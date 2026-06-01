// ─────────────────────────────────────────────
// Auth Module — shared across all pages
// Handles login, signup, Google OAuth, session
// ─────────────────────────────────────────────
const Auth = (function () {
  'use strict';

  const FEED_PAGE    = '/feed';
  const LANDING_PAGE = '/home';

  // ── Normalize email before any auth call ──────────────────────────────
  //
  // Fixes two classes of login failure:
  //
  //   1. Case mismatch — Supabase compares emails case-sensitively at the
  //      identity level. A user who signs up as "John@Gmail.com" cannot log
  //      in as "john@gmail.com" without this normalization.
  //
  //   2. Gmail dot / plus-address aliases — Gmail ignores dots in the local
  //      part and strips everything after '+'. From Gmail's perspective
  //      "j.ohn+tag@gmail.com" and "john@gmail.com" are the same inbox, but
  //      Supabase would treat them as separate accounts. Normalizing on both
  //      signup AND login ensures a user always resolves to the same identity
  //      regardless of how they type their address.
  //
  // This function is the single source of truth for email normalization and
  // is called inside signUp(), logIn(), and resendVerification() so every
  // entry point is automatically covered — including settings.js which calls
  // Auth.normalizeEmail() directly before supabase.auth.updateUser().
  //
  function normalizeEmail(raw) {
    if (!raw) return '';

    var lower = raw.trim().toLowerCase();
    var atIdx = lower.lastIndexOf('@');

    // Malformed — no @. Pass it through and let Supabase reject it.
    if (atIdx === -1) return lower;

    var local  = lower.slice(0, atIdx);
    var domain = lower.slice(atIdx + 1);

    // Gmail (and its googlemail.com alias) — strip dots and +tags from local part.
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      local  = local.split('+')[0];    // drop everything after the first +
      local  = local.replace(/\./g, ''); // dots are ignored by Gmail
      domain = 'gmail.com';             // googlemail.com → gmail.com canonical form
    }

    return local + '@' + domain;
  }

  // ── Guard: redirect to feed if a session already exists ──
  async function redirectIfLoggedIn() {
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (session) window.location.href = FEED_PAGE;

    return session ?? null;
  }

  // ── Guard: redirect to landing if no active session ──
  async function requireAuth() {
    if (!supabase) {
      window.location.href = LANDING_PAGE;
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = LANDING_PAGE;
      return null;
    }

    return session;
  }

  // ── Return the current session, or null if none exists ──
  async function getSession() {
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // ── Fetch the current user's profile row from the profiles table ──
  async function getProfile() {
    const session = await getSession();
    if (!session) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }

    return profile;
  }

  // ── Register a new account with email, password, and username ──
  async function signUp(email, password, username) {
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email), // normalized — see normalizeEmail() above
      password,
      options: { data: { username } }
    });

    return { data, error };
  }

  // ── Sign in with email and password ──
  async function logIn(email, password) {
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    return await supabase.auth.signInWithPassword({
      email: normalizeEmail(email), // normalized — must match what signUp stored
      password
    });
  }

  // ── Resend the signup confirmation email for an unconfirmed account ──
  //
  // Called from the login form when the user hits "Invalid login credentials"
  // and we suspect the account exists but the email was never confirmed.
  // Supabase rate-limits this endpoint, so duplicate clicks are safe.
  //
  async function resendVerification(email) {
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    const { error } = await supabase.auth.resend({
      type:  'signup',
      email: normalizeEmail(email), // normalize here too for consistency
    });

    return { error };
  }

  // ── Initiate Google OAuth sign-in ──
  async function signInWithGoogle() {
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + FEED_PAGE }
    });
  }

  // ── Sign out and redirect to landing page ──
  async function logOut() {
    if (!supabase) return;

    if (typeof UserProfile !== 'undefined') UserProfile.invalidate();

    await supabase.auth.signOut();
    window.location.href = LANDING_PAGE;
  }

  // ── Return true if the given username is not yet taken ──
  async function isUsernameAvailable(username) {
    if (!supabase) return false;

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    return !existingUser;
  }

  // ── Subscribe to auth state changes ──
  function onAuthStateChange(callback) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe() {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  }

  return {
    redirectIfLoggedIn,
    requireAuth,
    getSession,
    getProfile,
    normalizeEmail,       // exported so settings.js can use it for email updates
    signUp,
    logIn,
    resendVerification,   // exported so home.js login handler can trigger resend
    signInWithGoogle,
    logOut,
    isUsernameAvailable,
    onAuthStateChange
  };
})();
