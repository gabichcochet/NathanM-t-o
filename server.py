from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading

PORT = 8000

def start_server():
    server = HTTPServer(("0.0.0.0", PORT), SimpleHTTPRequestHandler)
    print(f"🌐 Serving at http://localhost:{PORT}")
    server.serve_forever()

if __name__ == "__main__":
    start_server()
