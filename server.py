import os
import json
import jwt
import datetime
from http.server import SimpleHTTPRequestHandler, HTTPServer
 
PORT = 8000
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
SECRET_KEY = "ma_cle_secrete"
 
USERS_FILE = os.path.join(ROOT_DIR, "users.json")
 
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []
 
def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
 
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
 
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        data = json.loads(body.decode("utf-8"))
 
        if self.path == "/api/login":
            email = data.get("email")
            password = data.get("password")
 
            users = load_users()
            user = next((u for u in users if u["email"] == email and u["password"] == password), None)
            if user:
                payload = {
                    "email": email,
                    "name": user["name"],
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
 
                response = {
                    "name": user["name"],
                    "email": user["email"],
                    "devices": user["devices"],
                    "token": token
                }
 
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response).encode("utf-8"))
            else:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid credentials"}).encode("utf-8"))
 
        elif self.path == "/api/signup":
            email = data.get("email")
            password = data.get("password")
            name = data.get("name")
            devices = data.get("devices", [])
 
            users = load_users()
            if any(u["email"] == email for u in users):
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Email already exists"}).encode("utf-8"))
                return
 
            new_user = {"email": email, "password": password, "name": name, "devices": devices}
            users.append(new_user)
            save_users(users)
 
            payload = {"email": email, "name": name, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)}
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
 
            response = {"name": name, "email": email, "devices": devices, "token": token}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
        elif self.path == "/api/add_device":
            token = self.headers.get("Authorization")
            if not token:
                self.send_response(403)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing token"}).encode("utf-8"))
                return
 
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                email = decoded["email"]
 
                device_code = data.get("device_code")
                users = load_users()
                user = next((u for u in users if u["email"] == email), None)
 
                if user and device_code:
                    if device_code not in user["devices"]:
                        user["devices"].append(device_code)
                        save_users(users)
 
                    response = {"devices": user["devices"]}
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode("utf-8"))
                else:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Invalid request"}).encode("utf-8"))
 
            except jwt.ExpiredSignatureError:
                self.send_response(401)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Token expired"}).encode("utf-8"))
            except jwt.InvalidTokenError:
                self.send_response(401)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid token"}).encode("utf-8"))
 
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