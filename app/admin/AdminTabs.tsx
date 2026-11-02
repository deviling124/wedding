"use client";

import { ReactNode, useState } from "react";

export function AdminTabs({ guestList, invitationLinks }: { guestList: ReactNode; invitationLinks: ReactNode }) {
  const [activeTab, setActiveTab] = useState<"guest-list" | "invitation-links">("guest-list");

  return (
    <>
      <div className="admin-tabs" role="tablist" aria-label="Admin dashboard sections">
        <button type="button" role="tab" aria-selected={activeTab === "guest-list"} className={activeTab === "guest-list" ? "active" : ""} onClick={() => setActiveTab("guest-list")}>Guest list</button>
        <button type="button" role="tab" aria-selected={activeTab === "invitation-links"} className={activeTab === "invitation-links" ? "active" : ""} onClick={() => setActiveTab("invitation-links")}>Invitation links</button>
      </div>
      <div hidden={activeTab !== "guest-list"} role="tabpanel">{guestList}</div>
      <div hidden={activeTab !== "invitation-links"} role="tabpanel">{invitationLinks}</div>
    </>
  );
}

