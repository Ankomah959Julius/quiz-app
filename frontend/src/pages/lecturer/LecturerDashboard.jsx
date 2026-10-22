import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  BookOpen,
  Plus,
  CheckCircle2,
  PencilLine,
  Sparkles,
  Users,
  ShieldCheck
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import SectionHeader from '../../components/common/SectionHeader';
import { Select } from '../../components/common/FormControls';

const STATS = [
  { label: 'Assigned courses', value: '3', hint: 'Current term allocation', icon: <BookOpen size={17} />, tone: 'brand' },
  { label: 'PDFs uploaded', value: '8', hint: 'Stored in the private bucket', icon: <FileText size={17} />, tone: 'info' },
  { label: 'Pending review', value: '2', hint: 'Awaiting human verification', icon: <AlertTriangle size={17} />, tone: 'warning' },
  { label: 'Published quizzes', value: '5', hint: 'Live for enrolled students', icon: <CheckCircle2 size={17} />, tone: 'success' }
];

const IMPORTS = [
  {
    id: 'pdf-1',
    filename: 'CS301_Midterm_Paper_2026.pdf',
    course: 'CS301 — Database Systems',
    status: 'Needs review',
    variant: 'warning',
    extracted: 25,
    flagged: 3,
    uploadedAt: 'Today, 08:30 AM'
  },
  {
    id: 'pdf-2',
    filename: 'CS402_Quiz3_Microservices.pdf',
    course: 'CS402 — Software Engineering',
    status: 'Ready to publish',
    variant: 'success',
    extracted: 15,
    flagged: 0,
    uploadedAt: 'Yesterday, 15:12 PM'
  },
  {
    id: 'pdf-3',
    filename: 'CS301_Quiz1_SQL_Archive.pdf',
    course: 'CS301 — Database Systems',
    status: 'Published',
    variant: 'default',
    extracted: 20,
    flagged: 0,
    uploadedAt: 'Oct 14, 2026'
  }
];

const OPTIONS = [
  { value: 'cs301', label: 'CS301 — Database Systems (34 students)' },
  { value: 'cs402', label: 'CS402 — Software Engineering (28 students)' },
  { value: 'cs501', label: 'CS501 — Distributed Systems (19 students)' }
];

const SAMPLE_OPTIONS = [
  { label: 'A', text: 'First Normal Form (1NF)', isCorrect: false },
  { label: 'B', text: 'Second Normal Form (2NF)', isCorrect: true },
  { label: 'C', text: 'Third Normal Form (3NF)', isCorrect: false },
  { label: 'D', text: 'Boyce-Codd Normal Form (BCNF)', isCorrect: false }
];

export default function LecturerDashboard() {
  const [selectedCourse, setSelectedCourse] = useState('cs301');

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <Badge variant="warning" dot>
            Course lecturer
          </Badge>
        }
        title="Lecturer workspace"
        subtitle="Dr. Evelyn Vance &middot; Department of Computer Science &amp; Informatics"
        actions={
          <>
            <Button variant="outline" size="sm" icon={<BookOpen size={14} />}>
              Manage courses
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={14} />}>
              New quiz
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle as="h2">Upload question paper</CardTitle>
              <CardDescription>PDFs are stored privately and processed by the extraction pipeline.</CardDescription>
            </div>
            <Badge variant="primary">Core pipeline</Badge>
          </CardHeader>

          <CardContent className="stack stack-5">
            <Select
              label="Assign to course"
              options={OPTIONS}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              hint="You can only assign papers to courses assigned to you."
            />

            <div className="dropzone" role="button" tabIndex={0}>
              <span className="dropzone__icon" aria-hidden="true">
                <UploadCloud size={22} />
              </span>
              <div>
                <div className="dropzone__title">
                  Drop a PDF question paper here or <span style={{ color: 'var(--accent-text)' }}>browse files</span>
                </div>
                <div className="dropzone__hint" style={{ marginTop: 4 }}>
                  Text-based and scanned exam PDFs supported &middot; 25&nbsp;MB maximum
                </div>
              </div>
            </div>

            <div className="row row--between row--wrap" style={{ gap: 'var(--space-3)' }}>
              <span className="row row-2 text-sm text-muted">
                <ShieldCheck size={15} aria-hidden="true" />
                Files stay in a private, access-controlled bucket
              </span>
              <Button variant="primary" size="md" icon={<Sparkles size={15} />}>
                Start extraction
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle as="h2">Import history</CardTitle>
              <CardDescription>Processing state, flagged questions, and review readiness.</CardDescription>
            </div>
          </CardHeader>

          <CardContent flush>
            {IMPORTS.map((item) => (
              <div className="list-row" key={item.id}>
                <span className="list-row__icon list-row__icon--primary" aria-hidden="true">
                  <FileText size={17} />
                </span>

                <div className="list-row__body">
                  <div className="list-row__title truncate">{item.filename}</div>
                  <div className="list-row__meta">
                    {item.course} &middot; {item.uploadedAt}
                  </div>
                  <div className="list-row__meta" style={{ marginTop: 4 }}>
                    Extracted <strong style={{ color: 'var(--text-primary)' }}>{item.extracted} MCQs</strong>
                    {item.flagged > 0 && (
                      <span style={{ color: 'var(--warning)', marginLeft: 6 }}>({item.flagged} flagged for review)</span>
                    )}
                  </div>
                </div>

                <div className="stack stack-2" style={{ alignItems: 'flex-end' }}>
                  <Badge variant={item.variant} dot={item.variant === 'warning'}>
                    {item.status}
                  </Badge>
                  <Button variant="outline" size="sm" icon={<PencilLine size={13} />}>
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="section">
        <SectionHeader
          title="Question verification"
          description="Confirm question text, answer options, the answer key, and marks before a quiz can be published."
          actions={<Badge variant="warning">Sample from CS301</Badge>}
        />

        <Card>
          <CardHeader>
            <div className="row row-3">
              <span className="kbd">Q #14</span>
              <span className="text-md" style={{ fontWeight: 600 }}>
                Multiple choice &middot; single answer
              </span>
            </div>
            <div className="row row-3">
              <span className="text-sm text-secondary">
                Marks: <strong style={{ color: 'var(--text-primary)' }}>2 pts</strong>
              </span>
              <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                Verified key
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="stack stack-5">
            <p style={{ fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.5 }}>
              Which normal form guarantees that every non-prime attribute is fully functionally dependent on every
              candidate key?
            </p>

            <div className="option-list">
              {SAMPLE_OPTIONS.map((option) => (
                <div className={`option ${option.isCorrect ? 'option--correct' : ''}`} key={option.label}>
                  <span className="option__key" aria-hidden="true">
                    {option.label}
                  </span>
                  <span className="option__text">{option.text}</span>
                  {option.isCorrect && (
                    <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                      Correct answer
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="row row--between row--wrap" style={{ gap: 'var(--space-3)' }}>
              <span className="text-sm text-muted">
                Extracted from <code>CS301_Midterm_Paper_2026.pdf</code> &middot; page 3
              </span>
              <div className="row row-2">
                <Button variant="outline" size="sm" icon={<PencilLine size={13} />}>
                  Edit question
                </Button>
                <Button variant="secondary" size="sm">
                  Change answer key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="row row-2 row--wrap">
        <span className="row row-2 text-sm text-muted">
          <Users size={15} aria-hidden="true" />
          81 students enrolled across your assigned courses
        </span>
      </div>
    </div>
  );
}
