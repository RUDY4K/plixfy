# تشغيل continuous-016

- التاريخ: 2026-08-29
- المدير: `plixfy-manager`
- الحالة: `completed_local`
- الأساس: `10307798b3225ea2493b79bab88e0155c492f3e1`
- worktree: `C:\Users\gaming\plixfy-continuous-016`
- branch: `manager/continuous-016-20260829`
- commit: `a351ee88fa8190c5a70cb0a57f4eab7afd0d6da9`

## الهدف

منع مراقب صفحات الإنتاج من احتساب soft-404 أو صفحة من نوع آخر كنجاح لمجرد
مطابقة canonical والحجم، عبر marker دلالي first-party لكل نوع route مراقب.

## بوابات الموافقة

- لا شبكة أو قراءة إنتاج أو `.env*` أو `.private/` أثناء التنفيذ والتحقق المحلي.
- لا push أو PR أو merge أو deploy أو تغيير محتوى مرئي أو SEO index gate.
- markers خاملة في HTML، ولا تُستخدم noindex وحدها لأن بعض الصفحات تقصده.

## النتيجة

- أضيف `data-plixfy-health-page` واحد خامد على `<main>` لثمانية أنواع: home،
  search، categories، news، blog، game، news-article، blog-article.
- يستنتج الفاحص النوع من pathname العربي أو الإنجليزي ويرفض marker المفقود أو
  الخاطئ أو المكرر أو غير المقتبس أو الموضوع خارج `<main>`.
- استُبدل فحص regex بـtokenizer محدود للوسوم والسمات، يتجاهل comments وraw/
  RCDATA بما فيها script/style/template/noscript/title/textarea/iframe/xmp/
  noembed/noframes/plaintext، ويفك HTML entities المسماة والرقمية.
- canonical يجب أن يكون واحدًا فقط، `rel` token دقيقًا، وسماته وحيدة وصحيحة،
  ولا يقبل userinfo أو canonical مموهًا داخل قيمة سمة.
- يرفض الفاحص Next not-found digest وdefault 404 title/H1 و`next-error-h1` حتى
  مع marker صحيح. ويرفض noindex فقط للأنواع المتوقع فهرستها home/categories/
  game، مع إبقاء search/news/blog/articles المقصودة noindex صالحة.
- لا تغيير في النص المرئي أو metadata أو canonical أو JSON-LD أو index gate.

## المراجعة والتحقق

- النسخة الأولى لم تُعتمد: المراجع المستقل أثبت soft-404 بmarker صحيح، وmarker
  مزيفًا داخل comment/script/aria، وcanonical مكررًا أو مموهًا؛ أُعيدت للتنفيذ.
- مراجعة ثانية كشفت عناصر raw/RCDATA الستة غير المغطاة؛ أُغلقت مع 12/12 fixture
  خصمية، والحكم النهائي PASS بلا P0–P3.
- operations ‏71/71، site ‏42/42، Next typegen وTypeScript الكامل ناجحان،
  و`git diff --check` ناجح.
- تحقق النسخة النظيفة في تشغيل `npm test` واحد: 347/347 اختبارًا وظيفيًا بلا
  تخطٍ، Turbopack/TypeScript ‏624/624 صفحة، وperformance ‏3/3؛ الإجمالي 350.
- لا شبكة أو قراءة إنتاج/أسرار، ولا push أو PR أو merge أو deploy.
