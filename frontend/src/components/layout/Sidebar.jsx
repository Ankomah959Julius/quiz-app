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
    { id: 'dashboard', label: 'Institutional Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'users', label: 'Lecturer & Student Accounts', icon: <Users size={17} /> },
    { id: 'courses', label: 'Course Directory', icon: <BookOpen size={17} /> },
    { id: 'quizzes', label: 'Institutional Quizzes', icon: <FileText size={17} /> },
    { id: 'imports', label: 'PDF Pipeline Monitor', icon: <FolderGit2 size={17} /> }
  ],
  super_admin: [
    { id: 'dashboard', label: 'Platform Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'users', label: 'User & Role Governance', icon: <Users size={17} />, badge: 'Root' },
    { id: 'courses', label: 'Global Course Directory', icon: <BookOpen size={17} /> },
    { id: 'quizzes', label: 'All Quizzes & Archives', icon: <FileText size={17} /> },
    { id: 'imports', label: 'PDF Pipeline Monitor', icon: <FolderGit2 size={17} /> },
    { id: 'security', label: 'Security & RLS Logs', icon: <ShieldAlert size={17} />, badge: 'Audit' },
    { id: 'settings', label: 'Platform Settings', icon: <Settings size={17} /> }
  ]
};

const ROLE_LABELS = {
  student: 'Student portal',
  lecturer: 'Lecturer workspace',
  admin: 'Admin console',
  super_admin: 'Super Admin console'
};

export default function Sidebar({ role = 'student', activeTab = 'dashboard', onSelectTab, open = false, onClose }) {
  const items = MENUS_BY_ROLE[role] || MENUS_BY_ROLE.student;

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label={`${ROLE_LABELS[role] || 'Portal'} navigation`}>
      <div className="row row--between sidebar__label">
        <span>{ROLE_LABELS[role] || 'Portal'}</span>
        <button
          type="button"
          className="icon-btn icon-btn--ghost"
          aria-label="Close navigation"
          onClick={onClose}
          style={{ width: 28, height: 28 }}
        >
          <X size={15} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
              onClick={() => {
                if (onSelectTab) onSelectTab(item.id);
                if (onClose) onClose();
              }}
              aria-current={active ? 'page' : undefined}
            >
              <span className="sidebar__item-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__item-label">{item.label}</span>
              {item.badge && (
                <Badge variant={active ? 'brand' : 'neutral'} size="sm">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="status-indicator">
          <span className="status-indicator__dot" />
          <span className="status-indicator__label">
            {role === 'super_admin' ? 'Root Governance' : role === 'admin' ? 'Institutional Admin' : 'Supabase Connected'}
          </span>
        </div>
      </div>
    </aside>
  );
}
