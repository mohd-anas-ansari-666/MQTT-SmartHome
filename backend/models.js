// models.js
const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  airQuality: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);

module.exports = {
  SensorReading
};