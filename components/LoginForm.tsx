"use client";

import { useState } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setError("بيانات الدخول غلط");
      }
    } catch {
      setError("حصل خطأ، جرب تاني");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 6,
          padding: 34,
          width: "100%",
          maxWidth: 360,
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 24, fontFamily: "Cairo, sans-serif" }}>
          تسجيل دخول الأدمن
        </h2>
        <div className="field">
          <label>اسم المستخدم</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p style={{ color: "#C97A5A", fontSize: 13, marginBottom: 14 }}>{error}</p>
        )}
        <button type="submit" className="btn btn-gold btn-block" disabled={loading}>
          {loading ? "..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
