Smart Home Monitoring Dashboard
===============================

A complete IoT solution for monitoring and controlling your smart home environment. This project includes a responsive web dashboard built with Vite and Tailwind CSS, a Node.js backend with MQTT and MongoDB integration, and ESP32 firmware for sensor data collection and device control.

Features
--------

*   Real-time monitoring of temperature, humidity, and air quality
    
*   Interactive charts for historical data visualization
    
*   Control of smart home devices (lights, appliances, etc.)
    
*   MQTT communication between ESP32 and server
    
*   Data persistence with MongoDB
    
*   Responsive design that works on mobile and desktop
    

System Architecture
-------------------

The system consists of several components:

1.  **ESP32 Microcontroller** - Collects sensor data and controls relays
    
2.  **MQTT Broker** - Handles message passing between components
    
3.  **Node.js Backend** - Processes and stores data, provides API endpoints
    
4.  **MongoDB Database** - Stores historical sensor readings
    
5.  **React Frontend** - User interface for monitoring and control
    

Prerequisites
-------------

*   Node.js (v14+)
    
*   MongoDB (v4+)
    
*   Eclipse Mosquitto MQTT Broker
    
*   Arduino IDE with ESP32 support
    
*   DHT11 temperature/humidity sensor
    
*   MQ135 air quality sensor
    
*   Relay modules for device control
    

Hardware Setup
--------------

Connect the components to your ESP32:

*   DHT11 sensor: GPIO4
    
*   MQ135 sensor: GPIO34 (ADC pin)
    
*   Living room light relay: GPIO16
    
*   Kitchen light relay: GPIO17
    
*   Bedroom light relay: GPIO18
    
*   AC control relay: GPIO19
    
*   Vacuum control relay: GPIO21
    

Installation & Setup
--------------------

### 1\. MQTT Broker Setup

Install and configure Eclipse Mosquitto:

`   # On Windows  # Download and install from https://mosquitto.org/download/  # On Linux  sudo apt-get install mosquitto mosquitto-clients  sudo systemctl enable mosquitto.service  sudo systemctl start mosquitto.service   `

### 2\. MongoDB Setup

Install and run MongoDB:

`   # On Windows  # Download and install from https://www.mongodb.com/try/download/community  # On Linux  sudo apt-get install mongodb  sudo systemctl enable mongodb  sudo systemctl start mongodb   `

### 3\. Backend Setup

Clone the repository and set up the backend:

`   # Navigate to the backend directory  cd backend  # Install dependencies  npm install  # Start the server  npm start   `

### 4\. Frontend Setup

Set up the frontend:

`   # Navigate to the frontend directory  cd frontend  # Install dependencies  npm install  # Start the development server  npm run dev   `

### 5\. ESP32 Setup

1.  Open the Arduino IDE
    
2.  Install the required libraries:
    
    *   PubSubClient
        
    *   DHT sensor library
        
    *   ArduinoJson
        
3.  Open the ESP32 sketch from the esp32 directory
    
4.  Update WiFi credentials and MQTT server address
    
5.  Upload the sketch to your ESP32
    

Configuration
-------------

### Backend Configuration

Edit these values in server.js:

`   // MongoDB connection  mongoose.connect('mongodb://localhost:27017/smart_home', {    useNewUrlParser: true,    useUnifiedTopology: true,  });  // MQTT connection  const mqttClient = mqtt.connect('mqtt://localhost:1883');   `

### ESP32 Configuration

Edit these values in the ESP32 sketch:

`   // WiFi credentials  const char* ssid = "YOUR_WIFI_SSID";  const char* password = "YOUR_WIFI_PASSWORD";  // MQTT Broker settings  const char* mqtt_server = "YOUR_PC_IP_ADDRESS";  // IP of your PC running Mosquitto  const int mqtt_port = 1883;   `

API Endpoints
-------------

* Endpoint - Method - Description
* /api/sensor/current - GET - Get current sensor readings
* /api/sensor/history - GET - Get historical data (24 hours)
* /api/control/toggle - POST - Control a device

MQTT Topics
-----------

### Sensor Data

*   esp32/temperature - Temperature readings
    
*   esp32/humidity - Humidity readings
    
*   esp32/airquality - Air quality readings
    

### Control Commands

*   esp32/control/light/living - Living room light control
    
*   esp32/control/light/kitchen - Kitchen light control
    
*   esp32/control/light/bedroom - Bedroom light control
    
*   esp32/control/ac - AC control
    
*   esp32/control/vacuum - Vacuum control
    

### Device Status

*   esp32/device/livingRoomLight - Living room light status
    
*   esp32/device/kitchenLight - Kitchen light status
    
*   esp32/device/bedroomLight - Bedroom light status
    
*   esp32/device/airConditioner - AC status
    
*   esp32/device/robotVacuum - Vacuum status
    

Development
-----------

### Frontend Development

The frontend is built with:

*   Vite
    
*   React
    
*   Tailwind CSS
    
*   React Query
    
*   Recharts for visualizations
    
*   Lucide-React for icons
    

To build for production:

`   cd frontend  npm run build   `

### Backend Development

The backend uses:

*   Node.js
    
*   Express
    
*   Mongoose for MongoDB
    
*   MQTT.js for MQTT communication
    

Troubleshooting
---------------

### MQTT Connection Issues

*   Ensure the MQTT broker is running
    
*   Check that the broker address is correct in both ESP32 and backend
    
*   Verify that the required topics are being published and subscribed
    

### Sensor Reading Issues

*   Check that the sensors are properly connected
    
*   Verify that the ESP32 is receiving and transmitting data
    
*   Check the serial monitor for debugging information
    

### MongoDB Issues

*   Ensure MongoDB is running
    
*   Check the connection string
    
*   Verify database permissions
    

Contributing
------------

Contributions are welcome! Please feel free to submit a Pull Request.

Acknowledgements
----------------

*   UI inspired by modern IoT dashboards
    
*   Thanks to all open-source libraries used in this project
