import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, room_type, preferred_date, notes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "الاسم ورقم الموبايل مطلوبين" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert([
        {
          name,
          phone,
          room_type: room_type || null,
          preferred_date: preferred_date || null,
          notes: notes || null,
          status: "جديد",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "فشل حفظ الحجز" }, { status: 500 });
    }

    // إرسال إشعار بالإيميل - لو Resend مش متظبط، الحجز اتحفظ برضه
    // في الداتابيز، وبس الإيميل مش هيتبعت.
    if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFY_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "AKHSHAB Website <onboarding@resend.dev>",
          to: process.env.ADMIN_NOTIFY_EMAIL,
          subject: `حجز جديد من ${name}`,
          html: `
            <div style="font-family: sans-serif; direction: rtl; text-align: right;">
              <h2>حجز استشارة جديد</h2>
              <p><b>الاسم:</b> ${name}</p>
              <p><b>الموبايل:</b> ${phone}</p>
              <p><b>نوع الأثاث:</b> ${room_type || "-"}</p>
              <p><b>التاريخ المفضل:</b> ${preferred_date || "-"}</p>
              <p><b>ملاحظات:</b> ${notes || "-"}</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Resend email error:", emailErr);
        // الحجز محفوظ، بس الإيميل فشل - مش بنفشل الطلب كله عشان كده
      }
    }

    return NextResponse.json({ ok: true, booking: data });
  } catch (err) {
    console.error("Booking route error:", err);
    return NextResponse.json({ error: "حصل خطأ غير متوقع" }, { status: 500 });
  }
}
