import React, { useState } from 'react';
import { Palette, CheckCircle2, AlertTriangle, Send, Layers, SquareStack, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import Badge from '../components/common/Badge';
import PageHeader from '../components/common/PageHeader';
import SectionHeader from '../components/common/SectionHeader';
import SegmentedControl from '../components/common/SegmentedControl';
import { Input, Select, Textarea, Checkbox } from '../components/common/FormControls';
import Alert from '../components/common/Alert';
import ProgressBar from '../components/common/ProgressBar';

const TOKENS = [
  { name: 'Brand primary', token: '--accent', value: '#4f46e5', className: 'swatch--brand' },
  { name: 'Brand gradient', token: '--gradient-brand', value: 'indigo → violet', className: 'swatch--gradient' },
  { name: 'Success', token: '--success', value: '#047857', className: 'swatch--success' },
  { name: 'Warning', token: '--warning', value: '#b45309', className: 'swatch--warning' }
];

export default function DesignSystemPreview() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [segment, setSegment] = useState('mcq');

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <Badge variant="primary" icon={<Palette size={13} />}>
            Design system
          </Badge>
        }
        title="QuizPulse component library"
        subtitle="Every screen in the product is composed from these tokens and primitives — light and dark, desktop and mobile."
        actions={
          <Badge variant="success" dot>
            All primitives accessible
          </Badge>
        }
      />

      <section className="section">
        <SectionHeader
          title="Color tokens"
          description="Semantic tokens resolve per theme, so components never hardcode a hex value."
          icon={<Layers size={17} />}
        />
        <div className="grid grid-4">
          {TOKENS.map((token) => (
            <Card key={token.token}>
              <CardContent>
                <div className={`swatch ${token.className}`} aria-hidden="true" />
                <div style={{ fontWeight: 600, marginTop: 'var(--space-3)' }}>{token.name}</div>
                <div className="mono text-xs text-muted" style={{ marginTop: 2 }}>
                  {token.token} &middot; {token.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Buttons" description="Five variants, three sizes, and a real loading state." icon={<SquareStack size={17} />} />
        <Card>
          <CardContent className="stack stack-5">
            <div>
              <div className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                Variants
              </div>
              <div className="row row--wrap" style={{ gap: 'var(--space-3)' }}>
                <Button variant="primary">Primary action</Button>
                <Button variant="secondary">Secondary action</Button>
                <Button variant="outline">Outline action</Button>
                <Button variant="ghost">Ghost action</Button>
                <Button variant="danger">Danger action</Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                Sizes, icons &amp; states
              </div>
              <div className="row row--wrap" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="secondary" icon={<Send size={14} />}>
                  With icon
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button
                  variant="secondary"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1800);
                  }}
                >
                  {btnLoading ? 'Processing' : 'Test loading'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="section">
        <SectionHeader title="Badges" description="Status tokens for pipeline states, verification, and access levels." />
        <Card>
          <CardContent className="row row--wrap" style={{ gap: 'var(--space-2)' }}>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success" icon={<CheckCircle2 size={12} />}>
              Verified answer
            </Badge>
            <Badge variant="warning" icon={<AlertTriangle size={12} />}>
              Needs review
            </Badge>
            <Badge variant="danger">Submission blocked</Badge>
            <Badge variant="info" dot>
              OCR processing
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="section">
        <SectionHeader title="Form controls" description="Labelled inputs with hints, validation errors, and an accessible select." />
        <div className="grid grid-2">
          <Card>
            <CardHeader plain>
              <CardTitle as="h3">Course configuration</CardTitle>
              <CardDescription>Fields map directly to the quiz_settings schema.</CardDescription>
            </CardHeader>
            <CardContent className="stack stack-4">
              <Input label="Course title" placeholder="e.g. Distributed Operating Systems" hint="Shown on the student dashboard and exam header" required />
              <Input label="Passing grade" type="number" defaultValue={60} hint="Minimum percentage required for credit" />
              <Input label="Duration (minutes)" defaultValue="invalid_quiz_time" error="Enter a valid positive number of minutes" />
              <Checkbox label="Allow students to review answers after submission" defaultChecked />
            </CardContent>
          </Card>

          <Card>
            <CardHeader plain>
              <CardTitle as="h3">Question authoring</CardTitle>
              <CardDescription>Only verified items can be published.</CardDescription>
            </CardHeader>
            <CardContent className="stack stack-4">
              <Select
                label="Question type"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                options={[
                  { value: 'mcq', label: 'Multiple choice (A–D)' },
                  { value: 'mcq5', label: 'Multiple choice (A–E)' },
                  { value: 'tf', label: 'True / false' }
                ]}
              />
              <Textarea label="Instructions" placeholder="Write exam guidance for candidates…" rows={4} />
              <div>
                <div className="text-sm text-secondary" style={{ marginBottom: 'var(--space-2)', fontWeight: 600 }}>
                  Segmented control
                </div>
                <SegmentedControl
                  items={[
                    { id: 'mcq', label: 'MCQ' },
                    { id: 'tf', label: 'True / false' },
                    { id: 'essay', label: 'Essay' }
                  ]}
                  value={segment}
                  onChange={setSegment}
                  ariaLabel="Question type"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Alerts" description="Contextual feedback for pipeline, verification, and security states." />
        <div className="stack stack-3">
          <Alert variant="info" title="System guidance">
            Question papers are parsed automatically using layout analysis with an OCR fallback for scanned documents.
          </Alert>
          <Alert variant="success" title="Evaluation complete">
            All 25 questions were scored by the trusted PostgreSQL evaluation function.
          </Alert>
          <Alert variant="warning" title="Human review needed">
            Page 4 uses a non-standard numbering format. Verify the options before publishing.
          </Alert>
          <Alert variant="danger" title="Security boundary enforced">
            Client-side score updates are rejected. Scores are immutable outside authorized server evaluations.
          </Alert>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Progress" description="Determinate meters with accessible values and semantic tones." icon={<Sparkles size={17} />} />
        <Card>
          <CardContent className="stack stack-5">
            <ProgressBar label="Quiz time elapsed (24 of 45 mins)" value={24} max={45} />
            <ProgressBar label="Extraction pipeline (18 of 20 questions)" value={18} max={20} tone="success" />
            <ProgressBar label="Overall course completion" value={85} max={100} tone="warning" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
