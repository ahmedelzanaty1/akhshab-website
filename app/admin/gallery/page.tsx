import { isAdminAuthed } from "@/lib/adminAuth";
import LoginForm from "@/components/LoginForm";
import GalleryManager from "@/components/GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const authed = await isAdminAuthed();
  if (!authed) return <LoginForm />;

  return (
    <>
      <div className="wrap" style={{ paddingTop: 30 }}>
        <a href="/admin" style={{ fontSize: 13, color: "var(--gold-bright)" }}>
          ← رجوع للحجوزات
        </a>
      </div>
      <GalleryManager />
    </>
  );
}
