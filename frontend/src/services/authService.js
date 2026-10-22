import { supabase } from '../lib/supabase';

/**
 * Authentication service communicating directly with Supabase Auth and Profiles table.
 */
export const authService = {
  /**
   * Register a new user account.
   * Supabase trigger automatically provisions a 'student' profile row.
   */
  async signUp({ email, password, displayName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) throw error;
    return data;
  },

  /**
   * Log in an existing user with email and password.
   */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out the currently active session.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current authenticated user object.
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError') {
      throw error;
    }
    return user || null;
  },

  /**
   * Get the current active session.
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session || null;
  },

  /**
   * Fetch the corresponding profile row for an authenticated user.
   */
  async getUserProfile(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Could not retrieve user profile:', error.message);
      return null;
    }
    return data;
  },

  /**
   * Send a password reset email.
   */
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    if (error) throw error;
    return data;
  },

  /**
   * Listen to real-time auth state events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

export default authService;
