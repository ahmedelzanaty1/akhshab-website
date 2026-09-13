import { NextRequest, NextResponse } from "next/server";

const IMG_COOKIE = "akhshab_img_gen_count";
const MAX_PER_SESSION = 2;
const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export const maxDuration = 30;

function buildPrompt(room: string, style: string, notes: string) {
  return `Professional interior design photo of a ${room}, ${style} style. Warm dark wood tones with brass and gold accents, natural wood grain furniture, elegant minimal-luxury composition, soft warm ambient lighting, high-end architectural photography. Brand aesthetic: AKHSHAB wood designs. ${notes || ""}`;
}

async function generateViaCloudflare(
  prompt: string
): Promise<{ image: string | null; quotaExhausted: boolean }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return { image: null, quotaExhausted: false };

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        // steps=4 هو الافتراضي والأرخص للموديل ده - بنسيبه كدا عمدًا
        // عشان نحافظ على الرصيد المجاني اليومي (10,000 neuron/يوم) قد ما نقدر.
        body: JSON.stringify({ prompt, steps: 4 }),
      }
    );

    if (res.status === 429) {
      // خلص الرصيد المجاني اليومي بتاع Cloudflare
      return { image: null, quotaExhausted: true };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Cloudflare Workers AI error:", res.status, errText);
      // بعض أخطاء Cloudflare بترجع 200 مع success:false وكود خطأ بيدل
      // على انتهاء الحصة كمان - بنتحقق من النص لو فيه إشارة لكدا
      const quotaLike = /quota|limit|rate/i.test(errText);
      return { image: null, quotaExhausted: quotaLike };
    }

    const data = await res.json();
    if (!data?.success || !data?.result?.image) {
      const quotaLike = JSON.stringify(data?.errors || "").match(/quota|limit|rate/i);
      return { image: null, quotaExhausted: !!quotaLike };
    }

    return { image: `data:image/jpeg;base64,${data.result.image}`, quotaExhausted: false };
  } catch (err) {
    console.error("Cloudflare Workers AI unreachable:", err);
    return { image: null, quotaExhausted: false };
  }
}

export async function POST(req: NextRequest) {
  const currentCount = parseInt(req.cookies.get(IMG_COOKIE)?.value || "0", 10);

  if (currentCount >= MAX_PER_SESSION) {
    return NextResponse.json(
      { error: `خلصت عدد المحاولات المتاحة لتوليد الصور في الجلسة دي (${MAX_PER_SESSION}).` },
      { status: 429 }
    );
  }

  const { room, style, notes } = await req.json();
  const prompt = buildPrompt(room, style, notes);

  const { image, quotaExhausted } = await generateViaCloudflare(prompt);

  if (!image) {
    const message = quotaExhausted
      ? "معرفناش نعمل صور دلوقتي، جرب تاني بكرا. آسفين! 🙏"
      : "معرفناش نولّد الصورة دلوقتي، جرب تاني كمان شوية.";
    return NextResponse.json({ error: message }, { status: quotaExhausted ? 429 : 500 });
  }

  const newCount = currentCount + 1;
  const response = NextResponse.json({
    image,
    remaining: MAX_PER_SESSION - newCount,
  });
  response.cookies.set(IMG_COOKIE, String(newCount), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
