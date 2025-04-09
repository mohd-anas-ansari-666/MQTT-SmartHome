import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Icons
import { Sun, Moon, Thermometer, Droplets, Wind, Power, Coffee } from 'lucide-react';

// Fetch data from our backend
const fetchSensorData = async () => {
  const response = await fetch('http://localhost:5000/api/sensor/current');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const fetchHistoricalData = async () => {
  const response = await fetch('http://localhost:5000/api/sensor/history');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Toggle switch component
const Toggle = ({ label, isOn, onToggle }) => {
  return (
    <div className="flex items-center justify-between w-full p-3 bg-white rounded-xl shadow-sm">
      <span className="text-gray-700 font-medium">{label}</span>
      <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          isOn ? 'bg-purple-600' : 'bg-gray-200'
        }`}
        onClick={onToggle}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

// Circular gauge component
const CircleGauge = ({ value, unit, label, color = 'purple', size = 'lg' }) => {
  const circumference = 2 * Math.PI * 38;
  const progress = (value / 100) * circumference;
  const dashoffset = circumference - progress;
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };
  
  const colorClasses = {
    purple: 'text-purple-500 stroke-purple-500',
    green: 'text-green-500 stroke-green-500',
    blue: 'text-blue-500 stroke-blue-500',
    red: 'text-red-500 stroke-red-500'
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="stroke-gray-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="38"
          cx="50"
          cy="50"
        />
        <circle
          className={colorClasses[color]}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="38"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">
          {value}
          <span className="text-sm font-normal">{unit}</span>
        </span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>
    </div>
  );
};

// Card component
const Card = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${className}`}>
      {title && <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>}
      {children}
    </div>
  );
};

