import React from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  FileText,
  UserPlus,
  Server,
  Search,
  ShieldAlert,
  Database
} from 'lucide-react';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import SectionHeader from '../../components/common/SectionHeader';
import DataTable from '../../components/common/DataTable';
import { Input } from '../../components/common/FormControls';

const STATS = [
  { label: 'Registered users', value: '1,420', hint: '18 lecturers · 1,400 students', icon: <Users size={17} />, tone: 'brand' },
  { label: 'Active courses', value: '24', hint: 'Across 4 departments', icon: <BookOpen size={17} />, tone: 'info' },
  { label: 'Published quizzes', value: '86', hint: '2,490 attempts logged', icon: <FileText size={17} />, tone: 'success' },
  { label: 'Policy coverage', value: '100%', hint: 'RLS enforced on all tables', icon: <ShieldCheck size={17} />, tone: 'success' }
];

const USERS = [
  { id: 'usr-1', name: 'Dr. Evelyn Vance', email: 'evelyn.vance@university.edu', role: 'lecturer', courses: 3, status: 'Active' },
  { id: 'usr-2', name: 'Prof. Marcus Chen', email: 'm.chen@university.edu', role: 'lecturer', courses: 2, status: 'Active' },
  { id: 'usr-3', name: 'Alexander Rivera', email: 'alex.rivera@student.edu', role: 'student', courses: 4, status: 'Active' },
  { id: 'usr-4', name: 'Elena Rostova', email: 'elena.r@student.edu', role: 'student', courses: 4, status: 'Active' },
  { id: 'usr-5', name: 'Dr. Sarah Lin', email: 's.lin@university.edu', role: 'lecturer', courses: 1, status: 'Active' }
];

const AUDIT_EVENTS = [
  {
    id: 'ev-1',
    event: 'PDF uploaded to private bucket',
    actor: 'Dr. Evelyn Vance',
    time: '10 minutes ago',
    status: 'Success',
    variant: 'success'
  },
  {
    id: 'ev-2',
    event: 'Attempt scoring verified by database function',
    actor: 'System PostgreSQL function',
    time: '24 minutes ago',
    status: 'Success',
    variant: 'success'
  },
  {
    id: 'ev-3',
    event: 'Unverified answer access attempt blocked',
    actor: 'Anonymous request · denied by RLS',
    time: '1 hour ago',
    status: 'Denied',
    variant: 'danger'
  }
];

export default function AdminDashboard() {
  const userColumns = [
    {
      key: 'name',
      header: 'Name & email',
      render: (row) => (
        <div>
          <div className="data-table__title">{row.name}</div>
          <div className="data-table__meta">{row.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={row.role === 'lecturer' ? 'warning' : 'primary'}>
          {row.role.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'courses',
      header: 'Courses',
      className: 'cell-num',
      render: (row) => `${row.courses} assigned`
    },
    {
      key: 'status',
      header: 'Account status',
      render: (row) => (
        <Badge variant="success" dot>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      className: 'cell-actions',
      render: () => (
        <Button variant="ghost" size="sm">
          Edit privileges
        </Button>
      )
    }
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <Badge variant="danger" dot>
            Super admin privilege
          </Badge>
        }
        title="Platform console"
        subtitle="System-wide user roles, course assignments, PDF pipelines, and security oversight."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Server size={14} />}>
              System health
            </Button>
            <Button variant="primary" size="sm" icon={<UserPlus size={14} />}>
              Add staff account
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="alert alert--neutral">
        <span className="alert__icon" aria-hidden="true">
          <ShieldAlert size={18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="alert__title">Role invariance is enforced server-side</div>
          <div className="alert__body">
            Users cannot elevate their own permissions or assign the Super Admin role from the browser. Row Level
            Security policies in the Supabase migrations remain the source of truth.
          </div>
        </div>
      </div>

      <section className="section">
        <SectionHeader
          title="User & role management"
          description="Administer lecturer assignments and student identities across the platform."
          actions={
            <div style={{ width: 280, maxWidth: '100%' }}>
              <Input placeholder="Search by name or email" aria-label="Search users" icon={<Search size={15} />} />
            </div>
          }
        />

        <Card>
          <DataTable columns={userColumns} rows={USERS} caption="Registered users and assigned roles" />
        </Card>
      </section>

      <section className="section">
        <SectionHeader
          title="Security & audit activity"
          description="Immutable record of privileged operations and blocked access attempts."
          actions={
            <Badge variant="info" icon={<Database size={12} />}>
              Live audit log
            </Badge>
          }
        />

        <Card>
          <CardContent flush>
            {AUDIT_EVENTS.map((event) => (
              <div className="list-row" key={event.id}>
                <span
                  className={`list-row__icon list-row__icon--${event.variant}`}
                  aria-hidden="true"
                >
                  {event.variant === 'success' ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
                </span>

                <div className="list-row__body">
                  <div className="list-row__title">{event.event}</div>
                  <div className="list-row__meta">
                    Actor: {event.actor} &middot; {event.time}
                  </div>
                </div>

                <Badge variant={event.variant} dot>
                  {event.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
