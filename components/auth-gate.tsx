"use client";
import type { Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null), [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [mode, setMode] = useState<"signin" | "signup">("signin"), [message, setMessage] = useState("");
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); }); const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); }); return () => data.subscription.unsubscribe(); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setMessage(""); const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); if (result.error) setMessage(result.error.message); else if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then sign in."); }
  if (loading) return <main className="auth-screen"><p>Connecting to TaskSprint…</p></main>;
  if (!session) return <main className="auth-screen"><section className="auth-card"><span className="eyebrow">Cloud workspace</span><h1>{mode === "signin" ? "Sign in to TaskSprint" : "Create your account"}</h1><p>Your calendar, goals, and habits will sync across your devices.</p><form onSubmit={submit}><label className="field"><span>Email</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field"><span>Password</span><input type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <div className="auth-message">{message}</div>}<button className="primary-button">{mode === "signin" ? "Sign in" : "Create account"}</button></form><button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "New here? Create an account" : "Already registered? Sign in"}</button></section></main>;
  return <>{children}</>;
}
