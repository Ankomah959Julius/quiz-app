import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Clock,
  FileUp,
  CheckSquare,
  Users,
  Settings,
  BarChart3,
  FolderGit2,
  ShieldAlert,
  HelpCircle,
  FileText,
  X
} from 'lucide-react';
import Badge from '../common/Badge';

const MENUS_BY_ROLE = {
  student: [
    { id: 'dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={17} /> },
    { id: 'quizzes', label: 'Available Quizzes', icon: <BookOpen size={17} />, badge: '3 active' },
    { id: 'results', label: 'Results & History', icon: <Clock size={17} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Award size={17} /> },
    { id: 'profile', label: 'Profile Settings', icon: <Settings size={17} /> }
  ],
  lecturer: [
    { id: 'dashboard', label: 'Lecturer Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'courses', label: 'Assigned Courses', icon: <BookOpen size={17} /> },
    { id: 'upload', label: 'PDF Import & Upload', icon: <FileUp size={17} />, badge: 'Core' },
    { id: 'review', label: 'Question Review', icon: <CheckSquare size={17} />, badge: 'Verify' },
    { id: 'quizzes', label: 'Quiz Management', icon: <FileText size={17} /> },
    { id: 'results', label: 'Course Analytics', icon: <BarChart3 size={17} /> }
  ],
  admin: [
    { id: 'dashboard', label: 'System Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'users', label: 'User & Role Access', icon: <Users size={17} /> },
    { id: 'courses', label: 'Course Directory', icon: <BookOpen size={17} /> },
    { id: 'quizzes', label: 'All Quizzes', icon: <FileText size={17} /> },
    { id: 'imports', label: 'PDF Pipeline Monitor', icon: <FolderGit2 size={17} /> },
    { id: 'security', label: 'Security & RLS Logs', icon: <ShieldAlert size={17} /> },
    { id: 'settings', label: 'Platform Config', icon: <Settings size={17} /> }
  ]
};

const ROLE_LABELS = {
  student: 'Student portal',
  lecturer: 'Lecturer workspace',
  admin: 'Admin console'
};

export default function Sidebar({ role = 'student', activeTab = 'dashboard', onSelectTab, open = false, onClose }) {
  const items = MENUS_BY_ROLE[role] || MENUS_BY_ROLE.student;

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label={`${ROLE_LABELS[role] || 'Portal'} navigation`}>
      <div className="row row--between sidebar__label">
        <span>{ROLE_LABELS[role] || 'Portal'}</span>
        <button
          type="button"
          className="icon-btn icon-btn--ghost sidebar__close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="nav-item"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab && onSelectTab(item.id)}
            >
              <span className="nav-item__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-item__text">{item.label}</span>
              {item.badge && (
                <Badge variant={isActive ? 'primary' : 'default'}>{item.badge}</Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__note">
          <HelpCircle size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Stage 1 UI foundation</strong>
            Live Supabase data, RLS policies, and PDF processing connect in Stage 3.
          </div>
        </div>
      </div>
    </aside>
  );
}
