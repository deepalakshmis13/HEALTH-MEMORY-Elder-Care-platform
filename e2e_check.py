"""
End-to-end verification of the 17-step demo flow (§42) plus the security
checks from the final validation checklist (§51).

    python seed.py && python e2e_check.py

Exits non-zero if any step fails.
"""

import io
import sys

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

PASSED, FAILED = [], []


def check(label: str, condition: bool, detail: str = ""):
    (PASSED if condition else FAILED).append(label)
    mark = "PASS" if condition else "FAIL"
    print(f"  [{mark}] {label}" + (f"  — {detail}" if detail else ""))
    return condition


def login(email: str, password: str = "Demo@123"):
    response = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    return data["access_token"], data["user"]


def head(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def main() -> int:
    print("\n" + "=" * 74)
    print("  END-TO-END DEMO FLOW CHECK")
    print("=" * 74)

    # ---------------------------------------------------- STEP 1: patient login
    print("\nSTEP 1–2  Patient login and first-time data entry")
    patient_token, patient_user = login("patient@demo.health")
    patient_id = patient_user["patient_id"]
    check("Patient login returns a token and patient profile", bool(patient_id))

    overview = client.get(
        f"/api/patients/{patient_id}/overview", headers=head(patient_token)
    ).json()
    check(
        "Health overview loads with active medications",
        len(overview.get("medications", [])) > 0,
        f"{len(overview.get('medications', []))} medications",
    )

    # ---------------------------------------------------- text ingestion
    text_result = client.post(
        "/api/ingestion/text",
        headers=head(patient_token),
        json={
            "patient_id": patient_id,
            "text": (
                "I visited Dr. Arun Kumar on 10 August because of dizziness. "
                "He asked me to continue my blood pressure medicine Amlodipine "
                "5 mg once daily."
            ),
        },
    ).json()
    check(
        "TEXT ingestion creates health-memory events",
        len(text_result.get("memory_event_ids", [])) > 0,
        f"{len(text_result.get('memory_event_ids', []))} events, "
        f"doctor routing: {text_result.get('doctor_routing', {}).get('status')}",
    )

    # ---------------------------------------------------- voice ingestion
    voice_result = client.post(
        "/api/ingestion/voice",
        headers=head(patient_token),
        json={
            "patient_id": patient_id,
            "transcript": (
                "I met Dr Arun Kumar last Monday and he changed my blood "
                "pressure medicine."
            ),
            "recognition_confidence": 0.86,
        },
    ).json()
    check(
        "VOICE ingestion stores a transcript as Patient Reported",
        len(voice_result.get("memory_event_ids", [])) > 0,
        voice_result.get("source", ""),
    )

    # ---------------------------------------------------- STEP 3–5: upload + OCR
    print("\nSTEP 3–5  Scan & Upload -> OCR -> verification routing")
    prescription = (
        "Dr. Arun Kumar MBBS MD (Cardiology)\n"
        "Sunrise Hospital, Chennai\n"
        "Date: 02/09/2026\n"
        "Rx\n"
        "1. Telmisartan 40 mg once daily after food\n"
        "Monitor blood pressure daily. Review after 3 weeks.\n"
    )
    upload = client.post(
        "/api/ingestion/upload",
        headers=head(patient_token),
        files={
            "file": (
                "handwritten_doctor_note_new.txt",
                io.BytesIO(prescription.encode()),
                "text/plain",
            )
        },
        data={"patient_id": str(patient_id), "is_handwritten": "true"},
    )
    check("SCAN & UPLOAD accepted", upload.status_code == 200, upload.text[:120])
    upload_data = upload.json() if upload.status_code == 200 else {}
    ocr = upload_data.get("ocr", {})
    check(
        "Handwriting path is used and confidence reported",
        bool(ocr.get("handwriting_detected")),
        f"engine={ocr.get('engine')}, "
        f"confidence={round((ocr.get('overall_confidence') or 0) * 100)}%",
    )

    bad_upload = client.post(
        "/api/ingestion/upload",
        headers=head(patient_token),
        files={"file": ("virus.exe", io.BytesIO(b"nope"), "application/octet-stream")},
        data={"patient_id": str(patient_id)},
    )
    check("File validation rejects unsupported types", bad_upload.status_code == 400)

    # ---------------------------------------------------- STEP 6–8: pharmacist
    print("\nSTEP 6–8  Pharmacist verification -> verified health memory")
    pharm_token, _ = login("pharmacist@demo.health")
    queue = client.get(
        "/api/verification/queue", headers=head(pharm_token)
    ).json()
    check(
        "Verification queue contains low/medium-confidence clinical fields",
        queue["stats"]["pending"] > 0,
        f"{queue['stats']['pending']} pending, "
        f"{queue['stats']['high_priority']} high priority",
    )

    target = next(
        (
            item for item in queue["queue"]
            if item["field_key"] == "medication_name" and item["priority"] == "HIGH"
        ),
        queue["queue"][0] if queue["queue"] else None,
    )
    check("A high-priority medication task is queued", target is not None)

    if target:
        detail = client.get(
            f"/api/verification/{target['id']}", headers=head(pharm_token)
        ).json()
        check(
            "Pharmacist sees OCR output, confidence and patient context",
            bool(detail.get("ocr_raw_text")) and "patient_context" in detail,
            f"{detail['field_label']} = '{detail['extracted_value']}' at "
            f"{detail['confidence_percent']}",
        )

        corrected = client.post(
            f"/api/verification/{target['id']}/correct",
            headers=head(pharm_token),
            json={
                "corrected_value": "Amlodipine",
                "clarification": "Confirmed against the prescriber's letterhead.",
            },
        )
        check("Pharmacist correction accepted", corrected.status_code == 200,
              corrected.text[:120])
        result = corrected.json().get("result", {}) if corrected.status_code == 200 else {}
        check(
            "Original OCR value and confidence are preserved",
            bool(result.get("original_value")) and result.get("original_confidence"),
            f"original '{result.get('original_value')}' at "
            f"{result.get('original_confidence_percent')} -> "
            f"'{result.get('corrected_value')}' by {result.get('pharmacist_name')}",
        )

        after = client.get(
            f"/api/verification/{target['id']}", headers=head(pharm_token)
        ).json()
        check("Task status becomes CORRECTED", after["status"] == "CORRECTED")

    # ---------------------------------------------------- STEP 9–11: doctor
    print("\nSTEP 9–11  Doctor routing -> RAG retrieval -> visit summary")
    doctor_token, _ = login("doctor@demo.health")
    routing = client.get("/api/doctor/routing", headers=head(doctor_token)).json()
    check(
        "Doctor routing feed lists patients routed from medical records",
        routing["count"] > 0,
        f"{routing['count']} patient(s)",
    )

    timeline = client.get(
        f"/api/memory/{patient_id}/timeline", headers=head(doctor_token)
    ).json()
    check("Clinical timeline retrievable by the treating doctor",
          timeline["count"] > 0, f"{timeline['count']} events")

    summary = client.post(
        "/api/doctor/visit-summary",
        headers=head(doctor_token),
        json={"patient_id": patient_id},
    )
    check("One-click visit summary generated", summary.status_code == 200,
          summary.text[:120])
    summary_data = summary.json() if summary.status_code == 200 else {}
    check(
        "Visit summary is evidence-backed and labelled AI-generated",
        len(summary_data.get("sources", [])) > 0
        and "AI-GENERATED" in (summary_data.get("content") or "").upper(),
        f"{len(summary_data.get('sources', []))} sources",
    )
    if summary_data:
        saved = client.post(
            "/api/doctor/visit-summary/save",
            headers=head(doctor_token),
            json={
                "summary_id": summary_data["summary_id"],
                "content": summary_data["content"] + "\n\nReviewed by the doctor.",
            },
        )
        check("Doctor can edit and save the summary", saved.status_code == 200)

    # ---------------------------------------------------- STEP 12–13: caregiver
    print("\nSTEP 12–13  Caregiver shift -> medication verification -> handover")
    care_token, _ = login("caregiver@demo.health")
    config = client.get("/api/caregiver/config", headers=head(care_token)).json()
    check(
        "Caregiver can choose care setting and shift",
        len(config["care_types"]) == 2 and len(config["shifts"]) == 3,
    )

    shift = client.post(
        "/api/caregiver/shift/start",
        headers=head(care_token),
        json={
            "care_type": "OLD_AGE_HOME",
            "shift_code": "MORNING",
            "facility_id": config["caregiver"]["old_age_home_id"],
            "patient_ids": [p["id"] for p in config["patients"]],
        },
    )
    check("Morning shift started for the old age home", shift.status_code == 200,
          shift.text[:120])
    shift_data = shift.json() if shift.status_code == 200 else {}
    shift_id = shift_data.get("shift", {}).get("id")

    detail = client.get(
        f"/api/caregiver/shift/{shift_id}", headers=head(care_token)
    ).json()
    administrations = [
        item
        for patient in detail["patients"]
        for item in patient["administrations"]
    ]
    check("Shift generated medication rounds and care tasks",
          len(administrations) > 0,
          f"{len(administrations)} scheduled doses")

    ready = next(
        (a for a in administrations if a["verification_status"] != "PENDING_VERIFICATION"),
        None,
    )
    if ready:
        verified = client.post(
            "/api/caregiver/medication/verify",
            headers=head(care_token),
            json={
                "administration_id": ready["id"],
                "status": "Administered",
                "notes": "Taken with breakfast.",
            },
        )
        check("Medication administration recorded in health memory",
              verified.status_code == 200, verified.text[:120])

    blocked = next(
        (a for a in administrations if a["verification_status"] == "PENDING_VERIFICATION"),
        None,
    )
    if blocked:
        refused = client.post(
            "/api/caregiver/medication/verify",
            headers=head(care_token),
            json={"administration_id": blocked["id"], "status": "Administered"},
        )
        check(
            "Unverified medication cannot be marked administered",
            refused.status_code == 409,
            refused.json().get("detail", "")[:90],
        )

    client.post(
        "/api/caregiver/observation",
        headers=head(care_token),
        json={
            "patient_id": patient_id,
            "shift_id": shift_id,
            "category": "general",
            "observation": "Reported dizziness at 09:15 while getting out of bed.",
            "severity": "attention",
        },
    )

    handover = client.post(
        "/api/caregiver/shift-handover",
        headers=head(care_token),
        json={"shift_id": shift_id, "patient_ids": [patient_id]},
    )
    check("Shift handover generated", handover.status_code == 200,
          handover.text[:120])
    handover_data = handover.json() if handover.status_code == 200 else {}
    content = handover_data.get("content", "")
    check(
        "Handover contains the required sections",
        all(
            section in content
            for section in (
                "PATIENT STATUS", "MEDICATION ADMINISTRATION",
                "MISSED / DELAYED MEDICATION", "NEW OBSERVATIONS",
                "PENDING TASKS", "ALERTS", "NEXT SHIFT INSTRUCTIONS",
            )
        ),
    )
    if handover_data:
        saved = client.post(
            "/api/caregiver/shift-handover/save",
            headers=head(care_token),
            json={
                "handover_id": handover_data["handover_id"],
                "content": content,
            },
        )
        check("Caregiver reviews and saves the handover", saved.status_code == 200)

    # ---------------------------------------------------- STEP 14–17: chatbots
    print("\nSTEP 14–17  Four role-specific chatbots with evidence")
    chats = [
        ("patient", patient_token, "What health information was recently added?"),
        ("doctor", doctor_token, "What changed since the last visit?"),
        ("caregiver", care_token, "What should I watch for during this shift?"),
        ("pharmacist", pharm_token,
         "Are there any medication entries that required verification?"),
    ]
    names = set()
    for role, token, question in chats:
        response = client.post(
            f"/api/chat/{role}",
            headers=head(token),
            json={"patient_id": patient_id, "message": question},
        )
        ok = response.status_code == 200
        data = response.json() if ok else {}
        names.add(data.get("agent"))
        check(
            f"{role.title()} chatbot answers with evidence",
            ok and len(data.get("answer", "")) > 40,
            f"{data.get('agent')} | {len(data.get('sources', []))} sources | "
            f"{data.get('provider')}",
        )
    check("Four distinct agents, not one generic chatbot", len(names) == 4,
          ", ".join(sorted(n for n in names if n)))

    # ---------------------------------------------------- security
    print("\nSECURITY  Isolation, authorization, consent, audit")
    other = client.get("/api/patients", headers=head(patient_token)).json()
    check(
        "Patient sees only their own record",
        other["count"] == 1 and other["patients"][0]["id"] == patient_id,
    )

    foreign = client.get(f"/api/memory/{patient_id + 1}", headers=head(patient_token))
    check("Patient A cannot access Patient B", foreign.status_code == 403,
          foreign.json().get("detail", "")[:70])

    anonymous = client.get(f"/api/memory/{patient_id}")
    check("Unauthenticated access is refused", anonymous.status_code == 401)

    voice_as_caregiver = client.get(
        f"/api/voice/{patient_id}", headers=head(care_token)
    )
    check(
        "Caregiver cannot read the voice diary (no consent scope)",
        voice_as_caregiver.status_code == 403,
    )

    revoke = client.post(
        "/api/consent",
        headers=head(patient_token),
        json={
            "patient_id": patient_id,
            "grantee_role": "doctor",
            "scope": "FULL_HEALTH_MEMORY",
            "granted": False,
        },
    )
    check("Consent can be revoked by the patient", revoke.status_code == 200)
    client.post(
        "/api/consent",
        headers=head(patient_token),
        json={
            "patient_id": patient_id,
            "grantee_role": "doctor",
            "scope": "RECENT_HISTORY",
            "granted": False,
        },
    )
    limited = client.get(
        f"/api/memory/{patient_id}", headers=head(doctor_token)
    ).json()
    consult_events = [
        e for e in limited.get("events", []) if e["event_type"] == "CONSULTATION"
    ]
    check(
        "Revoked consent removes records from retrieval",
        len(consult_events) == 0,
        f"{len(limited.get('events', []))} events still visible under remaining scopes",
    )
    for scope in ("FULL_HEALTH_MEMORY", "RECENT_HISTORY"):
        client.post(
            "/api/consent",
            headers=head(patient_token),
            json={
                "patient_id": patient_id, "grantee_role": "doctor",
                "scope": scope, "granted": True,
            },
        )

    audit = client.get("/api/audit", headers=head(pharm_token)).json()
    actions = {event["action"] for event in audit["events"]}
    check(
        "Audit log records the workflow",
        {"LOGIN", "RAG_RETRIEVAL"} & actions and audit["count"] > 5,
        f"{audit['count']} events: {', '.join(sorted(actions))[:110]}",
    )

    emergency = client.get(
        f"/api/emergency/{patient_id}", headers=head(patient_token)
    ).json()
    check(
        "Emergency card exposes blood group, allergies and contacts",
        emergency.get("blood_group") and emergency.get("emergency_contact"),
    )

    health = client.get("/api/health").json()
    check("Health endpoint reports RAG index and providers",
          health["rag_index"]["chunks"] > 0,
          f"{health['rag_index']['chunks']} indexed chunks, "
          f"AI provider {health['ai_provider']['provider']}")

    print("\n" + "=" * 74)
    print(f"  {len(PASSED)} passed, {len(FAILED)} failed")
    if FAILED:
        for label in FAILED:
            print(f"    FAILED: {label}")
    print("=" * 74 + "\n")
    return 1 if FAILED else 0


if __name__ == "__main__":
    sys.exit(main())
