"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogOutIcon } from "./icons";

export function CloudAccount({ mobile = false }: { mobile?: boolean }) {
  const [email, setEmail] = useState("");
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || "Account")); }, []);
  const initials = email.slice(0, 2).toUpperCase();
  const signOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) void supabase.auth.signOut();
  };
  if (mobile) return <button className="mobile-account" onClick={signOut} aria-label={`Sign out ${email}`}><LogOutIcon /><span>Sign out</span></button>;
  return <div className="profile cloud-profile"><span>{initials}</span><div><strong title={email}>{email}</strong></div><button onClick={signOut}><LogOutIcon /><span>Sign out</span></button></div>;
}
