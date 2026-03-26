const BACKEND_URL = "https://scan-project-be-5.onrender.com";

// ── Convert dataURI → Blob ──
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// ── Single file: accepts dataURI string OR a File object ──
export async function sendImageToBackend(input) {
    const formData = new FormData();

    if (typeof input === "string") {
        // It's a dataURI — convert to blob and give it a filename
        const blob = dataURItoBlob(input);
        const ext = blob.type === "application/pdf" ? "pdf" : "png";
        formData.append("file", blob, `upload.${ext}`); // ✅ filename fixes multer issues
    } else {
        // It's already a File object (from <input type="file">)
        formData.append("file", input, input.name);
    }

    console.log("Sending single file to backend...");

    const response = await fetch(`${BACKEND_URL}/ocr`, {
        method: "POST",
        body: formData,
        // ❌ DO NOT set Content-Type manually — browser sets it with boundary
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `OCR failed with status ${response.status}`);
    }

    return await response.json();
}

// ── Multiple files: accepts array of dataURIs and/or File objects ──
export async function sendMultipleFilesToBackend(inputs, mode = "sequential") {
    const formData = new FormData();

    inputs.forEach((input, index) => {
        if (typeof input === "string") {
            // dataURI
            const blob = dataURItoBlob(input);
            const ext = blob.type === "application/pdf" ? "pdf" : "png";
            formData.append("files", blob, `upload_${index + 1}.${ext}`); // ✅ field name must be "files"
        } else {
            // File object
            formData.append("files", input, input.name);
        }
    });

    console.log(`Sending ${inputs.length} files to backend (mode: ${mode})...`);

    const response = await fetch(`${BACKEND_URL}/ocr/batch?mode=${mode}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Batch OCR failed with status ${response.status}`);
    }

    return await response.json();
}