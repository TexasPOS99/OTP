"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Service = "ka" | "jg";
type Order = { id: string; phone: string; service: Service; country: string; createdAt: number };
type Country = { id: string; name: string; en: string; flag: string };

const SERVICES = {
  ka: { name: "Shopee", mark: "S", color: "shopee", hint: "รับรหัสยืนยันสำหรับ Shopee" },
  jg: { name: "Grab", mark: "G", color: "grab", hint: "รับรหัสยืนยันสำหรับ Grab" },
} as const;

const COUNTRIES: Country[] = [
  { id:"52", name:"ไทย", en:"Thailand", flag:"🇹🇭" }, { id:"6", name:"อินโดนีเซีย", en:"Indonesia", flag:"🇮🇩" },
  { id:"7", name:"มาเลเซีย", en:"Malaysia", flag:"🇲🇾" }, { id:"10", name:"เวียดนาม", en:"Vietnam", flag:"🇻🇳" },
  { id:"4", name:"ฟิลิปปินส์", en:"Philippines", flag:"🇵🇭" }, { id:"3", name:"จีน", en:"China", flag:"🇨🇳" },
  { id:"5", name:"เมียนมา", en:"Myanmar", flag:"🇲🇲" }, { id:"24", name:"กัมพูชา", en:"Cambodia", flag:"🇰🇭" },
  { id:"25", name:"ลาว", en:"Laos", flag:"🇱🇦" }, { id:"22", name:"อินเดีย", en:"India", flag:"🇮🇳" },
  { id:"55", name:"ไต้หวัน", en:"Taiwan", flag:"🇹🇼" }, { id:"14", name:"ฮ่องกง", en:"Hong Kong", flag:"🇭🇰" },
  { id:"20", name:"มาเก๊า", en:"Macao", flag:"🇲🇴" }, { id:"12", name:"สหรัฐอเมริกา", en:"United States USA", flag:"🇺🇸" },
  { id:"36", name:"แคนาดา", en:"Canada", flag:"🇨🇦" }, { id:"16", name:"สหราชอาณาจักร", en:"United Kingdom UK", flag:"🇬🇧" },
  { id:"43", name:"เยอรมนี", en:"Germany", flag:"🇩🇪" }, { id:"78", name:"ฝรั่งเศส", en:"France", flag:"🇫🇷" },
  { id:"86", name:"อิตาลี", en:"Italy", flag:"🇮🇹" }, { id:"56", name:"สเปน", en:"Spain", flag:"🇪🇸" },
  { id:"48", name:"เนเธอร์แลนด์", en:"Netherlands", flag:"🇳🇱" }, { id:"15", name:"โปแลนด์", en:"Poland", flag:"🇵🇱" },
  { id:"63", name:"เช็ก", en:"Czech Republic", flag:"🇨🇿" }, { id:"46", name:"สวีเดน", en:"Sweden", flag:"🇸🇪" },
  { id:"50", name:"ออสเตรีย", en:"Austria", flag:"🇦🇹" }, { id:"83", name:"บัลแกเรีย", en:"Bulgaria", flag:"🇧🇬" },
  { id:"32", name:"โรมาเนีย", en:"Romania", flag:"🇷🇴" }, { id:"62", name:"ตุรกี", en:"Turkey", flag:"🇹🇷" },
  { id:"2", name:"คาซัคสถาน", en:"Kazakhstan", flag:"🇰🇿" }, { id:"40", name:"อุซเบกิสถาน", en:"Uzbekistan", flag:"🇺🇿" },
  { id:"0", name:"รัสเซีย", en:"Russia", flag:"🇷🇺" }, { id:"1", name:"ยูเครน", en:"Ukraine", flag:"🇺🇦" },
  { id:"73", name:"บราซิล", en:"Brazil", flag:"🇧🇷" }, { id:"39", name:"อาร์เจนตินา", en:"Argentina", flag:"🇦🇷" },
  { id:"54", name:"เม็กซิโก", en:"Mexico", flag:"🇲🇽" }, { id:"33", name:"โคลอมเบีย", en:"Colombia", flag:"🇨🇴" },
  { id:"65", name:"เปรู", en:"Peru", flag:"🇵🇪" }, { id:"93", name:"คอสตาริกา", en:"Costa Rica", flag:"🇨🇷" },
  { id:"21", name:"อียิปต์", en:"Egypt", flag:"🇪🇬" }, { id:"19", name:"ไนจีเรีย", en:"Nigeria", flag:"🇳🇬" },
  { id:"38", name:"กานา", en:"Ghana", flag:"🇬🇭" }, { id:"8", name:"เคนยา", en:"Kenya", flag:"🇰🇪" },
  { id:"31", name:"แอฟริกาใต้", en:"South Africa", flag:"🇿🇦" }, { id:"53", name:"ซาอุดีอาระเบีย", en:"Saudi Arabia", flag:"🇸🇦" },
  { id:"95", name:"สหรัฐอาหรับเอมิเรตส์", en:"United Arab Emirates UAE", flag:"🇦🇪" }, { id:"100", name:"คูเวต", en:"Kuwait", flag:"🇰🇼" },
  { id:"111", name:"กาตาร์", en:"Qatar", flag:"🇶🇦" }, { id:"13", name:"อิสราเอล", en:"Israel", flag:"🇮🇱" },
  { id:"68", name:"นิวซีแลนด์", en:"New Zealand", flag:"🇳🇿" }, { id:"175", name:"ออสเตรเลีย", en:"Australia", flag:"🇦🇺" },
];

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

