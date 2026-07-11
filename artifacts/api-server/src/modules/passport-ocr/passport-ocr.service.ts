/**
 * PassportOcrService — orchestrates image preprocessing, OCR, MRZ parsing,
 * field extraction, validation, and confidence scoring.
 * Depends only on the OcrProvider interface; the concrete provider is injected.
 */

import type { OcrProvider, PassportData, PassportOcrResult } from './types.js';
import { preprocessPassportImage } from './image.service.js';
import { parseMrz } from './mrz.service.js';
import { validatePassportData } from './validators.js';

// ─── Country / nationality name normalization ──────────────────────────────────

const ICAO_TO_NAME: Record<string, string> = {
  AFG: 'AFGHANISTAN', ALB: 'ALBANIA', DZA: 'ALGERIA', AND: 'ANDORRA',
  AGO: 'ANGOLA', ARG: 'ARGENTINA', ARM: 'ARMENIA', AUS: 'AUSTRALIA',
  AUT: 'AUSTRIA', AZE: 'AZERBAIJAN', BHS: 'BAHAMAS', BHR: 'BAHRAIN',
  BGD: 'BANGLADESH', BLR: 'BELARUS', BEL: 'BELGIUM', BLZ: 'BELIZE',
  BEN: 'BENIN', BTN: 'BHUTAN', BOL: 'BOLIVIA', BIH: 'BOSNIA',
  BWA: 'BOTSWANA', BRA: 'BRAZIL', BRN: 'BRUNEI', BGR: 'BULGARIA',
  BFA: 'BURKINA FASO', BDI: 'BURUNDI', KHM: 'CAMBODIA', CMR: 'CAMEROON',
  CAN: 'CANADA', CAF: 'CENTRAL AFRICAN REPUBLIC', TCD: 'CHAD',
  CHL: 'CHILE', CHN: 'CHINA', COL: 'COLOMBIA', COD: 'DR CONGO',
  COG: 'CONGO', CRI: 'COSTA RICA', CIV: "COTE D'IVOIRE", HRV: 'CROATIA',
  CUB: 'CUBA', CYP: 'CYPRUS', CZE: 'CZECH REPUBLIC', DNK: 'DENMARK',
  DJI: 'DJIBOUTI', DOM: 'DOMINICAN REPUBLIC', ECU: 'ECUADOR',
  EGY: 'EGYPT', SLV: 'EL SALVADOR', GNQ: 'EQUATORIAL GUINEA',
  ERI: 'ERITREA', EST: 'ESTONIA', ETH: 'ETHIOPIA', FJI: 'FIJI',
  FIN: 'FINLAND', FRA: 'FRANCE', GAB: 'GABON', GMB: 'GAMBIA',
  GEO: 'GEORGIA', DEU: 'GERMANY', GHA: 'GHANA', GRC: 'GREECE',
  GTM: 'GUATEMALA', GIN: 'GUINEA', GNB: 'GUINEA-BISSAU', GUY: 'GUYANA',
  HTI: 'HAITI', HND: 'HONDURAS', HUN: 'HUNGARY', ISL: 'ICELAND',
  IND: 'INDIA', IDN: 'INDONESIA', IRN: 'IRAN', IRQ: 'IRAQ',
  IRL: 'IRELAND', ISR: 'ISRAEL', ITA: 'ITALY', JAM: 'JAMAICA',
  JPN: 'JAPAN', JOR: 'JORDAN', KAZ: 'KAZAKHSTAN', KEN: 'KENYA',
  PRK: 'NORTH KOREA', KOR: 'SOUTH KOREA', KWT: 'KUWAIT', KGZ: 'KYRGYZSTAN',
  LAO: 'LAOS', LVA: 'LATVIA', LBN: 'LEBANON', LSO: 'LESOTHO',
  LBR: 'LIBERIA', LBY: 'LIBYA', LIE: 'LIECHTENSTEIN', LTU: 'LITHUANIA',
  LUX: 'LUXEMBOURG', MKD: 'NORTH MACEDONIA', MDG: 'MADAGASCAR',
  MWI: 'MALAWI', MYS: 'MALAYSIA', MDV: 'MALDIVES', MLI: 'MALI',
  MLT: 'MALTA', MRT: 'MAURITANIA', MEX: 'MEXICO', MDA: 'MOLDOVA',
  MNG: 'MONGOLIA', MNE: 'MONTENEGRO', MAR: 'MOROCCO', MOZ: 'MOZAMBIQUE',
  MMR: 'MYANMAR', NAM: 'NAMIBIA', NPL: 'NEPAL', NLD: 'NETHERLANDS',
  NZL: 'NEW ZEALAND', NIC: 'NICARAGUA', NER: 'NIGER', NGA: 'NIGERIA',
  NOR: 'NORWAY', OMN: 'OMAN', PAK: 'PAKISTAN', PAN: 'PANAMA',
  PNG: 'PAPUA NEW GUINEA', PRY: 'PARAGUAY', PER: 'PERU', PHL: 'PHILIPPINES',
  POL: 'POLAND', PRT: 'PORTUGAL', QAT: 'QATAR', ROU: 'ROMANIA',
  RUS: 'RUSSIA', RWA: 'RWANDA', SAU: 'SAUDI ARABIA', SEN: 'SENEGAL',
  SRB: 'SERBIA', SLE: 'SIERRA LEONE', SGP: 'SINGAPORE', SVK: 'SLOVAKIA',
  SVN: 'SLOVENIA', SOM: 'SOMALIA', ZAF: 'SOUTH AFRICA', SSD: 'SOUTH SUDAN',
  ESP: 'SPAIN', LKA: 'SRI LANKA', SDN: 'SUDAN', SWE: 'SWEDEN',
  CHE: 'SWITZERLAND', SYR: 'SYRIA', TWN: 'TAIWAN', TJK: 'TAJIKISTAN',
  TZA: 'TANZANIA', THA: 'THAILAND', TGO: 'TOGO', TUN: 'TUNISIA',
  TUR: 'TURKEY', TKM: 'TURKMENISTAN', UGA: 'UGANDA', UKR: 'UKRAINE',
  ARE: 'UNITED ARAB EMIRATES', GBR: 'UNITED KINGDOM', USA: 'UNITED STATES',
  URY: 'URUGUAY', UZB: 'UZBEKISTAN', VEN: 'VENEZUELA', VNM: 'VIETNAM',
  YEM: 'YEMEN', ZMB: 'ZAMBIA', ZWE: 'ZIMBABWE',
};

