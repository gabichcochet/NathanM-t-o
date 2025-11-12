#include <Arduino.h>
#include "DHTesp.h"
#include <WiFiManager.h>
#include <PubSubClient.h>
 
WiFiManager wm;
DHTesp dht;

WiFiClient espClient;
PubSubClient client(espClient);

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("Nathan")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      delay(5000);
    }
  }
}

void setup() {

  WiFi.mode(WIFI_STA);

  Serial.begin(115200);

  dht.setup(25, DHTesp::DHT11);

  delay(1000);
  Serial.println();

  Serial.println("Tentative de connexion au réseau Wi-Fi...");

    if (!wm.autoConnect()) {
        Serial.println("Erreur de connexion au réseau Wi-Fi.");
    } else {
        Serial.println("Connexion au réseau Wi-Fi réussie !");
        Serial.print("Adresse IP : ");
        Serial.println(WiFi.localIP());
    }

    client.setServer("broker.emqx.io", 1883);
    client.connect("Nathan");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  
  float humidity = dht.getHumidity();
  float temperature = dht.getTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor");
  } else {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    client.publish("Nathan/temperature", String(temperature).c_str());

    Serial.print(" °C, Humidity: ");
    Serial.print(humidity);
    client.publish("Nathan/humidity", String(humidity).c_str());
    Serial.println(" %");
  }
  delay(20000);
}