import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Database, Layers, GraduationCap } from 'lucide-react';

const CURRENT_YEAR = 2026;

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="brand" style={{ fontSize: '1rem' }}>
              <span className="brand__mark" aria-hidden="true" style={{ width: 30, height: 30 }}>
                <GraduationCap size={17} />
              </span>
              <span className="brand__name">
                Quiz<em>Pulse</em>
              </span>
            </Link>
            <p className="footer__desc">
              Secure PDF-to-quiz extraction, role-separated access control, and transparent server-evaluated scoring for
              academic institutions.
            </p>
          </div>

          <div className="footer__signals">
            <span className="footer__signal">
              <ShieldCheck size={14} style={{ color: 'var(--success)' }} aria-hidden="true" />
              Row Level Security
            </span>
            <span className="footer__signal">
              <Database size={14} style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
              Supabase PostgreSQL
            </span>
            <span className="footer__signal">
              <Layers size={14} style={{ color: 'var(--warning)' }} aria-hidden="true" />
              Stage 1 foundation
            </span>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            &copy; {CURRENT_YEAR} QuizPulse. Built to the specification in <code>docs/PROJECT_REQUIREMENTS.md</code>.
          </span>
          <span>React 19 &middot; Vite &middot; Lucide icons</span>
        </div>
      </div>
    </footer>
  );
}
