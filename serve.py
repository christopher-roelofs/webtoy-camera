#!/usr/bin/env python3
"""
Simple HTTP server for testing the Game Boy Camera app locally.
Camera API works on localhost even without HTTPS.
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers for camera access
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

def main():
    # Change to the script's directory
    os.chdir(Path(__file__).parent)
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🎮 Game Boy Camera Server")
        print(f"📱 Serving at: http://localhost:{PORT}")
        print(f"🐛 Debug page: http://localhost:{PORT}/debug.html")
        print(f"📷 Main app: http://localhost:{PORT}")
        print(f"⏹️  Press Ctrl+C to stop")
        
        # Try to open browser automatically
        try:
            webbrowser.open(f"http://localhost:{PORT}")
        except:
            pass
            
        httpd.serve_forever()

if __name__ == "__main__":
    main()