# تركيب بلكسي (Mech) في plixfy.com

أربع ملفات + خطوتين تركيب. كله بالبطل المدرّع، موصّل بالـ chat API.

## ١) ركّب الملفات في أماكنها

| الملف هنا | مكانه في المشروع |
|---|---|
| `lib/blexy.ts` | `src/lib/blexy.ts` |
| `components/Plixy.tsx` | `src/components/Plixy.tsx` |
| `api/route.ts` | `src/app/api/chat/route.ts` |
| `blexy-animations.css` | الصق محتواه في آخر `src/app/globals.css` |

## ٢) ثبّت الـ SDK + المفتاح

```bash
cd C:\Users\gaming\plixfy-new
npm i @anthropic-ai/sdk
```

في `.env.local` أضف:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

(تجيبه من console.anthropic.com → API Keys. لا تحطه في NEXT_PUBLIC ـ لازم يبقى server-side.)

## ٣) ركّب الـ component في الـ layout

في `src/app/layout.tsx`، استورد وضِفه داخل الـ body (بعد BottomNav):

```tsx
import Plixy from "@/components/Plixy";
// ...
        <Header />
        {children}
        <BottomNav />
        <Plixy />
```

## ٤) تأكد من أسماء الـ exports في games.ts

ملف `api/route.ts` يستورد:

```ts
import { categoryMeta, getGamesByCategory } from "@/lib/games";
```

لو أسماء الـ exports عندك مختلفة، عدّل السطر هذا فقط ـ الباقي يبني الكتالوج تلقائياً (slug | الاسم | الفئة) ويرسله لبلكسي كـ system prompt.

---

## كيف يشتغل

- زر دائري (رأس بلكسي) يطفو يسار-تحت. اضغطه → تنفتح نافذة شات.
- المستخدم يكتب مزاجه ("ابي شي سريع ٥ دقايق" / "زي subway surfers") → بلكسي يرشّح ١-٣ ألعاب من كتالوجك مع تعليل، وتطلع أزرار تودّي مباشرة لـ `/play/[slug]`.
- تعابير بلكسي تتغيّر: idle ساكن → thinking وهو يفكّر → talking لما يرد → greeting أول ما تفتح.
- اللهجة سعودية نجدية، محتوى عائلي، يرشّح فقط من كتالوجك (ما يخترع).

## التكلفة

- موديل `claude-haiku-4-5-20251001` ($1/$5 لكل مليون توكن).
- كل محادثة ~$0.005–0.02 حسب طول الكتالوج. مع traffic بسيط = دولارات قليلة بالشهر.
- لو الكتالوج كبّر التكلفة، نقدر نقصّه أو نسوي بحث ذكي بدل ما نرسله كامل كل مرة (مرحلة ٢).

## بعد التركيب

شغّل `npm run dev`، افتح الموقع، اضغط زر بلكسي، وجرّب:
> "ابي لعبة سيارات سريعة"

لو طلع رد عربي + أزرار ألعاب تشتغل، خلصنا المرحلة ١.

ملاحظات للضبط لاحقاً:
- موضع الزر (الحين يسار-تحت، فوق الـ BottomNav بـ bottom-24).
- نضيف حفظ المحادثة في localStorage (اختياري).
- نوصّل تعبير "excited" لما اللاعب يفتح لعبة من ترشيح بلكسي.
