# WebToy Camera

A retro toy camera web app inspired by classic handheld cameras, optimized for mobile devices with modern web technologies.

## Features

- **Retro Camera**: 128x112 pixel monochrome photography with authentic dithering effects
- **Real-time Filters**: Floyd-Steinberg dithering, edge detection, and classic Game Boy effects
- **Photo Gallery**: Browse and edit your retro photos with stamps and frames
- **Mini-Games**: Collection of touch-optimized games inspired by the original
- **Mobile-First**: Designed specifically for smartphone browsers
- **PWA Ready**: Install as an app for offline use

## Demo

🎮 **[Live Demo](https://yourusername.github.io/gameboy-camera-remake)**

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gameboy-camera-remake.git
cd gameboy-camera-remake
```

2. Open `index.html` in your browser or serve with a local server:
```bash
python -m http.server 8000
# or
npx serve .
```

3. Grant camera permissions when prompted

## Games Included

- **Ball**: Motion-controlled juggling game
- **Space Fever II**: Touch-based space shooter
- **DJ**: Music mixing with camera input
- **Run! Run! Run!**: Endless runner with photo backgrounds

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with camera API support

## GitHub Pages Deployment

This project is configured for GitHub Pages hosting:

1. Push to your GitHub repository
2. Go to Settings > Pages
3. Select "Deploy from a branch" 
4. Choose `main` branch and `/ (root)` folder
5. Your app will be available at `https://yourusername.github.io/gameboy-camera-remake`

## Development

### File Structure
```
gameboy-camera-remake/
├── index.html          # Main application
├── css/
│   ├── main.css        # Core styles
│   └── gameboy-theme.css # Game Boy aesthetic
├── js/
│   ├── camera.js       # Camera functionality
│   ├── filters.js      # Image processing
│   ├── gallery.js      # Photo management
│   └── games/          # Mini-games
└── assets/             # Sounds, sprites, frames
```

### Key Technologies
- Vanilla JavaScript (ES6+)
- Canvas 2D API for image processing
- MediaDevices API for camera access
- IndexedDB for local photo storage
- CSS Grid/Flexbox for responsive layout

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Original Game Boy Camera by Nintendo
- Inspired by the retro photography community
- Thanks to contributors and testers

---

📱 **Best experienced on mobile devices**