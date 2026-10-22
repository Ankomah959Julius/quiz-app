import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load session and profile
  const loadUserData = useCallback(async (session) => {
    try {
      if (session?.user) {
        setUser(session.user);
        const profileData = await authService.getUserProfile(session.user.id);
        if (profileData) {
          setProfile(profileData);
          setRole(profileData.role || 'student');
        } else {
          // If profile trigger is pending, fallback to metadata or student
          const fallbackRole = session.user.user_metadata?.role || 'student';
          setRole(fallbackRole);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole('student');
      }
    } catch (err) {
      console.error('Error loading user session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial session check
    authService.getSession()
      .then((session) => loadUserData(session))
      .catch((err) => {
        console.warn('Initial session error:', err.message);
        setLoading(false);
      });

    // 2. Subscribe to auth state updates
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      loadUserData(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.signIn(credentials);
      await loadUserData(data.session);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.signUp(credentials);
      if (data.session) {
        await loadUserData(data.session);
      } else {
        setLoading(false);
      }
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setRole('student');
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  // Preview switcher helper for testing UI before all accounts are provisioned
  const setPreviewRole = (newRole) => {
    setRole(newRole);
  };

  const value = {
    user,
    profile,
    role,
    loading,
    error,
    isAuthenticated: !!user,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin' || role === 'super_admin',
    isLecturer: role === 'lecturer',
    isStudent: role === 'student',
    signIn,
    signUp,
    signOut,
    setPreviewRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
