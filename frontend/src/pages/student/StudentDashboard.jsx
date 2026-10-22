import React from 'react';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  TrendingUp,
  FileQuestion,
  Play,
  Users
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import SectionHeader from '../../components/common/SectionHeader';
import DataTable from '../../components/common/DataTable';
import ProgressBar from '../../components/common/ProgressBar';

const STATS = [
  { label: 'Completed quizzes', value: '14', hint: 'Across 3 enrolled courses', icon: <CheckCircle2 size={17} />, tone: 'success' },
  { label: 'Overall average', value: '88.4%', hint: 'Ranked 4th in cohort', icon: <TrendingUp size={17} />, tone: 'brand' },
  { label: 'Pending deadlines', value: '2', hint: 'Action required this week', icon: <Clock size={17} />, tone: 'warning' },
  { label: 'Global ranking', value: '#4 / 128', hint: 'Top 5% of the platform', icon: <Award size={17} />, tone: 'info' }
];

const AVAILABLE_QUIZZES = [
  {
    id: 'quiz-1',
    course: 'CS301 — Database Systems',
    title: 'Relational Algebra & SQL Normalization',
    lecturer: 'Dr. Evelyn Vance',
    duration: '45 mins',
    questions: 25,
    marks: 50,
    attemptsUsed: 0,
    maxAttempts: 2,
    due: 'Tomorrow, 11:59 PM',
    urgent: true
  },
  {
    id: 'quiz-2',
    course: 'CS204 — Algorithms & Data Structures',
    title: 'Graph Theory & Breadth-First Traversal',
    lecturer: 'Prof. Marcus Chen',
    duration: '30 mins',
    questions: 15,
    marks: 30,
    attemptsUsed: 0,
    maxAttempts: 1,
    due: 'Oct 28, 2026',
    urgent: false
  },
  {
    id: 'quiz-3',
    course: 'MATH105 — Linear Algebra',
    title: 'Matrix Eigenvalues & Diagonalization',
    lecturer: 'Dr. Sarah Lin',
    duration: '60 mins',
    questions: 20,
    marks: 40,
    attemptsUsed: 0,
    maxAttempts: 1,
    due: 'Nov 02, 2026',
    urgent: false
  }
];

const RECENT_ATTEMPTS = [
  {
    id: 'att-1',
    quizTitle: 'Transaction Management & ACID Properties',
    course: 'CS301',
    score: 46,
    total: 50,
    percentage: 92,
    submittedAt: 'Oct 19, 2026',
    attemptNum: 1,
    status: 'Graded',
    feedbackAllowed: true
  },
  {
    id: 'att-2',
    quizTitle: 'Red-Black Trees & Binary Search',
    course: 'CS204',
    score: 27,
    total: 30,
    percentage: 90,
    submittedAt: 'Oct 15, 2026',
    attemptNum: 1,
    status: 'Graded',
    feedbackAllowed: false
  },
  {
    id: 'att-3',
    quizTitle: 'Vector Spaces & Linear Independence',
    course: 'MATH105',
    score: 33,
    total: 40,
    percentage: 82.5,
    submittedAt: 'Oct 10, 2026',
    attemptNum: 1,
    status: 'Graded',
    feedbackAllowed: true
  }
];

export default function StudentDashboard() {
  const attemptColumns = [
    {
      key: 'quizTitle',
      header: 'Quiz / subject',
      render: (row) => (
        <div>
          <div className="data-table__title">{row.quizTitle}</div>
          <div className="data-table__meta">
            {row.course} &middot; Attempt #{row.attemptNum}
          </div>
        </div>
      )
    },
    {
      key: 'score',
      header: 'Score',
      className: 'cell-num',
      render: (row) => (
        <span className="mono cell-strong">
          {row.score} / {row.total}
        </span>
      )
    },
    {
      key: 'percentage',
      header: 'Result',
      className: 'cell-num',
      render: (row) => (
        <div style={{ minWidth: 150 }}>
          <ProgressBar
            value={row.score}
            max={row.total}
            height={6}
            showValue={false}
            tone={row.percentage >= 80 ? 'success' : row.percentage >= 50 ? 'warning' : 'danger'}
          />
          <div className="data-table__meta" style={{ marginTop: 6 }}>
            {row.percentage}% weighted
          </div>
        </div>
      )
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row) => row.submittedAt
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant="success" dot>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      className: 'cell-actions',
      render: (row) => (
        <Button variant={row.feedbackAllowed ? 'outline' : 'ghost'} size="sm" disabled={!row.feedbackAllowed}>
          {row.feedbackAllowed ? 'Review answers' : 'Feedback locked'}
        </Button>
      )
    }
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow={
          <>
            <Badge variant="primary" dot>
              Enrolled student
            </Badge>
            <span className="text-sm text-muted">Student ID: STU-88219</span>
          </>
        }
        title="Student portal"
        subtitle="Welcome back, Alexander Rivera. Track deadlines, sit published quizzes, and review your verified results."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<BookOpen size={14} />}>
              My courses
            </Button>
            <Button variant="primary" size="sm" icon={<Award size={14} />}>
              Leaderboard
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="section">
        <SectionHeader
          title="Published & available quizzes"
          description="Timed assessments released by your lecturers. Answer keys stay server-side until submission is scored."
          actions={<Badge variant="warning">{AVAILABLE_QUIZZES.length} pending</Badge>}
        />

        <div className="grid grid-3">
          {AVAILABLE_QUIZZES.map((quiz) => (
            <Card key={quiz.id} interactive>
              <CardHeader>
                <div style={{ minWidth: 0 }}>
                  <Badge variant="default" style={{ marginBottom: 8 }}>
                    {quiz.course}
                  </Badge>
                  <CardTitle as="h3" style={{ lineHeight: 1.35 }}>
                    {quiz.title}
                  </CardTitle>
                  <p className="data-table__meta" style={{ marginTop: 6 }}>
                    {quiz.lecturer}
                  </p>
                </div>
                {quiz.urgent && <Badge variant="danger">Due soon</Badge>}
              </CardHeader>

              <CardContent>
                <div className="quiz-card__meta">
                  <div className="quiz-card__row">
                    <span className="quiz-card__key">
                      <Clock size={14} aria-hidden="true" /> Time limit
                    </span>
                    <span className="quiz-card__val">{quiz.duration}</span>
                  </div>
                  <div className="quiz-card__row">
                    <span className="quiz-card__key">
                      <FileQuestion size={14} aria-hidden="true" /> Questions
                    </span>
                    <span className="quiz-card__val">
                      {quiz.questions} MCQ &middot; {quiz.marks} pts
                    </span>
                  </div>
                  <div className="quiz-card__row">
                    <span className="quiz-card__key">
                      <Calendar size={14} aria-hidden="true" /> Due
                    </span>
                    <span className="quiz-card__val" style={quiz.urgent ? { color: 'var(--danger)' } : undefined}>
                      {quiz.due}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <span className="text-sm text-muted">
                  Attempts {quiz.attemptsUsed}/{quiz.maxAttempts}
                </span>
                <Button variant="primary" size="sm" icon={<Play size={13} />}>
                  Start quiz
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader
          title="Recent attempts & verified results"
          description="Historical scores computed by database logic. Answer review unlocks only when the lecturer allows it."
          actions={
            <Button variant="ghost" size="sm" icon={<Users size={14} />}>
              View all attempts
            </Button>
          }
        />

        <Card>
          <DataTable columns={attemptColumns} rows={RECENT_ATTEMPTS} caption="Recent quiz attempts and verified scores" />
        </Card>
      </section>
    </div>
  );
}
