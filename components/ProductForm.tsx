"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

type Product = {
  id: string;
  category: string;
  name: string;
  price: number;
  offer_price: number | null;
  image_url: string | null;
};

const emptyForm = {
  id: "",
  category: CATEGORIES[0],
  name: "",
  price: "",
  offer_price: "",
  image_url: "",
};

export default function ProductForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      category: p.category,
      name: p.name,
      price: String(p.price),
      offer_price: p.offer_price ? String(p.offer_price) : "",
      image_url: p.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const isEdit = !!form.id;
    try {
      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          category: form.category,
          name: form.name,
          price: parseFloat(form.price),
          offer_price: form.offer_price ? parseFloat(form.offer_price) : null,
          image_url: form.image_url || null,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setForm(emptyForm);
      await loadProducts();
    } catch {
      setError("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("متأكد عايز تشيل المنتج ده؟")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="wrap" style={{ paddingTop: 150, paddingBottom: 100 }}>
      <h2 style={{ fontFamily: "Cairo, sans-serif", fontSize: 28, marginBottom: 8 }}>
        منتجات جاهزة للبيع
      </h2>
      <p style={{ color: "var(--cream-dim)", marginBottom: 30 }}>
        المنتجات دي بتظهر في صفحة الموقع الرئيسية. لو حطيت سعر عرض أقل من السعر
        الأصلي، هيظهر بادج "عرض" تلقائي.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 6,
          padding: 26,
          marginBottom: 40,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div className="field">
          <label>الكاتيجوري</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>اسم المنتج</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>السعر</label>
          <input
            type="number"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div className="field">
          <label>سعر العرض (اختياري)</label>
          <input
            type="number"
            value={form.offer_price}
            onChange={(e) => setForm({ ...form, offer_price: e.target.value })}
            placeholder="سيبه فاضي لو مفيش عرض"
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>رابط صورة (اختياري - انسخه من صور الجاليري)</label>
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        {error && (
          <p style={{ color: "#C97A5A", gridColumn: "1 / -1", fontSize: 13 }}>{error}</p>
        )}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn-gold" disabled={saving}>
            {saving ? "بيتحفظ..." : form.id ? "تحديث المنتج" : "إضافة المنتج"}
          </button>
          {form.id && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setForm(emptyForm)}
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>بيتحمل...</p>
      ) : products.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>لسه مفيش منتجات مضافة.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "14px 18px",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <b>{p.name}</b>
                <span style={{ color: "var(--muted)", fontSize: 13, marginRight: 10 }}>
                  {p.category}
                </span>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {p.offer_price ? (
                    <>
                      <span style={{ textDecoration: "line-through", color: "var(--muted)" }}>
                        {p.price} ج.م
                      </span>{" "}
                      <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>
                        {p.offer_price} ج.م (عرض)
                      </span>
                    </>
                  ) : (
                    <span>{p.price} ج.م</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => startEdit(p)}>تعديل</button>
                <button
                  className="btn btn-ghost"
                  style={{ color: "#C97A5A" }}
                  onClick={() => handleDelete(p.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
