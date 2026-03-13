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

export async function sendImageToBackend(dataUri) {
    const blob = dataURItoBlob(dataUri);

    const formData = new FormData();
    formData.append("file", blob); // must match backend

    console.log("Sending file to backend...");

    const response = await fetch("https://scan-project-be-5.onrender.com/ocr", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Cloud scan failed with status ${response.status}`);
    }

    return await response.json();
}