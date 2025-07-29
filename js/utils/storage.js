class Storage {
    static DB_NAME = 'GameBoyCameraDB';
    static DB_VERSION = 2;
    static STORE_NAME = 'photos';
    static db = null;

    static async init() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('filter', 'filter', { unique: false });
                }

                if (!db.objectStoreNames.contains('photostrips')) {
                    const stripStore = db.createObjectStore('photostrips', { keyPath: 'id' });
                    stripStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    static async savePhoto(photo) {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            await new Promise((resolve, reject) => {
                const request = store.add(photo);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            this.updatePhotoCount();
            console.log('Photo saved successfully');
        } catch (error) {
            console.error('Failed to save photo:', error);
            this.fallbackSave(photo);
        }
    }

    static async getAllPhotos() {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('timestamp');
            
            return new Promise((resolve, reject) => {
                const request = index.getAll();
                request.onsuccess = () => {
                    const photos = request.result.sort((a, b) => b.timestamp - a.timestamp);
                    resolve(photos);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get photos:', error);
            return this.fallbackGetAll();
        }
    }

    static async deletePhoto(id) {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            await new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            this.updatePhotoCount();
            console.log('Photo deleted successfully');
        } catch (error) {
            console.error('Failed to delete photo:', error);
            this.fallbackDelete(id);
        }
    }

    static async clearAllPhotos() {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
            this.updatePhotoCount();
            console.log('All photos cleared successfully');
        } catch (error) {
            console.error('Failed to clear photos:', error);
            this.fallbackClearAll();
        }
    }

    static async getPhotoCount() {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            
            return new Promise((resolve, reject) => {
                const request = store.count();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get photo count:', error);
            return this.fallbackGetCount();
        }
    }

    static updatePhotoCount() {
        this.getPhotoCount().then(count => {
            const countElement = document.getElementById('photo-count');
            if (countElement) {
                countElement.textContent = `${count} photo${count !== 1 ? 's' : ''}`;
            }
        });
    }

    static fallbackSave(photo) {
        try {
            const photos = JSON.parse(localStorage.getItem('gameboy-photos') || '[]');
            photos.push(photo);
            localStorage.setItem('gameboy-photos', JSON.stringify(photos));
            this.updatePhotoCount();
        } catch (error) {
            console.error('Fallback save failed:', error);
        }
    }

    static fallbackGetAll() {
        try {
            const photos = JSON.parse(localStorage.getItem('gameboy-photos') || '[]');
            return photos.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Fallback get all failed:', error);
            return [];
        }
    }

    static fallbackDelete(id) {
        try {
            const photos = JSON.parse(localStorage.getItem('gameboy-photos') || '[]');
            const filtered = photos.filter(photo => photo.id !== id);
            localStorage.setItem('gameboy-photos', JSON.stringify(filtered));
            this.updatePhotoCount();
        } catch (error) {
            console.error('Fallback delete failed:', error);
        }
    }

    static fallbackClearAll() {
        try {
            localStorage.removeItem('gameboy-photos');
            this.updatePhotoCount();
        } catch (error) {
            console.error('Fallback clear all failed:', error);
        }
    }

    static fallbackGetCount() {
        try {
            const photos = JSON.parse(localStorage.getItem('gameboy-photos') || '[]');
            return photos.length;
        } catch (error) {
            console.error('Fallback get count failed:', error);
            return 0;
        }
    }

    static exportPhoto(photo, filename) {
        const link = document.createElement('a');
        link.download = filename || `gameboy-photo-${photo.id}.png`;
        link.href = photo.dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static async sharePhoto(photo) {
        if (navigator.share && navigator.canShare) {
            try {
                const blob = await this.dataURLToBlob(photo.dataURL);
                const file = new File([blob], `gameboy-photo-${photo.id}.png`, { type: 'image/png' });
                
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Game Boy Camera Photo',
                        text: 'Check out this retro photo!',
                        files: [file]
                    });
                    return true;
                }
            } catch (error) {
                console.error('Share failed:', error);
            }
        }
        
        this.exportPhoto(photo);
        return false;
    }

    static dataURLToBlob(dataURL) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(resolve, 'image/png');
            };
            
            img.src = dataURL;
        });
    }

    static getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return Promise.resolve({ usage: 0, quota: 0 });
    }

    // Photostrip storage methods
    static async savePhotostrip(strip) {
        try {
            const db = await this.init();
            const transaction = db.transaction(['photostrips'], 'readwrite');
            const store = transaction.objectStore('photostrips');
            
            await store.add(strip);
            console.log('Photostrip saved successfully');
            this.updatePhotoCount();
            return strip;
        } catch (error) {
            console.error('Failed to save photostrip:', error);
            throw error;
        }
    }

    static async getAllPhotostrips() {
        try {
            const db = await this.init();
            const transaction = db.transaction(['photostrips'], 'readonly');
            const store = transaction.objectStore('photostrips');
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const strips = request.result.sort((a, b) => b.timestamp - a.timestamp);
                    resolve(strips);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get photostrips:', error);
            return [];
        }
    }

    static async deletePhotostrip(id) {
        try {
            const db = await this.init();
            const transaction = db.transaction(['photostrips'], 'readwrite');
            const store = transaction.objectStore('photostrips');
            
            await store.delete(id);
            console.log('Photostrip deleted successfully');
            this.updatePhotoCount();
        } catch (error) {
            console.error('Failed to delete photostrip:', error);
            throw error;
        }
    }

    static async clearAllPhotostrips() {
        try {
            const db = await this.init();
            const transaction = db.transaction(['photostrips'], 'readwrite');
            const store = transaction.objectStore('photostrips');
            
            await store.clear();
            console.log('All photostrips cleared');
            this.updatePhotoCount();
        } catch (error) {
            console.error('Failed to clear photostrips:', error);
            throw error;
        }
    }
}