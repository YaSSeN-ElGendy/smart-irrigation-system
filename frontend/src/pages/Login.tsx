import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Sprout } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/login', { password });
      login(data.token);
      navigate('/');
    } catch (err) {
      setError('Invalid password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors">
      <div className="max-w-md w-full bg-surface p-10 rounded-3xl shadow-xl border border-border">
        <div className="flex flex-col items-center mb-10 text-primary">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Sprout size={48} className="text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-text">Smart Irrigation</h2>
          <p className="text-muted mt-2 text-center">Enter your system password to access the telemetry dashboard.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text transition-shadow"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-danger text-sm font-medium">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl transition-all hover:shadow-lg active:scale-[0.98]"
          >
             Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
