import { FormData, FormType } from "../App";

interface ReferralFormProps {
  formType: FormType;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function ReferralForm({ formType, formData, setFormData }: ReferralFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isExternal = formType === "External";

  if (isExternal) {
    return (
      <div className="form-grid">
        <div className="form-group">
          <label>Nationality:</label>
          <input name="nationality" value={formData.nationality} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Age:</label>
          <input name="age" value={formData.age} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Gender:</label>
          <input name="gender" value={formData.gender} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Visit Date:</label>
          <input name="visit_date" value={formData.visit_date} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Insurance Company:</label>
          <input name="insurance" value={formData.insurance} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Contact Email:</label>
          <input name="contact_email" value={formData.contact_email} onChange={handleChange} />
        </div>
        <div className="form-group full-width">
          <label>Referral To:</label>
          <textarea name="referral_to" value={formData.referral_to} onChange={handleChange} />
        </div>
        <div className="form-group full-width">
          <label>Reason for Referral:</label>
          <textarea name="reason" value={formData.reason} onChange={handleChange} />
        </div>
        <div className="form-group full-width">
          <label>Brief Medical History:</label>
          <textarea name="clinical_info" value={formData.clinical_info} onChange={handleChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="form-grid">
      <div className="form-group">
        <label>Patient Name:</label>
        <input name="patient_name" value={formData.patient_name} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Age/Sex:</label>
        <input name="age_sex" value={formData.age_sex} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Date of Birth:</label>
        <input name="dob" value={formData.dob} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Patient ID (MRN):</label>
        <input name="patient_id" value={formData.patient_id} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Contact No:</label>
        <input name="contact_no" value={formData.contact_no} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Referring Clinician:</label>
        <input name="clinician" value={formData.clinician} onChange={handleChange} />
      </div>
      <div className="form-group full-width">
        <label>Reason of Referral:</label>
        <textarea name="reason" value={formData.reason} onChange={handleChange} />
      </div>
      <div className="form-group full-width">
        <label>Provisional Clinical Diagnosis:</label>
        <input name="diagnosis" value={formData.diagnosis} onChange={handleChange} />
      </div>
      <div className="form-group full-width">
        <label>Other Clinical Information:</label>
        <textarea name="clinical_info" value={formData.clinical_info} onChange={handleChange} />
      </div>
      <div className="form-group full-width">
        <label>Prior Investigations:</label>
        <textarea name="investigations" value={formData.investigations} onChange={handleChange} />
      </div>
    </div>
  );
}
