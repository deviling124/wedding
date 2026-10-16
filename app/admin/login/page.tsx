"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("We could not sign you in. Check your email and password.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">Private area</div>
        <h1>RSVP dashboard</h1>
        <p className="story-copy">Sign in to see your guest list and download responses.</p>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="button" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in →"}</button>
        </form>
        <p className="form-note" style={{ marginTop: 18 }}>Admin accounts are created in Supabase Auth. Guest accounts are never required.</p>
      </div>
    </main>
  );
}
