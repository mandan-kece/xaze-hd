// ============================================
// YT DOWNLOADER v2 - Nexray API
// ============================================

const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const errorMsg = document.getElementById('errorMsg');
const loadingState = document.getElementById('loadingState');
const resultContainer = document.getElementById('resultContainer');

const API_VIDEO = 'https://api.nexray.eu.cc/downloader/v1/ytmp4';
const API_AUDIO = 'https://api.nexray.eu.cc/downloader/v1/ytmp3';
const RESOLUTIONS = ['1080', '720', '480', '360', '240', '144'];

// ============================================
// EVENT LISTENERS
// ============================================

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit();
});

urlInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', !urlInput.value);
});

clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.classList.add('hidden');
    urlInput.focus();
});

urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        if (urlInput.value.trim() && isValidYoutubeUrl(urlInput.value.trim())) {
            handleSubmit();
        }
    }, 200);
});

// ============================================
// HELPERS
// ============================================

function isValidYoutubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.classList.toggle('hidden', isLoading);
    btnLoading.classList.toggle('hidden', !isLoading);
    loadingState.classList.toggle('hidden', !isLoading);
    
    if (isLoading) {
        resultContainer.classList.add('hidden');
        errorMsg.classList.add('hidden');
    }
}

function showError(msg) {
    errorMsg.innerHTML = `⚠️ ${msg}`;
    errorMsg.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    loadingState.classList.add('hidden');
    
    // Auto hide error after 8s
    setTimeout(() => errorMsg.classList.add('hidden'), 8000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

// ============================================
// HANDLE SUBMIT
// ============================================

async function handleSubmit() {
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Masukkan link YouTube dulu bro 🗿');
        return;
    }
    
    if (!isValidYoutubeUrl(url)) {
        showError('Link YouTube tidak valid. Contoh: https://youtube.com/watch?v=xxx atau https://youtu.be/xxx');
        return;
    }
    
    await fetchAll(url);
}

// ============================================
// FETCH ALL
// ============================================

async function fetchAll(url) {
    setLoading(true);
    
    const encodedUrl = encodeURIComponent(url);
    
    // Fetch paralel: semua video + audio
    const videoPromises = RESOLUTIONS.map(res => fetchVideo(encodedUrl, res));
    const audioPromise = fetchAudio(encodedUrl);
    
    const [videoResults, audioResult] = await Promise.all([
        Promise.all(videoPromises),
        audioPromise
    ]);
    
    // Filter video yang berhasil
    const validVideos = videoResults.filter(r => r !== null);
    
    // Debug
    console.log('Valid Videos:', validVideos.length, validVideos);
    console.log('Audio Result:', audioResult);
    
    if (validVideos.length === 0 && !audioResult) {
        showError('Gagal mengambil data. Mungkin video tidak tersedia atau private 🗿');
        setLoading(false);
        return;
    }
    
    // Info dari hasil pertama yang punya title
    const videoInfo = validVideos.find(r => r.title) || audioResult || validVideos[0];
    
    renderResult(videoInfo, validVideos, audioResult);
    setLoading(false);
}

async function fetchVideo(encodedUrl, resolution) {
    try {
        const response = await fetch(`${API_VIDEO}?url=${encodedUrl}&resolusi=${resolution}`, {
            headers: { 'accept': 'application/json' }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.status && data.result?.url) {
            // Tambahin resolusi ke object
            return {
                ...data.result,
                _resolution: resolution
            };
        }
        return null;
    } catch (err) {
        console.warn(`Gagal fetch ${resolution}p:`, err.message);
        return null;
    }
}

async function fetchAudio(encodedUrl) {
    try {
        const response = await fetch(`${API_AUDIO}?url=${encodedUrl}`, {
            headers: { 'accept': 'application/json' }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.status && data.result?.url) {
            return data.result;
        }
        return null;
    } catch (err) {
        console.warn('Gagal fetch MP3:', err.message);
        return null;
    }
}

// ============================================
// RENDER
// ============================================

function renderResult(info, videos, audio) {
    // Urutkan video berdasarkan resolusi tertinggi
    const sortedVideos = [...videos].sort((a, b) => {
        const qA = parseInt(a.quality) || parseInt(a._resolution) || 0;
        const qB = parseInt(b.quality) || parseInt(b._resolution) || 0;
        return qB - qA;
    });
    
    // Fix: gunakan quality dari API, fallback ke _resolution
    sortedVideos.forEach(v => {
        if (!v.quality) v.quality = `${v._resolution}p`;
    });
    
    const thumbnail = info?.thumbnail || '';
    const title = info?.title || 'Judul tidak tersedia';
    const author = info?.author || 'Unknown';
    const duration = info?.duration || 0;
    
    let html = `
        <div class="video-info">
            ${thumbnail ? `<img src="${thumbnail}" alt="Thumbnail" onerror="this.style.display='none'">` : ''}
            <div class="info-text">
                <h3>${escapeHtml(title)}</h3>
                <div class="meta">
                    <span>👤 ${escapeHtml(author)}</span>
                    <span>⏱️ ${formatDuration(duration)}</span>
                </div>
            </div>
        </div>
    `;
    
    // SECTION VIDEO
    if (sortedVideos.length > 0) {
        html += '<div class="section-title">🎬 Video MP4</div>';
        html += '<div class="download-grid">';
        
        sortedVideos.forEach(v => {
            const q = v.quality || '?';
            html += `
                <a href="${v.url}" target="_blank" class="download-btn" rel="noopener noreferrer" download>
                    <span class="quality">📹 ${q}</span>
                    <span class="details">${v.format || 'MP4'}</span>
                </a>
            `;
        });
        
        html += '</div>';
    }
    
    // SECTION AUDIO
    html += '<div class="section-title">🎵 Audio MP3</div>';
    
    if (audio?.url) {
        html += '<div class="download-grid">';
        html += `
            <a href="${audio.url}" target="_blank" class="download-btn audio-highlight" rel="noopener noreferrer" download>
                <span class="quality">🎵 MP3</span>
                <span class="details">${audio.quality || '128kbps'} • ${audio.format || 'MP3'}</span>
            </a>
        `;
        html += '</div>';
        html += '<p style="font-size:0.72rem;color:#555;text-align:center;margin-top:-8px;">💡 Ukuran file ±3-15 MB tergantung durasi video</p>';
    } else {
        html += '<p class="no-result">⚠️ Audio MP3 tidak tersedia untuk video ini</p>';
    }
    
    // NOTE BUAT USER
    html += `
        <div style="margin-top:16px;padding:12px;background:rgba(255,68,68,0.04);border-radius:10px;border:1px solid rgba(255,68,68,0.1);">
            <p style="font-size:0.75rem;color:#888;text-align:center;">
                ⚡ <strong>Tips:</strong> Klik link download, lalu klik kanan video & pilih <em>"Save video as..."</em> untuk menyimpan
            </p>
        </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    
    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}