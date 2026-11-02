"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      setError(body?.error ?? "We could not sign you in. Check your username and password.");
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
          <label>Username or email<input type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required autoComplete="username" placeholder="fenatti" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="button" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in →"}</button>
        </form>
        <p className="form-note" style={{ marginTop: 18 }}>Admin username: <strong>fenatti</strong>. Use the password for the matching Supabase Auth admin account.</p>
      </div>
    </main>
  );
}

