import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, LogOut, Sprout } from 'lucide-react';

export default function MainLayout() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface border-b border-border py-4 px-6 fixed w-full top-0 z-10 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-primary">
              <Sprout size={32} />
              <h1 className="text-xl font-bold tracking-tight text-text">Smart Irrigation</h1>
            </div>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
                <NavLink to="/" className={({ isActive }) => isActive ? "text-primary" : "text-muted hover:text-text transition-colors"} end>
                    Dashboard
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => isActive ? "text-primary" : "text-muted hover:text-text transition-colors"}>
                    About
                </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-muted"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-danger hover:text-danger-dark transition-colors font-medium"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto mt-20 p-6">
        <Outlet />
      </main>
    </div>
  );
}
