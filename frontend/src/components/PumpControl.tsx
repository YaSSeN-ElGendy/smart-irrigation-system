import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Power, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PumpControl() {
  const [pumpState, setPumpState] = useState<"on" | "off" | null>(null);
  const [mode, setMode] = useState<"auto" | "manual" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [thresholds, setThresholds] = useState({ tempThreshold: 18, moistureThreshold: 30 });
  const [savingThresholds, setSavingThresholds] = useState(false);

  useEffect(() => {
    fetchLatest();
    fetchThresholds();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatest = async () => {
    try {
      const { data } = await api.get('/latest');
      setPumpState(data.pumpState);
      setMode(data.mode);
    } catch (err) {
      console.error('Failed to fetch latest data', err);
    }
  };

  const fetchThresholds = async () => {
    try {
      const { data } = await api.get('/thresholds');
      setThresholds({ tempThreshold: data.tempThreshold, moistureThreshold: data.moistureThreshold });
    } catch (err) {
      console.error('Failed to fetch thresholds', err);
    }
  };

  const setPump = async (state: "on" | "off" | "auto") => {
    setLoading(true);
    try {
      const { data } = await api.post('/pump', { state });
      setPumpState(data.pumpState);
      if (state === "auto") {
        setMode("auto");
      } else {
        setMode("manual");
      }
    } catch (err) {
      console.error('Failed to toggle pump', err);
    } finally {
      setLoading(false);
    }
  };

  const updateThresholds = async () => {
    setSavingThresholds(true);
    try {
      await api.post('/thresholds', thresholds);
    } catch (err) {
      console.error('Failed to save thresholds', err);
    } finally {
      setSavingThresholds(false);
    }
  };

  const isAuto = mode === 'auto';

  return (
    <div className="bg-surface p-6 rounded-3xl shadow-sm border border-border flex flex-col justify-between transition-all hover:shadow-md h-full">
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center gap-2">
          <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800/50 text-muted">
            <Power size={22} />
          </div>
          <h3 className="text-lg font-semibold text-text">Pump Control</h3>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setPump('auto')} 
            disabled={loading}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${isAuto ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-muted hover:text-text'}`}
          >
            AUTO
          </button>
          <button 
            onClick={() => {}} // Will implicitly set manual when they click turn on/off, but they can just click "manual" to just switch mode
            disabled={loading}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${!isAuto && mode !== null ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-muted hover:text-text'}`}
          >
            MANUAL
          </button>
        </div>
      </div>

      <div className="mb-4 flex-1 flex flex-col items-center justify-center">
        {pumpState === null ? (
          <div className="text-3xl font-bold text-muted animate-pulse">Loading...</div>
        ) : (
          <div className="flex items-center gap-3">
             <div className={`w-4 h-4 rounded-full ${pumpState === 'on' ? 'bg-primary shadow-[0_0_10px_rgba(22,163,74,0.8)]' : 'bg-danger shadow-[0_0_10px_rgba(220,38,38,0.8)]'}`}></div>
             <div className={`text-3xl font-extrabold tracking-tight ${pumpState === 'on' ? 'text-primary' : 'text-text'}`}>
                {pumpState === 'on' ? 'RUNNING' : 'STOPPED'}
             </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full justify-center mb-6">
        <button
          onClick={() => setPump('on')}
          disabled={loading || pumpState === 'on' || isAuto}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-sm"
        >
          Turn ON
        </button>
        <button
          onClick={() => setPump('off')}
          disabled={loading || pumpState === 'off' || isAuto}
          className="flex-1 bg-danger hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-sm"
        >
          Turn OFF
        </button>
      </div>
      
      <div className="mt-auto border-t border-border pt-4">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-between w-full text-sm font-medium text-muted hover:text-text transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <span>Threshold Settings</span>
          </div>
          {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        <AnimatePresence>
          {showSettings && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden"
            >
              <div className="py-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Temperature (&lt; {thresholds.tempThreshold}°C)</span>
                  </div>
                  <input 
                    type="range" min="0" max="50" step="1" 
                    className="w-full accent-amber-500"
                    value={thresholds.tempThreshold}
                    onChange={(e) => setThresholds({...thresholds, tempThreshold: Number(e.target.value)})}
                    onMouseUp={updateThresholds}
                    onTouchEnd={updateThresholds}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Soil Moisture (&lt; {thresholds.moistureThreshold}%)</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="1" 
                    className="w-full accent-primary"
                    value={thresholds.moistureThreshold}
                    onChange={(e) => setThresholds({...thresholds, moistureThreshold: Number(e.target.value)})}
                    onMouseUp={updateThresholds}
                    onTouchEnd={updateThresholds}
                  />
                </div>
                {savingThresholds && <div className="text-xs text-primary font-medium text-center">Saving...</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
