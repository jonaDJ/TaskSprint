"use client";

import type { Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SprintIcon } from "./icons";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [recovering, setRecovering] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (window.location.search.includes("recovery=1") || window.location.hash.includes("type=recovery")) {
      queueMicrotask(() => setRecovering(true));
    }

    const validateSession = async () => {
      const { data: cached } = await supabase.auth.getSession();
      if (!active) return;
      if (!cached.session) {
        setSession(null);
        setLoading(false);
        return;
      }

      // getSession reads the browser cache. getUser verifies that cached token
      // with Supabase, which catches accounts deleted from the dashboard.
      const { data: verified, error } = await supabase.auth.getUser();
      if (!active) return;
      const accountNoLongerExists = !verified.user
        && (!error || error.status === 401 || error.status === 403);
      if (accountNoLongerExists) {
        await supabase.auth.signOut({ scope: "local" });
        if (!active) return;
        setSession(null);
        setLoading(false);
        return;
      }

      // A temporary network failure should not destroy a legitimate session.
      setSession(cached.session);
      setLoading(false);
    };

    void validateSession();
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(next);
      setLoading(false);
    });
    const verifyOnFocus = () => void validateSession();
    const verifyWhenVisible = () => {
      if (document.visibilityState === "visible") void validateSession();
    };
    const timer = window.setInterval(() => void validateSession(), 60_000);
    window.addEventListener("focus", verifyOnFocus);
    document.addEventListener("visibilitychange", verifyWhenVisible);

    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener("focus", verifyOnFocus);
      document.removeEventListener("visibilitychange", verifyWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session && pathname !== "/login") router.replace("/login");
    if (session && pathname === "/login" && !recovering) router.replace("/");
  }, [loading, pathname, recovering, router, session]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?recovery=1`,
      });
      setSubmitting(false);
      setMessage(error ? error.message : "If an account exists for this email, a password reset link has been sent.");
      return;
    }
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account, then return here to sign in.");
      return;
    }
    router.replace("/");
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("Your new password must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRecovering(false);
    setPassword("");
    setConfirmPassword("");
    router.replace("/");
  }

  if (loading || (!session && pathname !== "/login") || (session && pathname === "/login" && !recovering)) {
    return <main className="auth-loading"><span className="auth-logo"><SprintIcon /></span><p>Opening your workspace…</p></main>;
  }

  if (recovering && session) {
    return (
      <main className="auth-screen">
        <section className="auth-shell auth-recovery-shell">
          <aside className="auth-intro">
            <div className="auth-brand"><span className="auth-logo"><SprintIcon /></span><strong>TaskSprint</strong></div>
            <div><span className="eyebrow">Account recovery</span><h1>Choose a fresh password.</h1><p>Use a password that is memorable to you and difficult for anyone else to guess.</p></div>
            <ul><li><i />At least 6 characters</li><li><i />Avoid reused passwords</li><li><i />Keep your workspace protected</li></ul>
          </aside>
          <section className="auth-card">
            <span className="eyebrow">Almost there</span>
            <h2>Set a new password</h2>
            <p>Enter your new password twice to confirm it.</p>
            <form onSubmit={updatePassword}>
              <label className="field"><span>New password</span><input autoFocus type="password" autoComplete="new-password" minLength={6} placeholder="At least 6 characters" required value={password} onChange={event => setPassword(event.target.value)} /></label>
              <label className="field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={6} placeholder="Enter it again" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
              {message && <div className="auth-message" role="status">{message}</div>}
              <button className="primary-button auth-submit" disabled={submitting}>{submitting ? "Updating…" : "Update password"}</button>
            </form>
          </section>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-shell">
          <aside className="auth-intro">
            <div className="auth-brand"><span className="auth-logo"><SprintIcon /></span><strong>TaskSprint</strong></div>
            <div><span className="eyebrow">Plan with intention</span><h1>Your week, goals, and habits—together.</h1><p>One private workspace that stays synchronized across your computer and phone.</p></div>
            <ul><li><i />Plan focused time blocks</li><li><i />Track goals and deadlines</li><li><i />Build habits that last</li></ul>
          </aside>
          <section className="auth-card">
            <span className="eyebrow">{mode === "signin" ? "Welcome back" : mode === "signup" ? "Get started" : "Account recovery"}</span>
            <h2>{mode === "signin" ? "Sign in to your workspace" : mode === "signup" ? "Create your account" : "Reset your password"}</h2>
            <p>{mode === "signin" ? "Continue planning from any device." : mode === "signup" ? "Your planning data will be stored securely in the cloud." : "Enter your email and we’ll send you a secure reset link."}</p>
            <form onSubmit={submit}>
              <label className="field"><span>Email address</span><input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={event => setEmail(event.target.value)} /></label>
              {mode !== "forgot" && <label className="field"><span>Password</span><input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} placeholder="At least 6 characters" required value={password} onChange={event => setPassword(event.target.value)} /></label>}
              {mode === "signin" && <button type="button" className="auth-forgot" onClick={() => { setMode("forgot"); setMessage(""); }}>Forgot password?</button>}
              {message && <div className="auth-message" role="status">{message}</div>}
              <button className="primary-button auth-submit" disabled={submitting}>{submitting ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</button>
            </form>
            <div className="auth-divider"><span>or</span></div>
            <button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "New to TaskSprint? Create an account" : mode === "signup" ? "Already have an account? Sign in" : "Back to sign in"}</button>
          </section>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
