import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Droplets, ThermometerSun } from 'lucide-react';
import { SensorCard } from '../components/SensorCard';
import { PumpControl } from '../components/PumpControl';
import { HistoryChart } from '../components/HistoryChart';

interface CurrentData {
  temperature: number | null;
  soilMoisture: number | null;
  timestamp?: string;
}

export default function Dashboard() {
  const [currentData, setCurrentData] = useState<CurrentData>({ temperature: null, soilMoisture: null });

  useEffect(() => {
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrent = async () => {
    try {
      const { data } = await api.get('/latest');
      setCurrentData(data);
    } catch (err) {
      console.error('Failed to fetch current data', err);
    }
  };

  const getMoistureStatus = (val: number | null) => {
    if (val === null) return { text: '', color: '' };
    if (val < 30) return { text: 'Dry', color: 'text-danger' };
    if (val < 70) return { text: 'Moist', color: 'text-primary' };
    return { text: 'Wet', color: 'text-blue-500' };
  };

  const mStatus = getMoistureStatus(currentData.soilMoisture);
  
  const lastUpdate = currentData.timestamp 
    ? new Date(currentData.timestamp).toLocaleTimeString() 
    : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-text">Dashboard</h2>
        <p className="text-muted mt-2 text-lg font-medium">Real-time agricultural telemetry and pump management</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SensorCard
          title="Soil Moisture"
          value={currentData.soilMoisture}
          unit="%"
          icon={<Droplets size={26} className="text-primary"/>}
          statusText={mStatus.text}
          statusColor={mStatus.color}
          lastUpdated={lastUpdate}
        />
        <SensorCard
          title="Temperature"
          value={currentData.temperature}
          unit="°C"
          icon={<ThermometerSun size={26} className="text-amber-500"/>}
          lastUpdated={lastUpdate}
        />
        <PumpControl />
      </div>

      <div className="bg-surface p-8 rounded-3xl shadow-sm border border-border mt-8">
         <HistoryChart />
      </div>
    </div>
  );
}
