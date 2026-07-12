/**
 * Royal Velvet — الوضع الليلي الملكي الفاخر
 * Deep midnight indigo + premium champagne gold + electric gold accents
 * Premium hotel / luxury airline aesthetic
 */
export default function RoyalVelvet() {
  const BG      = "#07091A";
  const CARD    = "#0E1228";
  const CARD2   = "#0C1020";
  const GOLD    = "#C8A84E";
  const GOLD2   = "#E4C870";
  const INDIGO  = "#3050C0";
  const PURPLE  = "#2A1A5E";
  const CHAMPAGNE = "#F0E4B8";
  const MUTED   = "rgba(240,228,184,0.40)";
  const BORDER  = "rgba(200,168,78,0.14)";
  const GLOW    = "rgba(200,168,78,0.07)";

  return (
    <div style={{ width: 390, height: 844, background: BG, fontFamily: "'Tajawal', 'Cairo', sans-serif", overflowY: "auto", direction: "rtl", position: "relative" }}>

      {/* Subtle background glow */}
      <div style={{ position: "fixed", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${GLOW} 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Status Bar */}
      <div style={{ height: 44, paddingInline: 20, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ width: 16, height: 10, border: `1.5px solid ${GOLD}`, borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", inset: 1.5, background: GOLD, width: "90%", borderRadius: 1 }} />
          </div>
          <svg width="15" height="11" viewBox="0 0 15 11">
            <rect x="0" y="4" width="3" height="7" rx="1" fill={GOLD} />
            <rect x="4" y="2" width="3" height="9" rx="1" fill={GOLD} />
            <rect x="8" y="0" width="3" height="11" rx="1" fill={GOLD} />
            <rect x="12" y="0" width="3" height="11" rx="1" fill={`${GOLD}55`} />
          </svg>
        </div>
      </div>

      {/* Header — elegant minimal */}
      <div style={{ paddingInline: 20, paddingBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${GOLD}12`, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16 }}>🔔</span>
        </div>
        <div style={{ textAlign: "center" }}>
          {/* Crown icon + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(145deg, ${GOLD}, #A07830)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 12px ${GOLD}40` }}>
              <span style={{ fontSize: 14 }}>✈</span>
            </div>
            <div>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: 16, letterSpacing: 0.8, lineHeight: 1 }}>قمة النظائر</div>
              <div style={{ color: MUTED, fontSize: 8, letterSpacing: 2, textTransform: "uppercase" }}>TRAVEL & TOURISM</div>
            </div>
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${GOLD}12`, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16 }}>👤</span>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ paddingInline: 20, marginBottom: 18 }}>
        <p style={{ color: MUTED, fontSize: 13, margin: 0, letterSpacing: 0.3 }}>مرحباً بعودتك 👋</p>
        <h2 style={{ color: CHAMPAGNE, fontWeight: 800, fontSize: 20, margin: "4px 0 0", lineHeight: 1.3 }}>إلى أين تريد السفر؟</h2>
        {/* Decorative line */}
        <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)`, borderRadius: 1, marginTop: 8 }} />
      </div>

      {/* Search Bar — elevated */}
      <div style={{ marginInline: 20, marginBottom: 22, background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: `0 4px 20px rgba(0,0,0,0.3)` }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${GOLD}, #A07030)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${GOLD}30` }}>
          <span style={{ fontSize: 16 }}>🔍</span>
        </div>
        <span style={{ color: MUTED, fontSize: 14, flex: 1 }}>وجهتك القادمة...</span>
        <div style={{ width: 1, height: 20, background: BORDER }} />
        <span style={{ color: GOLD, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>تصفية</span>
      </div>

      {/* Services — pill style */}
      <div style={{ paddingInline: 20, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>المزيد</span>
          <span style={{ color: CHAMPAGNE, fontWeight: 800, fontSize: 15 }}>خدماتنا</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { icon: "✈️", label: "رحلات جوية", active: true },
            { icon: "🏨", label: "باقات سياحية", active: false },
            { icon: "📋", label: "تأشيرات", active: false },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 18, padding: "14px 6px", textAlign: "center",
              background: s.active
                ? `linear-gradient(155deg, ${GOLD}1A, ${INDIGO}14)`
                : CARD,
              border: `1px solid ${s.active ? GOLD + "45" : BORDER}`,
              boxShadow: s.active ? `0 2px 12px ${GOLD}15` : "none"
            }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{s.icon}</div>
              <div style={{ color: s.active ? GOLD2 : MUTED, fontSize: 11, fontWeight: s.active ? 700 : 500, lineHeight: 1.3 }}>{s.label}</div>
              {s.active && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                  <div style={{ width: 24, height: 2.5, background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 2, boxShadow: `0 0 6px ${GOLD}80` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Package — luxury card */}
      <div style={{ marginInline: 20, marginBottom: 22, borderRadius: 20, overflow: "hidden", background: `linear-gradient(145deg, ${PURPLE}88, #10143A)`, border: `1px solid ${GOLD}28`, padding: 18, position: "relative", boxShadow: `0 8px 30px rgba(0,0,0,0.5)` }}>
        {/* Gold line accent top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${GOLD}18`, borderRadius: 20, padding: "4px 10px", marginBottom: 10, border: `1px solid ${GOLD}28` }}>
          <span style={{ color: GOLD, fontSize: 11 }}>★</span>
          <span style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>باقة مميزة</span>
        </div>
        <p style={{ color: CHAMPAGNE, fontWeight: 800, fontSize: 17, margin: "0 0 4px", letterSpacing: 0.3 }}>إسطنبول السحرية</p>
        <p style={{ color: MUTED, fontSize: 12, margin: "0 0 12px" }}>7 أيام · فندق 5 نجوم · جولات سياحية</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 22, padding: "7px 16px", boxShadow: `0 3px 12px ${GOLD}44` }}>
            <span style={{ color: "#080914", fontWeight: 800, fontSize: 12 }}>احجز الآن</span>
          </div>
          <div style={{ textAlign: "left" }}>
            <span style={{ color: MUTED, fontSize: 10 }}>يبدأ من</span>
            <div style={{ color: GOLD2, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>$899</div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{ paddingInline: 20, marginBottom: 90 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>عرض الكل</span>
          <span style={{ color: CHAMPAGNE, fontWeight: 800, fontSize: 15 }}>آخر الحجوزات</span>
        </div>
        {[
          { from: "DXB", to: "JED", date: "21 يوليو 2026", status: "مؤكد", statusColor: "#1DB884" },
          { from: "BGW", to: "IST", date: "15 أغسطس 2026", status: "قيد الانتظار", statusColor: GOLD },
        ].map((b, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 15, border: `1px solid ${BORDER}`, padding: "13px 15px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: `0 2px 10px rgba(0,0,0,0.25)` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: CHAMPAGNE, fontWeight: 800, fontSize: 14 }}>{b.from}</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${GOLD}50, transparent)`, maxWidth: 60 }} />
                <span style={{ color: GOLD, fontSize: 14 }}>✈</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, ${GOLD}50, transparent)`, maxWidth: 60 }} />
                <span style={{ color: CHAMPAGNE, fontWeight: 800, fontSize: 14 }}>{b.to}</span>
              </div>
              <span style={{ color: MUTED, fontSize: 11 }}>{b.date}</span>
            </div>
            <div style={{ background: `${b.statusColor}14`, borderRadius: 20, padding: "4px 10px", border: `1px solid ${b.statusColor}40` }}>
              <span style={{ color: b.statusColor, fontSize: 10, fontWeight: 700 }}>{b.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar — premium glass */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: 390, background: `${CARD2}EE`, borderTop: `1px solid ${GOLD}18`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", padding: "10px 0 18px", display: "flex", justifyContent: "space-around" }}>
        {[
          { icon: "🏠", label: "الرئيسية", active: true },
          { icon: "✈️", label: "رحلات", active: false },
          { icon: "📦", label: "باقات", active: false },
          { icon: "📋", label: "تأشيرات", active: false },
          { icon: "👤", label: "حسابي", active: false },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56 }}>
            <div style={{
              width: 42, height: 34, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: t.active ? `linear-gradient(135deg, ${GOLD}20, ${INDIGO}18)` : "transparent",
              border: t.active ? `1px solid ${GOLD}25` : "1px solid transparent",
            }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: t.active ? 700 : 400, color: t.active ? GOLD2 : MUTED, letterSpacing: t.active ? 0.3 : 0 }}>{t.label}</span>
            {t.active && <div style={{ width: 18, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, borderRadius: 1, boxShadow: `0 0 6px ${GOLD}80` }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
