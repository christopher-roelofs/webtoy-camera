console.log('Loading new image-processing.js...');

class ImageProcessor {
    static twoBit(imageData) {
        const palette = [
            [0, 0, 0],        // Black
            [85, 85, 85],     // Dark gray  
            [170, 170, 170],  // Light gray
            [255, 255, 255]   // White
        ];
        
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const grayscale = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            const paletteIndex = Math.floor(grayscale / 64);
            const color = palette[Math.min(paletteIndex, 3)];
            
            data[i] = color[0];     // R
            data[i + 1] = color[1]; // G
            data[i + 2] = color[2]; // B
        }
    }

    static none(imageData) {
        // No processing - keep original camera colors
        // This method intentionally does nothing to preserve natural colors
    }

    static gameboy(imageData) {
        const palette = [
            [15, 56, 15],     // Black (darkest green)
            [48, 98, 48],     // Dark gray (dark green)  
            [139, 149, 109],  // Light gray (light green)
            [155, 189, 15]    // White (lightest green)
        ];
        
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const grayscale = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            const paletteIndex = Math.floor(grayscale / 64);
            const color = palette[Math.min(paletteIndex, 3)];
            
            data[i] = color[0];     // R
            data[i + 1] = color[1]; // G
            data[i + 2] = color[2]; // B
        }
    }
}

console.log('ImageProcessor class loaded successfully');
console.log('twoBit method:', typeof ImageProcessor.twoBit);
console.log('none method:', typeof ImageProcessor.none);