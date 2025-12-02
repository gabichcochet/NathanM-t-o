from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8000

class MyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.path = "/connexion.html"
        return super().do_GET()

def start_server():
    server = HTTPServer(("0.0.0.0", PORT), MyHandler)
    print(f"🌐 Serving at http://localhost:{PORT}")
    server.serve_forever()

if __name__ == "__main__":
    start_server()