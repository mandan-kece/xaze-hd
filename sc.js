// Multi Platform Downloader (Backend API akan diisi nanti)
// Buat sekarang pake dummy dulu, nanti tinggal ganti API endpoint

let currentPlatform = 'tiktok';
let currentVideoUrl = null;
let history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');

// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const closeDrawer = document.getElementById('closeDrawer');
const themeToggle = document.getElementById('themeToggle');
const platformBtns = document.querySelectorAll('.platform-btn');
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const loading = document.getElementById('loading');
const resultArea = document.getElementById('resultArea');
const videoPreview = document.getElementById('videoPreview');
const infoTitle = document.getElementById('infoTitle');
const infoStats = document.getElementById('infoStats');
const downloadLink = document.getElementById('downloadLink');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

// Drawer Menu
menuBtn.addEventListener('click', () => {
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
});

function closeDrawerMenu() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
}

closeDrawer.addEventListener('click', closeDrawerMenu);
drawerOverlay.addEventListener('click', closeDrawerMenu);

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        body.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '🌙';
    }
});

// Platform Selector
platformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        platformBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlatform = btn.getAttribute('data-platform');
    });
});

// Simulate Download (nanti ganti panggil API real)
async function processDownload(url, platform) {
    // DUMMY - nanti ganti dengan API asli
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                status: true,
                video_url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                title: `Video dari ${platform.toUpperCase()}`,
                stats: '❤️ 1.2K 💬 456 🔁 789'
            });
        }, 1500);
    });
}

downloadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Masukkan link video dulu!');
        return;
    }

    loading.classList.remove('hidden');
    resultArea.classList.add('hidden');

    try {
        const result = await processDownload(url, currentPlatform);
        
        if (result.status) {
            currentVideoUrl = result.video_url;
            videoPreview.src = result.video_url;
            infoTitle.textContent = result.title;
            infoStats.textContent = result.stats;
            downloadLink.href = result.video_url;
            downloadLink.download = `${currentPlatform}_video.mp4`;
            resultArea.classList.remove('hidden');

            // Save to history
            const historyItem = {
                platform: currentPlatform,
                url: url,
                videoUrl: result.video_url,
                title: result.title,
                date: new Date().toLocaleString()
            };
            history.unshift(historyItem);
            if (history.length > 20) history.pop();
            localStorage.setItem('downloadHistory', JSON.stringify(history));
            renderHistory();
        } else {
            alert('Gagal memproses video!');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        loading.classList.add('hidden');
    }
});

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">Belum ada riwayat</div>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <span>🎬 ${item.platform.toUpperCase()}</span>
            <span style="font-size:0.6rem; opacity:0.6">${item.date}</span>
            <a href="${item.videoUrl}" download>⬇️</a>
        </div>
    `).join('');
}

clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('downloadHistory');
    renderHistory();
});

renderHistory();