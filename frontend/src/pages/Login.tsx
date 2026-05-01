import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        onLogin();
        navigate('/');
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card border border-border p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Sprout size={48} className="text-primary mb-4" />
          <h1 className="text-2xl font-bold tracking-tight">Smart Irrigation</h1>
          <p className="text-muted mt-2">Enter credentials to access dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={handleChange}
                className={`w-full bg-background border ${error ? 'border-red-500' : 'border-border'} rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-primary transition-colors`}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">Incorrect password.</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
