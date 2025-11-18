import paho.mqtt.client as mqtt
import csv
from datetime import datetime

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = [("WeatherB2/temperature", 0), ("WeatherB2/humidity", 0)]
CSV_FILE = "sensor_data.csv"

latest_values = {"temperature": None, "humidity": None}


with open(CSV_FILE, "a", newline="") as f:
    if f.tell() == 0: 
        writer = csv.writer(f)
        writer.writerow(["timestamp", "temperature", "humidity"])

def read_temperature_humidity(csv_file=CSV_FILE):
    """
    Returns a list of dicts: [{'timestamp': ..., 'temperature': ..., 'humidity': ...}, ...]
    """
    data = []
    try:
        with open(csv_file, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    temp = float(row["temperature"])
                    hum = float(row["humidity"])
                except ValueError:
                    continue 
                data.append({
                    "timestamp": row["timestamp"],
                    "temperature": temp,
                    "humidity": hum
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

    if msg.topic.endswith("temperature"):
        latest_values["temperature"] = payload
    elif msg.topic.endswith("humidity"):
        latest_values["humidity"] = payload

    if latest_values["temperature"] and latest_values["humidity"]:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(CSV_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                timestamp,
                latest_values["temperature"],
                latest_values["humidity"]
            ])
        print("💾 Saved row:", latest_values)

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_forever()
