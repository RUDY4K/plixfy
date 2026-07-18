import type { GameContent } from "@/lib/gameContent";
import { girls1Content } from "./girls1";
import { girls2Content } from "./girls2";
import { action1Content } from "./action1";
import { action2Content } from "./action2";
import { action3Content } from "./action3";
import { puzzle1Content } from "./puzzle1";
import { puzzle2Content } from "./puzzle2";
import { casual1Content } from "./casual1";
import { casual2Content } from "./casual2";
import { racing1Content } from "./racing1";
import { racing2Content } from "./racing2";
import { racing3Content } from "./racing3";
import { io1Content } from "./io1";
import { io2Content } from "./io2";
import { io3Content } from "./io3";
import { sports1Content } from "./sports1";
import { sports2Content } from "./sports2";
import { shooting1Content } from "./shooting1";
import { shooting2Content } from "./shooting2";

/**
 * المحتوى العربي المولّد لكل ألعاب الكتالوج غير المشمولة في المحتوى
 * المُحرَّر يدوياً داخل gameContent.ts — مقسّم ملفات حسب التصنيف.
 */
export const generatedGameContent: Record<string, GameContent> = {
  ...girls1Content,
  ...girls2Content,
  ...action1Content,
  ...action2Content,
  ...action3Content,
  ...puzzle1Content,
  ...puzzle2Content,
  ...casual1Content,
  ...casual2Content,
  ...racing1Content,
  ...racing2Content,
  ...racing3Content,
  ...io1Content,
  ...io2Content,
  ...io3Content,
  ...sports1Content,
  ...sports2Content,
  ...shooting1Content,
  ...shooting2Content,
};
