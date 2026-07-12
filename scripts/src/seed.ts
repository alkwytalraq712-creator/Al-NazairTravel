/**
 * Seed script for Qema Travel Platform
 * Creates: admin user, sample visas, packages, banners, testimonials
 */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/src/schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

/** Generates a cryptographically random password (24 chars, URL-safe base64). */
function generateRandomPassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function main() {
  console.log("🌱 Starting Qema Travel seed...");

  // ── Admin user ────────────────────────────────────────────────────────────
  // Use ADMIN_PASSWORD env var if provided, otherwise generate a random password.
  // The generated password is printed once (only when the account is newly created).
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@qema.com";
  const adminPhone = process.env.ADMIN_PHONE ?? "+9647801234567";
  const generatedPassword = process.env.ADMIN_PASSWORD ?? generateRandomPassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 10);
  const [admin] = await db
    .insert(schema.usersTable)
    .values({
      fullName: "مدير النظام",
      phone: adminPhone,
      email: adminEmail,
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();
  if (admin) {
    console.log("✅ Admin user created (account did not previously exist).");
    if (!process.env.ADMIN_PASSWORD) {
      // Only print the generated password to stdout during initial setup.
      // Store it immediately; it cannot be recovered after this point.
      console.log("🔑 Generated admin password (save this now):", generatedPassword);
    }
  } else {
    console.log("✅ Admin user already exists — credentials unchanged.");
  }

  // ── Visas ─────────────────────────────────────────────────────────────────
  const visas = [
    {
      countryName: "تركيا",
      countryFlagUrl: "https://flagcdn.com/w80/tr.png",
      countryImageUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
      visaType: "tourism",
      processingTime: "3-5 أيام عمل",
      stayDuration: "30 يوماً",
      price: "85",
      currency: "USD",
      description: "تأشيرة سياحية لتركيا تمنح حاملها حق الدخول والإقامة لمدة 30 يوماً، وتشمل استكشاف إسطنبول وكبادوكيا والساحل التركي.",
      requiredDocuments: ["جواز سفر ساري", "صورة شخصية", "كشف حساب بنكي", "تأمين سفر", "حجز فندقي"],
      entriesAllowed: "دخول مرة واحدة",
      validity: "90 يوماً",
      isFeatured: true,
    },
    {
      countryName: "الإمارات العربية المتحدة",
      countryFlagUrl: "https://flagcdn.com/w80/ae.png",
      countryImageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      visaType: "tourism",
      processingTime: "24-48 ساعة",
      stayDuration: "30 يوماً",
      price: "120",
      currency: "USD",
      description: "تأشيرة الإمارات السياحية لاستكشاف دبي وأبوظبي والشارقة مع كامل الخدمات السياحية.",
      requiredDocuments: ["جواز سفر ساري", "صورة شخصية", "حجز فندقي", "تذكرة طيران"],
      entriesAllowed: "دخول مرة واحدة",
      validity: "60 يوماً",
      isFeatured: true,
    },
    {
      countryName: "المملكة المتحدة",
      countryFlagUrl: "https://flagcdn.com/w80/gb.png",
      countryImageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800",
      visaType: "tourism",
      processingTime: "15-21 يوم عمل",
      stayDuration: "180 يوماً",
      price: "350",
      currency: "USD",
      description: "تأشيرة بريطانيا السياحية تتيح زيارة لندن وإنجلترا واسكتلندا وويلز خلال فترة إقامة تصل إلى 6 أشهر.",
      requiredDocuments: ["جواز سفر ساري", "كشف حساب بنكي لـ 6 أشهر", "عقد عمل", "صورة شخصية", "تأمين طبي", "إثبات سكن"],
      entriesAllowed: "دخول متعدد",
      validity: "6 أشهر",
      isFeatured: false,
    },
    {
      countryName: "ماليزيا",
      countryFlagUrl: "https://flagcdn.com/w80/my.png",
      countryImageUrl: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800",
      visaType: "tourism",
      processingTime: "3-7 أيام عمل",
      stayDuration: "30 يوماً",
      price: "60",
      currency: "USD",
      description: "تأشيرة ماليزيا السياحية لاستكشاف كوالالمبور وبينانج ولنكاوي مع طبيعة استوائية خلابة.",
      requiredDocuments: ["جواز سفر ساري", "صورة شخصية", "حجز فندقي"],
      entriesAllowed: "دخول مرة واحدة",
      validity: "90 يوماً",
      isFeatured: true,
    },
    {
      countryName: "ألمانيا",
      countryFlagUrl: "https://flagcdn.com/w80/de.png",
      countryImageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800",
      visaType: "tourism",
      processingTime: "15-20 يوم عمل",
      stayDuration: "90 يوماً",
      price: "280",
      currency: "USD",
      description: "تأشيرة شنغن الألمانية تفتح أمامك أبواب 26 دولة أوروبية، ابدأ رحلتك من برلين وميونخ.",
      requiredDocuments: ["جواز سفر ساري", "كشف حساب بنكي", "تأمين سفر أوروبي", "عقد إيجار أو ملكية", "صورة شخصية", "تذاكر طيران ذهاباً وإياباً"],
      entriesAllowed: "دخول متعدد",
      validity: "180 يوماً",
      isFeatured: false,
    },
    {
      countryName: "السعودية",
      countryFlagUrl: "https://flagcdn.com/w80/sa.png",
      countryImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      visaType: "visit",
      processingTime: "7-14 يوم عمل",
      stayDuration: "30 يوماً",
      price: "100",
      currency: "USD",
      description: "تأشيرة الزيارة للمملكة العربية السعودية لزيارة الأقارب والأصدقاء أو أداء العمرة.",
      requiredDocuments: ["جواز سفر ساري", "دعوة من المضيف", "صورة شخصية", "تذكرة طيران"],
      entriesAllowed: "دخول مرة واحدة",
      validity: "90 يوماً",
      isFeatured: false,
    },
    {
      countryName: "اليونان",
      countryFlagUrl: "https://flagcdn.com/w80/gr.png",
      countryImageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800",
      visaType: "tourism",
      processingTime: "10-15 يوم عمل",
      stayDuration: "90 يوماً",
      price: "260",
      currency: "USD",
      description: "تأشيرة شنغن اليونانية للاستمتاع بجزر الأيجي وأثينا وسانتوريني ومياورتها الزرقاء.",
      requiredDocuments: ["جواز سفر ساري", "كشف حساب بنكي", "تأمين سفر", "حجز فندقي", "صورة شخصية"],
      entriesAllowed: "دخول متعدد",
      validity: "180 يوماً",
      isFeatured: true,
    },
    {
      countryName: "إيران",
      countryFlagUrl: "https://flagcdn.com/w80/ir.png",
      countryImageUrl: "https://images.unsplash.com/photo-1619625900268-c5d01d69f34d?w=800",
      visaType: "tourism",
      processingTime: "5-10 أيام عمل",
      stayDuration: "30 يوماً",
      price: "40",
      currency: "USD",
      description: "تأشيرة إيران السياحية لاكتشاف طهران وأصفهان وشيراز والمعالم التاريخية والحضارية الغنية.",
      requiredDocuments: ["جواز سفر ساري", "صورة شخصية", "تأمين سفر"],
      entriesAllowed: "دخول مرة واحدة",
      validity: "90 يوماً",
      isFeatured: false,
    },
    {
      countryName: "الصين",
      countryFlagUrl: "https://flagcdn.com/w80/cn.png",
      countryImageUrl: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800",
      visaType: "business",
      processingTime: "7-10 أيام عمل",
      stayDuration: "30 يوماً",
      price: "200",
      currency: "USD",
      description: "تأشيرة الصين التجارية لإجراء أعمال ولقاءات تجارية في بكين وشنغهاي وغوانغجو.",
      requiredDocuments: ["جواز سفر ساري", "دعوة شركة صينية", "صورة شخصية", "عقد عمل", "وثائق الشركة"],
      entriesAllowed: "دخول مرة واحدة",
      validity: "90 يوماً",
      isFeatured: false,
    },
    {
      countryName: "كندا",
      countryFlagUrl: "https://flagcdn.com/w80/ca.png",
      countryImageUrl: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800",
      visaType: "study",
      processingTime: "30-60 يوم",
      stayDuration: "مدة الدراسة",
      price: "150",
      currency: "USD",
      description: "تأشيرة كندا للدراسة تتيح الدراسة في الجامعات والمعاهد الكندية المعترف بها دولياً.",
      requiredDocuments: ["جواز سفر ساري", "قبول من مؤسسة تعليمية", "كشف حساب بنكي", "شهادات دراسية", "صورة شخصية"],
      entriesAllowed: "دخول متعدد",
      validity: "مدة الدراسة + 90 يوم",
      isFeatured: false,
    },
  ];

  let visaCount = 0;
  for (const visa of visas) {
    await db.insert(schema.visasTable).values(visa).onConflictDoNothing();
    visaCount++;
  }
  console.log(`✅ Inserted ${visaCount} visas`);

  // ── Packages ──────────────────────────────────────────────────────────────
  const packages = [
    {
      name: "باقة تركيا السياحية الشاملة",
      country: "تركيا",
      city: "إسطنبول",
      days: 7,
      nights: 6,
      priceFrom: "850",
      currency: "USD",
      rating: "4.8",
      images: [
        "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
        "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800",
        "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800",
      ],
      description: "استمتع بأجمل تجربة سياحية في تركيا مع باقتنا الشاملة التي تغطي إسطنبول العريقة وكبادوكيا الساحرة، مع أفضل الفنادق والخدمات.",
      hotelsIncluded: ["فندق بوسفور 5 نجوم", "منتجع كبادوكيا 4 نجوم"],
      hotelStars: 5,
      roomType: "غرفة مزدوجة مطلة على البوسفور",
      meals: "إفطار + عشاء",
      transportation: "حافلة خاصة مكيفة + رحلات بحرية",
      itinerary: [
        { day: 1, title: "الوصول إلى إسطنبول", description: "الاستقبال في المطار والتوجه للفندق، جولة مسائية في شارع الاستقلال" },
        { day: 2, title: "إسطنبول التاريخية", description: "زيارة آيا صوفيا، المسجد الأزرق، قصر توبكابي، والبازار الكبير" },
        { day: 3, title: "جولة البوسفور", description: "رحلة بحرية في مضيق البوسفور، زيارة قصر دولمة بهشة، التسوق في شارع بغداد" },
        { day: 4, title: "السفر إلى كبادوكيا", description: "رحلة بالطائرة إلى كبادوكيا، جولة في وادي غوريم والمنازل الحجرية" },
        { day: 5, title: "منطاد كبادوكيا", description: "رحلة المنطاد الهوائي عند الشروق، زيارة المدينة الجوفية" },
        { day: 6, title: "العودة إلى إسطنبول", description: "التسوق وشراء الهدايا، وجبة عشاء على ضفاف البوسفور" },
        { day: 7, title: "المغادرة", description: "الإفطار في الفندق، التوجه للمطار ومغادرة إسطنبول" },
      ],
      includedServices: ["تذاكر الطيران ذهاباً وإياباً", "الإقامة الفندقية", "وجبتا الإفطار والعشاء", "جولات سياحية منظمة", "مرشد سياحي ناطق بالعربية", "تأمين سفر شامل", "رسوم التأشيرة"],
      excludedServices: ["الغداء والمشروبات", "المشتريات الشخصية", "الرحلات الاختيارية الإضافية"],
      cancellationPolicy: "استرداد كامل قبل 30 يوماً من السفر، 50% قبل 15 يوماً، لا استرداد قبل 7 أيام.",
      isFeatured: true,
    },
    {
      name: "باقة دبي الفاخرة",
      country: "الإمارات",
      city: "دبي",
      days: 5,
      nights: 4,
      priceFrom: "1200",
      currency: "USD",
      rating: "4.9",
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
        "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800",
        "https://images.unsplash.com/photo-1497196823404-14f77de4e6f6?w=800",
      ],
      description: "تجربة فاخرة في دبي المدينة التي لا تنام، مع إقامة في أفخم الفنادق وزيارة أشهر المعالم السياحية.",
      hotelsIncluded: ["برج العرب أو فندق أتلانتس 5 نجوم"],
      hotelStars: 5,
      roomType: "جناح ملكي مع إطلالة على البحر",
      meals: "إفطار على الطراز الأمريكي",
      transportation: "ليموزين خاص + تاكسي فاخر",
      itinerary: [
        { day: 1, title: "الوصول إلى دبي", description: "الاستقبال VIP في المطار، التوجه للفندق الفاخر، العشاء في مطعم دوار برج خليفة" },
        { day: 2, title: "دبي الحديثة", description: "زيارة برج خليفة والطابق 148، التسوق في دبي مول، عرض النافورة الراقصة" },
        { day: 3, title: "ملاهي ومغامرات", description: "يوم كامل في حديقة دبي الميراكل، فيراري ورلد أو ديسني لاند" },
        { day: 4, title: "دبي القديمة", description: "جولة في ديرة ودبي الذهب والتوابل، عبور بالعبرة التقليدية، عشاء بحري" },
        { day: 5, title: "آخر يوم في دبي", description: "التسوق الأخير، زيارة الخور العربي، المغادرة" },
      ],
      includedServices: ["تذاكر الطيران", "الإقامة الفاخرة", "الإفطار", "استقبال VIP", "جولات سياحية", "تأمين سفر"],
      excludedServices: ["وجبات الغداء والعشاء", "نزهات الحياة الليلية", "التسوق"],
      cancellationPolicy: "استرداد 75% قبل 21 يوماً، 25% قبل 10 أيام، لا استرداد بعدها.",
      isFeatured: true,
    },
    {
      name: "باقة ماليزيا الاستوائية",
      country: "ماليزيا",
      city: "كوالالمبور",
      days: 8,
      nights: 7,
      priceFrom: "750",
      currency: "USD",
      rating: "4.7",
      images: [
        "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800",
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
        "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800",
      ],
      description: "رحلة استثنائية إلى ماليزيا بين عاصمتها النابضة كوالالمبور وجزيرة لنكاوي الخلابة وشبه جزيرة بينانج التاريخية.",
      hotelsIncluded: ["فندق ماندارين أوريانتال 5 نجوم", "منتجع لنكاوي الشاطئي 4 نجوم"],
      hotelStars: 5,
      roomType: "غرفة ديلوكس",
      meals: "إفطار يومي",
      transportation: "حافلة سياحية + رحلات داخلية",
      itinerary: [
        { day: 1, title: "الوصول إلى كوالالمبور", description: "الاستقبال في مطار KLIA، تسجيل الوصول في الفندق وراحة" },
        { day: 2, title: "كوالالمبور السياحية", description: "أبراج بتروناس، برج كوالالمبور، حديقة الطيور، مركز التسوق ستار هيل" },
        { day: 3, title: "مغامرة الغابة", description: "جولة في غابة باتو كيف، معبد سري ماهاماريامان، حديقة الطيور" },
        { day: 4, title: "السفر إلى لنكاوي", description: "رحلة داخلية إلى لنكاوي، شاطئ بانتاي تشيناج، رحلة قارب" },
        { day: 5, title: "جزيرة لنكاوي", description: "التيليفريك إلى قمة الجبل، جسر السماء، السباحة والغطس" },
        { day: 6, title: "التسوق الحر في لنكاوي", description: "منطقة الدوتي فري، بازار لنكاوي، استجمام على الشاطئ" },
        { day: 7, title: "زيارة بينانج", description: "تراث جورج تاون، معبد ثاي بوسام، جولة طعام ماليزي" },
        { day: 8, title: "المغادرة", description: "العودة إلى كوالالمبور والمغادرة" },
      ],
      includedServices: ["تذاكر الطيران الدولية", "رحلات داخلية", "الإقامة", "الإفطار اليومي", "مرشد سياحي"],
      excludedServices: ["وجبات الغداء والعشاء", "التأشيرة", "التأمين الإضافي"],
      cancellationPolicy: "استرداد كامل قبل 25 يوماً، 50% قبل 14 يوماً، لا استرداد بعدها.",
      isFeatured: true,
    },
    {
      name: "رحلة اليونان - سانتوريني وأثينا",
      country: "اليونان",
      city: "أثينا وسانتوريني",
      days: 9,
      nights: 8,
      priceFrom: "1500",
      currency: "USD",
      rating: "4.9",
      images: [
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800",
        "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800",
        "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800",
      ],
      description: "تجربة رومانسية لا تنسى في اليونان بين حضارة أثينا العريقة وزرقة بحر إيجه في سانتوريني.",
      hotelsIncluded: ["فندق النيل أثينا 4 نجوم", "فيلا سانتوريني إيجيان"],
      hotelStars: 5,
      roomType: "غرفة بإطلالة على البحر",
      meals: "إفطار يومي + بعض العشاءات",
      transportation: "حافلة + عبّارة + سيارة أجرة",
      itinerary: [
        { day: 1, title: "الوصول إلى أثينا", description: "الوصول والإقامة في فندق وسط المدينة" },
        { day: 2, title: "أثينا القديمة", description: "الأكروبول، البارثينون، متحف الأكروبول" },
        { day: 3, title: "أثينا الحديثة", description: "بلاكا، منطقة ثيسيو، سوق الأحد" },
        { day: 4, title: "السفر إلى سانتوريني", description: "عبّارة إلى سانتوريني، الاستقرار في أويا" },
        { day: 5, title: "استكشاف أويا", description: "طلوع الشمس في أويا، الكنائس الزرقاء، المسيرة إلى فيرا" },
        { day: 6, title: "بركان سانتوريني", description: "جولة بالقارب حول البركان، الاستحمام في الينابيع الحارة" },
        { day: 7, title: "شواطئ سانتوريني", description: "شاطئ كاماري الأسود، شاطئ أكروتيري الأحمر" },
        { day: 8, title: "التسوق والاستجمام", description: "آخر يوم في سانتوريني، التسوق من الحلي والتذكارات" },
        { day: 9, title: "المغادرة", description: "العودة إلى أثينا والمغادرة" },
      ],
      includedServices: ["تذاكر الطيران", "العبّارات الداخلية", "الإقامة الفندقية", "الإفطار", "جولات مرشد"],
      excludedServices: ["التأشيرة الشنغن", "معظم الوجبات", "التسوق"],
      cancellationPolicy: "استرداد 80% قبل 30 يوماً، 30% قبل 15 يوماً، غير قابل للاسترداد بعدها.",
      isFeatured: false,
    },
  ];

  let pkgCount = 0;
  for (const pkg of packages) {
    await db.insert(schema.packagesTable).values(pkg as any).onConflictDoNothing();
    pkgCount++;
  }
  console.log(`✅ Inserted ${pkgCount} packages`);

  // ── Banners ───────────────────────────────────────────────────────────────
  const banners = [
    {
      imageUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200",
      title: "اكتشف تركيا الساحرة",
      sortOrder: 1,
      isActive: true,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
      title: "دبي - المدينة التي لا تنام",
      sortOrder: 2,
      isActive: true,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200",
      title: "سانتوريني - جنة اليونان",
      sortOrder: 3,
      isActive: true,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1200",
      title: "ماليزيا - الطبيعة والحضارة",
      sortOrder: 4,
      isActive: true,
    },
  ];

  let bannerCount = 0;
  for (const banner of banners) {
    await db.insert(schema.bannersTable).values(banner).onConflictDoNothing();
    bannerCount++;
  }
  console.log(`✅ Inserted ${bannerCount} banners`);

  // ── Testimonials ──────────────────────────────────────────────────────────
  const testimonials = [
    {
      customerName: "محمد العبيدي",
      rating: 5,
      comment: "خدمة ممتازة جداً! حصلت على تأشيرة تركيا في أقل من 4 أيام. فريق قمة النظائر محترف ومتعاون وأنصح به الجميع.",
    },
    {
      customerName: "فاطمة الجنابي",
      rating: 5,
      comment: "باقة دبي كانت رائعة جداً من أول يوم حتى آخر يوم. الفندق فاخر والخدمات مميزة، سنعود مجدداً مع قمة النظائر!",
    },
    {
      customerName: "علي الموسوي",
      rating: 4,
      comment: "تجربتي مع طلب تأشيرة ألمانيا كانت سلسة ومريحة. المسؤولون كانوا يردون على استفساراتي بسرعة وكفاءة عالية.",
    },
    {
      customerName: "سارة الراشد",
      rating: 5,
      comment: "أفضل شركة سفر تعاملت معها في حياتي! رحلة ماليزيا كانت حلماً أصبح حقيقة. شكراً لكل فريق قمة النظائر.",
    },
    {
      customerName: "حسن الطائي",
      rating: 5,
      comment: "احترافية عالية وأسعار منافسة. تمكنت من السفر إلى اليونان لأول مرة بفضل مساعدة فريق الشركة في جميع إجراءات التأشيرة.",
    },
  ];

  let testCount = 0;
  for (const testimonial of testimonials) {
    await db.insert(schema.testimonialsTable).values(testimonial as any).onConflictDoNothing();
    testCount++;
  }
  console.log(`✅ Inserted ${testCount} testimonials`);

  console.log("\n✅ Seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
