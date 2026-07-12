---
name: E-ticket screen architecture
description: Key decisions for the e-ticket screen redesign (airline-grade UI, PDF, two-phase booking)
---

## Design
- Ticket card uses fixed WHITE (#FFFFFF) background regardless of dark/light mode — simulates a paper ticket
- Screen chrome (header, background) uses `useColors()` for dark/light theming
- Status-driven accent color: orange (#F97316) for held/pending, green (#10B981) for confirmed/ticketed
- SVG barcode rendered via `react-native-svg` (Svg + Rect) — visual only, not scannable Code128

## PDF Export
- Web: hidden `<iframe>` + `iframe.contentWindow.print()` — avoids opening new tab/showing links
- Native: `expo-print` → `printToFileAsync` → `FileSystem.moveAsync` to rename to `Electronic_Ticket_{PNR}.pdf`
- `expo-file-system` IS installed in the mobile-app artifact
- PDF uses A4 `@page` CSS, inline SVG watermark, Cairo font from Google Fonts CDN

## Two-phase booking UI
- `held` / `pending` status → shows orange "حجز مؤقت" header + countdown + "استكمال الدفع" button; QR/barcode hidden
- `confirmed` / `ticketed` status → shows green "تذكرة إلكترونية" header + full QR + SVG barcode
- `completeHoldBooking` mutation transitions `held → pending`; admin then moves to `confirmed/ticketed`

## Data fields
- Fields not in current data model (seat, gate, terminal, boardingTime, fareBasis) read from `offer as any` with fallback to "غير متوفر"
- `booking.passengers` typed as `any[]` for flexibility; eTicketNumber read from `p.eTicketNumber` OR `booking.eticketNumbers[i]`

**Why:** Full redesign needed to match airline industry standard; white card = universally recognizable ticket format.
**How to apply:** When touching e-ticket screen, preserve the white card + two-phase pattern; don't dark-mode the ticket card itself.
