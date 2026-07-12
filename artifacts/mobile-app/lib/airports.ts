export interface Airport {
  iata: string;
  arabic: string;
  city: string;
  cityEn: string;
  country: string;
  countryEn: string;
}

export const AIRPORT_DB: Airport[] = [
  // ── Iraq ──
  { iata:'BGW', arabic:'مطار بغداد الدولي',               city:'بغداد',     cityEn:'Baghdad',       country:'العراق',              countryEn:'Iraq' },
  { iata:'BSR', arabic:'مطار البصرة الدولي',              city:'البصرة',    cityEn:'Basra',         country:'العراق',              countryEn:'Iraq' },
  { iata:'NJF', arabic:'مطار النجف الأشرف الدولي',        city:'النجف',     cityEn:'Najaf',         country:'العراق',              countryEn:'Iraq' },
  { iata:'EBL', arabic:'مطار أربيل الدولي',               city:'أربيل',     cityEn:'Erbil',         country:'العراق',              countryEn:'Iraq' },
  { iata:'ISU', arabic:'مطار السليمانية الدولي',           city:'السليمانية',cityEn:'Sulaymaniyah',  country:'العراق',              countryEn:'Iraq' },
  { iata:'OSM', arabic:'مطار الموصل الدولي',              city:'الموصل',    cityEn:'Mosul',         country:'العراق',              countryEn:'Iraq' },
  // ── UAE ──
  { iata:'DXB', arabic:'مطار دبي الدولي',                 city:'دبي',       cityEn:'Dubai',         country:'الإمارات',            countryEn:'UAE' },
  { iata:'DWC', arabic:'مطار آل مكتوم الدولي',            city:'دبي',       cityEn:'Dubai',         country:'الإمارات',            countryEn:'UAE' },
  { iata:'AUH', arabic:'مطار أبوظبي الدولي',              city:'أبوظبي',    cityEn:'Abu Dhabi',     country:'الإمارات',            countryEn:'UAE' },
  { iata:'SHJ', arabic:'مطار الشارقة الدولي',             city:'الشارقة',   cityEn:'Sharjah',       country:'الإمارات',            countryEn:'UAE' },
  // ── Saudi Arabia ──
  { iata:'RUH', arabic:'مطار الملك خالد الدولي',           city:'الرياض',    cityEn:'Riyadh',        country:'السعودية',            countryEn:'Saudi Arabia' },
  { iata:'JED', arabic:'مطار الملك عبدالعزيز الدولي',     city:'جدة',       cityEn:'Jeddah',        country:'السعودية',            countryEn:'Saudi Arabia' },
  { iata:'MED', arabic:'مطار الأمير محمد بن عبدالعزيز',  city:'المدينة',   cityEn:'Medina',        country:'السعودية',            countryEn:'Saudi Arabia' },
  { iata:'DMM', arabic:'مطار الملك فهد الدولي',            city:'الدمام',    cityEn:'Dammam',        country:'السعودية',            countryEn:'Saudi Arabia' },
  // ── Qatar ──
  { iata:'DOH', arabic:'مطار حمد الدولي',                 city:'الدوحة',    cityEn:'Doha',          country:'قطر',                 countryEn:'Qatar' },
  // ── Kuwait ──
  { iata:'KWI', arabic:'مطار الكويت الدولي',              city:'الكويت',    cityEn:'Kuwait City',   country:'الكويت',              countryEn:'Kuwait' },
  // ── Bahrain ──
  { iata:'BAH', arabic:'مطار البحرين الدولي',             city:'المنامة',   cityEn:'Manama',        country:'البحرين',             countryEn:'Bahrain' },
  // ── Oman ──
  { iata:'MCT', arabic:'مطار مسقط الدولي',                city:'مسقط',      cityEn:'Muscat',        country:'عُمان',               countryEn:'Oman' },
  { iata:'SLL', arabic:'مطار صلالة',                       city:'صلالة',     cityEn:'Salalah',       country:'عُمان',               countryEn:'Oman' },
  // ── Egypt ──
  { iata:'CAI', arabic:'مطار القاهرة الدولي',             city:'القاهرة',   cityEn:'Cairo',         country:'مصر',                 countryEn:'Egypt' },
  { iata:'HBE', arabic:'مطار برج العرب الدولي',            city:'الإسكندرية',cityEn:'Alexandria',   country:'مصر',                 countryEn:'Egypt' },
  { iata:'SSH', arabic:'مطار شرم الشيخ الدولي',            city:'شرم الشيخ', cityEn:'Sharm El-Sheikh',country:'مصر',               countryEn:'Egypt' },
  { iata:'HRG', arabic:'مطار الغردقة الدولي',              city:'الغردقة',   cityEn:'Hurghada',      country:'مصر',                 countryEn:'Egypt' },
  { iata:'LXR', arabic:'مطار الأقصر الدولي',              city:'الأقصر',    cityEn:'Luxor',         country:'مصر',                 countryEn:'Egypt' },
  // ── Jordan ──
  { iata:'AMM', arabic:'مطار الملكة علياء الدولي',        city:'عمان',      cityEn:'Amman',         country:'الأردن',              countryEn:'Jordan' },
  // ── Lebanon ──
  { iata:'BEY', arabic:'مطار رفيق الحريري الدولي',         city:'بيروت',     cityEn:'Beirut',        country:'لبنان',               countryEn:'Lebanon' },
  // ── Turkey ──
  { iata:'IST', arabic:'مطار إسطنبول الدولي',             city:'إسطنبول',   cityEn:'Istanbul',      country:'تركيا',               countryEn:'Turkey' },
  { iata:'SAW', arabic:'مطار صبيحة كوكجن',                 city:'إسطنبول',   cityEn:'Istanbul',      country:'تركيا',               countryEn:'Turkey' },
  { iata:'AYT', arabic:'مطار أنطاليا',                     city:'أنطاليا',   cityEn:'Antalya',       country:'تركيا',               countryEn:'Turkey' },
  { iata:'ADB', arabic:'مطار إزمير أدنان مندريس',         city:'إزمير',     cityEn:'Izmir',         country:'تركيا',               countryEn:'Turkey' },
  { iata:'ESB', arabic:'مطار أنقرة أتاتورك',              city:'أنقرة',     cityEn:'Ankara',        country:'تركيا',               countryEn:'Turkey' },
  { iata:'TZX', arabic:'مطار طرابزون',                     city:'طرابزون',   cityEn:'Trabzon',       country:'تركيا',               countryEn:'Turkey' },
  // ── UK ──
  { iata:'LHR', arabic:'مطار هيثرو لندن',                 city:'لندن',      cityEn:'London',        country:'المملكة المتحدة',     countryEn:'UK' },
  { iata:'LGW', arabic:'مطار غاتويك لندن',                city:'لندن',      cityEn:'London',        country:'المملكة المتحدة',     countryEn:'UK' },
  { iata:'STN', arabic:'مطار ستانستد لندن',               city:'لندن',      cityEn:'London',        country:'المملكة المتحدة',     countryEn:'UK' },
  { iata:'MAN', arabic:'مطار مانشستر',                     city:'مانشستر',   cityEn:'Manchester',    country:'المملكة المتحدة',     countryEn:'UK' },
  { iata:'BHX', arabic:'مطار برمنغهام',                    city:'برمنغهام',  cityEn:'Birmingham',    country:'المملكة المتحدة',     countryEn:'UK' },
  // ── Germany ──
  { iata:'FRA', arabic:'مطار فرانكفورت الدولي',           city:'فرانكفورت', cityEn:'Frankfurt',     country:'ألمانيا',             countryEn:'Germany' },
  { iata:'MUC', arabic:'مطار ميونخ الدولي',               city:'ميونخ',     cityEn:'Munich',        country:'ألمانيا',             countryEn:'Germany' },
  { iata:'BER', arabic:'مطار برلين براندنبورغ',           city:'برلين',     cityEn:'Berlin',        country:'ألمانيا',             countryEn:'Germany' },
  // ── France ──
  { iata:'CDG', arabic:'مطار شارل ديغول باريس',           city:'باريس',     cityEn:'Paris',         country:'فرنسا',               countryEn:'France' },
  { iata:'ORY', arabic:'مطار أورلي باريس',                city:'باريس',     cityEn:'Paris',         country:'فرنسا',               countryEn:'France' },
  // ── Netherlands ──
  { iata:'AMS', arabic:'مطار أمستردام سخيبول',            city:'أمستردام',  cityEn:'Amsterdam',     country:'هولندا',              countryEn:'Netherlands' },
  // ── Italy ──
  { iata:'FCO', arabic:'مطار روما فيوميتشينو',            city:'روما',      cityEn:'Rome',          country:'إيطاليا',             countryEn:'Italy' },
  { iata:'MXP', arabic:'مطار ميلانو مالبنسا',             city:'ميلانو',    cityEn:'Milan',         country:'إيطاليا',             countryEn:'Italy' },
  // ── Spain ──
  { iata:'MAD', arabic:'مطار مدريد باراخاس',              city:'مدريد',     cityEn:'Madrid',        country:'إسبانيا',             countryEn:'Spain' },
  { iata:'BCN', arabic:'مطار برشلونة الدولي',             city:'برشلونة',   cityEn:'Barcelona',     country:'إسبانيا',             countryEn:'Spain' },
  // ── Austria ──
  { iata:'VIE', arabic:'مطار فيينا الدولي',              city:'فيينا',     cityEn:'Vienna',        country:'النمسا',              countryEn:'Austria' },
  // ── Switzerland ──
  { iata:'ZRH', arabic:'مطار زيورخ الدولي',              city:'زيورخ',     cityEn:'Zurich',        country:'سويسرا',              countryEn:'Switzerland' },
  { iata:'GVA', arabic:'مطار جنيف الدولي',               city:'جنيف',      cityEn:'Geneva',        country:'سويسرا',              countryEn:'Switzerland' },
  // ── Belgium ──
  { iata:'BRU', arabic:'مطار بروكسل الدولي',             city:'بروكسل',    cityEn:'Brussels',      country:'بلجيكا',              countryEn:'Belgium' },
  // ── Greece ──
  { iata:'ATH', arabic:'مطار أثينا إليفثيريوس فينيزيلوس',city:'أثينا',    cityEn:'Athens',        country:'اليونان',             countryEn:'Greece' },
  // ── Georgia ──
  { iata:'TBS', arabic:'مطار تبيليسي الدولي',            city:'تبيليسي',   cityEn:'Tbilisi',       country:'جورجيا',              countryEn:'Georgia' },
  // ── Iran ──
  { iata:'IKA', arabic:'مطار الإمام الخميني الدولي',      city:'طهران',     cityEn:'Tehran',        country:'إيران',               countryEn:'Iran' },
  { iata:'THR', arabic:'مطار مهرآباد طهران',              city:'طهران',     cityEn:'Tehran',        country:'إيران',               countryEn:'Iran' },
  // ── Pakistan ──
  { iata:'KHI', arabic:'مطار جناح الدولي كراتشي',        city:'كراتشي',    cityEn:'Karachi',       country:'باكستان',             countryEn:'Pakistan' },
  { iata:'LHE', arabic:'مطار علامة إقبال الدولي لاهور',  city:'لاهور',     cityEn:'Lahore',        country:'باكستان',             countryEn:'Pakistan' },
  { iata:'ISB', arabic:'مطار إسلام آباد الدولي',          city:'إسلام آباد',cityEn:'Islamabad',     country:'باكستان',             countryEn:'Pakistan' },
  // ── India ──
  { iata:'DEL', arabic:'مطار إنديرا غاندي الدولي دلهي',  city:'دلهي',      cityEn:'Delhi',         country:'الهند',               countryEn:'India' },
  { iata:'BOM', arabic:'مطار تشاتراباتي شيفاجي مومباي', city:'مومباي',    cityEn:'Mumbai',        country:'الهند',               countryEn:'India' },
  // ── Malaysia ──
  { iata:'KUL', arabic:'مطار كوالالمبور الدولي',          city:'كوالالمبور',cityEn:'Kuala Lumpur',  country:'ماليزيا',             countryEn:'Malaysia' },
  // ── Thailand ──
  { iata:'BKK', arabic:'مطار سوفارنابهومي بانكوك',       city:'بانكوك',    cityEn:'Bangkok',       country:'تايلاند',             countryEn:'Thailand' },
  { iata:'DMK', arabic:'مطار دون مواينغ بانكوك',          city:'بانكوك',    cityEn:'Bangkok',       country:'تايلاند',             countryEn:'Thailand' },
  // ── Indonesia ──
  { iata:'CGK', arabic:'مطار سوكارنو-هاتا جاكرتا',       city:'جاكرتا',    cityEn:'Jakarta',       country:'إندونيسيا',           countryEn:'Indonesia' },
  // ── Morocco ──
  { iata:'CMN', arabic:'مطار محمد الخامس الدولي',         city:'الدار البيضاء',cityEn:'Casablanca', country:'المغرب',              countryEn:'Morocco' },
  // ── Tunisia ──
  { iata:'TUN', arabic:'مطار تونس قرطاج الدولي',          city:'تونس',      cityEn:'Tunis',         country:'تونس',                countryEn:'Tunisia' },
  // ── Algeria ──
  { iata:'ALG', arabic:'مطار هواري بومدين الدولي',        city:'الجزائر',   cityEn:'Algiers',       country:'الجزائر',             countryEn:'Algeria' },
  // ── Libya ──
  { iata:'TIP', arabic:'مطار طرابلس الدولي',              city:'طرابلس',    cityEn:'Tripoli',       country:'ليبيا',               countryEn:'Libya' },
  // ── Sudan ──
  { iata:'KRT', arabic:'مطار الخرطوم الدولي',             city:'الخرطوم',   cityEn:'Khartoum',      country:'السودان',             countryEn:'Sudan' },
  // ── Syria ──
  { iata:'DAM', arabic:'مطار دمشق الدولي',                city:'دمشق',      cityEn:'Damascus',      country:'سوريا',               countryEn:'Syria' },
  // ── USA ──
  { iata:'JFK', arabic:'مطار جون إف كينيدي نيويورك',     city:'نيويورك',   cityEn:'New York',      country:'الولايات المتحدة',    countryEn:'USA' },
  { iata:'LAX', arabic:'مطار لوس أنجلوس الدولي',         city:'لوس أنجلوس',cityEn:'Los Angeles',   country:'الولايات المتحدة',    countryEn:'USA' },
  { iata:'ORD', arabic:'مطار أوهير شيكاغو',               city:'شيكاغو',    cityEn:'Chicago',       country:'الولايات المتحدة',    countryEn:'USA' },
];

export const AIRPORT_MAP = new Map<string, Airport>(AIRPORT_DB.map(a => [a.iata, a]));

export function searchAirports(q: string, limit = 8): Airport[] {
  if (!q.trim()) return [];
  const upper = q.toUpperCase().trim();
  const lower = q.toLowerCase().trim();
  const exact = AIRPORT_DB.filter(a => a.iata.startsWith(upper));
  const rest = AIRPORT_DB.filter(a =>
    !a.iata.startsWith(upper) && (
      a.arabic.includes(q) ||
      a.city.includes(q) ||
      a.country.includes(q) ||
      a.cityEn.toLowerCase().includes(lower) ||
      a.countryEn.toLowerCase().includes(lower) ||
      a.iata.includes(upper)
    )
  );
  return [...exact, ...rest].slice(0, limit);
}
