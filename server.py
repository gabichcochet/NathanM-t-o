import os
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8000
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class MyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.path = "/connexion.html"
        if self.path.endswith(".csv"):
            file_path = self.path.lstrip("/")
            if os.path.exists(file_path):
                self.send_response(200)
                self.send_header("Content-type", "text/plain; charset=utf-8")
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_error(404, "CSV file not found")
                return

        return super().do_GET()

def start_server():
    os.chdir(ROOT_DIR)
    server = HTTPServer(("0.0.0.0", PORT), MyHandler)
    print(f"🌐 Serving from: {ROOT_DIR}")
    print(f"🌐 Access at: http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()

if __name__ == "__main__":
    start_server()