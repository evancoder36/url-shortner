#!/usr/bin/env python3
import http.server
import socketserver
import os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the path
        path = self.path.lstrip('/')
        
        # If no path specified, serve index.html (router)
        if not path or path == '':
            self.path = '/index.html'
        # If it's a short code (no dots, no html), route to handler
        elif '/' not in path and '.' not in path and len(path) > 0:
            self.path = f'/handler.html#{path}'
        
        return super().do_GET()

PORT = 3000

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    httpd.serve_forever()