export default function Home() {
  const [service, setService] = useState<Service>("ka");
  const [country, setCountry] = useState("52");
  const [balance, setBalance] = useState<number | null>(null);
  const [quote, setQuote] = useState<{ cost: number | null; count: number | null }>({ cost: null, count: null });
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState("เลือกแอปและประเทศ แล้วกดซื้อหมายเลข");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryUsage, setCountryUsage] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("hero-country-usage") || "{}"); } catch { return {}; }
  });

  const sortedCountries = useMemo(() => {
    const term = countrySearch.trim().toLocaleLowerCase("th");
    return COUNTRIES
      .filter((item) => !term || (item.name + " " + item.en).toLocaleLowerCase("th").includes(term))
      .sort((a, b) => (countryUsage[b.id] || 0) - (countryUsage[a.id] || 0) || a.name.localeCompare(b.name, "th"));
  }, [countrySearch, countryUsage]);

  const loadSummary = useCallback(async () => {
    try {
      const [b, q] = await Promise.all([
        fetch("/api/hero?op=balance", { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/hero?op=quote&service=${service}&country=${country}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (b.ok) setBalance(Number(b.balance));
      if (q.ok) {
        const nextCost = q.cost == null ? null : Number(q.cost);
        setQuote({ cost: nextCost, count: q.count ?? null });
        setMaxPrice(nextCost);
      }
      else setQuote({ cost: null, count: null });
    } catch {
      setStatus("เชื่อมต่อ HeroSMS ไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  }, [service, country]);

  useEffect(() => {
    const timer = window.setTimeout(loadSummary, 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);

  useEffect(() => {
    if (!order || code) return;
    const check = async () => {
      try {
        const data = await fetch(`/api/hero?op=status&id=${order.id}`, { cache: "no-store" }).then((r) => r.json());
        if (data.code) {
          setCode(String(data.code));
          setStatus("ได้รับ OTP แล้ว");
          navigator.vibrate?.([100, 60, 100]);
        } else if (data.message) setStatus(data.message);
      } catch { /* retry on the next interval */ }
    };
    check();
    const timer = window.setInterval(check, 5000);
    return () => window.clearInterval(timer);
  }, [order, code]);

  async function buy() {
    setBusy(true); setCode(""); setStatus("กำลังซื้อหมายเลข…");
    try {
      const data = await fetch("/api/hero", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "buy", service, country, maxPrice }),
      }).then((r) => r.json());
      if (!data.ok) throw new Error(data.message);
      setOrder({ id: String(data.id), phone: String(data.phone), service, country, createdAt: Date.now() });
      setCountryUsage((current) => {
        const next = { ...current, [country]: (current[country] || 0) + 1 };
        localStorage.setItem("hero-country-usage", JSON.stringify(next));
        return next;
      });
      setStatus("พร้อมรับ OTP — นำหมายเลขไปกรอกในแอปได้เลย");
      await loadSummary();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "ซื้อหมายเลขไม่สำเร็จ");
    } finally { setBusy(false); }
  }

  async function updateOrder(action: "cancel" | "finish" | "again") {
    if (!order) return;
    setBusy(true);
    try {
      const data = await fetch("/api/hero", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "status", id: order.id, action }),
      }).then((r) => r.json());
      if (!data.ok) throw new Error(data.message);
      if (action === "again") { setCode(""); setStatus("กำลังรอ OTP ใหม่…"); }
      else { setOrder(null); setCode(""); setStatus(action === "cancel" ? "ยกเลิกรายการแล้ว" : "จบรายการเรียบร้อย"); }
      await loadSummary();
    } catch (e) { setStatus(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label); window.setTimeout(() => setCopied(""), 1400);
  }

  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;
  const svc = SERVICES[service];

  return (
    <main className="app-shell">
      <section className="phone-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">HERO SMS · QUICK OTP</p>
            <h1>รับ OTP ง่ายๆ</h1>
          </div>
          <button className="balance" onClick={loadSummary} aria-label="อัปเดตยอดเงิน">
            <span>ยอดคงเหลือ</span><strong>{balance === null ? "…" : money(balance)}</strong>
          </button>
        </header>

        {!order ? (
          <>
            <section className="step">
              <div className="step-title"><span>1</span><h2>เลือกแอป</h2></div>
              <div className="service-grid">
                {(Object.keys(SERVICES) as Service[]).map((key) => {
                  const item = SERVICES[key];
                  return <button key={key} onClick={() => setService(key)} className={`service-card ${item.color} ${service === key ? "selected" : ""}`}>
                    <span className="app-mark">{item.mark}</span>
                    <span><strong>{item.name}</strong><small>{item.hint}</small></span>
                    <i aria-hidden="true">✓</i>
                  </button>;
                })}
              </div>
            </section>

            <section className="step">
              <div className="step-title"><span>2</span><h2>เลือกประเทศ</h2></div>
              <div className="country-picker">
                <label>ประเทศของหมายเลข</label>
                <button className="country-trigger" onClick={() => setCountryOpen((value) => !value)} aria-expanded={countryOpen}>
                  <span><b>{selectedCountry.flag}</b><strong>{selectedCountry.name}</strong><small>{selectedCountry.en}</small></span><i>⌄</i>
                </button>
                {countryOpen && <div className="country-menu">
                  <div className="country-search"><span>⌕</span><input autoFocus value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="ค้นหาประเทศ เช่น ไทย, Japan…" aria-label="ค้นหาประเทศ" /><button onClick={() => setCountryOpen(false)}>ปิด</button></div>
                  <div className="country-list">
                    {sortedCountries.length ? sortedCountries.map((item, index) => {
                      const frequent = (countryUsage[item.id] || 0) > 0;
                      return <button key={item.id} className={country === item.id ? "active" : ""} onClick={() => { setCountry(item.id); setCountryOpen(false); setCountrySearch(""); }}>
                        <b>{item.flag}</b><span><strong>{item.name}</strong><small>{item.en}</small></span>{frequent && index < 5 && <em>ใช้บ่อย</em>}{country === item.id && <i>✓</i>}
                      </button>;
                    }) : <p className="country-empty">ไม่พบประเทศที่ค้นหา</p>}
                  </div>
                </div>}
                <div className="availability"><span className={quote.count ? "dot live" : "dot"} />{quote.count === null ? "กำลังตรวจสอบ…" : quote.count > 0 ? `มี ${quote.count.toLocaleString()} หมายเลข` : "ไม่มีหมายเลขในขณะนี้"}</div>
              </div>
            </section>

            <section className="checkout-card">
              <div className="checkout-row"><span>{svc.name} · {selectedCountry.flag} {selectedCountry.name}</span><strong>{money(quote.cost)}</strong></div>
              {quote.cost !== null && <div className="price-picker">
                <div><span>เลือกราคาสูงสุด</span><strong>{money(maxPrice)}</strong></div>
                <div className="price-options">
                  {[1, 1.1, 1.25, 1.5].map((rate, index) => {
                    const value = Number((quote.cost! * rate).toFixed(2));
                    return <button key={rate} className={maxPrice === value ? "active" : ""} onClick={() => setMaxPrice(value)}>
                      {index === 0 ? "ราคาต่ำสุด" : `+${Math.round((rate - 1) * 100)}%`}<b>{money(value)}</b>
                    </button>;
                  })}
                </div>
                <p>ตั้งราคาสูงขึ้นอาจหาหมายเลขได้ง่ายและเร็วขึ้น แต่ระบบจะไม่ซื้อเกินราคาที่เลือก</p>
              </div>}
              <button className={`primary ${svc.color}`} onClick={buy} disabled={busy || quote.count === 0}>
                {busy ? "กำลังดำเนินการ…" : "ซื้อหมายเลขและรับ OTP"}<span>→</span>
              </button>
              <p>ระบบจะรอและแสดงรหัส OTP ให้อัตโนมัติ</p>
            </section>
          </>
        ) : (
          <section className="active-order">
            <div className={`active-brand ${SERVICES[order.service].color}`}><span className="app-mark">{SERVICES[order.service].mark}</span><div><small>กำลังใช้งาน</small><strong>{SERVICES[order.service].name}</strong></div><em>LIVE</em></div>
            <div className="status-line"><span className="pulse" />{status}</div>
            <div className="value-box">
              <label>หมายเลขโทรศัพท์</label>
              <div><strong>{order.phone}</strong><button onClick={() => copy(order.phone, "phone")}>{copied === "phone" ? "คัดลอกแล้ว" : "คัดลอก"}</button></div>
            </div>
            <div className={`otp-box ${code ? "received" : ""}`}>
              <label>รหัส OTP</label>
              {code ? <div><strong>{code}</strong><button onClick={() => copy(code, "otp")}>{copied === "otp" ? "คัดลอกแล้ว" : "คัดลอก OTP"}</button></div> : <div className="waiting"><span /><span /><span /><p>กำลังรอข้อความ…</p></div>}
            </div>
            <div className="order-actions">
              {code && <button onClick={() => updateOrder("again")} disabled={busy}>ขอ OTP อีกครั้ง</button>}
              <button className="finish" onClick={() => updateOrder("finish")} disabled={busy || !code}>เสร็จสิ้น</button>
              <button className="cancel" onClick={() => updateOrder("cancel")} disabled={busy}>ยกเลิกหมายเลข</button>
            </div>
          </section>
        )}

        {!order && <div className="notice"><span>🔒</span><p><strong>API key ถูกเก็บอย่างปลอดภัย</strong><br />คีย์ไม่ถูกส่งมายังมือถือหรือแสดงบนหน้าเว็บ</p></div>}
      </section>
    </main>
  );
}
