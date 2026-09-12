"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CleanupButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCleanup() {
    if (
      !confirm(
        "متأكد عايز تنضف كل الحجوزات اللي عدى عليها أكتر من 5 شهور؟ الخطوة دي مش هترجع."
      )
    )
      return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/cleanup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMsg(`اتشال ${data.deleted} حجز قديم`);
        router.refresh();
      } else {
        setMsg("فشل التنظيف");
      }
    } catch {
      setMsg("حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button className="btn btn-ghost" onClick={handleCleanup} disabled={loading}>
        {loading ? "بينضف..." : "🧹 نضّف الحجوزات الأقدم من 5 شهور"}
      </button>
      {msg && <span style={{ fontSize: 13, color: "var(--muted)" }}>{msg}</span>}
    </div>
  );
}
