// ============================================
// YT DOWNLOADER - Nexray API (MP4 + MP3)
// ============================================

const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
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
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Masukkan link YouTube dulu bro 🗿');
        return;
    }
    
    if (!isValidYoutubeUrl(url)) {
        showError('Link YouTube tidak valid bro, cek lagi 🗿');
        return;
    }
    
    await fetchAll(url);
});

// Auto-submit pas paste
urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        if (urlInput.value.trim() && isValidYoutubeUrl(urlInput.value.trim())) {
            form.dispatchEvent(new Event('submit'));
        }
    }, 150);
});

// ============================================
// HELPERS
// ============================================

function isValidYoutubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return pattern.test(url);
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
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    loadingState.classList.add('hidden');
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

// ============================================
// FETCH ALL (VIDEO + AUDIO)
// ============================================

async function fetchAll(url) {
    setLoading(true);
    
    const encodedUrl = encodeURIComponent(url);
    
    // Fetch semua resolusi video + audio paralel
    const videoPromises = RESOLUTIONS.map(res =>
        fetchVideo(encodedUrl, res)
    );
    const audioPromise = fetchAudio(encodedUrl);
    
    const [videoResults, audioResult] = await Promise.all([
        Promise.all(videoPromises),
        audioPromise
    ]);
    
    const validVideos = videoResults.filter(r => r !== null);
    
    if (validVideos.length === 0 && !audioResult) {
        showError('Gagal mengambil data. Coba lagi bro 🗿');
        setLoading(false);
        return;
    }
    
    // Info dari video pertama yang ada title, atau dari audio
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
        console.log(`MP4 ${resolution}:`, data);
        
        if (data.status && data.result?.url) {
            return data.result;
        }
        return null;
    } catch (err) {
        console.warn(`Gagal fetch ${resolution}:`, err);
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
        console.log('MP3:', data);
        
        if (data.status && data.result?.url) {
            return data.result;
        }
        return null;
    } catch (err) {
        console.warn('Gagal fetch MP3:', err);
        return null;
    }
}

// ============================================
// RENDER
// ============================================

function renderResult(info, videos, audio) {
    // Urutkan video dari kualitas tertinggi
    const sortedVideos = [...videos].sort((a, b) => {
        const qA = parseInt(a.quality) || 0;
        const qB = parseInt(b.quality) || 0;
        return qB - qA;
    });
    
    const thumbnail = info?.thumbnail || '';
    const title = info?.title || 'Judul tidak tersedia';
    const author = info?.author || 'Unknown';
    const duration = info?.duration || 0;
    
    let html = `
        <div class="video-info">
            ${thumbnail ? `<img src="${thumbnail}" alt="Thumbnail">` : ''}
            <div class="info-text">
                <h3>${escapeHtml(title)}</h3>
                <p class="channel">👤 ${escapeHtml(author)}</p>
                <p class="duration">⏱️ ${formatDuration(duration)}</p>
            </div>
        </div>
    `;
    
    // SECTION VIDEO
    if (sortedVideos.length > 0) {
        html += '<div class="section-title">🎬 Download Video MP4</div>';
        html += '<div class="download-grid">';
        
        sortedVideos.forEach(v => {
            html += `
                <a href="${v.url}" target="_blank" class="download-btn" rel="noopener noreferrer">
                    <span class="quality">📹 ${v.quality}</span>
                    <span class="size">${v.format || 'MP4'}</span>
                </a>
            `;
        });
        
        html += '</div>';
    }
    
    // SECTION AUDIO
    if (audio) {
        html += '<div class="section-title">🎵 Download Audio MP3</div>';
        html += '<div class="download-grid">';
        
        html += `
            <a href="${audio.url}" target="_blank" class="download-btn" rel="noopener noreferrer">
                <span class="quality">🎵 MP3 ${audio.quality || '128k'}</span>
                <span class="size">${audio.format || 'MP3'}</span>
            </a>
        `;
        
        html += '</div>';
    } else {
        html += `
            <div class="section-title">🎵 Download Audio MP3</div>
            <p style="text-align:center; color:#888; padding:10px;">
                ⚠️ Audio tidak tersedia untuk video ini
            </p>
        `;
    }
    
    resultContainer.innerHTML = html;
    resultContainer.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    
    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}