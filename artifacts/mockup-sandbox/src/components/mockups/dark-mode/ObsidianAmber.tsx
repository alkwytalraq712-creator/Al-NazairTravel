/**
 * Obsidian Amber — الوضع الليلي الدافئ الداكن
 * Near-black background + warm amber/copper gold + burnt orange
 * More dramatic contrast, luxury "dark room" feel
 */
export default function ObsidianAmber() {
  const BG      = "#0C0804";
  const CARD    = "#18120A";
  const CARD2   = "#141008";
  const AMBER   = "#D4920A";
  const AMBER2  = "#F0B020";
  const COPPER  = "#B87820";
  const ORANGE  = "#E06818";
  const CREAM   = "#F5E8D0";
  const MUTED   = "rgba(245,232,208,0.42)";
  const BORDER  = "rgba(212,146,10,0.18)";

  return (
    <div style={{ width: 390, height: 844, background: BG, fontFamily: "'Tajawal', 'Cairo', sans-serif", overflowY: "auto", direction: "rtl", position: "relative" }}>

      {/* Status Bar */}
      <div style={{ height: 44, paddingInline: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: AMBER, fontSize: 12, fontWeight: 700 }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ width: 16, height: 10, border: `1.5px solid ${AMBER}`, borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", inset: 1.5, background: AMBER, width: "80%", borderRadius: 1 }} />
          </div>
          <svg width="15" height="11" viewBox="0 0 15 11">
            <rect x="0" y="4" width="3" height="7" rx="1" fill={AMBER} />
            <rect x="4" y="2" width="3" height="9" rx="1" fill={AMBER} />
            <rect x="8" y="0" width="3" height="11" rx="1" fill={AMBER} />
            <rect x="12" y="0" width="3" height="11" rx="1" fill={`${AMBER}33`} />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ paddingInline: 20, paddingBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: `${AMBER}14`, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16 }}>🔔</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${AMBER}, ${ORANGE})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>✈</span>
            </div>
            <span style={{ color: AMBER2, fontWeight: 800, fontSize: 17, letterSpacing: 0.5 }}>قمة النظائر</span>
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 19, overflow: "hidden", border: `1.5px solid ${AMBER}44` }}>
          <div style={{ width: "100%", height: "100%", background: `${AMBER}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>👤</span>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ paddingInline: 20, marginBottom: 16 }}>
        <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>مرحباً بعودتك 👋</p>
        <h2 style={{ color: CREAM, fontWeight: 800, fontSize: 20, margin: "2px 0 0" }}>إلى أين تريد السفر؟</h2>
      </div>

      {/* Search Bar */}
      <div style={{ marginInline: 20, marginBottom: 20, background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${AMBER}, ${COPPER})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
        </div>
        <span style={{ color: MUTED, fontSize: 14, flex: 1 }}>ابحث عن رحلات، باقات، تأشيرات...</span>
      </div>

      {/* Services */}
      <div style={{ paddingInline: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: AMBER, fontSize: 12, fontWeight: 600 }}>عرض الكل</span>
          <span style={{ color: CREAM, fontWeight: 800, fontSize: 15 }}>خدماتنا</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { icon: "✈️", label: "رحلات", active: true },
            { icon: "🏨", label: "باقات", active: false },
            { icon: "📋", label: "تأشيرات", active: false },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 16, padding: "14px 8px", textAlign: "center",
              background: s.active ? `linear-gradient(145deg, ${AMBER}20, ${ORANGE}14)` : CARD,
              border: `1px solid ${s.active ? AMBER + "50" : BORDER}`,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ color: s.active ? AMBER2 : MUTED, fontSize: 12, fontWeight: s.active ? 700 : 500 }}>{s.label}</div>
              {s.active && <div style={{ width: 20, height: 2, background: `linear-gradient(90deg, ${AMBER}, ${AMBER2})`, borderRadius: 1, margin: "6px auto 0" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Promo Banner — rich copper gradient */}
      <div style={{ marginInline: 20, marginBottom: 20, borderRadius: 18, overflow: "hidden", background: `linear-gradient(135deg, #1C1005, #140C04)`, border: `1px solid ${AMBER}30`, padding: 16, position: "relative" }}>
        <div style={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: `${AMBER}0A` }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-block", background: `${ORANGE}28`, borderRadius: 20, padding: "3px 10px", marginBottom: 8 }}>
            <span style={{ color: ORANGE, fontSize: 11, fontWeight: 700 }}>عرض محدود 🔥</span>
          </div>
          <p style={{ color: CREAM, fontWeight: 800, fontSize: 16, margin: "0 0 4px" }}>تأشيرة تركيا الإلكترونية</p>
          <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px" }}>صدور فوري خلال 24 ساعة</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: `linear-gradient(90deg, ${AMBER}, ${AMBER2})`, borderRadius: 20, padding: "6px 14px" }}>
              <span style={{ color: BG, fontWeight: 800, fontSize: 12 }}>احجز الآن</span>
            </div>
            <span style={{ color: AMBER, fontSize: 12 }}>من <strong style={{ color: AMBER2 }}>$45</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{ paddingInline: 20, marginBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: AMBER, fontSize: 12, fontWeight: 600 }}>عرض الكل</span>
          <span style={{ color: CREAM, fontWeight: 800, fontSize: 15 }}>حجوزاتي الأخيرة</span>
        </div>
        {[
          { from: "DXB", to: "JED", date: "21 يوليو 2026", status: "مؤكد", statusColor: "#22C97A" },
          { from: "BGW", to: "IST", date: "15 أغسطس 2026", status: "قيد الانتظار", statusColor: AMBER },
        ].map((b, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: CREAM, fontWeight: 800, fontSize: 13 }}>{b.from}</span>
                <span style={{ color: AMBER, fontSize: 12 }}>✈ ─────</span>
                <span style={{ color: CREAM, fontWeight: 800, fontSize: 13 }}>{b.to}</span>
              </div>
              <span style={{ color: MUTED, fontSize: 11 }}>{b.date}</span>
            </div>
            <div style={{ background: `${b.statusColor}16`, borderRadius: 20, padding: "4px 10px", border: `1px solid ${b.statusColor}44` }}>
              <span style={{ color: b.statusColor, fontSize: 10, fontWeight: 700 }}>{b.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: 390, background: CARD2, borderTop: `1px solid ${AMBER}20`, padding: "10px 0 16px", display: "flex", justifyContent: "space-around" }}>
        {[
          { icon: "🏠", label: "الرئيسية", active: true },
          { icon: "✈️", label: "رحلات", active: false },
          { icon: "📦", label: "باقات", active: false },
          { icon: "📋", label: "تأشيرات", active: false },
          { icon: "👤", label: "حسابي", active: false },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56 }}>
            <div style={{
              width: 40, height: 34, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: t.active ? `${AMBER}1E` : "transparent",
            }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: t.active ? 700 : 500, color: t.active ? AMBER2 : MUTED }}>{t.label}</span>
            {t.active && <div style={{ width: 16, height: 2, background: `linear-gradient(90deg, ${AMBER}, ${AMBER2})`, borderRadius: 1 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
