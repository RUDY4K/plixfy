# تشغيل continuous-015

- التاريخ: 2026-08-29
- المدير: `plixfy-manager`
- الحالة: `completed_local`
- الأساس: `f7bfdf09378d581dd4f8f187c0da94fe50abd52d`
- worktree: `C:\Users\gaming\plixfy-continuous-015`
- branch: `manager/continuous-015-20260829`
- commit: `10307798b3225ea2493b79bab88e0155c492f3e1`

## الهدف

اختيار أعلى إصلاح محلي آمن بعد دورة دقة التحليلات، عبر تدقيق متوازٍ لتعافي
المصادقة، وسلامة خطة النمو العضوي، ودقة لوحة الإيراد ومراقبة صفحات الإنتاج.

## بوابات الموافقة

- التدقيق قراءة فقط حتى يختار المدير حزمة واحدة محدودة الملكية.
- لا push أو PR أو merge أو deploy أو نشر أو إنفاق أو اتصال بحسابات خارجية.
- لا قراءة لـ`.env*` أو `.private/`، ولا تعديل بيانات إنتاج أو SQL حي.

## قرار الأولوية

- رصدت التدقيقات ثلاثة P1 محلية: تعليق Auth عند وعد لا ينتهي، قبول production
  health لـsoft-404 مطابق canonical، وخطة backlinks توجه روابط إلى `noindex`.
- اختير Auth لأنه يعطل الدخول والتسجيل والاستعادة والـcallback مباشرة، ويمكن
  إغلاقه في سبعة ملفات بلا تغيير محتوى خارجي أو production configuration.
- حزمة semantic page markers، وتصحيح outreach docs، ودقة RevenueDashboard
  محفوظة كمرشحات دورات مستقلة حتى لا تختلط عقود مختلفة في commit واحد.

## النتيجة

- أضيف `auth-deadline.ts`: مهلة نقل 10 ثوانٍ مع AbortController ودمج إشارة
  المتصل، مهلة عملية Auth ‏12 ثانية، ومهلة تنظيف recovery ‏3 ثوانٍ.
- عميل Supabase للمتصفح والخادم يستخدمان النقل المحدود؛ login/signup/Google/
  forgot/reset والـcallback لا يمكن أن يتركوا الواجهة أو route معلقة بلا حد.
- النتائج المتأخرة لا تغيّر الرسالة أو redirect، وForgot/Reset يحميان تبديل
  اللغة و`recoveryAuthorized` وStrictMode وunmount عبر epoch/mounted guards.
- callback يفشل مغلقًا إلى صفحة Auth المحلية برؤوس no-store/no-referrer، ولا
  يدخل code أو تفاصيل المزود في الوجهة أو الرسالة.
- تنظيف recovery marker يحدث ضمن مهلة قبل إظهار النجاح ويتحقق من response.ok؛
  تعذره لا يحول تغيير كلمة المرور الناجح إلى فشل زائف.
- أثرت مهارة `Auth` في إبقاء الرسائل عامة، والفشل آمنًا، وعدم لمس الأسرار أو
  استبدال مكتبة Supabase بأنماط مصادقة مخصصة.

## المراجعة والتحقق

- الاختبار السلوكي توسع من 22 إلى 29 حالة ويغطي never-settling لكل مسار،
  transport abort، caller signal، callback timeout، late settle، تبديل اللغة،
  StrictMode، unmount، وترتيب cleanup.
- المراجعة المستقلة النهائية PASS: P0=0 وP1=0 وP2=0، مع صفر
  `unhandledRejection` في fixture التسوية المتأخرة.
- TypeScript الكامل وNext typegen ناجحان؛ Auth+Consent ‏46/46؛ `git diff
  --check` ناجح.
- في النسخة النظيفة: 340/340 اختبارًا وظيفيًا بلا تخطٍ. بناء Turbopack داخل
  التشغيل المجمّع توقف بنقص ذاكرة native على Windows، ثم نجحت بوابة الأداء
  منفردة على commit نفسه: TypeScript، ‏624/624 صفحة، و3/3 اختبارات أداء.
- ملاحظة P3 غير حاجبة: مهلة النقل العامة 10 ثوانٍ تشمل PlayerData أيضًا قبل
  مهلة واجهته 12 ثانية؛ مسار error/outbox يحفظ البيانات ويتيح retry.
- لا push أو PR أو merge أو deploy أو اتصال حساب أو قراءة أسرار.
