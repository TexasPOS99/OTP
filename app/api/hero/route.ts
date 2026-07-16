import { NextRequest, NextResponse } from "next/server";

const ALLOWED_SERVICES = new Set(["ka", "jg"]);
const ALLOWED_COUNTRIES = new Set(["52","6","7","10","4","3","5","24","25","22","55","14","20","12","36","16","43","78","86","56","48","15","63","46","50","83","32","62","2","40","0","1","73","39","54","33","65","93","21","19","38","8","31","53","95","100","111","13","68","175"]);
const STATUS_MESSAGES: Record<string, string> = {
  STATUS_WAIT_CODE: "กำลังรอ OTP…",
  STATUS_WAIT_RETRY: "กำลังรอให้ส่ง OTP อีกครั้ง…",
  STATUS_WAIT_RESEND: "กดส่งรหัสซ้ำในแอปต้นทางได้เลย",
  STATUS_CANCEL: "หมายเลขนี้ถูกยกเลิกแล้ว",
};
const ERRORS: Record<string, string> = {
  NO_NUMBERS: "ไม่มีหมายเลขสำหรับตัวเลือกนี้ ลองประเทศอื่น",
  NO_BALANCE: "ยอดเงิน HeroSMS ไม่เพียงพอ",
  BAD_KEY: "API key ใช้งานไม่ได้ กรุณาสร้างคีย์ใหม่",
  ERROR_SQL: "HeroSMS ขัดข้องชั่วคราว กรุณาลองใหม่",
  BAD_SERVICE: "ไม่พบบริการนี้",
  EARLY_CANCEL_DENIED: "HeroSMS ยังไม่อนุญาตให้ยกเลิกเบอร์นี้ กรุณารออีกเล็กน้อยแล้วลองใหม่",
  BAD_STATUS: "ยังเปลี่ยนสถานะรายการนี้ไม่ได้ กรุณาลองใหม่",
};

function config() {
  const key = process.env.HERO_SMS_API_KEY;
  const base = process.env.HERO_SMS_API_BASE || "https://hero-sms.com/stubs/handler_api.php";
  if (!key) throw new Error("ยังไม่ได้ตั้งค่า HeroSMS API key");
  return { key, base };
}

async function hero(action: string, extra: Record<string, string> = {}) {
  const { key, base } = config();
  const url = new URL(base);
  url.searchParams.set("api_key", key);
  url.searchParams.set("action", action);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  const text = (await res.text()).trim();
  if (!res.ok) throw new Error(`HeroSMS ตอบกลับผิดปกติ (${res.status})`);
  return text;
}

function safeChoice(service: string | null, country: string | null) {
  if (!service || !ALLOWED_SERVICES.has(service)) throw new Error("กรุณาเลือกแอปใหม่");
  if (!country || !ALLOWED_COUNTRIES.has(country)) throw new Error("กรุณาเลือกประเทศใหม่");
  return { service, country };
}

function friendly(raw: string) {
  const key = raw.split(":")[0];
  return ERRORS[key] || STATUS_MESSAGES[key] || raw || "HeroSMS ไม่ตอบกลับ";
}

export async function GET(req: NextRequest) {
  try {
    const op = req.nextUrl.searchParams.get("op");
    if (op === "balance") {
      const raw = await hero("getBalance");
      if (!raw.startsWith("ACCESS_BALANCE:")) throw new Error(friendly(raw));
      return NextResponse.json({ ok: true, balance: Number(raw.split(":")[1]) });
    }
    if (op === "quote") {
      const { service, country } = safeChoice(req.nextUrl.searchParams.get("service"), req.nextUrl.searchParams.get("country"));
      const raw = await hero("getPrices", { service, country });
      const data = JSON.parse(raw);
      const item = data?.[country]?.[service] ?? data?.[service] ?? null;
      return NextResponse.json({ ok: true, cost: item?.cost ?? null, count: item?.count ?? 0 });
    }
    if (op === "status") {
      const id = req.nextUrl.searchParams.get("id");
      if (!id || !/^\d+$/.test(id)) throw new Error("เลขรายการไม่ถูกต้อง");
      const raw = await hero("getStatus", { id });
      if (raw.startsWith("STATUS_OK:")) return NextResponse.json({ ok: true, code: raw.slice(10), message: "ได้รับ OTP แล้ว" });
      return NextResponse.json({ ok: true, code: null, message: friendly(raw), raw: raw.split(":")[0] });
    }
    throw new Error("คำขอไม่ถูกต้อง");
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    if (body.op === "buy") {
      const { service, country } = safeChoice(body.service, body.country);
      const maxPrice = Number(body.maxPrice);
      if (!Number.isFinite(maxPrice) || maxPrice <= 0 || maxPrice > 100) throw new Error("ราคาที่เลือกไม่ถูกต้อง");
      const raw = await hero("getNumberV2", { service, country, maxPrice: maxPrice.toFixed(2) });
      if (raw.startsWith("{")) {
        const data = JSON.parse(raw);
        return NextResponse.json({ ok: true, id: data.activationId ?? data.id, phone: data.phoneNumber ?? data.number });
      }
      if (raw.startsWith("ACCESS_NUMBER:")) {
        const [, id, phone] = raw.split(":");
        return NextResponse.json({ ok: true, id, phone });
      }
      throw new Error(friendly(raw));
    }
    if (body.op === "status") {
      if (!body.id || !/^\d+$/.test(body.id)) throw new Error("เลขรายการไม่ถูกต้อง");
      const values = { again: "3", finish: "6", cancel: "8" } as const;
      const action = body.action as keyof typeof values;
      if (!values[action]) throw new Error("คำสั่งไม่ถูกต้อง");
      const raw = await hero("setStatus", { id: body.id, status: values[action] });
      if (!raw.startsWith("ACCESS_")) throw new Error(friendly(raw));
      return NextResponse.json({ ok: true, result: raw });
    }
    throw new Error("คำขอไม่ถูกต้อง");
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}
