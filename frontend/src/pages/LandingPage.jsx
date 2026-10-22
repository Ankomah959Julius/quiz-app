import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  GraduationCap,
  UploadCloud,
  Lock,
  CheckCircle2,
  Gauge,
  ScanLine
} from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import SectionHeader from '../components/common/SectionHeader';

const FEATURES = [
  {
    icon: <ScanLine size={22} />,
    tone: '',
    title: 'PDF extraction with OCR fallback',
    desc: 'Text-based and scanned question papers are parsed into structured MCQs with options A–D, flagged for human verification before publication.'
  },
  {
    icon: <Lock size={22} />,
    tone: 'feature__icon--success',
    title: 'Server-side scoring, zero answer leaks',
    desc: 'Correct answers never reach the student browser. Row Level Security evaluates attempts and computes scores in trusted PostgreSQL logic.'
  },
  {
    icon: <Award size={22} />,
    tone: 'feature__icon--warning',
    title: 'Fair, explainable leaderboards',
    desc: 'Quiz-specific and overall rankings with documented tie-breaking rules and privacy-preserving student display names.'
  }
];

const WORKFLOW = [
  { step: '01', title: 'Upload', desc: 'Staff drop a PDF into private Supabase storage and attach it to an assigned course.' },
  { step: '02', title: 'Extract', desc: 'The pipeline parses questions, options, marks, and any detectable answer key.' },
  { step: '03', title: 'Verify', desc: 'A lecturer reviews every uncertain item, corrects the key, and confirms marks.' },
  { step: '04', title: 'Publish', desc: 'The quiz is configured, published to enrolled students, and scored on submission.' }
];

const STAGES = [
  { stage: 'Stage 1', title: 'Inspect & plan', status: 'Complete', desc: 'Design tokens, layout primitives, routing, responsive shell.', done: true },
  { stage: 'Stage 2', title: 'UI foundation expansion', status: 'Complete', desc: 'Shared components, tables, forms, and feedback states.', done: true },
  { stage: 'Stage 3', title: 'Supabase auth & roles', status: 'Next', desc: 'Real sessions, profiles, and Row Level Security policies.', done: false },
  { stage: 'Stage 4', title: 'Courses & permissions', status: 'Planned', desc: 'Course assignments, lecturer scoping, and enrollments.', done: false },
  { stage: 'Stage 5', title: 'PDF import pipeline', status: 'Planned', desc: 'Private storage, OCR text parsing, and error handling.', done: false },
  { stage: 'Stage 6', title: 'Question review editor', status: 'Planned', desc: 'Option correction, mark assignment, and publishing rules.', done: false },
  { stage: 'Stage 7', title: 'Quiz-taking & scoring', status: 'Planned', desc: 'Timed submissions, auto-save, and server scoring.', done: false },
  { stage: 'Stage 8', title: 'Results & leaderboards', status: 'Planned', desc: 'Overall and per-quiz rankings with tie-breaking.', done: false },
  { stage: 'Stage 9', title: 'Testing & release', status: 'Planned', desc: 'Security audit, role validation, and deployment docs.', done: false }
];

