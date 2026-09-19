# استعادة قسم الأخبار — 2026-09-14

## النتيجة

صحح المدير ادعاء الإصلاح السابق: بوابة الاعتماد كانت تعمل، لكن `/news` الحية
بقيت بلا خبر منشور، لذلك لم تكن المشكلة محلولة إنتاجيًا. بعد اكتمال المرشح
والمراجعات وافق المالك، فدُمج PR21 ونُشر وتحقق حيًا.

## مصدر الحقيقة والعزل

- worktree: `C:\Users\gaming\plixfy-organic-news-20260914`
- branch: `codex/organic-news-20260914`
- base و`origin/main`: `ef4645f087121d12bea49b2a414df2883e2702ce`
- commit المرشح: `6641804`
- PR: `https://github.com/RUDY4K/plixfy/pull/21`
- merge commit: `1fa46cc92601bda3bd892620d32d268a5637e24e`
- checkout المالك القديم لم يُحدّث ولم تُمس تعديلاته.

## ما يتضمنه المرشح

- خبر أصلي ثنائي اللغة عن موعد `MELTY BLOOD: TWI-LUMINA` ومنصاتها.
- المصدر الأساسي الوحيد: `https://meltyblood.twilumina.com/`.
- حذف تاريخ نشر غير مسند، وتقييد الاستنتاجات بما تعرضه صفحة المواصفات.
- قيمة عملية أصلية: العربية غير مدرجة حاليًا، دعم الإنترنت لا يثبت cross-play،
  وSteam يعني نسخة حاسب لا لعبة متصفح.
- صورة أصلية مولدة لصالح Plixfy مع caption ظاهر بأنها ليست لقطة من اللعبة،
  وسجل توليد وبصمات SHA-256 في دليل التحرير.
- سجل اعتماد exact-hash للعربية والإنجليزية بعد مراجعتين مستقلتين.
- تحويل آمن لأصل الصورة الأول إلى ملف `public/news` في المعاينة والإنتاج.
- إصلاح `sitemap.xml` لتوليد إدخال مستقل لأخبار الإنجليزية المؤهلة مع hreflang
  عربي/إنجليزي/x-default بدل حصر الأخبار بالعربية.

## المراجعات

- `daily-growth-review`: FAIL أولي بثلاث ملاحظات P2 وP3؛ صُححت كلها ثم PASS.
- `daily-ops-review`: FAIL أولي بسبب ضعف القيمة الأصلية وتاريخ/صورة؛ صُححت ثم PASS.
- `engineering-standard-review`: PASS نهائي بلا P0–P3، مع تحقق من المحتوى
  والدليل والصورة وسجل الاعتماد وعدم حذف بيانات أحدث.

## التحقق

- `npm test`: 161/161 PASS بعد آخر تعديل.
- `npm run build`: Next.js 16.3.5، 627/627 صفحة PASS.
- Playwright محلي، جوال وكمبيوتر: القائمة والتفاصيل AR/EN والصورة والـcaption
  وcanonical و`index,follow` ومنع التمدد الأفقي PASS.
- `/news/rss.xml`: 200 ويحتوي الخبر.
- `/sitemap.xml`: 200 ويحتوي رابطين مستقلين AR/EN مع alternates.
- `/api/news-image/<slug>`: يعيد أصل WebP المحلي بنجاح.
- `git diff --check`: PASS.

## النشر والتحقق الحي

- وافق المالك صراحة على الرفع والدمج والنشر.
- رُفع `codex/organic-news-20260914` وفتح PR21.
- نجح Vercel Preview ثم دُمج PR21 في `main` عند `1fa46cc`.
- أصبح Vercel Production Ready.
- `/news`: 200 وتعرض الخبر الجديد بدل الحالة الفارغة.
- `/news/melty-blood-twi-lumina-release-date`: 200 و`index,follow` وcanonical
  عربي صحيح وcaption ظاهر.
- `/en/news/melty-blood-twi-lumina-release-date`: 200 و`index,follow` وcanonical
  إنجليزي صحيح وcaption ظاهر.
- `/api/news-image/melty-blood-twi-lumina-release-date`: 200 `image/webp`
  وحجم 183,988 بايتًا بعد التحويل الداخلي.
- `/news/rss.xml`: 200 ويحتوي الخبر.
- `/sitemap.xml`: 200 ويحتوي رابطَي AR/EN.

أصبحت مشكلة صفحة الأخبار الفارغة محلولة إنتاجيًا بناءً على الفحص الحي، ولا يعني
ذلك ضمان قبول AdSense؛ تبقى حالته مسار متابعة منفصلًا.
