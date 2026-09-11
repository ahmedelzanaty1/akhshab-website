import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, GALLERY_BUCKET } from "@/lib/supabaseAdmin";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  const { error } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Gallery upload error:", error);
    return NextResponse.json({ error: "فشل الرفع" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, fileName });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "اسم الملف مطلوب" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.storage.from(GALLERY_BUCKET).remove([name]);
  if (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
