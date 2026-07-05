# SmartReferral (Neuropedia)

SmartReferral is a modern, standalone desktop application designed to streamline the referral generation process for Neuropedia and related external clinics. Built with Tauri, React, and TypeScript, it offers a secure, offline-first experience with zero backend dependencies.

## Features
- **Intelligent PDF Extraction**: Upload patient medical reports (PDF format) and automatically extract critical details such as Patient Name, DOB, MRN, and Clinical Information.
- **Dynamic Referral Generation**: Automatically formats and maps the extracted information onto official Neuropedia, CDC, or External referral templates.
- **EMR Merging**: Merge the generated referral form with the original medical report into a single, cohesive PDF document.
- **Customizable Settings**: Set your preferred default fonts, colors, email templates, and signature images.

## Technology Stack
- **Frontend**: React, TypeScript, Vite
- **Backend/Native**: Tauri (Rust)
- **PDF Processing**: `pdfjs-dist` (extraction) and `pdf-lib` (generation/merging)

## Build Instructions
Make sure you have Node.js and the Rust toolchain installed.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run in development mode:
   ```bash
   npm run tauri dev
   ```
3. Build for production (Generates Windows .exe, .msi, etc.):
   ```bash
   npm run tauri build
   ```
