const pdfLibraryUrls = {
  html2canvas:
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  jspdf:
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
};

const scriptLoadCache = {};

function loadExternalScript(src) {
  if (scriptLoadCache[src]) {
    return scriptLoadCache[src];
  }

  scriptLoadCache[src] = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  return scriptLoadCache[src];
}

async function ensurePdfLibraries() {
  if (typeof window.html2canvas === "function" && window.jspdf?.jsPDF) {
    return;
  }

  await Promise.all([
    loadExternalScript(pdfLibraryUrls.html2canvas),
    loadExternalScript(pdfLibraryUrls.jspdf),
  ]);
}

function waitForFonts() {
  if (document.fonts?.ready) {
    return document.fonts.ready;
  }

  return Promise.resolve();
}

function waitForImages(element) {
  const images = Array.from(element.querySelectorAll("img"));

  return Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    })
  );
}

function sanitizeFilename(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function cloneImageToDataUrl(image) {
  if (!image.naturalWidth || !image.naturalHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0);

  return canvas.toDataURL("image/png");
}

function inlineCloneImages(sourcePage, clonedPage) {
  const sourceImages = Array.from(sourcePage.querySelectorAll("img"));
  const clonedImages = Array.from(clonedPage.querySelectorAll("img"));

  clonedImages.forEach((clonedImage, index) => {
    const sourceImage = sourceImages[index];

    if (!sourceImage) {
      return;
    }

    const dataUrl = cloneImageToDataUrl(sourceImage);

    if (dataUrl) {
      clonedImage.src = dataUrl;
      return;
    }

    if (sourceImage.currentSrc) {
      clonedImage.src = sourceImage.currentSrc;
    }
  });
}

function buildPdfFromCanvas({ canvas, filename }) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 6;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imageData = canvas.toDataURL("image/jpeg", 0.96);
  const renderedHeight = (canvas.height * contentWidth) / canvas.width;
  const totalPages = Math.max(1, Math.ceil(renderedHeight / contentHeight));

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const offsetY = margin - pageIndex * contentHeight;

    pdf.addImage(imageData, "JPEG", margin, offsetY, contentWidth, renderedHeight);
  }

  pdf.save(filename);
}

async function exportResumePdf({ resume, lang }) {
  const page = document.querySelector(".page");

  if (!page) {
    return;
  }

  try {
    await ensurePdfLibraries();
    await waitForFonts();
    await waitForImages(page);

    const rect = page.getBoundingClientRect();
    const renderWidth = Math.max(1, Math.ceil(rect.width));
    const renderHeight = Math.max(1, Math.ceil(page.scrollHeight));

    const canvas = await window.html2canvas(page, {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: renderWidth,
      height: renderHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: renderWidth,
      windowHeight: renderHeight,
      onclone(clonedDocument) {
        const clonedPage = clonedDocument.querySelector(".page");

        if (!clonedPage) {
          return;
        }

        inlineCloneImages(page, clonedPage);
        clonedPage.style.width = `${renderWidth}px`;
        clonedPage.style.maxWidth = `${renderWidth}px`;
        clonedPage.style.margin = "0";
        clonedPage.style.boxShadow = "none";
        clonedPage.style.borderRadius = getComputedStyle(page).borderRadius;
        clonedPage.style.overflow = "hidden";

        clonedDocument.querySelectorAll("*").forEach((node) => {
          node.style.animation = "none";
          node.style.transition = "none";
        });
      },
    });

    buildPdfFromCanvas({
      canvas,
      filename: `${sanitizeFilename(resume.name || "resume")}-CV.pdf`,
    });
  } catch (error) {
    console.error(error);
    window.alert(
      lang === "vi"
        ? "Khong the tai thu vien hoac file PDF luc nay. Vui long thu lai."
        : "The PDF libraries or file could not be downloaded right now. Please try again."
    );
  }
}

window.ResumePrint = {
  exportResumePdf,
};
