import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, visasTable, usersTable, visaEligibilityRuleTable } from "@workspace/db";
import type { User, Visa, VisaEligibilityRule } from "@workspace/db";
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
import { requireAdmin, requireAuth, requirePermission } from "../lib/auth";
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
  newzealand: 'نيوزيلندا', southkorea: 'كوريا الجنوبية',
};

// ─── Eligibility helper ───────────────────────────────────────────────────────

interface EligibilityBlocker {
  type: string;
  message: string;
  actionRoute: string | null;
}

/** Check whether user's active visas satisfy a requiresValidVisaCountries list (OR logic). */
function hasValidVisaFor(user: User, countries: string[]): boolean {
  if (countries.length === 0) return false;
  const userActiveVisas = (user.activeVisas as Array<{ country?: string }>) ?? [];
  return userActiveVisas.some(v => {
    const c = (v.country ?? '').toLowerCase();
    return countries.some(req => {
      const r = req.toLowerCase();
      return r === 'schengen' ? SCHENGEN.has(c) : r === c;
    });
  });
}

async function checkEligibility(
  user: User,
  visa: Visa,
): Promise<{ eligible: boolean; blockers: EligibilityBlocker[] }> {
  const blockers: EligibilityBlocker[] = [];

  // ── Eligibility Rules (admin-configurable per-nationality logic) ────────────
  const rules = await db
    .select()
    .from(visaEligibilityRuleTable)
    .where(eq(visaEligibilityRuleTable.visaId, visa.id))
    .orderBy(asc(visaEligibilityRuleTable.sortOrder), asc(visaEligibilityRuleTable.id));

  if (rules.length > 0) {
    const userNat = (user.nationality ?? '').toLowerCase();

    // Find specific rule first, then fall back to default
    const specificRule = rules.find(r =>
      !r.isDefault && r.nationalities.some(n => n.toLowerCase() === userNat)
    );
    const defaultRule = rules.find(r => r.isDefault);
    const rule: VisaEligibilityRule | undefined = specificRule ?? defaultRule;

    if (rule) {
      if (rule.allowDirect) {
        // Eligible immediately — no blockers from nationality rule
      } else {
        // OR-logic: user must satisfy at least one of the requirements
        const needsOr = rule.requiresGulfResidence || rule.requiresValidVisaCountries.length > 0;
        if (needsOr) {
          const hasGulf = !!(user.hasGulfResidence);
          const hasVisa = hasValidVisaFor(user, rule.requiresValidVisaCountries);
          const satisfied = (rule.requiresGulfResidence && hasGulf) || hasVisa;

          if (!satisfied) {
            const parts: string[] = [];
            if (rule.requiresGulfResidence) parts.push('إقامة سارية في دول مجلس التعاون الخليجي');
            if (rule.requiresValidVisaCountries.length > 0) {
              const labels = rule.requiresValidVisaCountries.map(c => COUNTRY_LABELS[c.toLowerCase()] ?? c).join(' أو ');
              parts.push(`تأشيرة سارية لـ: ${labels}`);
            }
            blockers.push({
              type: 'nationality_rule',
              message: `هذه التأشيرة تتطلب ${parts.join(' أو ')}`,
              actionRoute: '/profile-edit',
            });
          }
        }

        // AND-logic: invitation letter
        if (rule.requiresInvitationLetter) {
          blockers.push({ type: 'invitation_letter', message: 'يجب إرفاق خطاب تعريف', actionRoute: null });
        }
      }
    } else {
      // No matching rule and no default — block
      blockers.push({ type: 'nationality_no_rule', message: 'هذه التأشيرة غير متاحة لجنسيتك حالياً', actionRoute: null });
    }
  } else {
    // ── Legacy flat-column eligibility (backward compat) ─────────────────────
    if (visa.blockedNationalities.length > 0 && user.nationality &&
        visa.blockedNationalities.map(n => n.toLowerCase()).includes((user.nationality ?? '').toLowerCase())) {
      blockers.push({ type: 'nationality_blocked', message: 'هذه التأشيرة غير متاحة لجنسيتك حالياً', actionRoute: null });
    }
    if (visa.allowedNationalities.length > 0 && user.nationality &&
        !visa.allowedNationalities.map(n => n.toLowerCase()).includes((user.nationality ?? '').toLowerCase())) {
      blockers.push({ type: 'nationality_not_allowed', message: 'هذه التأشيرة غير متاحة لجنسيتك حالياً', actionRoute: null });
    }
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
    if (visa.requiresValidVisaCountries.length > 0 && !hasValidVisaFor(user, visa.requiresValidVisaCountries)) {
      const labels = visa.requiresValidVisaCountries.map(c => COUNTRY_LABELS[c.toLowerCase()] ?? c).join(' أو ');
      blockers.push({
        type: 'no_valid_visa',
        message: `هذه التأشيرة تتطلب وجود تأشيرة سارية لـ: ${labels}`,
        actionRoute: '/profile-edit',
      });
    }
    if (visa.requiresInvitationLetter) blockers.push({ type: 'invitation_letter', message: 'يجب إرفاق خطاب تعريف', actionRoute: null });
  }

  // ── Document requirements (always shown regardless of rules) ─────────────
  if (visa.requiresBankStatement)   blockers.push({ type: 'bank_statement',   message: 'يجب إرفاق كشف حساب بنكي', actionRoute: null });
  if (visa.requiresFlightBooking)   blockers.push({ type: 'flight_booking',   message: 'يجب إرفاق حجز طيران مؤكد', actionRoute: null });
  if (visa.requiresHotelBooking)    blockers.push({ type: 'hotel_booking',    message: 'يجب إرفاق حجز فندقي', actionRoute: null });
  if (visa.requiresTravelInsurance) blockers.push({ type: 'travel_insurance', message: 'يجب إرفاق تأمين سفر', actionRoute: null });

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

router.post("/visas", requireAdmin, requirePermission("visas.create"), async (req, res): Promise<void> => {
  const parsed = CreateVisaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [visa] = await db
    .insert(visasTable)
    .values({ ...parsed.data, price: parsed.data.price })
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

router.patch("/visas/:id", requireAdmin, requirePermission("visas.edit"), async (req, res): Promise<void> => {
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
        parsed.data.price !== undefined ? parsed.data.price : undefined,
    })
    .where(eq(visasTable.id, params.data.id))
    .returning();

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.json(UpdateVisaResponse.parse(coerceVisa(visa)));
});

router.delete("/visas/:id", requireAdmin, requirePermission("visas.delete"), async (req, res): Promise<void> => {
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

// ─── Eligibility Rules CRUD (admin) ──────────────────────────────────────────

router.get("/visas/:id/rules", requireAdmin, requirePermission("visas.view"), async (req, res): Promise<void> => {
  const visaId = Number(req.params.id);
  if (isNaN(visaId)) { res.status(400).json({ error: "Invalid visa id" }); return; }
  const rules = await db
    .select()
    .from(visaEligibilityRuleTable)
    .where(eq(visaEligibilityRuleTable.visaId, visaId))
    .orderBy(asc(visaEligibilityRuleTable.sortOrder), asc(visaEligibilityRuleTable.id));
  res.json(rules);
});

router.post("/visas/:id/rules", requireAdmin, requirePermission("visas.edit"), async (req, res): Promise<void> => {
  const visaId = Number(req.params.id);
  if (isNaN(visaId)) { res.status(400).json({ error: "Invalid visa id" }); return; }
  const [rule] = await db
    .insert(visaEligibilityRuleTable)
    .values({ ...req.body, visaId })
    .returning();
  res.status(201).json(rule);
});

router.put("/visas/:id/rules/:ruleId", requireAdmin, requirePermission("visas.edit"), async (req, res): Promise<void> => {
  const visaId = Number(req.params.id);
  const ruleId = Number(req.params.ruleId);
  if (isNaN(visaId) || isNaN(ruleId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [rule] = await db
    .update(visaEligibilityRuleTable)
    .set(req.body)
    .where(and(eq(visaEligibilityRuleTable.id, ruleId), eq(visaEligibilityRuleTable.visaId, visaId)))
    .returning();
  if (!rule) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json(rule);
});

router.delete("/visas/:id/rules/:ruleId", requireAdmin, requirePermission("visas.delete"), async (req, res): Promise<void> => {
  const visaId = Number(req.params.id);
  const ruleId = Number(req.params.ruleId);
  if (isNaN(visaId) || isNaN(ruleId)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db
    .delete(visaEligibilityRuleTable)
    .where(and(eq(visaEligibilityRuleTable.id, ruleId), eq(visaEligibilityRuleTable.visaId, visaId)));
  res.status(204).send();
});

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

  const result = await checkEligibility(user, visa);
  res.setHeader('Cache-Control', 'no-store');
  res.json(result);
});

export default router;
