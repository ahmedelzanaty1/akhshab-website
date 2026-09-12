import { NextResponse } from "next/server";
import { supabaseAdmin, GALLERY_BUCKET } from "@/lib/supabaseAdmin";

const categoryFolders: Record<string, string> = {
  bedroom: "غرفة نوم",
  office: "مكتب",
  salon: "صالون",
  dining: "غرفة سفرة",
  doors: "أبواب",
  general: "عام",
};

const UNCATEGORIZED = "عام";

export const revalidate = 0; // إلغاء الـ cache للتأكد من رؤية الصور فور رفعها

export async function GET() {
  try {
    const folders = Object.entries(categoryFolders);

    const folderPromises = folders.map(async ([folder, displayCategory]) => {
      const { data, error } = await supabaseAdmin.storage
        .from(GALLERY_BUCKET)
        .list(folder, { sortBy: { column: "created_at", order: "desc" } });

      if (error || !data) return [];

      return data
        .filter((f) => f.id)
        .map((f) => {
          const path = `${folder}/${f.name}`;
          const { data: pub } = supabaseAdmin.storage
            .from(GALLERY_BUCKET)
            .getPublicUrl(path);

          return {
            name: path,
            url: pub.publicUrl,
            category: displayCategory,
          };
        });
    });

    const rootPromise = (async () => {
      const { data, error } = await supabaseAdmin.storage
        .from(GALLERY_BUCKET)
        .list("", { sortBy: { column: "created_at", order: "desc" } });

      if (error || !data) return [];

      return data
        .filter((f) => f.id)
        .map((f) => {
          const { data: pub } = supabaseAdmin.storage
            .from(GALLERY_BUCKET)
            .getPublicUrl(f.name);

          return {
            name: f.name,
            url: pub.publicUrl,
            category: UNCATEGORIZED,
          };
        });
    })();

    const results = await Promise.all([...folderPromises, rootPromise]);
    const images = results.flat();

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Gallery fetch error:", err);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}