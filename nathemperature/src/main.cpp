#include <Arduino.h>
#include "DHTesp.h"
#include <WiFiManager.h>
 
WiFiManager wm;
DHTesp dht;

void setup() {

  WiFi.mode(WIFI_STA);
  
  Serial.begin(115200);

  dht.setup(25, DHTesp::DHT11);

  delay(1000);
  Serial.println();

  Serial.println("Tentative de connexion au réseau Wi-Fi...");

    // Connexion automatique au réseau Wi-Fi connu
    if (!wm.autoConnect()) {
        Serial.println("Erreur de connexion au réseau Wi-Fi.");
        // Vous pouvez ajouter ici une logique pour gérer l'erreur de connexion
    } else {
        // Connexion réussie
        Serial.println("Connexion au réseau Wi-Fi réussie !");
        Serial.print("Adresse IP : ");
        Serial.println(WiFi.localIP());
        // Vous pouvez ajouter ici une logique pour exécuter des actions supplémentaires après la connexion réussie
    }
}

void loop() {
  float humidity = dht.getHumidity();
  float temperature = dht.getTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor");
  } else {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C, Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }
  delay(2000);
}
