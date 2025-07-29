class GameBoyCameraApp {
    constructor() {
        this.camera = null;
        this.gallery = null;
        this.currentMode = 'camera';
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            await this.setupApp();
            this.setupNavigation();
            this.setupServiceWorker();
            this.isInitialized = true;
            console.log('Game Boy Camera app initialized');
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError('Failed to initialize app');
        }
    }

    async setupApp() {
        await Storage.init();
        
        this.camera = new GameBoyCamera();
        this.gallery = new Gallery();
        
        // Make camera available globally for error handler
        window.gameBoyCamera = this.camera;
        
        this.showMode('camera');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.id.replace('-btn', '');
                this.switchMode(mode);
            });
        });

        this.setupKeyboardShortcuts();
        this.setupSwipeNavigation();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key) {
                case '1':
                    this.switchMode('camera');
                    break;
                case '2':
                    this.switchMode('gallery');
                    break;
                case ' ':
                case 'Enter':
                    if (this.currentMode === 'camera') {
                        e.preventDefault();
                        this.camera.capturePhoto();
                    }
                    break;
                case 'c':
                    if (this.currentMode === 'camera') {
                        this.camera.capturePhoto();
                    }
                    break;
                case 'f':
                    if (this.currentMode === 'camera') {
                        this.cycleFilter();
                    }
                    break;
                case 's':
                    if (this.currentMode === 'camera' && e.ctrlKey) {
                        e.preventDefault();
                        this.camera.switchCamera();
                    }
                    break;
            }
        });
    }

    setupSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        mainContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        mainContent.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const diffX = startX - endX;
            const diffY = startY - endY;
            const minSwipeDistance = 50;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    this.navigateNext();
                } else {
                    this.navigatePrevious();
                }
            }
        };

        this.handleSwipe = handleSwipe;
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;

        const modes = ['camera', 'gallery'];
        if (!modes.includes(mode)) return;

        this.hideAllModes();
        this.showMode(mode);
        this.updateNavigation(mode);
        
        this.currentMode = mode;

        if (mode === 'gallery') {
            this.gallery.loadPhotos();
        }

        this.addModeTransition();
    }

    showMode(mode) {
        const modeSection = document.getElementById(`${mode}-mode`);
        if (modeSection) {
            modeSection.classList.add('active');
        }
    }

    hideAllModes() {
        const modes = document.querySelectorAll('.view-section');
        modes.forEach(mode => mode.classList.remove('active'));
    }

    updateNavigation(activeMode) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `${activeMode}-btn`) {
                btn.classList.add('active');
            }
        });
    }

    addModeTransition() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.transition = 'opacity 0.2s ease';
            mainContent.style.opacity = '0.8';
            
            setTimeout(() => {
                mainContent.style.opacity = '1';
                setTimeout(() => {
                    mainContent.style.transition = '';
                }, 200);
            }, 50);
        }
    }

    navigateNext() {
        const modes = ['camera', 'gallery'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.switchMode(modes[nextIndex]);
    }

    navigatePrevious() {
        const modes = ['camera', 'gallery'];
        const currentIndex = modes.indexOf(this.currentMode);
        const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
        this.switchMode(modes[prevIndex]);
    }

    cycleFilter() {
        const filterButtons = document.querySelectorAll('.filter-pill');
        const activeButton = document.querySelector('.filter-pill.active');
        const currentIndex = Array.from(filterButtons).indexOf(activeButton);
        const nextIndex = (currentIndex + 1) % filterButtons.length;
        
        filterButtons[nextIndex].click();
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Skip service worker for now - optional feature
                console.log('Service Worker setup skipped (optional feature)');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'app-error';
        errorElement.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
        errorElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: var(--gray-100);
            text-align: center;
        `;
        
        document.body.appendChild(errorElement);
    }

    getAppInfo() {
        return {
            initialized: this.isInitialized,
            currentMode: this.currentMode,
            cameraActive: this.camera?.isActive || false,
            photoCount: this.gallery?.photos?.length || 0,
            version: '1.0.0'
        };
    }

    async exportAppData() {
        try {
            const photos = await Storage.getAllPhotos();
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                photos: photos
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `gameboy-camera-export-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    }

    async importAppData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.photos || !Array.isArray(data.photos)) {
                throw new Error('Invalid export file format');
            }
            
            for (const photo of data.photos) {
                await Storage.savePhoto(photo);
            }
            
            await this.gallery.loadPhotos();
            return data.photos.length;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
}

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new GameBoyCameraApp();
    window.gameBoyApp = app;
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && app?.camera) {
        console.log('App hidden, preserving camera state');
    } else if (!document.hidden && app?.camera && app.currentMode === 'camera') {
        console.log('App visible, resuming camera');
    }
});

window.addEventListener('beforeunload', () => {
    if (app?.camera) {
        app.camera.stop();
    }
});

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    console.error('Error details:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
    });
    
    if (app) {
        app.showError(`Error: ${e.message || 'An unexpected error occurred'}`);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    console.error('Promise rejection details:', e);
    
    if (app) {
        app.showError(`Promise error: ${e.reason?.message || 'An async operation failed'}`);
    }
    
    e.preventDefault();
});