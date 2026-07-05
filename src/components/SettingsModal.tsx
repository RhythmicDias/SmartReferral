import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl as openBrowser } from "@tauri-apps/plugin-opener";

interface SettingsModalProps {
  onClose: () => void;
}

export interface AppSettings {
  font_name: string;
  font_size: number;
  font_color: string;
  signature_path: string;
  email_body: string;
}

export const defaultSettings: AppSettings = {
  font_name: "Helvetica",
  font_size: 15,
  font_color: "#000000",
  signature_path: "",
  email_body: ""
};

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const hasSettings = await exists("settings.json", { baseDir: BaseDirectory.AppData });
      if (hasSettings) {
        const data = await readTextFile("settings.json", { baseDir: BaseDirectory.AppData });
        setSettings({ ...defaultSettings, ...JSON.parse(data) });
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const saveSettings = async () => {
    try {
      const appDataExists = await exists("", { baseDir: BaseDirectory.AppData });
      if (!appDataExists) {
        await mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });
      }
      await writeTextFile("settings.json", JSON.stringify(settings, null, 2), { baseDir: BaseDirectory.AppData });
      onClose();
    } catch (err: any) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings: " + (err.message || String(err)));
    }
  };

  const handleBrowseSignature = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }]
      });
      if (selected && typeof selected === 'string') {
        setSettings(prev => ({ ...prev, signature_path: selected }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkForUpdates = async () => {
    try {
      setCheckingUpdate(true);
      const response = await fetch("https://api.github.com/repos/RhythmicDias/SmartReferral/releases/latest");
      if (!response.ok) {
        throw new Error("Failed to fetch latest release.");
      }
      const data = await response.json();
      const latestVersion = data.tag_name;
      const currentVersion = "v0.1.0"; // Update this when releasing new versions
      
      if (latestVersion && latestVersion !== currentVersion) {
        if (window.confirm(`A new version (${latestVersion}) is available! You are currently on ${currentVersion}.\n\nWould you like to open GitHub to download it?`)) {
          await openBrowser(data.html_url);
        }
      } else {
        alert(`You are up to date! Current version: ${currentVersion}`);
      }
    } catch (err) {
      console.error(err);
      alert("Could not check for updates. Please check your internet connection or the repository visibility.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body" style={{ gap: "1rem", padding: "1rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Font Family</label>
              <select 
                value={settings.font_name} 
                onChange={e => setSettings(prev => ({ ...prev, font_name: e.target.value }))}
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Courier">Courier</option>
                <option value="Times-Roman">Times-Roman</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Font Size</label>
              <input 
                type="number" 
                value={settings.font_size} 
                onChange={e => setSettings(prev => ({ ...prev, font_size: parseInt(e.target.value) || 15 }))} 
              />
            </div>

            <div className="form-group">
              <label>Font Color</label>
              <input 
                type="color" 
                value={settings.font_color} 
                onChange={e => setSettings(prev => ({ ...prev, font_color: e.target.value }))} 
                style={{ padding: 0, height: "36px", width: "50px" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Signature Image</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                readOnly 
                value={settings.signature_path} 
                placeholder="No signature selected..." 
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleBrowseSignature}>Browse</button>
            </div>
          </div>

          <div className="form-group">
            <label>Email Body Template</label>
            <textarea 
              value={settings.email_body} 
              onChange={e => setSettings(prev => ({ ...prev, email_body: e.target.value }))} 
              placeholder="Enter default email body text..."
              style={{ minHeight: "80px" }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <button className="btn btn-warning" onClick={checkForUpdates} disabled={checkingUpdate}>
              {checkingUpdate ? "Checking..." : "Check for Updates"}
            </button>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn glass-panel" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
          <div style={{ 
            textAlign: "center", 
            fontSize: "0.75rem", 
            color: "var(--text-color-muted)", 
            borderTop: "1px solid var(--border-color)", 
            paddingTop: "0.75rem",
            width: "100%"
          }}>
            SmartReferral v0.1.0 &copy; {new Date().getFullYear()} Neuropedia. Developed by{" "}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                openBrowser("https://github.com/RhythmicDias");
              }}
              style={{ color: "var(--primary-color)", textDecoration: "none" }}
            >
              Stephen Dias
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
}
