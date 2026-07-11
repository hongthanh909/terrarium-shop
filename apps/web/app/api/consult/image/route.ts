import { NextResponse } from "next/server";
import { completeVisionFromOpenAI } from "@/lib/ai/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "user" | "assistant";

type SafeHistoryItem = {
  role: ChatRole;
  content: string;
};

const WINDOW_MS = Number(process.env.CHAT_IMAGE_RATE_WINDOW_MINUTES || 10) * 60_000;
const MAX_REQUESTS = Number(process.env.CHAT_IMAGE_RATE_LIMIT || 5);
const MAX_IMAGE_MB = Number(process.env.CHAT_IMAGE_MAX_MB || 5);
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 400;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

function getSafeHistory(history: unknown): SafeHistoryItem[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item): item is { role: string; content: string } => {
      return (
        item &&
        typeof item === "object" &&
        typeof (item as { role?: unknown }).role === "string" &&
        typeof (item as { content?: unknown }).content === "string"
      );
    })
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" as const : "user" as const,
      content: item.content.slice(0, 700),
    }))
    .slice(-6);
}

function parseImageDataUrl(value: unknown): { mime: string; bytes: number } | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return null;

  const base64 = match[2];
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes <= 0 || bytes > MAX_IMAGE_BYTES) return null;

  return { mime: match[1], bytes };
}

function normalizeMessage(message: unknown): string {
  if (typeof message !== "string") return "";
  return message.trim().slice(0, MAX_MESSAGE_LENGTH);
}

function buildVisionPrompt(): string {
  return `Ban la "Reu", tro ly tu van cham soc terrarium cua Tiem Reu Decor.
Nhiem vu: quan sat anh be/cay/reu/terrarium va cau hoi cua khach de tu van cach cham soc thuc te.

Quy tac bat buoc:
- Tra loi bang tieng Viet, xung "em", goi khach "anh/chi".
- Chi nhan xet nhung gi co the thay tu anh hoac khach mo ta; khong khang dinh 100% neu anh chua ro.
- Neu anh mo, qua toi, qua xa, bi che khuat, hay noi ro can anh gan hon/sang hon/goc khac.
- Uu tien cau truc: tinh trang co the la gi -> nguyen nhan kha di -> cach xu ly -> cach theo doi.
- Voi reu/cay: chu y mau sac, do uot/kho, nam moc, la heo/vang/ru, dau hieu ung/thoi, anh sang va do thong khi.
- Voi be kin: chu y dong suong, do am, mo nap/thong khi, tranh nang truc tiep.
- Voi be mo/sen da/xuong rong: chu y thoat nuoc, dat kho, anh sang va tan suat tuoi.
- Khong tu noi gia, ton kho, bao hanh, doi tra, phi ship, thanh toan, tracking hoac cam ket cua shop.
- Khong cam ket cay/reu chac chan hoi phuc.
- Neu tinh trang nang hoac can xac minh, khuyen khach gui them anh/video ro hon qua Fanpage tiemreudecor.
- Cau tra loi nen gon, cu the, uu tien bullet/so buoc khi can.`;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          response: "Da anh/chi dang gui anh hoi nhanh qua. Vui long doi mot chut roi gui lai de Reu phan tich chinh xac hon a.",
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const imageInfo = parseImageDataUrl(body?.imageDataUrl);
    if (!imageInfo) {
      return NextResponse.json(
        {
          response: `Anh khong hop le hoac vuot qua gioi han ${MAX_IMAGE_MB}MB. Anh/chi chon anh JPG, PNG hoac WebP ro hon giup Reu nhe.`,
        },
        { status: 400 }
      );
    }

    const message = normalizeMessage(body?.message) || "Anh/chi xem giup tinh trang be/cay/reu trong anh va tu van cach cham soc.";
    const history = getSafeHistory(body?.history);
    const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || process.env.OPENAI_CARE_MODEL || "gpt-5-mini";

    console.log(`[CONSULT_IMAGE] ${imageInfo.mime}, ${imageInfo.bytes} bytes, model=${model}, ip=${ip}`);

    const answer = await completeVisionFromOpenAI({
      systemPrompt: buildVisionPrompt(),
      message,
      imageDataUrl: body.imageDataUrl,
      history,
      model,
      maxOutputTokens: 1200,
    });

    if (!answer?.text) {
      return NextResponse.json({
        response: "Da phan tich anh bang AI dang tam thoi chua phan hoi duoc. Anh/chi thu lai sau it phut hoac gui anh qua Fanpage tiemreudecor neu can shop kiem tra ngay a.",
        source: "fallback",
        imageAnalysis: true,
      });
    }

    console.log(`[CONSULT_IMAGE] success model=${model}, usage=${JSON.stringify(answer.usage || {})}`);

    return NextResponse.json({
      response: answer.text,
      source: "ai_vision",
      imageAnalysis: true,
    });
  } catch (error) {
    console.error("Consult image API error:", error);
    return NextResponse.json(
      { response: "Xin loi, he thong phan tich anh dang gap su co. Vui long thu lai sau!" },
      { status: 500 }
    );
  }
}
