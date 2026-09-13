import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { category, name, price, offer_price, image_urls } = body;

  if (!category || !name || !price) {
    return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert([
      {
        category,
        name,
        price,
        offer_price: offer_price || null,
        image_urls: image_urls && image_urls.length ? image_urls : null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "فشل إضافة المنتج" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, product: data });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { id, category, name, price, offer_price, image_urls } = body;
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      category,
      name,
      price,
      offer_price: offer_price || null,
      image_urls: image_urls && image_urls.length ? image_urls : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "فشل تعديل المنتج" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, product: data });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "فشل حذف المنتج" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
