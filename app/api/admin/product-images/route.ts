import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, GALLERY_BUCKET } from "@/lib/supabaseAdmin";
import { isAdminAuthed } from "@/lib/adminAuth";

// صور المنتجات بتتخزن في نفس الـ bucket بس في فولدر "products/"
// اللي مش بيتقرا في /api/gallery (المخصص لصور الكاتيجوريز بس)،
// فمش هتظهر في جاليري "شغلنا" في الصفحة الرئيسية.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
  }

  const safeFileName = file.name
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "-")
    .replace(/-+/g, "-");
  const filePath = `products/${Date.now()}-${safeFileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Product image upload error:", error);
    return NextResponse.json({ error: "فشل رفع الصورة" }, { status: 500 });
  }

  const { data: pub } = supabaseAdmin.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);
  return NextResponse.json({ ok: true, url: pub.publicUrl, path: filePath });
}
