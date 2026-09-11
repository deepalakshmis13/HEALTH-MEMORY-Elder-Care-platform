import api from './api';

export const doctorService = {
  routing: () => api.get('/api/doctor/routing'),
  insights: (patientId) => api.get(`/api/doctor/insights/${patientId}`),
  caregiverFeed: (patientId) => api.get(`/api/doctor/caregiver-feed/${patientId}`),
  visitSummary: (patientId) =>
    api.post('/api/doctor/visit-summary', { patient_id: patientId }),
  saveVisitSummary: (summaryId, content) =>
    api.post('/api/doctor/visit-summary/save', {
      summary_id: summaryId,
      content,
    }),
  listSummaries: (patientId) => api.get(`/api/doctor/visit-summaries/${patientId}`),
};

export const caregiverService = {
  config: () => api.get('/api/caregiver/config'),
  setCareType: (careType, facilityId) =>
    api.post(
      `/api/caregiver/care-type?care_type=${careType}` +
        (facilityId ? `&facility_id=${facilityId}` : ''),
    ),
  startShift: ({ careType, shiftCode, facilityId, patientIds }) =>
    api.post('/api/caregiver/shift/start', {
      care_type: careType,
      shift_code: shiftCode,
      facility_id: facilityId || null,
      patient_ids: patientIds,
    }),
  shift: (shiftId) => api.get(`/api/caregiver/shift/${shiftId}`),
  shifts: () => api.get('/api/caregiver/shifts'),
  verifyMedication: (payload) => api.post('/api/caregiver/medication/verify', payload),
  addObservation: (payload) => api.post('/api/caregiver/observation', payload),
  updateTask: (taskId, status, notes) =>
    api.post(`/api/caregiver/task/${taskId}`, { status, notes: notes || null }),
  insights: (patientId) =>
    api.get(`/api/caregiver/insights${patientId ? `?patient_id=${patientId}` : ''}`),
  generateHandover: (shiftId, patientIds = []) =>
    api.post('/api/caregiver/shift-handover', {
      shift_id: shiftId,
      patient_ids: patientIds,
    }),
  saveHandover: (handoverId, content) =>
    api.post('/api/caregiver/shift-handover/save', {
      handover_id: handoverId,
      content,
    }),
  handovers: () => api.get('/api/caregiver/handovers'),
};

export const pharmacistService = {
  queue: (status = 'PENDING_VERIFICATION') =>
    api.get(`/api/verification/queue?status=${status}`),
  task: (taskId) => api.get(`/api/verification/${taskId}`),
  verify: (taskId, note) => api.post(`/api/verification/${taskId}/verify`, { note }),
  correct: (taskId, correctedValue, clarification) =>
    api.post(`/api/verification/${taskId}/correct`, {
      corrected_value: correctedValue,
      clarification: clarification || null,
    }),
  reject: (taskId, reason) => api.post(`/api/verification/${taskId}/reject`, { reason }),
  patients: () => api.get('/api/pharmacist/patients'),
  medications: (patientId) => api.get(`/api/pharmacist/medications/${patientId}`),
  insights: () => api.get('/api/pharmacist/insights'),
};

export default { doctorService, caregiverService, pharmacistService };
