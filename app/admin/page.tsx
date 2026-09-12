import { isAdminAuthed } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import LoginForm from "@/components/LoginForm";
import CleanupButton from "@/components/CleanupButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  if (!authed) return <LoginForm />;

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="wrap" style={{ paddingTop: 150, paddingBottom: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "Cairo, sans-serif", fontSize: 28 }}>الحجوزات</h2>
          <p style={{ color: "var(--cream-dim)", marginTop: 6 }}>
            كل طلبات المعاينة اللي جاية من الموقع
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/admin/stats" className="btn btn-ghost">الإحصائيات</a>
          <a href="/admin/products" className="btn btn-ghost">المنتجات</a>
          <a href="/admin/gallery" className="btn btn-ghost">صور الجاليري</a>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <CleanupButton />
      </div>

      {error && <p style={{ color: "#C97A5A" }}>حصل خطأ في تحميل الحجوزات: {error.message}</p>}

      {!error && (!bookings || bookings.length === 0) && (
        <p style={{ color: "var(--muted)" }}>لسه مفيش حجوزات.</p>
      )}

      {bookings && bookings.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "right" }}>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>الاسم</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>الموبايل</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>نوع الأثاث</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>التاريخ المفضل</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>أفضل تواصل</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>ملاحظات</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>الحالة</th>
                <th style={{ padding: "12px 10px", color: "var(--muted)" }}>تاريخ الطلب</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 10px" }}>{b.name}</td>
                  <td style={{ padding: "12px 10px" }} dir="ltr">{b.phone}</td>
                  <td style={{ padding: "12px 10px" }}>{b.room_type || "-"}</td>
                  <td style={{ padding: "12px 10px" }}>{b.preferred_date || "-"}</td>
                  <td style={{ padding: "12px 10px" }}>{b.contact_method || "-"}</td>
                  <td style={{ padding: "12px 10px", maxWidth: 220 }}>{b.notes || "-"}</td>
                  <td style={{ padding: "12px 10px" }}>{b.status || "جديد"}</td>
                  <td style={{ padding: "12px 10px", color: "var(--muted)" }}>
                    {new Date(b.created_at).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
