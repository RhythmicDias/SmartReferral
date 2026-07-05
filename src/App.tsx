import { useState } from "react";
import "./App.css"; // Original Vite styles
import "./index.css"; // Our new design system
import { UploadSection } from "./components/UploadSection";
import { ReferralForm } from "./components/ReferralForm";
import { SettingsModal, defaultSettings } from "./components/SettingsModal";
import { Settings } from "lucide-react";
import { generateReferralPdf } from "./lib/pdfGenerator";
import { BaseDirectory, readTextFile, exists } from "@tauri-apps/plugin-fs";

// Types
export type FormType = "NPD" | "CDC" | "External";

export type FormData = {
  patient_name: string;
  age_sex: string;
  dob: string;
  patient_id: string;
  contact_no: string;
  clinician: string;
  reason: string;
  diagnosis: string;
  clinical_info: string;
  investigations: string;
  
  // External
  nationality: string;
  age: string;
  gender: string;
  visit_date: string;
  insurance: string;
  contact_email: string;
  referral_to: string;
};

const initialFormData: FormData = {
  patient_name: "", age_sex: "", dob: "", patient_id: "",
  contact_no: "", clinician: "", reason: "", diagnosis: "",
  clinical_info: "", investigations: "", nationality: "",
  age: "", gender: "", visit_date: "", insurance: "",
  contact_email: "", referral_to: ""
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>("NPD");
  const [medicalReportPath, setMedicalReportPath] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  
  const handleDataExtracted = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleGenerate = async (merge = false) => {
    try {
      // Load settings to pass to generator
      let settings = defaultSettings;
      const hasSettings = await exists("settings.json", { baseDir: BaseDirectory.AppData });
      if (hasSettings) {
        const data = await readTextFile("settings.json", { baseDir: BaseDirectory.AppData });
        settings = { ...defaultSettings, ...JSON.parse(data) };
      }

      if (!formData.patient_name) {
        alert("Input Required: Patient Name cannot be empty.");
        return;
      }

      const outPath = await generateReferralPdf(formType, formData, settings, medicalReportPath, merge);
      alert(`Referral form created successfully!\nSaved to: ${outPath}`);
    } catch (err) {
      alert("PDF Generation Error: " + String(err));
    }
  };

  const clearFields = () => {
    setFormData(initialFormData);
    setMedicalReportPath(null);
    setFormType("NPD");
  };

  return (
    <div className="app-container">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>SmartReferral</h1>
        <button className="btn glass-panel" style={{ padding: "0.5rem" }} onClick={() => setIsSettingsOpen(true)}>
          <Settings size={20} />
        </button>
      </header>

      <UploadSection 
        medicalReportPath={medicalReportPath}
        setMedicalReportPath={setMedicalReportPath}
        onDataExtracted={handleDataExtracted}
      />

      <div className="glass-panel">
        <div className="radio-group">
          {(["NPD", "CDC", "External"] as FormType[]).map(type => (
            <label key={type} className="radio-label">
              <input 
                type="radio" 
                name="formType" 
                value={type}
                checked={formType === type}
                onChange={() => setFormType(type)}
              />
              {type}
            </label>
          ))}
        </div>

        <ReferralForm 
          formType={formType} 
          formData={formData} 
          setFormData={setFormData} 
        />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button className="btn btn-primary" onClick={() => handleGenerate(false)}>
          Generate Referral
        </button>
        <button className="btn glass-panel" style={{ color: "white" }} onClick={() => handleGenerate(true)}>
          Merge with EMR
        </button>
        <button className="btn btn-success" disabled>
          Send Referral
        </button>
        <button className="btn btn-warning" onClick={clearFields} style={{ marginLeft: "auto" }}>
          Clear Fields
        </button>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

export default App;
