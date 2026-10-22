import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, Mail, GraduationCap } from 'lucide-react';
import Button from '../../components/common/Button';
import { Input, Checkbox } from '../../components/common/FormControls';
import Alert from '../../components/common/Alert';
import SegmentedControl from '../../components/common/SegmentedControl';

const ROLE_OPTIONS = [
  { id: 'student', label: 'Student' },
  { id: 'lecturer', label: 'Lecturer' },
  { id: 'admin', label: 'Admin' }
];

const ROLE_EMAILS = {
  student: 'student@university.edu',
  lecturer: 'lecturer.smith@university.edu',
  admin: 'admin.office@university.edu'
};

const HIGHLIGHTS = [
  'Role-scoped navigation with server-enforced permissions',
  'Timed attempts with safe refresh and duplicate-submit handling',
  'Results and leaderboards computed by trusted database logic'
];

export default function LoginPage({ onRoleChange }) {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState(ROLE_EMAILS.student);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRoleTab = (selectedRole) => {
    setRole(selectedRole);
    setEmail(ROLE_EMAILS[selectedRole]);
  };

  const handlePreviewLogin = (event) => {
    event.preventDefault();
    if (onRoleChange) onRoleChange(role);
    navigate(`/${role}`);
  };

  return (
    <div className="auth-shell">
      <aside className="auth-panel">
        <Link to="/" className="row row-2" style={{ color: '#fff', fontWeight: 800, fontSize: '1.0625rem' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.18)',
              display: 'grid',
              placeItems: 'center'
            }}
            aria-hidden="true"
          >
            <GraduationCap size={19} />
          </span>
          QuizPulse
        </Link>

        <div>
          <h2>Sign in to your assessment workspace</h2>
          <p style={{ marginTop: 'var(--space-3)' }}>
            One account, three role-scoped experiences — everything you need to publish, sit, and govern quizzes.
          </p>
        </div>

        <div className="auth-points">
          {HIGHLIGHTS.map((item) => (
            <div className="auth-point" key={item}>
              <span className="auth-point__icon" aria-hidden="true">
                <CheckCircle2 size={13} />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="row row-2" style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          <ShieldCheck size={15} aria-hidden="true" />
          Supabase Auth + Row Level Security
        </div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="stack stack-2">
            <h1 style={{ fontSize: '1.75rem' }}>Welcome back</h1>
            <p className="text-secondary text-md">Choose your role to preview the matching portal layout.</p>
          </div>

          <div className="stack stack-5">
            <SegmentedControl
              items={ROLE_OPTIONS}
              value={role}
              onChange={handleRoleTab}
              ariaLabel="Select account role"
            />

            <form onSubmit={handlePreviewLogin} className="stack stack-5">
              <Input
                label="Institutional email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                icon={<Mail size={15} />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                icon={<Lock size={15} />}
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                required
              />

              <div className="row row--between row--wrap" style={{ gap: 'var(--space-3)' }}>
                <Checkbox label="Keep me signed in on this device" defaultChecked />
                <Link to="/login" className="text-sm" style={{ fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="primary" size="lg" block iconRight={<ArrowRight size={16} />}>
                Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            </form>

            <Alert variant="info" title="Stage 2 interface preview">
              Authentication, sessions, and database policies connect in Stage 3. No credentials are transmitted or stored
              by this preview.
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
