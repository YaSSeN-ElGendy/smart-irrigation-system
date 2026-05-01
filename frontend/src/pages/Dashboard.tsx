import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Sun, Moon, LogOut, Droplets, Thermometer, Power, Calendar, Users
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [espConnected, setEspConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('Checking...');
  const [chartData, setChartData] = useState([]);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [soilMoisture, setSoilMoisture] = useState<number | null>(null);
  const [pumpRunning, setPumpRunning] = useState(false);
  const [pumpMode, setPumpMode] = useState('auto');
  const [activeRange, setActiveRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isDark, setIsDark] = useState(true);

  const getToken = () => localStorage.getItem('auth_token');

  const logoutAndClear = () => {
    localStorage.removeItem('auth_token');
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.status === 401) return logoutAndClear();
        if (res.ok) {
          const data = await res.json();
          setEspConnected(data.esp32Connected);
        }
      } catch { setEspConnected(false); }
    };

    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/latest`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTemperature(data.temperature);
          setSoilMoisture(data.soilMoisture);
          setPumpRunning(data.pumpState === 'on');
          setPumpMode(data.mode);
          if (data.timestamp) setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
        }
      } catch (err) { console.error(err); }
    };

    fetchStatus(); fetchLatest();
    const id = setInterval(() => { fetchStatus(); fetchLatest(); }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/history?range=${activeRange}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Sample data to avoid overcrowded chart (max 60 points)
          const raw = data.data || [];
          const step = Math.max(1, Math.floor(raw.length / 60));
          const sampled = raw.filter((_: any, i: number) => i % step === 0);
          setChartData(sampled);
        }
      } catch (err) { console.error(err); }
    };
    fetchHistory();
    const id = setInterval(fetchHistory, 10000);
    return () => clearInterval(id);
  }, [activeRange]);

  // FIX: Manual mode - send correct state to backend
  const togglePump = async (turnOn: boolean) => {
    try {
      setPumpRunning(turnOn);
      setPumpMode('manual');
      await fetch(`${API_URL}/api/pump`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ state: turnOn ? 'on' : 'off' })
      });
    } catch (err) {
      console.error("Failed to toggle pump", err);
    }
  };

  const setAutoMode = async () => {
    try {
      setPumpMode('auto');
      await fetch(`${API_URL}/api/pump`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ state: 'auto' })
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sprout size={24} className="text-primary" />
            <h1 className="text-xl font-bold tracking-wide">Smart Irrigation</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${espConnected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {espConnected ? 'ESP32 Online 🟢' : 'ESP32 Offline 🔴'}
            </div>
            <button onClick={() => setIsDark(!isDark)} className="text-muted hover:text-primary transition-colors">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={logoutAndClear} className="flex items-center gap-2 text-red-500 hover:opacity-80 transition-opacity font-medium">
              <LogOut size={18} /><span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-12">

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Soil Moisture */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col shadow-sm overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-muted font-medium mb-4">
              <Droplets size={18} className="text-primary" />
              <span>Soil Moisture</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {soilMoisture !== null ? Math.round(soilMoisture) : '--'}
                </span>
                <span className="text-lg text-primary font-semibold">%</span>
              </div>
              <span className={`text-sm font-medium mt-2 ${soilMoisture !== null && soilMoisture > 50 ? 'text-blue-400' : 'text-orange-400'}`}>
                {soilMoisture === null ? 'Syncing...' : soilMoisture > 75 ? 'Wet' : soilMoisture > 50 ? 'Moist' : 'Dry'}
              </span>
            </div>
            <div className="border-t border-border pt-3 text-center">
              <p className="text-xs text-muted">Last update: {lastUpdate}</p>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col shadow-sm overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-muted font-medium mb-4">
              <Thermometer size={18} className="text-amber-500" />
              <span>Temperature</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {temperature !== null ? temperature.toFixed(1) : '--'}
                </span>
                <span className="text-lg text-amber-500 font-semibold">°C</span>
              </div>
              <span className={`text-sm font-medium mt-2 ${temperature !== null && temperature >= 38 ? 'text-red-400' : 'text-green-400'}`}>
                {temperature === null ? 'Syncing...' : temperature >= 38 ? 'Too Hot' : temperature < 15 ? 'Too Cold' : 'Normal'}
              </span>
            </div>
            <div className="border-t border-border pt-3 text-center">
              <p className="text-xs text-muted">Last update: {lastUpdate}</p>
            </div>
          </div>

          {/* Pump Control */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col shadow-sm overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-muted font-medium mb-3">
              <Power size={18} className="text-muted" />
              <span>Pump Control</span>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={setAutoMode}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${pumpMode === 'auto' ? 'bg-primary text-white' : 'bg-card border border-border text-muted'}`}
              >
                AUTO
              </button>
              <button
                onClick={() => setPumpMode('manual')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${pumpMode === 'manual' ? 'bg-amber-500 text-white' : 'bg-card border border-border text-muted'}`}
              >
                MANUAL
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${pumpRunning ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-lg font-bold ${pumpRunning ? 'text-primary' : 'text-red-500'}`}>
                {pumpRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>

            {/* Manual Buttons */}
            <div className={`flex gap-3 mt-2 ${pumpMode === 'auto' ? 'opacity-40 pointer-events-none' : ''}`}>
              <button
                onClick={() => togglePump(true)}
                className="flex-1 font-bold py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-all active:scale-95"
              >
                Turn ON
              </button>
              <button
                onClick={() => togglePump(false)}
                className="flex-1 font-bold py-2 rounded-lg bg-red-500 text-white hover:bg-red-500/80 transition-all active:scale-95"
              >
                Turn OFF
              </button>
            </div>
            {pumpMode === 'auto' && (
              <p className="text-xs text-muted text-center mt-2">Switch to MANUAL to control pump</p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar size={22} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">Sensor History</h2>
            </div>
            <div className="flex items-center bg-background border border-border rounded-lg p-1">
              {(['24h', '7d', '30d'] as const).map((r, i) => (
                <button
                  key={r}
                  onClick={() => setActiveRange(r)}
                  className={`px-4 py-1.5 text-sm font-semibold transition-colors ${i > 0 ? 'border-l border-border' : ''} ${activeRange === r ? 'text-primary' : 'text-muted'}`}
                >
                  {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-[300px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted text-sm">
                No history data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" stroke="#22c55e" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 50]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" />
                  <Line yAxisId="left" type="monotone" name="Moisture (%)" dataKey="moisture" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" name="Temperature (°C)" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* About */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users size={22} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">About the Team</h2>
          </div>
          <p className="text-muted leading-relaxed max-w-3xl mb-6">
            Developed by <strong>Yasen Elgendy</strong>, <strong>Ziad Mousa</strong>, and <strong>Mohamed Abdelrahman</strong>.
            Faculty of Engineering, Port Said University — Computers & Control Department.
          </p>
          <div className="flex items-center gap-4">
            {[['YE', 'text-primary'], ['ZM', 'text-amber-500'], ['MA', 'text-blue-500']].map(([init, color]) => (
              <div key={init} className={`w-12 h-12 rounded-full bg-slate-800 border-2 border-border flex items-center justify-center font-bold text-sm ${color}`}>
                {init}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
