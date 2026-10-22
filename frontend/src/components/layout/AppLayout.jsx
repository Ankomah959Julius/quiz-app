import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppLayout({
  children,
  role = 'student',
  onRoleChange,
  showSidebar = false,
  showFooter,
  activeTab = 'dashboard',
  onSelectTab
}) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('quizpulse_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('quizpulse_theme', theme);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [theme]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const footerVisible = showFooter ?? !showSidebar;

  const handleSelectTab = (tab) => {
    if (onSelectTab) onSelectTab(tab);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="visually-hidden" href="#main-content">
        Skip to main content
      </a>

      <Navbar
        currentRole={role}
        onRoleChange={onRoleChange}
        theme={theme}
        onToggleTheme={toggleTheme}
        hasSidebar={showSidebar}
        sidebarOpen={mobileNavOpen}
        onToggleSidebar={() => setMobileNavOpen((open) => !open)}
      />

      <div className="app-body">
        {showSidebar && (
          <Sidebar
            role={role}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        )}

        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>

      {showSidebar && mobileNavOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {footerVisible && <Footer />}
    </div>
  );
}
