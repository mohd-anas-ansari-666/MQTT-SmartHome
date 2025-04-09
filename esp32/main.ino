#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "JARVIS";
const char* password = "jarvis$100";

// MQTT Broker settings
const char* mqtt_server = "192.168.43.4";  // IP of your Windows PC running Mosquitto
const int mqtt_port = 1883;
const char* mqtt_username = ""; // If you set up authentication
const char* mqtt_password = ""; // If you set up authentication

// DHT11 sensor
#define DHTPIN 4      // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11 // DHT 11
DHT dht(DHTPIN, DHTTYPE);

// MQ135 Air Quality Sensor
#define MQ135PIN 34   // Analog pin connected to MQ135

// Relay pins
#define RELAY_LIVING_ROOM 16
#define RELAY_KITCHEN 17
#define RELAY_BEDROOM 18
#define RELAY_AC 19
#define RELAY_VACUUM 21

// MQTT topics
const char* temp_topic = "esp32/temperature";
const char* humidity_topic = "esp32/humidity";
const char* airquality_topic = "esp32/airquality";

// Control topics (commands from server)
const char* light_living_topic = "esp32/control/light/living";
const char* light_kitchen_topic = "esp32/control/light/kitchen";
const char* light_bedroom_topic = "esp32/control/light/bedroom";
const char* ac_topic = "esp32/control/ac";
const char* vacuum_topic = "esp32/control/vacuum";

// Device status topics (reporting back to server)
const char* status_living_topic = "esp32/device/livingRoomLight";
const char* status_kitchen_topic = "esp32/device/kitchenLight";
const char* status_bedroom_topic = "esp32/device/bedroomLight";
const char* status_ac_topic = "esp32/device/airConditioner";
const char* status_vacuum_topic = "esp32/device/robotVacuum";

// Initialize WiFi and MQTT client
WiFiClient espClient;
PubSubClient client(espClient);

// Timing variables
unsigned long lastReadingTime = 0;
const long interval = 2000;  // Read sensors every 2 seconds

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      
      // Subscribe to control topics
      client.subscribe(light_living_topic);
      client.subscribe(light_kitchen_topic);
      client.subscribe(light_bedroom_topic);
      client.subscribe(ac_topic);
      client.subscribe(vacuum_topic);
      
      // Report initial device states
      reportDeviceStates();
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void reportDeviceStates() {
  // Report status of all devices
  client.publish(status_living_topic, digitalRead(RELAY_LIVING_ROOM) == HIGH ? "1" : "0", true);
  client.publish(status_kitchen_topic, digitalRead(RELAY_KITCHEN) == HIGH ? "1" : "0", true);
  client.publish(status_bedroom_topic, digitalRead(RELAY_BEDROOM) == HIGH ? "1" : "0", true);
  client.publish(status_ac_topic, digitalRead(RELAY_AC) == HIGH ? "1" : "0", true);
  client.publish(status_vacuum_topic, digitalRead(RELAY_VACUUM) == HIGH ? "1" : "0", true);
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string
  payload[length] = '\0';
  String message = String((char*)payload);
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(message);
  
  // Process device control messages
  if (strcmp(topic, light_living_topic) == 0) {
    handleDeviceControl(RELAY_LIVING_ROOM, message, status_living_topic);
  } else if (strcmp(topic, light_kitchen_topic) == 0) {
    handleDeviceControl(RELAY_KITCHEN, message, status_kitchen_topic);
  } else if (strcmp(topic, light_bedroom_topic) == 0) {
    handleDeviceControl(RELAY_BEDROOM, message, status_bedroom_topic);
  } else if (strcmp(topic, ac_topic) == 0) {
    handleDeviceControl(RELAY_AC, message, status_ac_topic);
  } else if (strcmp(topic, vacuum_topic) == 0) {
    handleDeviceControl(RELAY_VACUUM, message, status_vacuum_topic);
  }
}

void handleDeviceControl(int relayPin, String message, const char* statusTopic) {
  if (message == "1") {
    digitalWrite(relayPin, HIGH); // ON
  } else {
    digitalWrite(relayPin, LOW);  // OFF
  }
  // Report the new state back to the server
  client.publish(statusTopic, digitalRead(relayPin) == HIGH ? "1" : "0", true);
}

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(RELAY_LIVING_ROOM, OUTPUT);
  pinMode(RELAY_KITCHEN, OUTPUT);
  pinMode(RELAY_BEDROOM, OUTPUT);
  pinMode(RELAY_AC, OUTPUT);
  pinMode(RELAY_VACUUM, OUTPUT);
  
  // Set initial states
  digitalWrite(RELAY_LIVING_ROOM, LOW);
  digitalWrite(RELAY_KITCHEN, LOW);
  digitalWrite(RELAY_BEDROOM, LOW);
  digitalWrite(RELAY_AC, LOW);
  digitalWrite(RELAY_VACUUM, LOW);
  
  // Setup WiFi
  setup_wifi();
  
  // Configure MQTT server
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // Initialize DHT sensor
  dht.begin();
  
  Serial.println("Setup complete");
}

void loop() {
  // Ensure MQTT connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read sensors at specified interval
  unsigned long currentMillis = millis();
  if (currentMillis - lastReadingTime >= interval) {
    lastReadingTime = currentMillis;
    
    // Read DHT11 sensor
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    
    // Read MQ135 air quality sensor
    int airQualityValue = analogRead(MQ135PIN);
    
    // Check if readings are valid
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
    } else {
      // Convert float values to strings with 1 decimal place
      char tempStr[8];
      char humStr[8];
      char airQualityStr[8];
      
      dtostrf(temperature, 5, 1, tempStr);
      dtostrf(humidity, 5, 1, humStr);
      sprintf(airQualityStr, "%d", airQualityValue);
      
      // Publish sensor data to MQTT
      client.publish(temp_topic, tempStr);
      client.publish(humidity_topic, humStr);
      client.publish(airquality_topic, airQualityStr);
      
      // Debug output
      Serial.print("Temperature: ");
      Serial.print(temperature);
      Serial.print(" °C, Humidity: ");
      Serial.print(humidity);
      Serial.print(" %, Air Quality: ");
      Serial.println(airQualityValue);
    }
  }
}