import React from 'react';
import { useLocation } from 'wouter';
import { Home, LineChart, List, Settings } from 'lucide-react';
import { useUserPreferencesStore } from '../../store/userPreferences';
import type { Theme } from '../../types/UserPreferenceSchema';
import styles from './MobileNavbar.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Strategies', path: '/trading/strategies', icon: LineChart },
  { label: 'Watchlist', path: '/watchlist', icon: List },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const MobileNavbar: React.FC = () => {
  const [location, navigate] = useLocation();
  const theme = useUserPreferencesStore((s: { theme: Theme }) => s.theme);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-background border-t border-border shadow-lg md:hidden transition-colors duration-300 ${styles.mobileNavbar}`}
      role="navigation"
      aria-label="Mobile navigation"
      style={{
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const isActive = location === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center flex-1 h-full px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-150 ${styles.navButton} ${
              isActive ? `${styles.active} text-primary font-bold scale-110 bg-primary/10` : 'text-muted-foreground hover:text-primary'
            }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            tabIndex={0}
          >
            <Icon className="w-6 h-6 mb-1" aria-hidden="true" />
            <span className="text-xs leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavbar; 