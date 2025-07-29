class GameBoyCamera {
    constructor() {
        this.video = document.getElementById('camera-preview');
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.isActive = false;
        this.currentFilter = '2bit';
        this.availableDevices = [];
        this.currentDeviceId = null;
        
        this.init();
    }

    async init() {
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported');
            }

            console.log('Enumerating camera devices...');
            await this.enumerateDevices();
            
            console.log('Requesting camera access...');
            await this.requestCamera();
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Starting preview...');
            this.startPreview();
            
            this.updateStatus('Camera ready');
            console.log('Camera initialization complete');
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.updateStatus('Camera unavailable');
            this.showCameraError(error.message);
        }
    }

    async enumerateDevices() {
        try {
            // Request permission first to get device labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('Found cameras:', this.availableDevices);
            this.populateCameraSelect();
            
        } catch (error) {
            console.error('Device enumeration failed:', error);
            // Continue without device selection
        }
    }

    populateCameraSelect() {
        const select = document.getElementById('camera-select');
        if (!select) return;
        
        select.innerHTML = '';
        
        if (this.availableDevices.length === 0) {
            select.innerHTML = '<option value="">No cameras found</option>';
            return;
        }
        
        this.availableDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            
            let label = device.label || `Camera ${index + 1}`;
            
            // Clean up common device names
            if (label.includes('infrared') || label.includes('IR')) {
                label += ' (IR - not recommended)';
            } else if (label.includes('front') || label.includes('user')) {
                label += ' (Front)';
            } else if (label.includes('back') || label.includes('environment')) {
                label += ' (Back)';
            }
            
            option.textContent = label;
            select.appendChild(option);
        });
        
        // Try to select a good default (prefer back camera, avoid IR)
        const preferredDevice = this.findPreferredDevice();
        if (preferredDevice) {
            select.value = preferredDevice.deviceId;
            this.currentDeviceId = preferredDevice.deviceId;
        }
    }

    findPreferredDevice() {
        if (this.availableDevices.length === 0) return null;
        
        // Avoid infrared cameras
        const nonIR = this.availableDevices.filter(device => 
            !device.label.toLowerCase().includes('infrared') && 
            !device.label.toLowerCase().includes('ir')
        );
        
        if (nonIR.length === 0) {
            console.warn('Only IR camera available - this may not work well');
            return this.availableDevices[0];
        }
        
        // Prefer back/environment camera on mobile
        const backCamera = nonIR.find(device => 
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) return backCamera;
        
        // Otherwise use first non-IR camera
        return nonIR[0];
    }

    async requestCamera() {
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };
        
        // Use specific device if selected
        if (this.currentDeviceId) {
            constraints.video.deviceId = { exact: this.currentDeviceId };
        } else {
            // Fallback to facingMode for mobile
            constraints.video.facingMode = { ideal: 'environment' };
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            this.isActive = true;
            
            this.video.addEventListener('loadedmetadata', () => {
                this.video.play();
                // Set up canvas size and start processing
                this.setupCanvas();
                this.startPreview();
            });
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera permission denied');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera found');
            } else {
                throw new Error('Camera access failed');
            }
        }
    }

    setupEventListeners() {
        const captureBtn = document.getElementById('capture-btn');
        const filterBtns = document.querySelectorAll('.filter-pill');
        const cameraSelect = document.getElementById('camera-select');
        const switchBtn = document.getElementById('switch-camera');

        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
            });
        });
        
        if (cameraSelect) {
            cameraSelect.addEventListener('change', (e) => {
                this.switchToDevice(e.target.value);
            });
        }
        
        if (switchBtn) {
            switchBtn.addEventListener('click', () => {
                this.switchToNextCamera();
            });
        }
    }

    setupCanvas() {
        // Set canvas to fill the viewport while maintaining Game Boy resolution internally
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = 128;
        this.canvas.height = 112;
        
        // Scale canvas to fit container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }

    startPreview() {
        if (!this.isActive) return;

        const renderFrame = () => {
            if (this.video.readyState >= 2) {
                this.processFrame();
            }
            if (this.isActive) {
                requestAnimationFrame(renderFrame);
            }
        };
        
        renderFrame();
    }

    processFrame() {
        const { videoWidth, videoHeight } = this.video;
        if (videoWidth === 0 || videoHeight === 0) return;

        // Calculate cropping to maintain aspect ratio
        const sourceAspect = videoWidth / videoHeight;
        const targetAspect = 128 / 112;
        
        let sourceX = 0, sourceY = 0, sourceW = videoWidth, sourceH = videoHeight;
        
        if (sourceAspect > targetAspect) {
            sourceW = videoHeight * targetAspect;
            sourceX = (videoWidth - sourceW) / 2;
        } else {
            sourceH = videoWidth / targetAspect;
            sourceY = (videoHeight - sourceH) / 2;
        }

        // Draw video frame to canvas at Game Boy resolution
        this.ctx.drawImage(this.video, sourceX, sourceY, sourceW, sourceH, 0, 0, 128, 112);
        
        // Apply the same filter processing as saved images
        this.applyFilter();
    }

    applyFilter() {
        const imageData = this.ctx.getImageData(0, 0, 128, 112);
        
        switch (this.currentFilter) {
            case '2bit':
                ImageProcessor.twoBit(imageData);
                break;
            case 'gameboy':
                ImageProcessor.gameboy(imageData);
                break;
            case 'none':
                ImageProcessor.none(imageData);
                break;
            default:
                ImageProcessor.twoBit(imageData);
                break;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    capturePhoto() {
        if (!this.isActive) return;

        // Simply capture the current canvas content since it already has the processed image
        const dataURL = this.canvas.toDataURL('image/png');
        const timestamp = Date.now();
        
        const photo = {
            id: timestamp,
            dataURL: dataURL,
            timestamp: timestamp,
            filter: this.currentFilter
        };
        
        Storage.savePhoto(photo);
        Gallery.addPhoto(photo);
        
        this.flashEffect();
    }

    flashEffect() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 9999;
            pointer-events: none;
            opacity: 0.8;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.transition = 'opacity 0.2s ease';
            flash.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flash);
            }, 200);
        }, 50);
    }

    showCameraError(errorMessage = 'Camera unavailable') {
        const container = document.querySelector('.camera-container');
        
        let message = 'Please allow camera access and refresh the page';
        let troubleshooting = '';
        
        if (errorMessage.includes('permission') || errorMessage.includes('NotAllowed')) {
            message = 'Camera permission was denied';
            troubleshooting = '• Click the camera icon in your address bar<br>• Allow camera access for this site<br>• Refresh the page';
        } else if (errorMessage.includes('not found') || errorMessage.includes('NotFound')) {
            message = 'No camera was found on this device';
            troubleshooting = '• Make sure your device has a camera<br>• Try a different browser<br>• Check if another app is using the camera';
        } else if (errorMessage.includes('not supported')) {
            message = 'Camera API not supported';
            troubleshooting = '• Use HTTPS (https://) instead of HTTP<br>• Try a modern browser (Chrome, Firefox, Safari)<br>• Update your browser';
        } else if (!window.isSecureContext) {
            message = 'Camera requires secure connection (HTTPS)';
            troubleshooting = '• Access via https:// instead of http://<br>• Use localhost for local development<br>• Deploy to a secure server';
        }
        
        container.innerHTML = `
            <div class="empty-state" style="padding: var(--space-8); text-align: center;">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
                <h3>Camera Unavailable</h3>
                <p style="margin: var(--space-4) 0; font-weight: 600;">
                    ${message}
                </p>
                ${troubleshooting ? `
                    <div style="margin: var(--space-6) 0; font-size: var(--font-size-sm); text-align: left; max-width: 300px; margin-left: auto; margin-right: auto; background: var(--gray-50); padding: var(--space-4); border-radius: var(--radius-md);">
                        <strong>Troubleshooting:</strong><br>
                        ${troubleshooting}
                    </div>
                ` : ''}
                <div style="display: flex; gap: var(--space-3); justify-content: center; margin-top: var(--space-6);">
                    <button onclick="location.reload()" class="primary-btn">
                        Retry
                    </button>
                    <button onclick="window.gameBoyCamera.requestCamera()" class="secondary-btn">
                        Request Permission
                    </button>
                </div>
                <details style="margin-top: var(--space-6); font-size: var(--font-size-xs); color: var(--gray-500);">
                    <summary style="cursor: pointer; margin-bottom: var(--space-2);">Debug Info</summary>
                    <div style="text-align: left; background: var(--gray-50); padding: var(--space-3); border-radius: var(--radius-sm);">
                        <strong>Error:</strong> ${errorMessage}<br>
                        <strong>Secure Context:</strong> ${window.isSecureContext}<br>
                        <strong>User Agent:</strong> ${navigator.userAgent.substring(0, 50)}...<br>
                        <strong>URL:</strong> ${window.location.href}
                    </div>
                </details>
            </div>
        `;
    }

    updateStatus(message) {
        const statusElement = document.getElementById('camera-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.isActive = false;
        }
    }

    async switchToDevice(deviceId) {
        if (!deviceId || deviceId === this.currentDeviceId) return;
        
        console.log('Switching to device:', deviceId);
        this.currentDeviceId = deviceId;
        
        if (this.stream) {
            this.stop();
        }
        
        try {
            await this.requestCamera();
            this.setupCanvas();
            this.startPreview();
        } catch (error) {
            console.error('Camera switch failed:', error);
            this.showCameraError(error.message);
        }
    }
    
    switchToNextCamera() {
        if (this.availableDevices.length <= 1) return;
        
        const currentIndex = this.availableDevices.findIndex(
            device => device.deviceId === this.currentDeviceId
        );
        
        const nextIndex = (currentIndex + 1) % this.availableDevices.length;
        const nextDevice = this.availableDevices[nextIndex];
        
        const select = document.getElementById('camera-select');
        if (select) {
            select.value = nextDevice.deviceId;
        }
        
        this.switchToDevice(nextDevice.deviceId);
    }

    async switchCamera() {
        // Legacy method - now uses switchToNextCamera
        this.switchToNextCamera();
    }
}