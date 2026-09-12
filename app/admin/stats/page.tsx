import { isAdminAuthed } from "@/lib/adminAuth";
import LoginForm from "@/components/LoginForm";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function weekBuckets(bookings: { created_at: string }[]) {
  const weeks: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7 - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const count = bookings.filter((b) => {
      const d = new Date(b.created_at);
      return d >= start && d < end;
    }).length;
    weeks.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, count });
  }
  return weeks;
}

function BarChart({ data, max }: { data: { label: string; count: number }[]; max: number }) {
  const safeMax = max || 1;
  return (
    <svg viewBox="0 0 400 140" style={{ width: "100%", height: 160 }}>
      {data.map((d, i) => {
        const barW = 400 / data.length - 10;
        const x = i * (400 / data.length) + 5;
        const h = (d.count / safeMax) * 100;
        const y = 110 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill="var(--gold)" rx="2" />
            <text x={x + barW / 2} y={128} fontSize="9" fill="var(--muted)" textAnchor="middle">
              {d.label}
            </text>
            <text x={x + barW / 2} y={y - 4} fontSize="10" fill="var(--cream-dim)" textAnchor="middle">
              {d.count || ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function AdminStatsPage() {
  const authed = await isAdminAuthed();
  if (!authed) return <LoginForm />;

  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("created_at, room_type");
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, offer_price");

  const allBookings = bookings || [];
  const allProducts = products || [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const bookingsThisMonth = allBookings.filter(
    (b) => new Date(b.created_at) >= startOfMonth
  ).length;

  const roomCounts: Record<string, number> = {};
  allBookings.forEach((b) => {
    const key = b.room_type || "غير محدد";
    roomCounts[key] = (roomCounts[key] || 0) + 1;
  });
  const roomEntries = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]);
  const maxRoomCount = Math.max(1, ...roomEntries.map(([, c]) => c));

  const weekly = weekBuckets(allBookings);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.count));

  const offersCount = allProducts.filter((p) => p.offer_price).length;

  return (
    <div className="wrap" style={{ paddingTop: 150, paddingBottom: 100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
        <h2 style={{ fontFamily: "Cairo, sans-serif", fontSize: 28 }}>إحصائيات الموقع</h2>
        <a href="/admin" style={{ fontSize: 13, color: "var(--gold-bright)" }}>← رجوع للحجوزات</a>
      </div>

      <div className="stat-row" style={{ marginBottom: 50 }}>
        <div className="stat">
          <div className="num">{allBookings.length}</div>
          <div className="label">إجمالي الحجوزات</div>
        </div>
        <div className="stat">
          <div className="num">{bookingsThisMonth}</div>
          <div className="label">حجوزات الشهر ده</div>
        </div>
        <div className="stat">
          <div className="num">{allProducts.length}</div>
          <div className="label">منتج مضاف</div>
        </div>
        <div className="stat">
          <div className="num">{offersCount}</div>
          <div className="label">منتج عليه عرض دلوقتي</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 40, marginBottom: 20 }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6, padding: 26 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, color: "var(--cream-dim)", fontWeight: 600 }}>
            الحجوزات آخر 8 أسابيع
          </h3>
          <BarChart data={weekly} max={maxWeekly} />
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6, padding: 26 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, color: "var(--cream-dim)", fontWeight: 600 }}>
            الحجوزات حسب نوع الأثاث
          </h3>
          {roomEntries.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>لسه مفيش بيانات</p>}
          {roomEntries.map(([room, count]) => (
            <div key={room} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                <span>{room}</span>
                <span style={{ color: "var(--muted)" }}>{count}</span>
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 3, height: 8 }}>
                <div
                  style={{
                    width: `${(count / maxRoomCount) * 100}%`,
                    background: "var(--gold)",
                    height: 8,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