function countryName(code: string): string {
  return ICAO_TO_NAME[code.toUpperCase()] ?? code;
}

// ─── Date extraction from freetext OCR ────────────────────────────────────────

const DATE_PATTERNS = [
  // ISO: 2024-01-14
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  // DD/MM/YYYY or DD.MM.YYYY
  /\b(\d{2})[./](\d{2})[./](\d{4})\b/,
  // DD MMM YYYY e.g. 14 JAN 2024
  /\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})\b/i,
];

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

function extractDate(text: string, hintKeywords: string[]): string {
  // Focus on lines that contain the hint keywords
  const lines = text.split('\n');
  for (const hint of hintKeywords) {
    const relevantLines = lines.filter(l =>
      l.toLowerCase().includes(hint.toLowerCase()),
    );
    for (const line of relevantLines) {
      const d = tryExtractDate(line);
      if (d) return d;
    }
  }
  // Fallback: scan all text
  const all = tryExtractDate(text);
  return all ?? '';
}

function tryExtractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) continue;
    if (pattern === DATE_PATTERNS[0]) {
      return `${m[1]}-${m[2]}-${m[3]}`;
    }
    if (pattern === DATE_PATTERNS[1]) {
      return `${m[3]}-${m[2]}-${m[1]}`;
    }
    if (pattern === DATE_PATTERNS[2]) {
      const month = MONTH_MAP[m[2].toUpperCase()] ?? '01';
      const day = m[1].padStart(2, '0');
      return `${m[3]}-${month}-${day}`;
    }
  }
  return null;
}

// ─── Field extraction from freetext OCR ───────────────────────────────────────

