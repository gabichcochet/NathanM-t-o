#include <Arduino.h>
#include "DHTesp.h"

DHTesp dht;

void setup() {
  Serial.begin(115200);
  dht.setup(25, DHTesp::DHT11);
  delay(1000);
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
