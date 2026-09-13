"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

type Product = {
  id: string;
  category: string;
  name: string;
  price: number;
  offer_price: number | null;
  image_urls: string[] | null;
};

const emptyForm = {
  id: "",
  category: CATEGORIES[0],
  name: "",
  price: "",
  offer_price: "",
  image_urls: [] as string[],
};

function discountPercent(price: number, offer: number) {
  if (!price || !offer || offer >= price) return 0;
  return Math.round((1 - offer / price) * 100);
}

export default function ProductForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
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
      image_urls: p.image_urls || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImg(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/product-images", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) uploaded.push(data.url);
      }
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }));
    } catch {
      setError("فشل رفع بعض الصور");
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((u) => u !== url) }));
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
          image_urls: form.image_urls,
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
        الصور دي منفصلة عن جاليري "شغلنا" — ارفع أكتر من صورة للمنتج والعميل
        هيقدر يقلب بينهم. نسبة الخصم بتتحسب تلقائي لو حطيت سعر عرض.
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
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>اسم المنتج</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>السعر</label>
          <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="field">
          <label>سعر العرض (اختياري)</label>
          <input
            type="number"
            value={form.offer_price}
            onChange={(e) => setForm({ ...form, offer_price: e.target.value })}
            placeholder="سيبه فاضي لو مفيش عرض"
          />
          {form.price && form.offer_price && discountPercent(parseFloat(form.price), parseFloat(form.offer_price)) > 0 && (
            <p style={{ fontSize: 12, color: "var(--gold-bright)", marginTop: 6 }}>
              خصم {discountPercent(parseFloat(form.price), parseFloat(form.offer_price))}%
            </p>
          )}
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>صور المنتج (تقدر تختار أكتر من صورة)</label>
          <input type="file" accept="image/*" multiple onChange={handleImagesSelected} disabled={uploadingImg} />
          {uploadingImg && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>بيترفعوا...</p>}
          {form.image_urls.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {form.image_urls.map((url) => (
                <div key={url} style={{ position: "relative", width: 70, height: 70 }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    style={{
                      position: "absolute", top: -6, left: -6, background: "#C97A5A", color: "#fff",
                      borderRadius: "50%", width: 20, height: 20, fontSize: 12, lineHeight: "20px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: "#C97A5A", gridColumn: "1 / -1", fontSize: 13 }}>{error}</p>}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn-gold" disabled={saving}>
            {saving ? "بيتحفظ..." : form.id ? "تحديث المنتج" : "إضافة المنتج"}
          </button>
          {form.id && (
            <button type="button" className="btn btn-ghost" onClick={() => setForm(emptyForm)}>
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
          {products.map((p) => {
            const disc = p.offer_price ? discountPercent(p.price, p.offer_price) : 0;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: "1px solid var(--line)", borderRadius: 4, padding: "14px 18px",
                  flexWrap: "wrap", gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {p.image_urls?.[0] && (
                    <img src={p.image_urls[0]} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 4 }} />
                  )}
                  <div>
                    <b>{p.name}</b>
                    <span style={{ color: "var(--muted)", fontSize: 13, marginRight: 10 }}>{p.category}</span>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {p.offer_price ? (
                        <>
                          <span style={{ textDecoration: "line-through", color: "var(--muted)" }}>{p.price} ج.م</span>{" "}
                          <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>
                            {p.offer_price} ج.م {disc > 0 && `(خصم ${disc}%)`}
                          </span>
                        </>
                      ) : (
                        <span>{p.price} ج.م</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => startEdit(p)}>تعديل</button>
                  <button className="btn btn-ghost" style={{ color: "#C97A5A" }} onClick={() => handleDelete(p.id)}>حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
