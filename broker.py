import os
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
        writer.writerow(["timestamp", "value", "type", "device_code"])

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
    device_code = None
    if len(parts) >= 3:
        category = parts[1]  
        device_code = parts[2] 

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if category in ["temperature", "humidity"]:
        try:
            value = float(payload)
        except ValueError:
            value = payload

        with open(CSV_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([timestamp, value, category, device_code])
            print(f"💾 Saved {category} row: {value} (device: {device_code})")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_forever()