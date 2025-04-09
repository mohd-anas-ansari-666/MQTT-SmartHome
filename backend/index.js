// server.js
const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const cors = require('cors');
const { SensorReading } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/smart_home', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Connect to MQTT broker
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to sensor data topics
  mqttClient.subscribe('esp32/temperature', { qos: 0 });
  mqttClient.subscribe('esp32/humidity', { qos: 0 });
  mqttClient.subscribe('esp32/airquality', { qos: 0 });
  
  // Subscribe to device status topics for bidirectional communication
  mqttClient.subscribe('esp32/device/#', { qos: 0 });
});

// Cache for the latest sensor readings
let latestSensorData = {
  temperature: 0,
  humidity: 0,
  airQuality: 0,
  energyUsage: 51, // Default values
  timestamp: new Date()
};

// Process incoming MQTT messages
mqttClient.on('message', async (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
  
  try {
    const value = parseFloat(message.toString());
    
    // Update the cache based on topic
    if (topic === 'esp32/temperature') {
      latestSensorData.temperature = value;
    } else if (topic === 'esp32/humidity') {
      latestSensorData.humidity = value;
    } else if (topic === 'esp32/airquality') {
      latestSensorData.airQuality = value;
    } else if (topic.startsWith('esp32/device/')) {
      // Handle device status updates from ESP32
      const deviceName = topic.split('/').pop();
      console.log(`Device ${deviceName} status: ${message.toString()}`);
      // You could update a devices state cache here if needed
    }
    
    // Save to database (throttled to avoid too many writes)
    // We could optimize this to write less frequently in production
    const now = new Date();
    if (now - latestSensorData.timestamp > 60000) { // Save once per minute
      latestSensorData.timestamp = now;
      
      const reading = new SensorReading({
        temperature: latestSensorData.temperature,
        humidity: latestSensorData.humidity,
        airQuality: latestSensorData.airQuality,
        timestamp: now
      });
      
      await reading.save();
      console.log('Saved sensor reading to database');
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// API Routes
// Get current sensor readings
app.get('/api/sensor/current', (req, res) => {
  res.json(latestSensorData);
});

// Get historical sensor data (last 24 hours)
app.get('/api/sensor/history', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const readings = await SensorReading.find({
      timestamp: { $gte: oneDayAgo }
    }).sort({ timestamp: 1 });
    
    res.json(readings);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Control devices
app.post('/api/control/toggle', (req, res) => {
  const { device, state } = req.body;
  
  if (!device) {
    return res.status(400).json({ error: 'Device name is required' });
  }
  
  // Map frontend device names to ESP32 topics
  const deviceTopicMap = {
    livingRoomLight: 'esp32/control/light/living',
    kitchenLight: 'esp32/control/light/kitchen',
    bedroomLight: 'esp32/control/light/bedroom',
    airConditioner: 'esp32/control/ac',
    robotVacuum: 'esp32/control/vacuum'
  };
  
  const topic = deviceTopicMap[device];
  if (!topic) {
    return res.status(400).json({ error: 'Unknown device' });
  }
  
  // Publish command to MQTT
  mqttClient.publish(topic, state ? '1' : '0', { qos: 0 }, (err) => {
    if (err) {
      console.error(`Failed to publish to ${topic}:`, err);
      return res.status(500).json({ error: 'Failed to send command' });
    }
    
    console.log(`Published to ${topic}: ${state ? '1' : '0'}`);
    res.json({ success: true, device, state });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});