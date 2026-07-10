# استخدام نسخة Node.js الرسمية كبيئة أساسية
FROM node:20-slim

# تفعيل أداة corepack لتشغيل pnpm تلقائياً
RUN corepack enable && corepack prepare pnpm@latest --activate

# تحديد مجلد العمل داخل حاوية الدكر
WORKDIR /app

# نسخ ملفات الحزم أولاً لتسريع عملية البناء الكاش
COPY package.json pnpm-lock.yaml* ./

# تثبيت الاعتماديات والمكتبات الخاصة بالمشروع
RUN pnpm install

# نسخ بقية ملفات المشروع بالكامل
COPY . .

# إنشاء نسخة الإنتاج (Build) للمشروع
RUN pnpm run build

# تحديد المنفذ الافتراضي الذي سيعمل عليه التطبيق
EXPOSE 3000

# أمر تشغيل المشروع الأساسي
CMD ["pnpm", "start"]