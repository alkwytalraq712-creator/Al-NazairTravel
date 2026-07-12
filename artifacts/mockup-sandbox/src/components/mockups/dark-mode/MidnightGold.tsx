/**
 * Midnight Gold — الوضع الليلي بألوان هوية قمة النظائر
 * Deep navy + rich gold (#C9A060) + orange accent
 * All primary elements use brand gold, not generic white/blue
 */
export default function MidnightGold() {
  const BG      = "#060B18";
  const CARD    = "#0F1E36";
  const CARD2   = "#0C1830";
  const GOLD    = "#C9A060";
  const GOLD2   = "#E8C07A";
  const ORANGE  = "#F97316";
  const WHITE   = "#FFFFFF";
  const MUTED   = "rgba(255,255,255,0.45)";
  const BORDER  = "rgba(201,160,96,0.15)";
  const ACTIVE  = GOLD;

  return (
    <div style={{ width: 390, height: 844, background: BG, fontFamily: "'Tajawal', 'Cairo', sans-serif", overflowY: "auto", direction: "rtl", position: "relative" }}>

      {/* Status Bar */}
      <div style={{ height: 44, paddingInline: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ width: 16, height: 10, border: `1.5px solid ${GOLD}`, borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", inset: 1.5, background: GOLD, width: "70%", borderRadius: 1 }} />
          </div>
          <svg width="15" height="11" viewBox="0 0 15 11">
            <rect x="0" y="4" width="3" height="7" rx="1" fill={GOLD} />
            <rect x="4" y="2" width="3" height="9" rx="1" fill={GOLD} />
            <rect x="8" y="0" width="3" height="11" rx="1" fill={GOLD} />
            <rect x="12" y="0" width="3" height="11" rx="1" fill={`${GOLD}44`} />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ paddingInline: 20, paddingBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: `${GOLD}18`, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16 }}>🔔</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${GOLD}, ${ORANGE})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>✈</span>
            </div>
            <span style={{ color: GOLD, fontWeight: 800, fontSize: 17, letterSpacing: 0.5 }}>قمة النظائر</span>
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 19, overflow: "hidden", border: `1.5px solid ${GOLD}44` }}>
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${GOLD}33, ${ORANGE}22)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, color: GOLD }}>👤</span>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ paddingInline: 20, marginBottom: 16 }}>
        <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>مرحباً بعودتك 👋</p>
        <h2 style={{ color: WHITE, fontWeight: 800, fontSize: 20, margin: "2px 0 0" }}>إلى أين تريد السفر؟</h2>
      </div>

      {/* Search Bar */}
      <div style={{ marginInline: 20, marginBottom: 20, background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${ORANGE}, #E8620D)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
        </div>
        <span style={{ color: MUTED, fontSize: 14, flex: 1 }}>ابحث عن رحلات، باقات، تأشيرات...</span>
      </div>

      {/* Services */}
      <div style={{ paddingInline: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>عرض الكل</span>
          <span style={{ color: WHITE, fontWeight: 800, fontSize: 15 }}>خدماتنا</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { icon: "✈️", label: "رحلات", active: true },
            { icon: "🏨", label: "باقات", active: false },
            { icon: "📋", label: "تأشيرات", active: false },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 16, padding: "14px 8px", textAlign: "center",
              background: s.active ? `linear-gradient(145deg, ${GOLD}22, ${ORANGE}18)` : CARD,
              border: `1px solid ${s.active ? GOLD + "55" : BORDER}`,
              cursor: "pointer"
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ color: s.active ? GOLD : MUTED, fontSize: 12, fontWeight: s.active ? 700 : 500 }}>{s.label}</div>
              {s.active && <div style={{ width: 20, height: 2, background: `linear-gradient(90deg, ${GOLD}, ${ORANGE})`, borderRadius: 1, margin: "6px auto 0" }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div style={{ marginInline: 20, marginBottom: 20, borderRadius: 18, overflow: "hidden", background: `linear-gradient(135deg, #0D1E3A, #0A1628)`, border: `1px solid ${GOLD}33`, padding: 16, position: "relative" }}>
        <div style={{ position: "absolute", top: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: `${GOLD}08` }} />
        <div style={{ position: "absolute", bottom: -30, right: -10, width: 120, height: 120, borderRadius: "50%", background: `${ORANGE}06` }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-block", background: `${ORANGE}22`, borderRadius: 20, padding: "3px 10px", marginBottom: 8 }}>
            <span style={{ color: ORANGE, fontSize: 11, fontWeight: 700 }}>عرض محدود ✨</span>
          </div>
          <p style={{ color: WHITE, fontWeight: 800, fontSize: 16, margin: "0 0 4px" }}>تأشيرة تركيا الإلكترونية</p>
          <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px" }}>صدور فوري خلال 24 ساعة</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 20, padding: "6px 14px", display: "inline-block" }}>
              <span style={{ color: "#0B1628", fontWeight: 800, fontSize: 12 }}>احجز الآن</span>
            </div>
            <span style={{ color: GOLD, fontSize: 12 }}>ابتداءً من <strong>$45</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{ paddingInline: 20, marginBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>عرض الكل</span>
          <span style={{ color: WHITE, fontWeight: 800, fontSize: 15 }}>حجوزاتي الأخيرة</span>
        </div>
        {[
          { from: "DXB", to: "JED", date: "21 يوليو 2026", status: "مؤكد", statusColor: "#10B981" },
          { from: "BGW", to: "IST", date: "15 أغسطس 2026", status: "قيد الانتظار", statusColor: GOLD },
        ].map((b, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: WHITE, fontWeight: 800, fontSize: 13 }}>{b.from}</span>
                <span style={{ color: GOLD, fontSize: 12 }}>✈ ─────</span>
                <span style={{ color: WHITE, fontWeight: 800, fontSize: 13 }}>{b.to}</span>
              </div>
              <span style={{ color: MUTED, fontSize: 11 }}>{b.date}</span>
            </div>
            <div style={{ background: `${b.statusColor}18`, borderRadius: 20, padding: "4px 10px", border: `1px solid ${b.statusColor}44` }}>
              <span style={{ color: b.statusColor, fontSize: 10, fontWeight: 700 }}>{b.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: 390, background: CARD2, borderTop: `1px solid ${GOLD}22`, padding: "10px 0 16px", display: "flex", justifyContent: "space-around" }}>
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
              background: t.active ? `linear-gradient(135deg, ${GOLD}28, ${ORANGE}18)` : "transparent",
            }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: t.active ? 700 : 500, color: t.active ? GOLD : MUTED }}>{t.label}</span>
            {t.active && <div style={{ width: 16, height: 2, background: GOLD, borderRadius: 1 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
