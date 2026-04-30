import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Calendar } from 'lucide-react';

interface SensorData {
  id: number;
  timestamp: string;
  temperature: number;
  soilMoisture: number;
}

export function HistoryChart() {
  const [data, setData] = useState<SensorData[]>([]);
  const [range, setRange] = useState('day');

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [range]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/history?range=${range}`);
      const formatted = res.data.data.map((item: any) => ({
        ...item,
        time: new Date(item.timestamp).toLocaleString([], {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      }));
      setData(formatted);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3 text-text">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Calendar size={28} className="text-primary"/>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Sensor History</h3>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-border">
          {['day', 'week', 'month'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                range === r
                  ? 'bg-surface text-primary shadow-sm ring-1 ring-border'
                  : 'text-muted hover:text-text'
              }`}
            >
              {r === 'day' ? '24 Hours' : r === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[450px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.length > 0 ? data : [{ time: '12:00', temperature: null, soilMoisture: null }, { time: '18:00', temperature: null, soilMoisture: null }, { time: '00:00', temperature: null, soilMoisture: null }]} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.6}/>
            <XAxis dataKey="time" stroke="var(--muted)" fontSize={13} tickLine={false} axisLine={false} dy={15} minTickGap={40} />
            <YAxis yAxisId="left" stroke="var(--primary)" fontSize={13} tickLine={false} axisLine={false} dx={-10}/>
            <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={13} tickLine={false} axisLine={false} dx={10}/>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                borderRadius: '16px',
                color: 'var(--text)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                fontWeight: 600,
                padding: '12px 16px'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '30px' }} iconType="circle" />
            <Line yAxisId="left" type="basis" name="Moisture (%)" dataKey="soilMoisture" stroke="var(--primary)" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0 }} connectNulls={true} />
            <Line yAxisId="right" type="basis" name="Temperature (°C)" dataKey="temperature" stroke="#eab308" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0 }} connectNulls={true} />
            {data.length === 0 && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-muted text-lg font-medium opacity-50">
                Awaiting sensor data...
              </text>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
