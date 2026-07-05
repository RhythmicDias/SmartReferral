import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { readFile } from "@tauri-apps/plugin-fs";
import { FormData } from "../App";

// Set worker source for pdfjs-dist using Vite's ?url syntax
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractInfoFromReport(filePath: string): Promise<Partial<FormData>> {
  try {
    // Read the PDF file into a byte array using Tauri FS
    const fileBytes = await readFile(filePath);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: fileBytes });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    // Clean up non-printable characters (similar to python's char.isprintable())
    fullText = fullText.replace(/[^\x20-\x7E\n]/g, "");

    const patterns = {
      name: /(?:Patient Name|Name|FULL NAME)[:\s]+([A-Za-z\s]+?)(?:\s+Nationality|\s+DOB|\s+Date of Birth|$)/i,
      dob: /(?:DOB|Date of Birth:)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      mrn: /(?:MRN|Patient ID|File\s?#)[:\s]+(\d+)/i,
      age: /Age[:\s]+(\d+)/i,
      gender: /(?:Gender|Sex)[:\s]+(Male|Female|M|F)/i,
      doctor: /(?:Consultant|Referring Physician|Consulted Dr)[:\s]+(Dr\.?\s[A-Za-z\s\d,]+?)(?:\s+Visit Date|\n|$)/i,
      nationality: /Nationality[:\s]+([A-Za-z\s]+?)(?=\s*MRN|\s*DOB|\n|$)/i,
      visit_date: /Visit Date & Time[:\s]+(\d{1,2}\/\d{1,2}\/\d{4}\s\d{2}:\d{2})/i,
      insurance: /Insurance Company[:\s]+(.*?)(?=\s+Network Name:|\n|$)/i,
      contact_email: /Email Id[:\s]+([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i
    };

    const extractedData: Record<string, string> = {};

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        // @ts-ignore
        extractedData[key] = match[1].trim();
      }
    }

    const mappedData: Partial<FormData> = {};
    if (extractedData.name) mappedData.patient_name = extractedData.name;
    if (extractedData.dob) mappedData.dob = extractedData.dob;
    if (extractedData.mrn) mappedData.patient_id = extractedData.mrn;
    if (extractedData.doctor) mappedData.clinician = extractedData.doctor;
    
    const ageSex = `${extractedData.age || ''} / ${extractedData.gender || ''}`.replace(/^\s*\/\s*|\s*\/\s*$/g, '');
    if (ageSex) mappedData.age_sex = ageSex;

    if (extractedData.nationality) mappedData.nationality = extractedData.nationality;
    if (extractedData.age) mappedData.age = extractedData.age;
    if (extractedData.gender) mappedData.gender = extractedData.gender;
    if (extractedData.visit_date) mappedData.visit_date = extractedData.visit_date;
    if (extractedData.insurance) mappedData.insurance = extractedData.insurance;
    if (extractedData.contact_email) mappedData.contact_email = extractedData.contact_email;

    return mappedData;

  } catch (error: any) {
    console.error("Error extracting PDF:", error);
    throw new Error(error.message || String(error));
  }
}
