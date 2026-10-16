"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return <button className="button secondary" type="button" onClick={logout}>Sign out</button>;
}
