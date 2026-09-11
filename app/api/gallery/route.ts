import { NextResponse } from "next/server";
import { supabaseAdmin, GALLERY_BUCKET } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .list("", { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    console.error("Gallery list error:", error);
    return NextResponse.json({ images: [] });
  }

  const images = (data || [])
    .filter((f) => f.name && !f.name.startsWith("."))
    .map((f) => {
      const { data: pub } = supabaseAdmin.storage
        .from(GALLERY_BUCKET)
        .getPublicUrl(f.name);
      return { name: f.name, url: pub.publicUrl };
    });

  return NextResponse.json({ images });
}