function extractField(text: string, keywords: string[]): string {
  const lines = text.split('\n');
  for (const kw of keywords) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(kw.toLowerCase())) {
        // Try same line first (after colon)
        const colonIdx = lines[i].indexOf(':');
        if (colonIdx > 0) {
          const val = lines[i].slice(colonIdx + 1).trim();
          if (val.length > 1) return val;
        }
        // Try next line
        if (i + 1 < lines.length) {
          const next = lines[i + 1].trim();
          if (next.length > 1 && !/^\d+$/.test(next)) return next;
        }
      }
    }
  }
  return '';
}

function extractPassportNumber(text: string): string {
  // After "Passport No" or standalone 6-9 alphanumeric
  const after = extractField(text, ['passport no', 'passport number', 'document no', 'no.']);
  if (after && /^[A-Z0-9]{6,9}$/i.test(after.replace(/\s/g, ''))) {
    return after.replace(/\s/g, '').toUpperCase();
  }
  // Scan lines for standalone passport number pattern
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^([A-Z]{1,2}\d{6,7}|\d{8,9})$/i);
    if (m) return m[1].toUpperCase();
  }
  return '';
}

// ─── Confidence scoring ────────────────────────────────────────────────────────

function calculateConfidence(params: {
  ocrConfidence: number;
  mrzFound: boolean;
  mrzChecksumValid: boolean;
  fieldsExtracted: string[];
  validationErrors: string[];
}): number {
  let score = params.ocrConfidence;

  if (params.mrzFound) score = Math.min(100, score + 10);
  if (params.mrzChecksumValid) score = Math.min(100, score + 5);

  const required = ['passportNumber', 'surname', 'dateOfBirth', 'passportExpiry'];
  const missing = required.filter(f => !params.fieldsExtracted.includes(f));
  score -= missing.length * 8;

  score -= params.validationErrors.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Main service ──────────────────────────────────────────────────────────────

export class PassportOcrService {
  constructor(private readonly provider: OcrProvider) {}

  async process(rawImageBuffer: Buffer): Promise<PassportOcrResult> {
    const totalStart = Date.now();

    // 1. Preprocess image
    const processed = await preprocessPassportImage(rawImageBuffer);

    // 2a. Preferred: vision-LLM structured extraction. Reads the printed fields
    //     and MRZ semantically — reliable, unlike transcribing a perfect MRZ.
    if (this.provider.extractStructured) {
      const s = await this.provider.extractStructured(processed.buffer);
      if (!s) {
        throw Object.assign(
          new Error('Passport validation failed: no readable passport detected'),
          { code: 'PASSPORT_INVALID', details: ['لم يتم التعرف على جواز سفر واضح في الصورة'] },
        );
      }
      const fullName = [s.givenNames, s.surname].filter(Boolean).join(' ').trim();
      return this.buildResult(
        { ...s, fullName, mrzRaw: '' },
        {
          provider: this.provider.name,
          ocrConfidence: 92,
          mrzFound: false,
          mrzChecksumValid: false,
          trustSource: true, // LLM read the fields directly; gaps are user-editable
          totalStart,
        },
      );
    }

    // 2b. Fallback: raw-text OCR (Google/Azure/Tesseract) + MRZ/freetext parsing.
    const ocrResult = await this.provider.extractText(processed.buffer);
    const rawText = ocrResult.rawText;
    const mrz = parseMrz(rawText);

    const surname = mrz?.surname ?? extractField(rawText, ['surname', 'last name', 'family name']);
    const givenNames = mrz?.givenNames ?? extractField(rawText, ['given names', 'first name', 'forename', 'given name']);
    const passportNumber = mrz?.documentNumber ?? extractPassportNumber(rawText);
    const nationality = mrz?.nationality ?? extractField(rawText, ['nationality', 'national']);
    const issuingCountry = mrz?.issuingCountry ?? extractField(rawText, ['issuing country', 'issuing state', 'country of issue', 'country']);
    const gender = mrz
      ? (mrz.sex === 'M' ? 'M' : mrz.sex === 'F' ? 'F' : '')
      : (() => {
          const g = extractField(rawText, ['sex', 'gender']);
          if (/^m/i.test(g)) return 'M';
          if (/^f/i.test(g)) return 'F';
          return '';
        })();
    const dateOfBirth = mrz?.dateOfBirth ?? extractDate(rawText, ['date of birth', 'birth', 'born', 'dob']);
    const passportExpiry = mrz?.expiryDate ?? extractDate(rawText, ['expiry', 'expiration', 'valid until', 'date of expiry']);
    const passportIssueDate = extractDate(rawText, ['issue date', 'date of issue', 'issued', 'date issued']);
    const placeOfBirth = extractField(rawText, ['place of birth', 'birthplace', 'born in']);
    const passportType = mrz?.type ?? 'P';
    const fullName = [givenNames, surname].filter(Boolean).join(' ').trim()
      || extractField(rawText, ['name', 'full name', 'holder']);

    return this.buildResult(
      {
        passportType,
        passportNumber,
        surname,
        givenNames,
        fullName,
        nationality,
        issuingCountry,
        gender,
        dateOfBirth,
        passportIssueDate,
        passportExpiry,
        placeOfBirth,
        mrzRaw: mrz?.raw ?? '',
      },
      {
        provider: ocrResult.provider,
        ocrConfidence: ocrResult.confidence,
        mrzFound: !!mrz,
        mrzChecksumValid: mrz?.checksumValid ?? false,
        trustSource: !!mrz, // MRZ is trusted; freetext-only must pass validation
        totalStart,
      },
    );
  }

  /** Validate, score confidence, and assemble the final result from extracted fields. */
  private buildResult(
    fields: {
      passportType: string;
      passportNumber: string;
      surname: string;
      givenNames: string;
      fullName: string;
      nationality: string;
      issuingCountry: string;
      gender: string;
      dateOfBirth: string;
      passportIssueDate: string;
      passportExpiry: string;
      placeOfBirth: string;
      mrzRaw: string;
    },
    meta: {
      provider: string;
      ocrConfidence: number;
      mrzFound: boolean;
      mrzChecksumValid: boolean;
      trustSource: boolean;
      totalStart: number;
    },
  ): PassportOcrResult {
    const validationErrors = validatePassportData({
      passportNumber: fields.passportNumber,
      passportExpiry: fields.passportExpiry,
      passportIssueDate: fields.passportIssueDate,
      dateOfBirth: fields.dateOfBirth,
      nationality: fields.nationality,
    });

    // Hard-fail only without a trusted source (no MRZ, no structured LLM read):
    // that likely means the image isn't a passport. A trusted source may have
    // small gaps the user can correct in the review screen.
    if (validationErrors.length > 0 && !meta.trustSource) {
      throw Object.assign(new Error(`Passport validation failed: ${validationErrors.join('; ')}`), {
        code: 'PASSPORT_INVALID',
        details: validationErrors,
      });
    }

    const extractedFields = [
      fields.passportNumber && 'passportNumber',
      fields.surname && 'surname',
      fields.givenNames && 'givenNames',
      fields.dateOfBirth && 'dateOfBirth',
      fields.passportExpiry && 'passportExpiry',
    ].filter(Boolean) as string[];

    const confidence = calculateConfidence({
      ocrConfidence: meta.ocrConfidence,
      mrzFound: meta.mrzFound,
      mrzChecksumValid: meta.mrzChecksumValid,
      fieldsExtracted: extractedFields,
      validationErrors,
    });

    const passport: PassportData = {
      passportType: fields.passportType,
      passportNumber: fields.passportNumber,
      surname: fields.surname,
      givenNames: fields.givenNames,
      fullName: fields.fullName,
      nationality: fields.nationality,
      issuingCountry: countryName(fields.issuingCountry || fields.nationality),
      gender: fields.gender,
      dateOfBirth: fields.dateOfBirth,
      passportIssueDate: fields.passportIssueDate,
      passportExpiry: fields.passportExpiry,
      placeOfBirth: fields.placeOfBirth,
      mrz: fields.mrzRaw,
      confidence,
    };

    return {
      success: true,
      passport,
      provider: meta.provider,
      durationMs: Date.now() - meta.totalStart,
    };
  }
}
