import { NextRequest, NextResponse } from "next/server";

const IMG_COOKIE = "akhshab_img_gen_count";
const MAX_PER_SESSION = 2;

export async function POST(req: NextRequest) {
  const currentCount = parseInt(req.cookies.get(IMG_COOKIE)?.value || "0", 10);

  if (currentCount >= MAX_PER_SESSION) {
    return NextResponse.json(
      { error: `خلصت عدد المحاولات المتاحة لتوليد الصور في الجلسة دي (${MAX_PER_SESSION}).` },
      { status: 429 }
    );
  }

  const { room, style, notes } = await req.json();
  const prompt = `Luxury interior design photo of a ${room}, ${style} style, warm dark wood tones with brass and gold accents, natural wood grain furniture, professional architectural photography, warm ambient lighting, brand identity: AKHSHAB wood designs. ${notes || ""}`;

  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("no api key");

    const res = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-image",
        prompt,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter image error:", res.status, errText);
      throw new Error("openrouter error");
    }

    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error("no image in response");

    const newCount = currentCount + 1;
    const response = NextResponse.json({
      image: `data:image/png;base64,${b64}`,
      remaining: MAX_PER_SESSION - newCount,
    });
    // كوكي جلسة (من غير maxAge) - بيتمسح لما المستخدم يقفل المتصفح
    response.cookies.set(IMG_COOKIE, String(newCount), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: "معرفناش نولّد الصورة دلوقتي، جرب تاني كمان شوية." },
      { status: 500 }
    );
  }
}
