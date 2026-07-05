import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Disable default right-click context menu to make it feel like a native app
document.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement;
  // Allow right-click on inputs and textareas so users can copy/paste
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