// Device control button component
const DeviceButton = ({ icon, label, isActive, onClick }) => {
  const Icon = icon;
  return (
    <button
      className={`flex flex-col items-center justify-center p-3 rounded-xl ${
        isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
      }`}
      onClick={onClick}
    >
      <Icon size={24} className={isActive ? 'text-purple-600' : 'text-gray-500'} />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

// Slider control component
const Slider = ({ label, value, onChange, min = 0, max = 100 }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />
    </div>
  );
};

function App() {
  // State for toggleable devices
  const [devices, setDevices] = useState({
    livingRoomLight: false,
    kitchenLight: false,
    bedroomLight: false,
    airConditioner: false,
    robotVacuum: false,
  });

  // State for sliders
  const [sliders, setSliders] = useState({
    lighting: 60,
    intensity: 75,
  });

  // Current sensor readings
  const { data: sensorData, isLoading, error } = useQuery('sensorData', fetchSensorData, {
    refetchInterval: 5000,
  });

  // Historical data for charts
  const { data: historyData } = useQuery('historyData', fetchHistoricalData, {
    refetchInterval: 60000,
  });

  // Handle device toggle
  const toggleDevice = async (device) => {
    // Toggle the state locally first for immediate UI feedback
    setDevices(prev => ({
      ...prev,
      [device]: !prev[device]
    }));

    // Send the command to the backend
    try {
      await fetch('http://localhost:5000/api/control/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device,
          state: !devices[device]
        }),
      });
    } catch (err) {
      console.error('Failed to toggle device:', err);
      // Revert state on error
      setDevices(prev => ({
        ...prev,
        [device]: !prev[device]
      }));
    }
  };

  // Handle slider change
  const handleSliderChange = (name, e) => {
    const value = parseInt(e.target.value);
    setSliders(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format chart data
  const chartData = historyData ? historyData.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    temperature: item.temperature,
    humidity: item.humidity
  })) : [];

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Smart Home Dashboard</h1>
          <p className="text-gray-500">Monitor and control your smart home devices</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Main stats section */}
          <Card className="md:col-span-2">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <CircleGauge 
                value={sensorData?.temperature || 0} 
                unit="°C" 
                label="Temperature" 
                color="purple" 
              />
              
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="bg-gray-100 rounded-xl p-3 flex flex-col items-center">
                  <Droplets className="text-blue-500 mb-1" />
                  <span className="text-sm text-gray-500">Humidity</span>
                  <span className="text-xl font-bold">{sensorData?.humidity || 0}%</span>
                </div>
                <div className="bg-gray-100 rounded-xl p-3 flex flex-col items-center">
                  <Wind className="text-green-500 mb-1" />
                  <span className="text-sm text-gray-500">Air Quality</span>
                  <span className="text-xl font-bold">{sensorData?.airQuality || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Energy usage card */}
          <Card className="col-span-1">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Energy Usage</h3>
              <CircleGauge 
                value={sensorData?.energyUsage || 51} 
                unit="%" 
                color="green" 
                size="md"
              />
              <span className="mt-2 text-sm text-gray-500">
                {sensorData?.energyUsage < 60 ? 'Good efficiency' : 'High usage'}
              </span>
            </div>
          </Card>

          {/* Mode selector */}
          <Card className="col-span-1">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center p-3 rounded-xl bg-purple-100 text-purple-600">
                <Sun size={20} className="mr-2" />
                <span>Day</span>
              </button>
              <button className="flex items-center justify-center p-3 rounded-xl bg-gray-100 text-gray-500">
                <Moon size={20} className="mr-2" />
                <span>Night</span>
              </button>
            </div>
          </Card>

          {/* Temperature chart */}
          <Card title="Temperature History" className="md:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Humidity chart */}
          <Card title="Humidity History" className="md:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="#82ca9d" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Device controls */}
          <Card title="Lighting" className="col-span-1">
            <Toggle 
              label="Living Room" 
              isOn={devices.livingRoomLight} 
              onToggle={() => toggleDevice('livingRoomLight')} 
            />
            <div className="mt-2">
              <Toggle 
                label="Kitchen" 
                isOn={devices.kitchenLight} 
                onToggle={() => toggleDevice('kitchenLight')} 
              />
            </div>
            <div className="mt-2">
              <Toggle 
                label="Bedroom" 
                isOn={devices.bedroomLight} 
                onToggle={() => toggleDevice('bedroomLight')} 
              />
            </div>
          </Card>

          {/* Additional controls */}
          <Card title="Appliances" className="col-span-1">
            <Toggle 
              label="Air Conditioner" 
              isOn={devices.airConditioner} 
              onToggle={() => toggleDevice('airConditioner')} 
            />
            <div className="mt-2">
              <Toggle 
                label="Robot Vacuum" 
                isOn={devices.robotVacuum} 
                onToggle={() => toggleDevice('robotVacuum')} 
              />
            </div>
          </Card>

          {/* Smart devices quick access */}
          <Card title="Quick Access" className="md:col-span-2">
            <div className="grid grid-cols-4 gap-2">
              <DeviceButton 
                icon={Sun} 
                label="Lights" 
                isActive={devices.livingRoomLight || devices.kitchenLight || devices.bedroomLight} 
                onClick={() => toggleDevice('livingRoomLight')} 
              />
              <DeviceButton 
                icon={Thermometer} 
                label="AC" 
                isActive={devices.airConditioner} 
                onClick={() => toggleDevice('airConditioner')} 
              />
              <DeviceButton 
                icon={Power} 
                label="TV" 
                isActive={false} 
                onClick={() => {}} 
              />
              <DeviceButton 
                icon={Coffee} 
                label="Coffee" 
                isActive={false} 
                onClick={() => {}} 
              />
            </div>
          </Card>

          {/* Sliders for additional controls */}
          <Card title="Controls" className="md:col-span-2">
            <Slider 
              label="Lighting dimmer" 
              value={sliders.lighting} 
              onChange={(e) => handleSliderChange('lighting', e)} 
            />
            <div className="mt-4">
              <Slider 
                label="Intensity" 
                value={sliders.intensity} 
                onChange={(e) => handleSliderChange('intensity', e)} 
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;