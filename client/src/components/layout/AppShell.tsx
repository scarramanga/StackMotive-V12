import React, { ReactNode, useState, useEffect } from 'react';
import RouteGuard from './RouteGuard';
import { isDev } from '../../utils/isDev';
import { ThemeAnimator } from '../animation/ThemeAnimator';
import MobileNavigation from './mobile-navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserPreferencesStore } from '../../store/userPreferences';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { MobileNavbar } from '../nav/MobileNavbar';

export interface AppShellProps {
  children: ReactNode;
  title?: string;
  headerActions?: ReactNode;
  rightPanel?: ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children, title, headerActions, rightPanel }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isBrowser = typeof window !== 'undefined';
  const theme = useUserPreferencesStore((s: any) => s.theme);
  const setTheme = useUserPreferencesStore((s: any) => s.setTheme);
  const { user } = useAuth();

  // SSR-safe theme application
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <AuthProvider>
      <ThemeAnimator>
        {/* Mobile Hamburger & Drawer */}
        <div className="md:hidden flex items-center px-4 py-3 bg-background/80 sticky top-0 z-40 shadow-sm">
          <button
            aria-label="Open navigation menu"
            className="mr-3 p-2 rounded focus:outline-none focus:ring"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="block w-6 h-0.5 bg-foreground mb-1" />
            <span className="block w-6 h-0.5 bg-foreground mb-1" />
            <span className="block w-6 h-0.5 bg-foreground" />
          </button>
          <span className="font-bold text-lg truncate flex-1">{title}</span>
          {headerActions && <div className="ml-2">{headerActions}</div>}
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col w-64 max-w-full h-full shadow-xl md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              {/* Sidebar content here (add navigation links as needed) */}
              <button className="self-end m-4 p-2" aria-label="Close navigation menu">
                <span className="block w-6 h-0.5 bg-foreground mb-1" />
                <span className="block w-6 h-0.5 bg-foreground mb-1" />
                <span className="block w-6 h-0.5 bg-foreground" />
              </button>
              {/* Add navigation links here */}
            </motion.aside>
          )}
        </AnimatePresence>
        <RouteGuard>
          {/* Block 70 Implementation: Dev-only Diagnostic Overlay, SSR-safe */}
          {/* {isDev() && isBrowser && <DiagnosticOverlay />} */}
          <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr]">
            {/* Sidebar slot (future, desktop only) */}
            <aside className="hidden md:block col-span-1 row-span-2 bg-sidebar-background border-r border-border shadow-lg" />
            {/* Header (desktop only) */}
            {/* Header */}
            <header className="col-span-1 md:col-span-2 row-start-1 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
              <div className="flex-1 min-w-0">
                {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
              </div>
              {headerActions && <div className="flex-shrink-0 ml-4">{headerActions}</div>}
            </header>
            {/* Main Content */}
            <main className="col-span-1 row-start-2 flex flex-col overflow-y-auto p-4 md:p-8 bg-background shadow-inner rounded-lg">
              {children}
            </main>
            {/* Right Panel (optional) */}
            {rightPanel && (
              <aside className="hidden md:block col-span-1 row-span-2 bg-sidebar-background border-l border-border shadow-lg min-w-[280px] max-w-xs p-4">
                {rightPanel}
              </aside>
            )}
          </div>
        </RouteGuard>
      </ThemeAnimator>
      <MobileNavbar />
    </AuthProvider>
  );
};

export default AppShell; 