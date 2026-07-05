import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { join, downloadDir } from "@tauri-apps/api/path";
import { FormData, FormType } from "../App";
import { AppSettings, defaultSettings } from "../components/SettingsModal";

// @ts-ignore
import npdTemplateUrl from "../../templates/neuropedia_referral.pdf?url";
// @ts-ignore
import cdcTemplateUrl from "../../templates/cdc_referral.pdf?url";
// @ts-ignore
import extTemplateUrl from "../../templates/external_referral.pdf?url";

const NEUROPEDIA_COORDS: Record<string, [number, number, number]> = {
  patient_name: [140, 685, 300], age_sex: [140, 650, 150],
  dob: [425, 650, 150], patient_id: [140, 615, 100],
  contact_no: [425, 615, 100], clinician: [160, 580, 480],
  reason: [160, 545, 390], diagnosis: [220, 478, 338],
  clinical_info: [210, 376, 338], investigations: [235, 307, 328],
};

const EXTERNAL_COORDS: Record<string, [number, number, number]> = {
  patient_name: [125, 735, 200], nationality: [400, 735, 150],
  mrn: [125, 725, 200], dob: [400, 725, 150],
  gender: [125, 715, 200], age: [400, 715, 150],
  clinician: [125, 705, 200], visit_date: [400, 705, 150],
  insurance: [125, 676, 200], email_id: [400, 665, 100],
  referral_to: [125, 630, 300], name_of_professional: [193, 519, 350],
  contact_name: [193, 407, 200], contact_dob: [193, 350, 200],
  contact_no: [193, 310, 150], contact_email: [360, 310, 50],
  reason: [193, 270, 350], clinical_info: [193, 197, 350]
};

const EXTERNAL_HEADER_FIELDS = [
  "patient_name", "nationality", "mrn", "dob", "gender", 
  "age", "clinician", "visit_date", "insurance", "email_id"
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function generateReferralPdf(
  formType: FormType, 
  formData: FormData, 
  settings: AppSettings = defaultSettings,
  originalReportPath: string | null = null,
  merge: boolean = false
): Promise<string> {
  try {
    const isExternal = formType === "External";
    const templatePath = isExternal 
      ? extTemplateUrl 
      : formType === "NPD" ? npdTemplateUrl : cdcTemplateUrl;

    // Fetch the template using Vite's bundled URL
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch template from ${templatePath}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const templateBytes = new Uint8Array(arrayBuffer);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    let font;
    switch (settings.font_name) {
      case "Courier": font = await pdfDoc.embedFont(StandardFonts.Courier); break;
      case "Times-Roman": font = await pdfDoc.embedFont(StandardFonts.TimesRoman); break;
      default: font = await pdfDoc.embedFont(StandardFonts.Helvetica); break;
    }

    const customColor = hexToRgb(settings.font_color);
    const blackColor = rgb(0, 0, 0);

    const coords = isExternal ? EXTERNAL_COORDS : NEUROPEDIA_COORDS;
    
    const formatDob = (dobStr: string | undefined) => {
      if (!dobStr) return "";
      const match = dobStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
      if (match) {
        let [_, d, m, y] = match;
        d = d.padStart(2, "0");
        m = m.padStart(2, "0");
        if (y.length === 2) {
          y = parseInt(y) > 30 ? `19${y}` : `20${y}`;
        }
        return `${d}     ${m}     ${y}`;
      }
      return dobStr;
    };

    const formattedDob = formatDob(formData.dob);

    // Map the form data based on type
    const mappedData: Record<string, string> = isExternal ? {
      patient_name: formData.patient_name, age: formData.age, dob: formattedDob,
      mrn: formData.patient_id, contact_no: formData.contact_no, clinician: formData.clinician,
      reason: formData.reason, clinical_info: formData.clinical_info, nationality: formData.nationality,
      gender: formData.gender, visit_date: formData.visit_date, insurance: formData.insurance,
      contact_email: formData.contact_email, contact_name: formData.patient_name,
      contact_dob: formattedDob, referral_to: formData.referral_to,
      name_of_professional: formData.clinician, email_id: formData.contact_email
    } : {
      patient_name: formData.patient_name, age_sex: formData.age_sex, dob: formattedDob,
      patient_id: formData.patient_id, contact_no: formData.contact_no, clinician: formData.clinician,
      reason: formData.reason, diagnosis: formData.diagnosis,
      clinical_info: formData.clinical_info, investigations: formData.investigations,
    };

    for (const [key, textValue] of Object.entries(mappedData)) {
      if (!textValue || !coords[key]) continue;
      
      const [x, y, maxWidth] = coords[key];
      const isHeader = isExternal && EXTERNAL_HEADER_FIELDS.includes(key);
      const fontSize = (isExternal && isHeader) ? 8 : settings.font_size;
      const color = isHeader ? blackColor : customColor;

      // Reportlab wraps text top-down from Y coordinate.
      // pdf-lib's drawText with maxWidth wraps top-down, but its initial Y is the bottom of the first line.
      // So reportlab's Y is effectively the top line. This usually maps directly.
      firstPage.drawText(textValue, {
        x,
        y,
        size: fontSize,
        font,
        color,
        maxWidth,
        lineHeight: fontSize * 1.2
      });
    }

    // Handle Signature
    if (isExternal && settings.signature_path) {
      try {
        const imageBytes = await readFile(settings.signature_path);
        let image;
        if (settings.signature_path.toLowerCase().endsWith("png")) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
        const imgDims = image.scaleToFit(115, 100);
        firstPage.drawImage(image, {
          x: 365,
          y: 480 - imgDims.height,
          width: imgDims.width,
          height: imgDims.height,
        });
      } catch (err) {
        console.error("Failed to embed signature", err);
      }
    }

    // Handle Merge
    if (merge && originalReportPath) {
      try {
        const reportBytes = await readFile(originalReportPath);
        const reportPdf = await PDFDocument.load(reportBytes);
        const reportPages = await pdfDoc.copyPages(reportPdf, reportPdf.getPageIndices());
        for (const page of reportPages) {
          pdfDoc.addPage(page);
        }
      } catch (err: any) {
        throw new Error("Failed to merge report: " + (err.message || String(err)));
      }
    }

    const pdfBytes = await pdfDoc.save();
    
    // Determine Output Path
    const safeName = formData.patient_name ? formData.patient_name.replace(/[^a-z0-9]/gi, '_') : 'Patient';
    const downloads = await downloadDir();
    const baseName = merge ? `Referral_EMR_${safeName}.pdf` : `Referral_${safeName}.pdf`;
    const outPath = await join(downloads, baseName);
    
    await writeFile(outPath, pdfBytes);
    
    return outPath;

  } catch (error) {
    console.error("PDF Generation failed:", error);
    throw error;
  }
}
