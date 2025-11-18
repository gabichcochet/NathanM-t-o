import paho.mqtt.client as mqtt
import csv
from datetime import datetime

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = [("WeatherB2/temperature/#", 0), ("WeatherB2/humidity/#", 0)]
CSV_FILE = "sensor_data.csv"

with open(CSV_FILE, "a", newline="") as f:
    if f.tell() == 0:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "temperature", "humidity", "token"])

def read_temperature_humidity(csv_file=CSV_FILE):
    """
    Returns a list of dicts: [{'timestamp': ..., 'temperature': ..., 'humidity': ..., 'token': ...}, ...]
    """
    data = []
    try:
        with open(csv_file, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    temp = float(row.get("temperature", "") or 0)
                    hum = float(row.get("humidity", "") or 0)
                except (ValueError, TypeError):
                    continue
                tok = row.get("token", "")
                data.append({
                    "timestamp": row.get("timestamp", ""),
                    "temperature": temp,
                    "humidity": hum,
                    "token": tok
                })
    except FileNotFoundError:
        print(f"❌ CSV file {csv_file} not found.")
    return data

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to broker")
        client.subscribe(TOPIC)
    else:
        print("❌ Failed to connect:", rc)

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"📥 {msg.topic}: {payload}")
    parts = msg.topic.split('/')
    category = None
    token = None
    if len(parts) >= 3:
        category = parts[1]
        token = parts[2]

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if category in ["temperature", "humidity"]:
        try:
            value = float(payload)
        except ValueError:
            value = payload

        with open(CSV_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            if category == "temperature":
                writer.writerow([timestamp, value, "", token])
                print(f"💾 Saved temperature row: {value} (token: {token})")
            elif category == "humidity":
                writer.writerow([timestamp, "", value, token])
                print(f"💾 Saved humidity row: {value} (token: {token})")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_forever()
