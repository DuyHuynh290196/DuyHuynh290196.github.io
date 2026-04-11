function showToast(message) {
  const existing = document.getElementById("pdf-toast");

  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "pdf-toast";
  toast.setAttribute("role", "alert");
  toast.textContent = message;
  toast.style.cssText = [
    "position:fixed",
    "bottom:80px",
    "right:22px",
    "z-index:100",
    "max-width:320px",
    "padding:12px 16px",
    "border-radius:12px",
    "background:rgba(40,50,58,0.97)",
    "color:#eef2f5",
    "font-size:0.88rem",
    "line-height:1.4",
    "box-shadow:0 8px 24px rgba(0,0,0,0.28)",
    "backdrop-filter:blur(8px)",
    "opacity:0",
    "transition:opacity 0.2s ease",
  ].join(";");

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 4000);
}

async function exportResumePdf({ lang }) {
  await document.fonts.ready;
  window.print();
}

window.ResumePrint = {
  exportResumePdf,
};
