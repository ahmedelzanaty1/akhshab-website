"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

type GalleryImage = { name: string; url: string; category: string };

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadCategory, setUploadCategory] = useState(CATEGORIES[0]);
  const [activeTab, setActiveTab] = useState<string>("الكل");

  async function loadImages() {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setError("مقدرناش نجيب الصور");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  const tabs = useMemo(() => {
    const cats = Array.from(new Set(images.map((i) => i.category)));
    return ["الكل", ...cats];
  }, [images]);

  const visible = activeTab === "الكل" ? images : images.filter((i) => i.category === activeTab);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: formData });
      if (!res.ok) throw new Error("upload failed");
      await loadImages();
    } catch {
      setError("فشل رفع الصورة");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(name: string) {
    if (!confirm("متأكد عايز تشيل الصورة دي؟")) return;
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("delete failed");
      setImages((prev) => prev.filter((img) => img.name !== name));
    } catch {
      setError("فشل حذف الصورة");
    }
  }

  return (
    <div className="wrap" style={{ paddingTop: 150, paddingBottom: 100 }}>
      <h2 style={{ fontFamily: "Cairo, sans-serif", fontSize: 28, marginBottom: 8 }}>
        إدارة صور الجاليري
      </h2>
      <p style={{ color: "var(--cream-dim)", marginBottom: 30 }}>
        الصور دي بتظهر تلقائي في صفحة الموقع الرئيسية، مقسمة حسب الكاتيجوري.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 30 }}>
        <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="btn btn-gold" style={{ display: "inline-block", cursor: "pointer" }}>
          {uploading ? "بيترفع..." : "ارفع صورة جديدة"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {error && <p style={{ color: "#C97A5A", marginBottom: 20 }}>{error}</p>}

      <div className="chip-group" style={{ marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`chip${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>بيتحمل...</p>
      ) : visible.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>لسه مفيش صور في القسم ده.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          {visible.map((img) => (
            <div
              key={img.name}
              style={{
                position: "relative",
                border: "1px solid var(--line)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <img
                src={img.url}
                alt={img.name}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  fontSize: 10.5,
                  background: "rgba(14,10,7,.85)",
                  color: "var(--gold-bright)",
                  padding: "3px 8px",
                  borderRadius: 20,
                }}
              >
                {img.category}
              </span>
              <button
                onClick={() => handleDelete(img.name)}
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  background: "rgba(14,10,7,.85)",
                  color: "#C97A5A",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  padding: "4px 10px",
                  fontSize: 12,
                }}
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
