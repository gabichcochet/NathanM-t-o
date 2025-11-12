import paho.mqtt.client as mqtt

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC =  [("Nathan/humidity", 0), ("Nathan/temperature", 0)]

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected successfully to broker!")
        client.subscribe(TOPIC)
        print(f"📡 Subscribed to topic: {TOPIC}")
    else:
        print("❌ Connection failed with code:", rc)

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"📥 Message received on '{msg.topic}': {payload}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
print("🔄 Connecting to broker...")

client.loop_forever()
