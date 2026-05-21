// ============================================
// YT DOWNLOADER - Kaizen API
// ============================================

const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const errorMsg = document.getElementById('errorMsg');
const loadingState = document.getElementById('loadingState');
const resultContainer = document.getElementById('resultContainer');

const API_URL = 'https://kaizenapi.my.id/api/downloader/ytdown';

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
    
    await fetchVideo(url);
});

// Auto-submit saat paste link
urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        if (urlInput.value.trim() && isValidYoutubeUrl(urlInput.value.trim())) {
            form.dispatchEvent(new Event('submit'));
        }
    }, 150);
});

// ============================================
// HELPER FUNCTIONS
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

// ============================================
// API CALL
// ============================================

async function fetchVideo(url) {
    setLoading(true);
    
    try {
        const encodedUrl = encodeURIComponent(url);
        const response = await fetch(`${API_URL}?url=${encodedUrl}`, {
            headers: { 'accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Server error (${response.status})`);
        }
        
        const data = await response.json();
        
        // Debug log (bisa dihapus nanti)
        console.log('API Response:', data);
        
        // Validasi response
        if (!data.status) {
            throw new Error(data.message || 'Gagal mengambil data');
        }
        
        if (!data.result?.api) {
            throw new Error('Format response API tidak dikenali');
        }
        
        if (data.result.api.status !== 'ok') {
            throw new Error(data.result.api.message || 'Video tidak ditemukan');
        }
        
        renderResult(data.result);
        
    } catch (err) {
        console.error('Fetch error:', err);
        showError(`⚠️ ${err.message}. Coba lagi bro 🗿`);
    } finally {
        setLoading(false);
    }
}

// ============================================
// RENDER RESULT
// ============================================

function renderResult(result) {
    const video = result.api;
    const items = video.mediaItems;
    
    // Fallback: kalo mediaItems kosong
    if (!items || !Array.isArray(items) || items.length === 0) {
        resultContainer.innerHTML = `
            <div class="video-info">
                <img 
                    src="${video.imagePreviewUrl || ''}" 
                    alt="Thumbnail" 
                    onerror="this.style.display='none'"
                >
                <div class="info-text">
                    <h3>${escapeHtml(video.title)}</h3>
                    <p class="channel">👤 ${escapeHtml(video.userInfo?.name || 'Unknown')}</p>
                    <p style="color:#ff6b6b; margin-top:10px;">
                        ⚠️ Link download belum tersedia. Coba lagi dalam beberapa detik.
                    </p>
                </div>
            </div>
        `;
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    // Filter video & audio
    const videos = items.filter(item => item.type === 'Video');
    const audios = items.filter(item => item.type === 'Audio');
    
    // Cari MP3 (prioritas), fallback ke audio terakhir
    const mp3Audio = audios.find(a => a.mediaExtension === 'MP3') || audios[audios.length - 1] || null;
    const m4aAudio = audios.find(a => a.mediaExtension === 'M4A' && a.mediaId !== mp3Audio?.mediaId);
    
    // Durasi dari item pertama
    const duration = items[0]?.mediaDuration || 'N/A';
    
    // ============================================
    // BUILD HTML
    // ============================================
    
    let html = '';
    
    // --- VIDEO INFO ---
    html += `
        <div class="video-info">
            <img 
                src="${video.imagePreviewUrl || ''}" 
                alt="Thumbnail" 
                onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22><rect fill=%22%231a1a1a%22 width=%22320%22 height=%22180%22/><text fill=%22%23ff4444%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2220%22>No Thumbnail</text></svg>'"
            >
            <div class="info-text">
                <h3>${escapeHtml(video.title)}</h3>
                <p class="channel">👤 ${escapeHtml(video.userInfo?.name || 'Unknown')}</p>
                <p class="duration">⏱️ ${duration}</p>
            </div>
        </div>
    `;
    
    // --- VIDEO DOWNLOADS ---
    if (videos.length > 0) {
        html += '<div class="section-title">🎬 Download Video</div>';
        html += '<div class="download-grid">';
        
        videos.forEach(v => {
            const res = v.mediaRes || '';
            const size = v.mediaFileSize || '';
            html += `
                <a href="${v.mediaUrl}" target="_blank" class="download-btn" rel="noopener noreferrer">
                    <span class="quality">${v.mediaQuality || 'Video'}</span>
                    <span class="size">${res}${res && size ? ' • ' : ''}${size}</span>
                </a>
            `;
        });
        
        html += '</div>';
    }
    
    // --- AUDIO DOWNLOADS ---
    if (mp3Audio || m4aAudio) {
        html += '<div class="section-title">🎵 Download Audio</div>';
        html += '<div class="download-grid">';
        
        if (mp3Audio) {
            html += `
                <a href="${mp3Audio.mediaUrl}" target="_blank" class="download-btn" rel="noopener noreferrer">
                    <span class="quality">🎵 MP3 ${mp3Audio.mediaQuality || ''}</span>
                    <span class="size">${mp3Audio.mediaFileSize || ''}</span>
                </a>
            `;
        }
        
        if (m4aAudio) {
            html += `
                <a href="${m4aAudio.mediaUrl}" target="_blank" class="download-btn" rel="noopener noreferrer">
                    <span class="quality">🎵 M4A ${m4aAudio.mediaQuality || ''}</span>
                    <span class="size">${m4aAudio.mediaFileSize || ''}</span>
                </a>
            `;
        }
        
        html += '</div>';
    }
    
    // --- NO DOWNLOADS ---
    if (videos.length === 0 && !mp3Audio && !m4aAudio) {
        html += `
            <p style="text-align:center; color:#ff6b6b; padding:20px;">
                ⚠️ Tidak ada link download tersedia untuk video ini.
            </p>
        `;
    }
    
    // ============================================
    // TAMPILKAN
    // ============================================
    
    resultContainer.innerHTML = html;
    resultContainer.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    
    // Smooth scroll ke hasil
    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}