import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, Mail, GraduationCap, UserPlus, LogIn, KeyRound } from 'lucide-react';
import Button from '../../components/common/Button';
import { Input, Checkbox } from '../../components/common/FormControls';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';

const DEFAULT_ACCOUNTS = [
  { role: 'super_admin', label: 'Super Admin (Julius)', email: 'ankomahjulius959@gmail.com', desc: 'Full platform governance' },
  { role: 'lecturer', label: 'Lecturer', email: 'lecturer@university.edu', desc: 'Uploads PDFs & manages quizzes' },
  { role: 'admin', label: 'Admin', email: 'admin@university.edu', desc: 'Institutional course & user administration' },
  { role: 'student', label: 'Student', email: 'student@university.edu', desc: 'Takes quizzes & views scores' }
];

const DEFAULT_PASSWORD = 'Password123!';

export default function LoginPage() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('ankomahjulius959@gmail.com');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, isAuthenticated, role, loading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect straight to the user's role dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (role === 'super_admin' || role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'lecturer') {
        navigate('/lecturer', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    }
  }, [isAuthenticated, role, loading, navigate]);

  const handleQuickFill = (account) => {
    setEmail(account.email);
    setPassword(DEFAULT_PASSWORD);
    setAuthError(null);
    setAuthSuccess(`Loaded default credentials for ${account.label}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUp({ email, password, displayName: displayName || email.split('@')[0] });
        setAuthSuccess('Student account created successfully! Signing in...');
        // Immediately sign in
        const res = await signIn({ email, password });
        const userRole = res.user?.user_metadata?.role || 'student';
        navigate(userRole === 'super_admin' || userRole === 'admin' ? '/admin' : `/${userRole}`);
      } else {
        const data = await signIn({ email, password });
        const userRole = data.user?.user_metadata?.role || role || 'student';
        navigate(userRole === 'super_admin' || userRole === 'admin' ? '/admin' : `/${userRole}`);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify your credentials or check that default accounts were seeded in Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-panel">
        <Link to="/login" className="row row-2" style={{ color: '#fff', fontWeight: 800, fontSize: '1.0625rem' }}>
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
          <h2>Academic Assessment Platform</h2>
          <p style={{ marginTop: 'var(--space-3)' }}>
            Sign in with your verified credentials. The system automatically identifies your role and routes you to your secure portal.
          </p>
        </div>

        <div className="auth-points">
          <div className="auth-point">
            <span className="auth-point__icon" aria-hidden="true"><CheckCircle2 size={13} /></span>
            <span>Students: take timed quizzes, save progress & view personal scores</span>
          </div>
          <div className="auth-point">
            <span className="auth-point__icon" aria-hidden="true"><CheckCircle2 size={13} /></span>
            <span>Lecturers: review extracted questions, verify answers & manage courses</span>
          </div>
          <div className="auth-point">
            <span className="auth-point__icon" aria-hidden="true"><CheckCircle2 size={13} /></span>
            <span>Administrators: manage users, courses, and platform governance</span>
          </div>
        </div>

        <div className="row row-2" style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          <ShieldCheck size={15} aria-hidden="true" />
          Enforced by Supabase Auth & PostgreSQL Row Level Security
        </div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="stack stack-2">
            <h1 style={{ fontSize: '1.75rem' }}>
              {mode === 'signin' ? 'Sign in to QuizPulse' : 'Create an Account'}
            </h1>
            <p className="text-secondary text-md">
              {mode === 'signin' 
                ? 'Your role will be verified automatically by the database.' 
                : 'Sign up as a new student to take quizzes.'}
            </p>
          </div>

          <div className="stack stack-5">
            {/* Sign In vs Register Tabs */}
            <div className="row row-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setMode('signin'); setAuthError(null); }}
                style={{
                  fontWeight: mode === 'signin' ? 700 : 500,
                  color: mode === 'signin' ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  borderBottom: mode === 'signin' ? '2px solid var(--color-brand)' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setAuthError(null); }}
                style={{
                  fontWeight: mode === 'signup' ? 700 : 500,
                  color: mode === 'signup' ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  borderBottom: mode === 'signup' ? '2px solid var(--color-brand)' : 'none',
                  paddingBottom: '0.5rem'
                }}
              >
                Create Student Account
              </button>
            </div>

            {/* Quick-fill default demo credentials */}
            {mode === 'signin' && (
              <div className="stack stack-2" style={{ background: 'var(--color-bg-subtle, rgba(255,255,255,0.03))', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div className="row row-2" style={{ color: 'var(--color-brand)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <KeyRound size={14} />
                  <span>Click to Auto-fill Default Login Details:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {DEFAULT_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="button button--secondary button--sm"
                      style={{ justifyContent: 'flex-start', padding: '6px 10px', height: 'auto', textAlign: 'left' }}
                    >
                      <div className="col" style={{ gap: 0 }}>
                        <strong style={{ fontSize: '0.8125rem' }}>{acc.label}</strong>
                        <span className="text-xs text-muted" style={{ fontSize: '0.6875rem' }}>{acc.email.split('@')[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                  Default password for all accounts: <code>Password123!</code>
                </span>
              </div>
            )}

            {authError && (
              <Alert variant="danger" dismissible onDismiss={() => setAuthError(null)}>
                {authError}
              </Alert>
            )}

            {authSuccess && (
              <Alert variant="success" dismissible onDismiss={() => setAuthSuccess(null)}>
                {authSuccess}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="stack stack-4">
              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alexander Rivera"
                  required
                />
              )}

              <Input
                label="Institutional Email"
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
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
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

              {mode === 'signin' && (
                <div className="row row--between row--wrap" style={{ gap: 'var(--space-3)' }}>
                  <Checkbox label="Keep me signed in" defaultChecked />
                </div>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                block 
                loading={isSubmitting}
                iconRight={mode === 'signin' ? <LogIn size={16} /> : <UserPlus size={16} />}
              >
                {mode === 'signin' ? 'Sign In & Verify Role' : 'Register Student Account'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
