import { isAdminAuthed } from "@/lib/adminAuth";
import LoginForm from "@/components/LoginForm";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const authed = await isAdminAuthed();
  if (!authed) return <LoginForm />;

  return (
    <>
      <div className="wrap" style={{ paddingTop: 30 }}>
        <a href="/admin" style={{ fontSize: 13, color: "var(--gold-bright)" }}>
          ← رجوع للحجوزات
        </a>
      </div>
      <ProductForm />
    </>
  );
}
