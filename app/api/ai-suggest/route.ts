import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": "AKHSHAB",
  },
});

function fallbackSuggestions(room: string, style: string) {
  return [
    {
      title: `ركن ${room} بهوية أخشاب`,
      description: `تصميم ${style} بيعتمد على خشب طبيعي مع لمسات نحاسية خفيفة تناسب هوية البراند.`,
      materials: ["خشب زان", "تشطيب مطفي", "مقابض نحاس"],
    },
    {
      title: "إضاءة مدمجة بالتفصيل",
      description: "إضاءة LED مخفية داخل التشطيبات الخشبية تدي إحساس دافئ ليلاً.",
      materials: ["LED دافئ", "قواطع خشبية", "تحكم بالديمر"],
    },
    {
      title: "تخزين ذكي بدون ازدحام",
      description: "وحدات تخزين مدمجة بتصميم نضيف يخلي المساحة مرتبة من غير ما تفقد شكلها الفاخر.",
      materials: ["أدراج بمجرى صامت", "قشرة خشب طبيعي"],
    },
  ];
}

export async function POST(req: NextRequest) {
  const { room, style, notes } = await req.json();

  const prompt = `أنت مساعد تصميم داخلي لعلامة أثاث فاخرة اسمها "أخشاب" (AKHSHAB). هوية البراند: ألوان بنية خشبية دافئة غامقة مع لمسات ذهبية/نحاسية، خامات خشب طبيعي فاخر، تركيز على التفاصيل الدقيقة. المطلوب: اقترح 3 أفكار تصميم لمساحة "${room}" بستايل "${style}". ${
    notes ? "ملاحظات العميل: " + notes : ""
  } رجّع فقط JSON array بدون أي نص إضافي وبدون markdown، بالشكل التالي بالظبط: [{"title":"عنوان قصير","description":"وصف من سطرين بالعربي المصري","materials":["خامة1","خامة2","خامة3"]}]`;

  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("no api key");

    const completion = await openrouter.chat.completions.create({
      model: "openrouter/free",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(clean);

    return NextResponse.json({ suggestions, source: "ai" });
  } catch (err) {
    console.error("AI suggest error:", err);
    return NextResponse.json({
      suggestions: fallbackSuggestions(room, style),
      source: "fallback",
    });
  }
}
