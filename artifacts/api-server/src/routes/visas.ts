import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, visasTable, usersTable } from "@workspace/db";
import type { User, Visa } from "@workspace/db";
import {
  ListVisasQueryParams,
  ListVisasResponse,
  CreateVisaBody,
  CreateVisaResponse,
  GetVisaParams,
  GetVisaResponse,
  UpdateVisaParams,
  UpdateVisaBody,
  UpdateVisaResponse,
  DeleteVisaParams,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";
import { coerceVisa } from "../lib/coerce";

// ─── Schengen countries ───────────────────────────────────────────────────────
const SCHENGEN = new Set([
  'austria','belgium','czechia','denmark','estonia','finland','france','germany',
  'greece','hungary','iceland','italy','latvia','liechtenstein','lithuania',
  'luxembourg','malta','netherlands','norway','poland','portugal','slovakia',
  'slovenia','spain','sweden','switzerland',
]);

const COUNTRY_LABELS: Record<string, string> = {
  schengen: 'دول الشنغن', uk: 'المملكة المتحدة', us: 'الولايات المتحدة',
  canada: 'كندا', australia: 'أستراليا', japan: 'اليابان',
};

// ─── Eligibility helper ───────────────────────────────────────────────────────

interface EligibilityBlocker {
  type: string;
  message: string;
  actionRoute: string | null;
}

function checkEligibility(user: User, visa: Visa): { eligible: boolean; blockers: EligibilityBlocker[] } {
  const blockers: EligibilityBlocker[] = [];

  // 1. Nationality gating
  if (visa.blockedNationalities.length > 0 && user.nationality &&
      visa.blockedNationalities.map(n => n.toLowerCase()).includes(user.nationality.toLowerCase())) {
    blockers.push({ type: 'nationality_blocked', message: 'هذه التأشيرة غير متاحة لجنسيتك حالياً', actionRoute: null });
  }
  if (visa.allowedNationalities.length > 0 && user.nationality &&
      !visa.allowedNationalities.map(n => n.toLowerCase()).includes(user.nationality.toLowerCase())) {
    blockers.push({ type: 'nationality_not_allowed', message: 'هذه التأشيرة غير متاحة لجنسيتك حالياً', actionRoute: null });
  }

  // 2. Gulf residence
  if (visa.requiresGulfResidence) {
    if (!user.hasGulfResidence) {
      blockers.push({
        type: 'no_gulf_residence',
        message: 'هذه التأشيرة متاحة فقط للمقيمين في إحدى دول مجلس التعاون الخليجي',
        actionRoute: '/profile-edit',
      });
    } else if (visa.requiresGulfResidenceCountry && user.gulfResidenceCountry !== visa.requiresGulfResidenceCountry) {
      blockers.push({
        type: 'wrong_gulf_country',
        message: `هذه التأشيرة تتطلب إقامة في ${visa.requiresGulfResidenceCountry}`,
        actionRoute: '/profile-edit',
      });
    }
  }

  // 3. Valid foreign visa
  if (visa.requiresValidVisaCountries.length > 0) {
    const userActiveVisas = (user.activeVisas as Array<{ country?: string }>) ?? [];
    const hasMatch = userActiveVisas.some(v => {
      const country = (v.country ?? '').toLowerCase();
      return visa.requiresValidVisaCountries.some(req => {
        const r = req.toLowerCase();
        return r === 'schengen' ? SCHENGEN.has(country) : r === country;
      });
    });
    if (!hasMatch) {
      const labels = visa.requiresValidVisaCountries.map(c => COUNTRY_LABELS[c.toLowerCase()] ?? c).join(' أو ');
      blockers.push({
        type: 'no_valid_visa',
        message: `هذه التأشيرة تتطلب وجود تأشيرة سارية لـ: ${labels}`,
        actionRoute: '/profile-edit',
      });
    }
  }

  // 4. Document requirements (informational blockers — uploaded at application time)
  if (visa.requiresBankStatement)   blockers.push({ type: 'bank_statement',    message: 'يجب إرفاق كشف حساب بنكي', actionRoute: null });
  if (visa.requiresFlightBooking)   blockers.push({ type: 'flight_booking',    message: 'يجب إرفاق حجز طيران مؤكد', actionRoute: null });
  if (visa.requiresHotelBooking)    blockers.push({ type: 'hotel_booking',     message: 'يجب إرفاق حجز فندقي', actionRoute: null });
  if (visa.requiresTravelInsurance) blockers.push({ type: 'travel_insurance',  message: 'يجب إرفاق تأمين سفر', actionRoute: null });
  if (visa.requiresInvitationLetter)blockers.push({ type: 'invitation_letter', message: 'يجب إرفاق خطاب تعريف', actionRoute: null });

  return { eligible: blockers.length === 0, blockers };
}

const router: IRouter = Router();

router.get("/visas", async (req, res): Promise<void> => {
  const query = ListVisasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.visaType) {
    conditions.push(eq(visasTable.visaType, query.data.visaType));
  }
  if (query.data.country) {
    conditions.push(eq(visasTable.countryName, query.data.country));
  }

  const rows = await db
    .select()
    .from(visasTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(visasTable.createdAt);

  res.json(ListVisasResponse.parse(rows.map(coerceVisa)));
});

router.post("/visas", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateVisaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [visa] = await db
    .insert(visasTable)
    .values({ ...parsed.data, price: String(parsed.data.price) })
    .returning();

  res.status(201).json(CreateVisaResponse.parse(coerceVisa(visa)));
});

router.get("/visas/:id", async (req, res): Promise<void> => {
  const params = GetVisaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [visa] = await db
    .select()
    .from(visasTable)
    .where(eq(visasTable.id, params.data.id));

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.json(GetVisaResponse.parse(coerceVisa(visa)));
});

router.patch("/visas/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateVisaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVisaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [visa] = await db
    .update(visasTable)
    .set({
      ...parsed.data,
      price:
        parsed.data.price !== undefined ? String(parsed.data.price) : undefined,
    })
    .where(eq(visasTable.id, params.data.id))
    .returning();

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.json(UpdateVisaResponse.parse(coerceVisa(visa)));
});

router.delete("/visas/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteVisaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [visa] = await db
    .delete(visasTable)
    .where(eq(visasTable.id, params.data.id))
    .returning();

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.sendStatus(204);
});

// ─── Eligibility check ────────────────────────────────────────────────────────

router.get("/visas/:id/eligibility", requireAuth, async (req, res): Promise<void> => {
  const visaId = Number(req.params.id);
  if (isNaN(visaId)) {
    res.status(400).json({ error: "Invalid visa id" });
    return;
  }

  const [visa] = await db.select().from(visasTable).where(eq(visasTable.id, visaId));
  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const result = checkEligibility(user, visa);
  res.json(result);
});

export default router;
