#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// --- WiFi & API Configuration ---
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* SERVER_URL = "http://YOUR_BACKEND_URL/api/data"; // Post endpoint optimization

// --- Pin Definitions ---
#define DHTPIN 4           // Digital pin connected to the DHT sensor
#define SOIL_MOISTURE_PIN 34 // Analog pin connected to soil moisture potentiometer
#define RELAY_PIN 25       // Digital pin connected to the relay (and LED)

// --- DHT Configuration ---
#define DHTTYPE DHT22      // Use DHT22 (AM2302)
DHT dht(DHTPIN, DHTTYPE);

// --- Constants & Thresholds ---
const int RECORD_INTERVAL = 2000;    // Non-blocking delay interval (2 seconds)
const int DRY_SOIL_THRESHOLD = 30;   // Pump triggers if soil moisture < 30%
const float TEMP_MIN = 15.0;         // Minimum safe temperature for watering
const float TEMP_MAX = 38.0;         // Maximum safe temperature for watering
const float HUMIDITY_MAX = 80.0;     // Maximum air humidity for watering

unsigned long previousMillis = 0;
bool isPumpOn = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize outputs
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure pump is OFF at startup
  
  // Initialize inputs
  pinMode(SOIL_MOISTURE_PIN, INPUT);

  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected.");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi. Operating offline.");
  }

  Serial.println("--- Smart Irrigation System Initialized ---");
}

void loop() {
  unsigned long currentMillis = millis();

  // Run non-blocking delay every 2 seconds
  if (currentMillis - previousMillis >= RECORD_INTERVAL) {
    previousMillis = currentMillis;

    // 1. Read DHT22 Sensors
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // 2. Read Soil Moisture
    int rawMoisture = analogRead(SOIL_MOISTURE_PIN);
    int soilMoisturePercent = map(rawMoisture, 4095, 0, 0, 100);
    soilMoisturePercent = constrain(soilMoisturePercent, 0, 100);

    // Default target state based on offline logical calculations
    bool needsWater = (soilMoisturePercent < DRY_SOIL_THRESHOLD);
    bool tempSafe = (temperature >= TEMP_MIN && temperature <= TEMP_MAX);
    bool humiditySafe = (humidity < HUMIDITY_MAX);
    bool localPumpTarget = (needsWater && tempSafe && humiditySafe);
    
    // Fallback variables
    String serverMode = "auto";
    bool serverPumpTarget = localPumpTarget;

    // 3. Network POST if Connected
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");

      // Build JSON payload (ArduinoJson v6 syntax)
      StaticJsonDocument<200> doc;
      doc["temperature"] = temperature;
      doc["soilMoisture"] = soilMoisturePercent;
      doc["pumpState"] = isPumpOn ? "on" : "off";
      
      String requestBody;
      serializeJson(doc, requestBody);
      
      int httpResponseCode = http.POST(requestBody);
      
      if (httpResponseCode > 0) {
        String responseBody = http.getString();
        
        // Parse incoming instructions correctly
        StaticJsonDocument<200> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, responseBody);
        
        if (!error && responseDoc["success"] == true) {
           if (responseDoc.containsKey("mode")) {
              serverMode = responseDoc["mode"].as<String>();
           }
           if (responseDoc.containsKey("pumpState")) {
              serverPumpTarget = (responseDoc["pumpState"].as<String>() == "on");
           }
        }
      } else {
        Serial.print("HTTP POST Failed, Error code: ");
        Serial.println(httpResponseCode);
      }
      http.end();
    }

    // 4. Resolve Control Logic
    if (serverMode == "manual") {
      isPumpOn = serverPumpTarget;
    } else {
      isPumpOn = localPumpTarget;
    }

    // Apply Pump State
    if (isPumpOn) {
      digitalWrite(RELAY_PIN, HIGH);
    } else {
      digitalWrite(RELAY_PIN, LOW);
    }

    // 5. Console output format requested
    Serial.print("WiFi: ");
    Serial.print((WiFi.status() == WL_CONNECTED) ? "Connected" : "Disconnected");
    if (WiFi.status() == WL_CONNECTED) {
       Serial.print(" | IP: ");
       Serial.print(WiFi.localIP());
    }
    Serial.println();
    
    Serial.print("Server: ");
    Serial.print((WiFi.status() == WL_CONNECTED) ? "OK" : "Unreachable");
    Serial.print(" | Temp: ");
    Serial.print(temperature, 1);
    Serial.print("C | Soil: ");
    Serial.print(soilMoisturePercent);
    Serial.print("% | Pump: ");
    Serial.print(isPumpOn ? "ON" : "OFF");
    Serial.print(" | Mode: ");
    
    // Capitalize mode manually for standard output
    String printMode = serverMode;
    printMode.toUpperCase();
    Serial.println(printMode);
  }
}