export default function LandingPage() {
  return (
    <>
      <div className="announce">
        <Badge variant="primary" dot>
          Stage 2 complete
        </Badge>
        <span>
          The interface foundation is live. Preview any role portal or inspect the component library.
        </span>
        <Link to="/design-system" className="row row-2" style={{ fontWeight: 600 }}>
          Inspect the system <ArrowRight size={14} />
        </Link>
      </div>

      <section className="hero">
        <div className="hero__inner">
          <Badge variant="primary" icon={<Sparkles size={13} />}>
            Academic assessment, rebuilt for integrity
          </Badge>

          <h1 className="hero__title">
            Turn PDF question papers into <span>secure, verified quizzes</span>
          </h1>

          <p className="hero__lead">
            One platform for lecturers, students, and administrators. Extract questions from PDFs, verify answer keys
            with human oversight, run timed assessments, and publish leaderboards — with scoring that never trusts the
            browser.
          </p>

          <div className="hero__actions">
            <Button as={Link} to="/student" variant="primary" size="lg" icon={<GraduationCap size={18} />}>
              Preview student portal
            </Button>
            <Button as={Link} to="/lecturer" variant="outline" size="lg" icon={<UploadCloud size={18} />}>
              Lecturer workflow
            </Button>
            <Button as={Link} to="/admin" variant="ghost" size="lg" icon={<ShieldCheck size={18} />}>
              Admin console
            </Button>
          </div>

          <div className="hero__meta">
            <span>
              <CheckCircle2 size={15} style={{ color: 'var(--success)' }} aria-hidden="true" />
              Row Level Security ready
            </span>
            <span>
              <Gauge size={15} style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
              Fully responsive
            </span>
            <span>
              <Lock size={15} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              No client-side answer exposure
            </span>
          </div>
        </div>
      </section>

      <div
        className="container"
        style={{ paddingTop: 'var(--space-9)', paddingBottom: 'var(--space-9)', display: 'flex', flexDirection: 'column', gap: 'var(--space-9)' }}
      >
        <section>
          <SectionHeader
            title="Engineered for rigorous academic requirements"
            description="Every surface follows one design system and one security model, matching the platform specification end to end."
          />
          <div className="grid grid-3" style={{ marginTop: 'var(--space-5)' }}>
            {FEATURES.map((feature) => (
              <Card key={feature.title} interactive>
                <div className="feature">
                  <span className={`feature__icon ${feature.tone}`} aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3 className="feature__title">{feature.title}</h3>
                  <p className="feature__desc">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="From PDF to published quiz in four steps"
            description="Human review sits deliberately between extraction and publication so nothing ships unverified."
          />
          <div className="grid grid-4" style={{ marginTop: 'var(--space-5)' }}>
            {WORKFLOW.map((item) => (
              <Card key={item.step}>
                <div className="feature" style={{ gap: 'var(--space-2)' }}>
                  <span className="mono text-sm" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>
                    {item.step}
                  </span>
                  <h3 className="feature__title">{item.title}</h3>
                  <p className="feature__desc">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card>
            <CardContent>
              <div className="row row--between row--wrap" style={{ marginBottom: 'var(--space-5)' }}>
                <div>
                  <Badge variant="primary">Delivery roadmap</Badge>
                  <h2 style={{ marginTop: 'var(--space-2)' }}>Nine managed implementation stages</h2>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>
                    Each stage ships a working, reviewable slice of the platform.
                  </p>
                </div>
                <span className="text-sm text-muted">UI foundation complete &middot; Supabase auth next</span>
              </div>

              <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                {STAGES.map((item) => (
                  <div
                    key={item.stage}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${item.done ? 'var(--accent-soft-border)' : 'var(--border-subtle)'}`,
                      background: item.done ? 'var(--accent-soft)' : 'var(--bg-surface-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div className="row row--between row--wrap" style={{ gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{item.stage}</span>
                      <Badge variant={item.done ? 'success' : 'default'} dot={!item.done}>
                        {item.status}
                      </Badge>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</span>
                    <span className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="cta-panel">
          <FileText size={26} style={{ margin: '0 auto var(--space-4)' }} aria-hidden="true" />
          <h2>Ready to see the platform from every angle?</h2>
          <p style={{ margin: 'var(--space-3) auto 0', maxWidth: '56ch' }}>
            Jump straight into any role portal and review the full component library used across the product.
          </p>
          <div className="row row--center row--wrap" style={{ marginTop: 'var(--space-6)' }}>
            <Button as={Link} to="/student" variant="secondary" size="lg">
              Student portal
            </Button>
            <Button as={Link} to="/lecturer" variant="secondary" size="lg">
              Lecturer workspace
            </Button>
            <Button as={Link} to="/admin" variant="secondary" size="lg">
              Admin console
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
