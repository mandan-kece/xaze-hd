const API_UPSCALE = "https://api-faa.my.id/faa/hdv4";
const UPLOAD_URL = "https://uguu.se/upload.php";

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const previewImg = document.getElementById('previewImg');
const processBtn = document.getElementById('processBtn');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const resultImg = document.getElementById('resultImg');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

let uploadedImageUrl = null;

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#38bdf8';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(255,255,255,0.4)';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
    uploadArea.style.borderColor = 'rgba(255,255,255,0.4)';
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
});

async function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewArea.classList.remove('hidden');
        uploadArea.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    // Upload ke uguu.se
    loading.classList.remove('hidden');
    previewArea.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const uploadRes = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
        const uploadText = await uploadRes.text();
        // uguu.se balikin URL langsung
        const match = uploadText.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i);
        if (match) {
            uploadedImageUrl = match[0];
            loading.classList.add('hidden');
            previewArea.classList.remove('hidden');
        } else {
            throw new Error('Gagal upload ke uguu');
        }
    } catch (err) {
        loading.classList.add('hidden');
        alert('Upload gagal: ' + err.message);
        resetToUpload();
    }
}

processBtn.addEventListener('click', async () => {
    if (!uploadedImageUrl) return;

    loading.classList.remove('hidden');
    previewArea.classList.add('hidden');

    try {
        const response = await fetch(`${API_UPSCALE}?image=${encodeURIComponent(uploadedImageUrl)}`);
        const data = await response.json();

        if (data.status && data.result?.image_upscaled) {
            const upscaledUrl = data.result.image_upscaled;
            resultImg.src = upscaledUrl;
            downloadBtn.href = upscaledUrl;
            resultArea.classList.remove('hidden');
        } else {
            throw new Error('Gagal upscale gambar');
        }
    } catch (err) {
        alert('Error: ' + err.message);
        resetToUpload();
    } finally {
        loading.classList.add('hidden');
    }
});

resetBtn.addEventListener('click', resetToUpload);

function resetToUpload() {
    uploadedImageUrl = null;
    previewArea.classList.add('hidden');
    resultArea.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    fileInput.value = '';
    previewImg.src = '';
    resultImg.src = '';
}