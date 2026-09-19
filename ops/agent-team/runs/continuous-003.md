# تشغيل continuous-003

## الهدف

إغلاق مخاطر الأتمتات القديمة، تحديث الإفصاحات لتطابق تدفقات البيانات الفعلية،
ومنع ادعاءات الألعاب الحساسة غير المسندة قبل تجهيز الإصدار العام.

## حدود التنفيذ

- العمل داخل `C:\Users\gaming\plixfy-continuous-003` فقط.
- لا workflow run أو push أو PR أو merge أو deploy أو رسالة أو إنفاق أو سر.
- لا تغيير `ads.txt` أو حسابات Supabase/Google/Vercel/Playgama.

## أمان الأتمتات

- social schedule أصبح `offline dry-run` إجباريًا؛ النشر يحتاج تأكيد
  `PUBLISH_SOCIAL` في dispatch يدوي.
- content schedule يفحص snapshot قائمًا بلا Gemini؛ التوليد يحتاج
  `GENERATE_CONTENT_PR` وينشئ فرعًا وPR فقط.
- Playgama schedule ينتج artifact؛ التحديث يحتاج `CREATE_CATALOG_PR` وينشئ
  فرعًا وPR فقط.
- IndexNow schedule ينشئ GET preview؛ POST يحتاج `SUBMIT_INDEXNOW` يدويًا.
- اختبار reachability يمنع وصول schedule إلى الأسرار والتكلفة وTelegram
  والنشر وPOST والـpush/PR/merge، ويثبت permissions وartifacts وdependencies.

## الخصوصية والشروط

- حدثت صفحات privacy/terms/contact بالعربية والإنجليزية وفق Supabase Auth،
  Google sign-in، المفضلة والسجل، GA4، AdSense، Vercel Analytics وPlaygama.
- فُرض حد 100 مفضلة فعليًا وربط الاختبار بالإفصاح.
- لم تُختلق مدد مزودين أو اختصاص أو ضمان نقل دولي؛ هذه نقاط مراجعة قانونية.

## الأدلة التحريرية

- البوابة تحمل 19 shard، و538 إدخالًا عربيًا مولدًا، و30 يدويًا، و50 إنجليزيًا.
- خُفف 1669 حقلًا في 532 إدخالًا عربيًا مولدًا و235 حقلًا في 50 إنجليزيًا.
- QC حتمي راجع 20 حقلًا عربيًا و20 إنجليزيًا عبر كل أشكال النص؛ النتيجة 0/40.
- التنقية كسولة لكل slug؛ المعالجة الدفعة واحدة أسقطت عامل build مرتين، وبعد
  التحويل نجح توليد 621/621 صفحة وأضيف اختبار يمنع الرجوع للمعالجة الشاملة.

## التحقق

- الفرع: `manager/compliance-automation-20260829`.
- commit: `02834c8e22d3e2b5a16820fb51e99c028d981e80`.
- `npm test`: 115/115 ناجحًا.
- `npm run build -- --webpack`: ناجح، 621/621 صفحة.
- `git diff --check`: ناجح.
- مراجعة workflows المستقلة: PASS بعد إغلاق P2.
- مراجعة الامتثال المتقاطعة كشفت P1 للمحتوى المولد وP2 لحد المفضلة؛ أُغلقا.
- Vivaldi headless شُغّل بملف QA معزول، لكن واجهة الأتمتة/CDP علقت ولم تنتج
  نتيجة قابلة للاعتماد؛ لا ندعي تحققًا بصريًا جديدًا لهذه الدورة.

## المتبقي قبل الإصدار

1. موافقة push/PR/merge/deploy للمرشح المجمع.
2. مراجعة قانونية للاسم والعنوان والمسغ القانوني والاحتفاظ والنقل الدولي
   والأطفال والاختصاص قبل نشر نصوص الامتثال.
3. قرار Vercel image quota/CDN.
4. إعداد GitHub مثبت قراءةً على `default_workflow_permissions=read` و
   `can_approve_pull_request_reviews=false`؛ يلزم إذن صريح لتغييره كي تنشئ
   Actions فروع PR تلقائيًا، وإلا يبقى الفشل مغلقًا وآمنًا.

## الحالة

`active` — الحزمة مثبتة محليًا وغير منشورة، والهدف المستمر باقٍ.
