import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminAuthed } from "@/lib/adminAuth";

export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 5);

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "فشل التنظيف" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: data?.length || 0 });
}
