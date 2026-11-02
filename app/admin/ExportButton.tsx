"use client";

import { useState } from "react";

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function exportRsvps() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/export");
      if (!response.ok) throw new Error();

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "wedding-rsvps.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return <button className="button secondary" type="button" onClick={exportRsvps} disabled={loading}>{loading ? "Preparing CSV…" : "Download CSV ↓"}</button>;
}

