import { open } from "@tauri-apps/plugin-dialog";
import { Upload, FileText } from "lucide-react";
import { FormData } from "../App";
import { extractInfoFromReport } from "../lib/pdfExtractor";

interface UploadSectionProps {
  medicalReportPath: string | null;
  setMedicalReportPath: (path: string | null) => void;
  onDataExtracted: (data: Partial<FormData>) => void;
}

export function UploadSection({ medicalReportPath, setMedicalReportPath, onDataExtracted }: UploadSectionProps) {
  const handleBrowse = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: "PDF Files",
          extensions: ["pdf"]
        }]
      });
      if (selected && typeof selected === 'string') {
        setMedicalReportPath(selected);
      }
    } catch (err) {
      console.error("Failed to open file dialog", err);
    }
  };

  const handleExtract = async () => {
    if (!medicalReportPath) return;
    try {
      const extracted = await extractInfoFromReport(medicalReportPath);
      onDataExtracted(extracted);
      alert("Extraction Complete! Information has been extracted from the report.");
    } catch (err: any) {
      console.error(err);
      alert("Extraction Error: " + (err.message || String(err)));
    }
  };

  return (
    <div className="glass-panel">
      <h2>Upload Medical Report</h2>
      <div className="file-upload-wrapper">
        <div className="file-input-display">
          {medicalReportPath ? medicalReportPath.split(/[\\/]/).pop() : "No medical report selected..."}
        </div>
        <button className="btn btn-primary" onClick={handleBrowse}>
          <Upload size={16} /> Browse
        </button>
        <button 
          className="btn glass-panel" 
          onClick={handleExtract}
          disabled={!medicalReportPath}
          style={{ color: medicalReportPath ? "var(--text-color)" : "inherit" }}
        >
          <FileText size={16} /> Extract Info
        </button>
      </div>
    </div>
  );
}
