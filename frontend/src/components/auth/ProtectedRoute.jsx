import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Alert from '../common/Alert';
import Card, { CardContent, CardHeader, CardTitle } from '../common/Card';
import Button from '../common/Button';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-page" style={{ minHeight: '60vh' }}>
        <div className="spinner" aria-label="Loading authentication..." />
      </div>
    );
  }

  // If role is permitted (either via real authenticated profile or authorized preview)
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(role);

  if (!isAllowed) {
    return (
      <div className="page-shell" style={{ maxWidth: 640, margin: '4rem auto' }}>
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="col col-4">
            <Alert variant="danger">
              Your current account role (<strong>{role}</strong>) does not have permission to access this portal.
            </Alert>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
              Required role(s): {allowedRoles.join(', ')}.
            </p>
            <div className="row row-3">
              <Button variant="secondary" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button variant="primary" onClick={() => { window.location.href = `/${role}`; }}>
                Return to My Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
