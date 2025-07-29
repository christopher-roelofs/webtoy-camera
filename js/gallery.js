class Gallery {
    constructor() {
        this.photoGrid = document.getElementById('photo-grid');
        this.clearBtn = document.getElementById('clear-gallery');
        this.photos = [];
        this.strips = [];
        this.selectedPhoto = null;
        
        this.init();
    }

    async init() {
        await this.loadPhotos();
        await this.loadStrips();
        this.setupEventListeners();
        this.setupTabNavigation();
        Storage.updatePhotoCount();
    }

    async loadPhotos() {
        try {
            this.photos = await Storage.getAllPhotos();
            this.render();
        } catch (error) {
            console.error('Failed to load photos:', error);
            this.showError('Failed to load photos');
        }
    }

    setupEventListeners() {
        this.clearBtn.addEventListener('click', () => this.confirmClearAll());
        
        const stripBtn = document.getElementById('create-strip');
        if (stripBtn) {
            stripBtn.addEventListener('click', () => this.createPhotostripUI());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.selectedPhoto) {
                this.closePhotoViewer();
            }
        });
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById(`${tabName}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    render() {
        if (this.photos.length === 0) {
            this.showEmptyState();
            return;
        }

        this.photoGrid.innerHTML = '';
        
        this.photos.forEach((photo, index) => {
            const photoElement = this.createPhotoElement(photo, index);
            this.photoGrid.appendChild(photoElement);
        });
    }

    createPhotoElement(photo, index) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.photoId = photo.id;
        
        const img = document.createElement('img');
        img.src = photo.dataURL;
        img.alt = `Photo ${index + 1}`;
        img.loading = 'lazy';
        
        const overlay = document.createElement('div');
        overlay.className = 'photo-overlay';
        overlay.innerHTML = `
            <div class="photo-info">
                <span class="photo-filter">${photo.filter || 'none'}</span>
                <span class="photo-date">${this.formatDate(photo.timestamp)}</span>
            </div>
        `;
        
        photoItem.appendChild(img);
        photoItem.appendChild(overlay);
        
        this.addPhotoEventListeners(photoItem, photo);
        
        return photoItem;
    }

    addPhotoEventListeners(photoItem, photo) {
        photoItem.addEventListener('click', () => {
            this.openPhotoViewer(photo);
        });
    }

    openPhotoViewer(photo) {
        this.selectedPhoto = photo;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: var(--radius-xl);
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: var(--shadow-xl);
            animation: slideUp 0.3s ease;
            display: flex;
            flex-direction: column;
        `;

        modalContent.innerHTML = `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-6);
                border-bottom: 1px solid var(--gray-200);
                background: var(--gray-50);
            ">
                <div style="display: flex; flex-direction: column; gap: var(--space-1);">
                    <span style="font-weight: 600; color: var(--gray-900);">Photo Details</span>
                    <div style="display: flex; gap: var(--space-4); font-size: var(--font-size-sm); color: var(--gray-600);">
                        <span>Filter: ${photo.filter}</span>
                        <span>${this.formatDate(photo.timestamp)}</span>
                    </div>
                </div>
                <button class="close-btn" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: var(--gray-200);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--gray-600);
                    font-size: 18px;
                    transition: all var(--transition-fast);
                ">×</button>
            </div>
            
            <div style="
                flex: 1;
                padding: var(--space-6);
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--gray-100);
            ">
                <img src="${photo.dataURL}" alt="Photo" style="
                    max-width: 100%;
                    max-height: 60vh;
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                ">
            </div>
            
            <div style="
                padding: var(--space-6);
                display: flex;
                gap: var(--space-3);
                justify-content: flex-end;
                border-top: 1px solid var(--gray-200);
                background: white;
            ">
                <button class="download-btn" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border: 2px solid #6366f1;
                    border-radius: 8px;
                    background: #6366f1;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-height: 44px;
                ">
                    <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                </button>
                <button class="delete-btn" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border: 2px solid #ef4444;
                    border-radius: 8px;
                    background: white;
                    color: #ef4444;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-height: 44px;
                ">
                    <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2"/>
                    </svg>
                    Delete
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
                this.selectedPhoto = null;
            }, 200);
        };

        const closeBtn = modalContent.querySelector('.close-btn');
        const downloadBtn = modalContent.querySelector('.download-btn');
        const deleteBtn = modalContent.querySelector('.delete-btn');

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        downloadBtn.addEventListener('click', () => {
            this.exportPhoto(photo);
        });

        deleteBtn.addEventListener('click', () => {
            this.deletePhoto(photo.id);
            closeModal();
        });

        // Hover effects handled by CSS
    }

    closePhotoViewer() {
        // This method is kept for compatibility but the modal handles its own closing
        this.selectedPhoto = null;
    }


    exportPhoto(photo) {
        const filename = `gameboy-photo-${this.formatDate(photo.timestamp, true)}.png`;
        Storage.exportPhoto(photo, filename);
        this.showModalMessage('Photo downloaded', 'success');
    }

    async deletePhoto(id) {
        if (!confirm('Delete this photo?')) return;
        
        try {
            await Storage.deletePhoto(id);
            this.photos = this.photos.filter(photo => photo.id !== id);
            this.render();
            this.showModalMessage('Photo deleted', 'success');
        } catch (error) {
            console.error('Delete failed:', error);
            this.showModalMessage('Delete failed', 'error');
        }
    }

    confirmClearAll() {
        if (this.photos.length === 0) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: white;
            border-radius: var(--radius-xl);
            padding: var(--space-8);
            max-width: 320px;
            width: 90%;
            text-align: center;
            box-shadow: var(--shadow-xl);
            border-top: 4px solid var(--warning-500);
            animation: slideUp 0.3s ease;
        `;

        messageBox.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">
                ⚠️
            </div>
            <h3 style="margin: 0 0 var(--space-3) 0; color: var(--gray-900); font-size: var(--font-size-lg);">
                Clear All Photos?
            </h3>
            <p style="margin: 0 0 var(--space-6) 0; color: var(--gray-600); font-size: var(--font-size-base);">
                This will permanently delete all ${this.photos.length} photos.
            </p>
            <div style="display: flex; gap: var(--space-3); justify-content: center;">
                <button class="cancel-btn" style="
                    background: var(--gray-200);
                    color: var(--gray-700);
                    border: none;
                    border-radius: var(--radius-md);
                    padding: var(--space-3) var(--space-6);
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                ">Cancel</button>
                <button class="confirm-btn" style="
                    background: var(--warning-500);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    padding: var(--space-3) var(--space-6);
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                ">Clear All</button>
            </div>
        `;

        modal.appendChild(messageBox);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            }, 200);
        };

        const cancelBtn = messageBox.querySelector('.cancel-btn');
        const confirmBtn = messageBox.querySelector('.confirm-btn');

        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        confirmBtn.addEventListener('click', async () => {
            closeModal();
            await this.clearAllPhotos();
        });
    }

    async clearAllPhotos() {
        try {
            await Storage.clearAllPhotos();
            this.photos = [];
            this.render();
            this.showModalMessage('All photos cleared', 'success');
        } catch (error) {
            console.error('Clear all failed:', error);
            this.showModalMessage('Clear failed', 'error');
        }
    }

    addPhoto(photo) {
        this.photos.unshift(photo);
        this.render();
    }

    static addPhoto(photo) {
        // Static method for external calls - find the gallery instance
        const gallery = window.gameBoyApp?.gallery;
        if (gallery) {
            gallery.addPhoto(photo);
        }
    }

    showEmptyState() {
        this.photoGrid.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
                <h3>No photos yet</h3>
                <p>Take some pictures to get started</p>
            </div>
        `;
    }

    showError(message) {
        this.photoGrid.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="secondary-btn">Retry</button>
            </div>
        `;
    }

    showModalMessage(message, type = 'success') {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const messageBox = document.createElement('div');
        const bgColor = type === 'error' ? 'var(--error-500)' : 'var(--success-500)';
        messageBox.style.cssText = `
            background: white;
            border-radius: var(--radius-xl);
            padding: var(--space-8);
            max-width: 320px;
            width: 90%;
            text-align: center;
            box-shadow: var(--shadow-xl);
            border-top: 4px solid ${bgColor};
            animation: slideUp 0.3s ease;
        `;

        messageBox.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">
                ${type === 'error' ? '❌' : '✅'}
            </div>
            <h3 style="margin: 0 0 var(--space-3) 0; color: var(--gray-900); font-size: var(--font-size-lg);">
                ${type === 'error' ? 'Error' : 'Success'}
            </h3>
            <p style="margin: 0 0 var(--space-6) 0; color: var(--gray-600); font-size: var(--font-size-base);">
                ${message}
            </p>
            <button class="modal-ok-btn" style="
                background: ${bgColor};
                color: white;
                border: none;
                border-radius: var(--radius-md);
                padding: var(--space-3) var(--space-6);
                font-size: var(--font-size-base);
                font-weight: 600;
                cursor: pointer;
                transition: all var(--transition-fast);
                min-width: 80px;
            ">OK</button>
        `;

        modal.appendChild(messageBox);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            }, 200);
        };

        const okBtn = messageBox.querySelector('.modal-ok-btn');
        okBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Auto-close after 3 seconds
        setTimeout(closeModal, 3000);
    }

    formatDate(timestamp, forFilename = false) {
        const date = new Date(timestamp);
        
        if (forFilename) {
            return date.toISOString().slice(0, 19).replace(/:/g, '-');
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    getPhotoStats() {
        const stats = {
            total: this.photos.length,
            filters: {},
            oldestDate: null,
            newestDate: null
        };
        
        this.photos.forEach(photo => {
            const filter = photo.filter || 'none';
            stats.filters[filter] = (stats.filters[filter] || 0) + 1;
            
            if (!stats.oldestDate || photo.timestamp < stats.oldestDate) {
                stats.oldestDate = photo.timestamp;
            }
            if (!stats.newestDate || photo.timestamp > stats.newestDate) {
                stats.newestDate = photo.timestamp;
            }
        });
        
        return stats;
    }

    createPhotostripUI() {
        if (this.photos.length < 1) {
            this.showModalMessage('Add some photos first!', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: var(--radius-xl);
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: var(--shadow-xl);
            animation: slideUp 0.3s ease;
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 500px;
        `;

        modalContent.innerHTML = `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-6);
                border-bottom: 1px solid var(--gray-200);
                background: var(--gray-50);
            ">
                <div>
                    <h3 style="margin: 0; color: var(--gray-900); font-size: var(--font-size-lg); font-weight: 600;">Create Photo Strip</h3>
                    <p style="margin: var(--space-2) 0 0 0; color: var(--gray-600); font-size: var(--font-size-sm);">Select up to 4 photos for your strip</p>
                </div>
                <button class="close-btn" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: var(--gray-200);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--gray-600);
                    font-size: 18px;
                    transition: all var(--transition-fast);
                ">×</button>
            </div>
            
            <div style="
                flex: 1;
                padding: var(--space-6);
                overflow-y: auto;
            ">
                <div class="strip-photo-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: var(--space-4);
                ">
                    ${this.photos.map((photo, index) => `
                        <div class="strip-photo-item" data-photo-id="${photo.id}" style="
                            position: relative;
                            cursor: pointer;
                            border: 2px solid var(--gray-200);
                            border-radius: var(--radius-lg);
                            overflow: hidden;
                            transition: all var(--transition-fast);
                            aspect-ratio: 1;
                        ">
                            <img src="${photo.dataURL}" style="
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                                image-rendering: pixelated;
                                image-rendering: -moz-crisp-edges;
                                image-rendering: crisp-edges;
                            ">
                            <div class="strip-selection-indicator" style="
                                position: absolute;
                                top: var(--space-2);
                                right: var(--space-2);
                                width: 24px;
                                height: 24px;
                                background: var(--primary-500);
                                color: white;
                                border-radius: 50%;
                                display: none;
                                align-items: center;
                                justify-content: center;
                                font-size: var(--font-size-sm);
                                font-weight: 600;
                                box-shadow: var(--shadow-md);
                            "></div>
                            <div class="photo-overlay" style="
                                position: absolute;
                                inset: 0;
                                background: rgba(0, 0, 0, 0.5);
                                opacity: 0;
                                transition: opacity var(--transition-fast);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: var(--font-size-sm);
                                font-weight: 500;
                            ">Click to select</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="
                padding: var(--space-6);
                display: flex;
                gap: var(--space-3);
                justify-content: flex-end;
                border-top: 1px solid var(--gray-200);
                background: white;
            ">
                <button class="cancel-btn secondary-btn">Cancel</button>
                <button class="create-strip-btn primary-btn" disabled style="
                    opacity: 0.5;
                    cursor: not-allowed;
                ">Create Strip</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        this.setupStripSelectionEvents(modal);
    }

    setupStripSelectionEvents(modal) {
        const selectedPhotos = [];
        const photoItems = modal.querySelectorAll('.strip-photo-item');
        const createBtn = modal.querySelector('.create-strip-btn');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 200);
        };

        // Photo hover effects handled by CSS
        photoItems.forEach(item => {
            item.addEventListener('click', () => {
                const photoId = parseInt(item.dataset.photoId);
                const indicator = item.querySelector('.strip-selection-indicator');
                
                if (selectedPhotos.includes(photoId)) {
                    // Deselect
                    const index = selectedPhotos.indexOf(photoId);
                    selectedPhotos.splice(index, 1);
                    item.style.border = '2px solid var(--gray-200)';
                    item.style.transform = 'scale(1)';
                    indicator.style.display = 'none';
                } else if (selectedPhotos.length < 4) {
                    // Select
                    selectedPhotos.push(photoId);
                    item.style.border = '2px solid var(--primary-500)';
                    item.style.transform = 'scale(0.95)';
                    indicator.style.display = 'flex';
                    indicator.textContent = selectedPhotos.length;
                }

                // Update create button state
                if (selectedPhotos.length === 0) {
                    createBtn.disabled = true;
                    createBtn.style.opacity = '0.5';
                    createBtn.style.cursor = 'not-allowed';
                } else {
                    createBtn.disabled = false;
                    createBtn.style.opacity = '1';
                    createBtn.style.cursor = 'pointer';
                }
            });
        });

        createBtn.addEventListener('click', () => {
            if (selectedPhotos.length > 0) {
                const photos = selectedPhotos.map(id => this.photos.find(p => p.id === id));
                this.generatePhotostrip(photos);
                closeModal();
            }
        });

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Hover effects handled by CSS
    }

    generatePhotostrip(photos) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Standard photo strip dimensions (roughly 2x8 inches at 300 DPI)
        const stripWidth = 200;
        const photoHeight = 150;
        const spacing = 10;
        const totalHeight = (photos.length * photoHeight) + ((photos.length + 1) * spacing);
        
        canvas.width = stripWidth;
        canvas.height = totalHeight;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add photos
        photos.forEach((photo, index) => {
            const img = new Image();
            img.onload = () => {
                const y = spacing + (index * (photoHeight + spacing));
                
                // Calculate scaling to fit photo in strip slot
                const imgAspect = img.width / img.height;
                const slotAspect = stripWidth / photoHeight;
                
                let drawWidth = stripWidth;
                let drawHeight = photoHeight;
                let drawX = 0;
                let drawY = y;
                
                if (imgAspect > slotAspect) {
                    // Image is wider - fit height and crop width
                    drawWidth = photoHeight * imgAspect;
                    drawX = (stripWidth - drawWidth) / 2;
                } else {
                    // Image is taller - fit width and crop height  
                    drawHeight = stripWidth / imgAspect;
                    drawY = y + (photoHeight - drawHeight) / 2;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                
                // If this is the last photo, save the strip
                if (index === photos.length - 1) {
                    const photoIds = photos.map(p => p.id);
                    this.savePhotostrip(canvas, photoIds);
                }
            };
            img.src = photo.dataURL;
        });
    }

    async savePhotostrip(canvas, photoIds) {
        const dataURL = canvas.toDataURL('image/png');
        const timestamp = Date.now();
        
        const strip = {
            id: timestamp,
            dataURL: dataURL,
            timestamp: timestamp,
            photoIds: photoIds, // Array of photo IDs used in this strip
            photoCount: photoIds.length
        };
        
        try {
            await Storage.savePhotostrip(strip);
            this.showModalMessage('Photo strip saved!', 'success');
            this.loadStrips(); // Refresh strips display
        } catch (error) {
            console.error('Failed to save photostrip:', error);
            this.showModalMessage('Failed to save strip', 'error');
        }
    }

    async loadStrips() {
        try {
            this.strips = await Storage.getAllPhotostrips();
            this.renderStrips();
        } catch (error) {
            console.error('Failed to load photostrips:', error);
            this.showStripsError('Failed to load strips');
        }
    }

    renderStrips() {
        const stripsGrid = document.getElementById('strips-grid');
        if (!stripsGrid) return;

        if (this.strips.length === 0) {
            stripsGrid.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <rect x="7" y="7" width="3" height="3"/>
                        <rect x="14" y="7" width="3" height="3"/>
                        <rect x="7" y="14" width="3" height="3"/>
                        <rect x="14" y="14" width="3" height="3"/>
                    </svg>
                    <h3>No photo strips yet</h3>
                    <p>Create strips from your photos</p>
                </div>
            `;
            return;
        }

        stripsGrid.innerHTML = this.strips.map(strip => `
            <div class="strip-item" data-strip-id="${strip.id}">
                <img src="${strip.dataURL}" class="strip-thumbnail" alt="Photo Strip">
                <div class="strip-info">
                    <div>${strip.photoCount} photos</div>
                    <div>${this.formatDate(strip.timestamp)}</div>
                </div>
            </div>
        `).join('');

        // Add event listeners for strip items
        this.strips.forEach(strip => {
            const stripItem = stripsGrid.querySelector(`[data-strip-id="${strip.id}"]`);
            if (stripItem) {
                this.addStripEventListeners(stripItem, strip);
            }
        });
    }

    addStripEventListeners(stripItem, strip) {
        stripItem.addEventListener('click', () => {
            this.openStripViewer(strip);
        });
    }

    openStripViewer(strip) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 1rem;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            animation: slideUp 0.3s ease;
            display: flex;
            flex-direction: column;
            max-width: 400px;
            width: 100%;
        `;

        modalContent.innerHTML = `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
                background: #f9fafb;
            ">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight: 600; color: #111827; font-size: 18px;">Photo Strip</span>
                    <div style="font-size: 14px; color: #6b7280;">
                        ${strip.photoCount} photos • ${this.formatDate(strip.timestamp)}
                    </div>
                </div>
                <button class="close-btn" style="
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: #e5e7eb;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #6b7280;
                    font-size: 18px;
                    transition: all 0.15s ease;
                ">×</button>
            </div>
            
            <div style="
                flex: 1;
                padding: 24px;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                background: #f3f4f6;
                min-height: 300px;
                max-height: 60vh;
                overflow-y: auto;
            ">
                <img src="${strip.dataURL}" alt="Photo Strip" style="
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                ">
            </div>
            
            <div style="
                padding: 24px;
                display: flex;
                gap: 12px;
                justify-content: center;
                border-top: 1px solid #e5e7eb;
                background: white;
                min-height: 80px;
                align-items: center;
            ">
                <button class="download-btn" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: 2px solid #6366f1;
                    border-radius: 8px;
                    background: #6366f1;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-height: 44px;
                    min-width: 120px;
                    justify-content: center;
                ">
                    <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                </button>
                <button class="delete-btn" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: 2px solid #ef4444;
                    border-radius: 8px;
                    background: white;
                    color: #ef4444;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-height: 44px;
                    min-width: 100px;
                    justify-content: center;
                ">
                    <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2"/>
                    </svg>
                    Delete
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        this.setupStripViewerEvents(modal, strip);
    }

    setupStripViewerEvents(modal, strip) {
        const closeBtn = modal.querySelector('.close-btn');
        const downloadBtn = modal.querySelector('.download-btn');
        const deleteBtn = modal.querySelector('.delete-btn');

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 200);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `photostrip-${strip.timestamp}.png`;
            link.href = strip.dataURL;
            link.click();
            this.showModalMessage('Strip downloaded!', 'success');
        });

        deleteBtn.addEventListener('click', () => {
            this.confirmDeleteStrip(strip.id);
            closeModal();
        });

        // Hover effects handled by CSS
    }

    async confirmDeleteStrip(stripId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: white;
            border-radius: var(--radius-xl);
            padding: var(--space-8);
            max-width: 320px;
            width: 90%;
            text-align: center;
            box-shadow: var(--shadow-xl);
            border-top: 4px solid var(--error-500);
            animation: slideUp 0.3s ease;
        `;

        messageBox.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: var(--space-4);">
                🗑️
            </div>
            <h3 style="margin: 0 0 var(--space-3) 0; color: var(--gray-900); font-size: var(--font-size-lg);">
                Delete Strip?
            </h3>
            <p style="margin: 0 0 var(--space-6) 0; color: var(--gray-600); font-size: var(--font-size-base);">
                This action cannot be undone.
            </p>
            <div style="display: flex; gap: var(--space-3); justify-content: center;">
                <button class="cancel-btn" style="
                    background: var(--gray-200);
                    color: var(--gray-700);
                    border: none;
                    border-radius: var(--radius-md);
                    padding: var(--space-3) var(--space-6);
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                ">Cancel</button>
                <button class="confirm-btn" style="
                    background: var(--error-500);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    padding: var(--space-3) var(--space-6);
                    font-size: var(--font-size-base);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                ">Delete</button>
            </div>
        `;

        modal.appendChild(messageBox);
        document.body.appendChild(modal);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const closeModal = () => {
            modal.style.animation = 'fadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            }, 200);
        };

        const cancelBtn = messageBox.querySelector('.cancel-btn');
        const confirmBtn = messageBox.querySelector('.confirm-btn');

        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        confirmBtn.addEventListener('click', async () => {
            try {
                await Storage.deletePhotostrip(stripId);
                this.loadStrips();
                this.showModalMessage('Strip deleted', 'success');
                closeModal();
            } catch (error) {
                console.error('Failed to delete strip:', error);
                this.showModalMessage('Delete failed', 'error');
                closeModal();
            }
        });
    }

    showStripsError(message) {
        const stripsGrid = document.getElementById('strips-grid');
        if (stripsGrid) {
            stripsGrid.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="window.gallery.loadStrips()" class="secondary-btn">Retry</button>
                </div>
            `;
        }
    }

}