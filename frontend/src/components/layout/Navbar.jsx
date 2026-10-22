import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Sun, Moon, Menu, X, User, Palette, ChevronDown, LogOut } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

const NAV_LINKS = [
  { label: 'Overview', path: '/' },
  { label: 'Student', path: '/student', role: 'student' },
  { label: 'Lecturer', path: '/lecturer', role: 'lecturer' },
  { label: 'Admin', path: '/admin', role: 'admin' },
  { label: 'Design System', path: '/design-system', icon: <Palette size={15} /> }
];

const ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'lecturer', label: 'Lecturer' },
  { id: 'admin', label: 'Admin' },
  { id: 'super_admin', label: 'Super Admin' }
];

export default function Navbar({
  currentRole = 'student',
  onRoleChange,
  theme = 'dark',
  onToggleTheme,
  hasSidebar = false,
  sidebarOpen = false,
  onToggleSidebar
}) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleRoleChange = (event) => {
    const role = event.target.value;
    if (onRoleChange) onRoleChange(role);
  };

  const closeMobile = () => setMobileOpen(false);

  // User display name from profile, auth metadata, or email
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || (hasSidebar ? 'Alexander Rivera' : 'Preview User');

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'US';

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button
          type="button"
          className="icon-btn icon-btn--ghost topbar__toggle"
          aria-label={hasSidebar ? (sidebarOpen ? 'Close navigation' : 'Open navigation') : 'Open menu'}
          aria-expanded={hasSidebar ? sidebarOpen : mobileOpen}
          onClick={() => (hasSidebar ? onToggleSidebar && onToggleSidebar() : setMobileOpen((open) => !open))}
        >
          {hasSidebar ? (
            sidebarOpen ? <X size={18} /> : <Menu size={18} />
          ) : mobileOpen ? (
            <X size={18} />
          ) : (
            <Menu size={18} />
          )}
        </button>

        <Link to="/" className="brand" onClick={closeMobile}>
          <span className="brand__mark" aria-hidden="true">
            <GraduationCap size={19} />
          </span>
          <span className="brand__name">
            Quiz<em>Pulse</em>
          </span>
        </Link>

        <nav className="topbar__nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="topbar__link"
              aria-current={isActive(link.path) ? 'page' : undefined}
              onClick={() => {
                if (link.role && onRoleChange) onRoleChange(link.role);
                closeMobile();
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="topbar__actions">
          {/* Quick Role Switcher */}
          <div className="role-chip" title="Switch the preview role">
            <span className="visually-hidden">Preview role</span>
            <span aria-hidden="true" style={{ display: 'inline-flex' }}>
              <User size={14} />
            </span>
            <select
              value={currentRole}
              onChange={handleRoleChange}
              aria-label="Preview role"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                paddingRight: 2
              }}
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            className="icon-btn icon-btn--ghost"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User Status / Logout */}
          {isAuthenticated ? (
            <div className="row row-2" style={{ marginLeft: 'var(--space-2)' }}>
              <span className="avatar" aria-hidden="true" title={user.email}>
                {initials}
              </span>
              <span className="row row--between" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>{displayName}</span>
                <span className="text-xs text-muted" style={{ lineHeight: 1.2 }}>
                  {currentRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </span>
              <button
                type="button"
                className="icon-btn icon-btn--ghost"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                style={{ width: 28, height: 28, marginLeft: '0.25rem' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : !hasSidebar ? (
            <Button as={Link} to="/login" variant="secondary" size="sm" icon={<User size={14} />}>
              Sign in
            </Button>
          ) : (
            <div className="row row-2" style={{ marginLeft: 'var(--space-2)' }}>
              <span className="avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="row row--between" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>{displayName}</span>
                <span className="text-xs text-muted" style={{ lineHeight: 1.2 }}>
                  {currentRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {!hasSidebar && mobileOpen && (
        <nav className="topbar__mobile-nav" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="topbar__link"
              style={{ padding: '10px 12px' }}
              aria-current={isActive(link.path) ? 'page' : undefined}
              onClick={() => {
                if (link.role && onRoleChange) onRoleChange(link.role);
                closeMobile();
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
