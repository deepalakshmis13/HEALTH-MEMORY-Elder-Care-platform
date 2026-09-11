"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import Principal, get_current_user
from database import get_db
from models import Caregiver, Doctor, Patient, Pharmacist, User
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from services import audit_service, consent_service
from utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _profile_payload(db: Session, user: User) -> dict:
    if user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        return {
            "profile_id": getattr(patient, "id", None),
            "patient_id": getattr(patient, "id", None),
            "extra": {
                "age": getattr(patient, "age", None),
                "blood_group": getattr(patient, "blood_group", None),
                "guardian_name": getattr(patient, "guardian_name", None),
            },
        }
    if user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        return {
            "profile_id": getattr(doctor, "id", None),
            "extra": {
                "specialty": getattr(doctor, "specialty", None),
                "hospital": getattr(doctor, "hospital", None),
                "registration_no": getattr(doctor, "registration_no", None),
            },
        }
    if user.role == "caregiver":
        caregiver = db.query(Caregiver).filter(Caregiver.user_id == user.id).first()
        return {
            "profile_id": getattr(caregiver, "id", None),
            "extra": {
                "care_type": getattr(caregiver, "care_type", None),
                "old_age_home_id": getattr(caregiver, "old_age_home_id", None),
                "old_age_home": (
                    caregiver.old_age_home.name
                    if caregiver and caregiver.old_age_home
                    else None
                ),
                "staff_code": getattr(caregiver, "staff_code", None),
            },
        }
    if user.role == "pharmacist":
        pharmacist = db.query(Pharmacist).filter(Pharmacist.user_id == user.id).first()
        return {
            "profile_id": getattr(pharmacist, "id", None),
            "extra": {
                "pharmacy_name": getattr(pharmacist, "pharmacy_name", None),
                "license_no": getattr(pharmacist, "license_no", None),
            },
        }
    return {"profile_id": None, "extra": {}}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401, detail="Incorrect email address or password."
        )

    profile = _profile_payload(db, user)
    audit_service.log(db, "LOGIN", None, target=user.email,
                      detail=f"role={user.role}")
    return TokenResponse(
        access_token=create_access_token(user.id, user.role, user.email),
        user=UserOut(
            id=user.id, email=user.email, full_name=user.full_name, role=user.role,
            **profile,
        ),
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if payload.role not in {"patient", "doctor", "caregiver", "pharmacist"}:
        raise HTTPException(status_code=400, detail="Unknown role.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=400, detail="An account already exists for this email address."
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    db.flush()

    if payload.role == "patient":
        patient = Patient(
            user_id=user.id,
            full_name=user.full_name,
            age=payload.age,
            gender=payload.gender,
            blood_group=payload.blood_group,
            guardian_name=payload.guardian_name,
            phone=payload.phone,
        )
        db.add(patient)
        db.flush()
        consent_service.ensure_default_consents(db, patient, commit=False)
    elif payload.role == "doctor":
        db.add(Doctor(user_id=user.id, full_name=user.full_name, is_registered=True))
    elif payload.role == "caregiver":
        db.add(Caregiver(user_id=user.id, full_name=user.full_name))
    elif payload.role == "pharmacist":
        db.add(Pharmacist(user_id=user.id, full_name=user.full_name))

    audit_service.log(db, "REGISTER", None, target=email,
                      detail=f"role={payload.role}", commit=False)
    db.commit()
    db.refresh(user)

    profile = _profile_payload(db, user)
    return TokenResponse(
        access_token=create_access_token(user.id, user.role, user.email),
        user=UserOut(
            id=user.id, email=user.email, full_name=user.full_name, role=user.role,
            **profile,
        ),
    )


@router.get("/me", response_model=UserOut)
def me(principal: Principal = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _profile_payload(db, principal.user)
    return UserOut(
        id=principal.user.id,
        email=principal.user.email,
        full_name=principal.user.full_name,
        role=principal.user.role,
        **profile,
    )
