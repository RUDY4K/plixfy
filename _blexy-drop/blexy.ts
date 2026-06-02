// src/lib/blexy.ts
// Blexy — Plixfy mascot SVG factory (cel-shaded mech). One geometry, five expressions.
// Faithful port of the Claude Design "mech" build. Returns an SVG markup string.
// Inject via dangerouslySetInnerHTML and re-render when `expr` changes.

export type BlexyExpr = "idle" | "thinking" | "excited" | "talking" | "greeting";

const K = "#0A0D16",
  A = "#3E4878",
  Ah = "#5A66A0",
  As = "#2A3158",
  G = "#FBBF24",
  Gh = "#FFD55E",
  C = "#22D3EE",
  Ch = "#9DEEFF",
  Cs = "#149DB8",
  IN = "#818CF8",
  PU = "#C084FC",
  VIS = "#0B0D14",
  TW =
    "M0,-1 C.2,-.35 .35,-.2 1,0 C.35,.2 .2,.35 0,1 C-.2,.35 -.35,.2 -1,0 C-.35,-.2 -.2,-.35 0,-1 Z";

function seg(d: string, w: number, fill: string) {
  return (
    '<path d="' + d + '" fill="none" stroke="' + K + '" stroke-width="' + (w + 5) +
    '" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d +
    '" fill="none" stroke="' + fill + '" stroke-width="' + w +
    '" stroke-linecap="round" stroke-linejoin="round"/>'
  );
}
function joint(x: number, y: number, r: number) {
  return (
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + A +
    '" stroke="' + K + '" stroke-width="4"/><circle cx="' + x + '" cy="' + y +
    '" r="' + r * 0.46 + '" fill="' + C + '" stroke="' + K + '" stroke-width="2"/>'
  );
}
function fist(x: number, y: number) {
  const s = 12;
  return (
    '<g><rect x="' + (x - s) + '" y="' + (y - s) + '" width="' + 2 * s + '" height="' + (2 * s + 3) +
    '" rx="6" fill="' + A + '" stroke="' + K + '" stroke-width="4"/><rect x="' + (x - s + 3) +
    '" y="' + (y - s + 3) + '" width="' + (2 * s - 6) + '" height="5" rx="2.5" fill="' + Ah +
    '"/><line x1="' + (x - 4) + '" y1="' + (y - 2) + '" x2="' + (x - 4) + '" y2="' + (y + s) +
    '" stroke="' + K + '" stroke-width="2"/><line x1="' + (x + 4) + '" y1="' + (y - 2) +
    '" x2="' + (x + 4) + '" y2="' + (y + s) + '" stroke="' + K + '" stroke-width="2"/><circle cx="' +
    x + '" cy="' + (y - s - 2) + '" r="3" fill="' + G + '" stroke="' + K + '" stroke-width="2"/></g>'
  );
}
function ear(x: number) {
  return (
    '<circle cx="' + x + '" cy="118" r="18" fill="' + G + '" stroke="' + K +
    '" stroke-width="4.5"/><circle cx="' + x + '" cy="118" r="11" fill="' + C + '" stroke="' + K +
    '" stroke-width="3"/><circle cx="' + (x - 3) + '" cy="115" r="3.5" fill="' + Ch + '"/>'
  );
}
function flame(x: number, p: string) {
  return (
    '<g class="flamewrap"><g class="flame' + (x > 150 ? " fb" : "") + '"><path d="M' + (x - 12) +
    ",300 C" + (x - 15) + ",324 " + (x - 7) + ",340 " + x + ",352 C" + (x + 7) + ",340 " + (x + 15) +
    ",324 " + (x + 12) + ',300 Z" fill="url(#' + p + '-fl)" stroke="' + Cs +
    '" stroke-width="2.5" stroke-linejoin="round"/><path d="M' + (x - 6) + ",304 C" + (x - 7) +
    ",322 " + (x - 3) + ",332 " + x + ",342 C" + (x + 3) + ",332 " + (x + 7) + ",322 " + (x + 6) +
    ',304 Z" fill="#EAFCFF"/></g></g>'
  );
}
function spk(x: number, y: number, r: number, fill: string, d: number) {
  return (
    '<g class="spk" style="--d:' + d + 's"><path transform="translate(' + x + " " + y +
    ") scale(" + r + ')" d="' + TW + '" fill="' + fill + '"/></g>'
  );
}

function eyes(expr: BlexyExpr) {
  let py = 0,
    ex = 8.5,
    ey = 11;
  if (expr === "excited") {
    ex = 10;
    ey = 13.5;
  }
  if (expr === "thinking") {
    py = -4;
    ey = 8.5;
  }
  return (
    '<g class="eyeglow"><ellipse cx="132" cy="116" rx="13" ry="15" fill="' + G +
    '" opacity="0.35"/><ellipse cx="168" cy="116" rx="13" ry="15" fill="' + G +
    '" opacity="0.35"/></g><ellipse cx="132" cy="' + (116 + py) + '" rx="' + ex + '" ry="' + ey +
    '" fill="' + G + '"/><ellipse cx="168" cy="' + (116 + py) + '" rx="' + ex + '" ry="' + ey +
    '" fill="' + G + '"/><ellipse cx="129" cy="' + (112 + py) +
    '" rx="3.2" ry="4.2" fill="' + Gh + '"/><ellipse cx="165" cy="' + (112 + py) +
    '" rx="3.2" ry="4.2" fill="' + Gh + '"/>'
  );
}
function extras(expr: BlexyExpr) {
  if (expr === "thinking")
    return (
      '<g class="orbit"><g transform="translate(150,16)"><path transform="scale(7)" d="' + TW +
      '" fill="' + C + '"/></g></g><g transform="translate(214,50)"><circle class="tdot" r="3.4" fill="' +
      C + '"/><circle class="tdot d2" cx="12" cy="-8" r="4.2" fill="' + IN +
      '"/><circle class="tdot d3" cx="26" cy="-18" r="5.2" fill="' + PU + '"/></g>'
    );
  if (expr === "talking")
    return (
      '<g transform="translate(214,112)" stroke="' + C +
      '" stroke-width="3.4" fill="none" stroke-linecap="round"><path class="snd" d="M0,-12 Q13,0 0,12"/><path class="snd s2" d="M10,-20 Q30,0 10,20" opacity=".6"/></g>'
    );
  if (expr === "excited")
    return spk(58, 68, 7, G, 0) + spk(244, 82, 6, C, 0.2) + spk(250, 198, 6, PU, 0.4) + spk(46, 208, 6.5, IN, 0.3) + spk(232, 40, 5, G, 0.5);
  if (expr === "greeting") return spk(246, 66, 5.5, G, 0) + spk(58, 150, 4.5, C, 0.5);
  return spk(56, 150, 4, C, 0) + spk(246, 152, 4, PU, 0.8);
}

function helmetBlock(expr: BlexyExpr) {
  return (
    ear(95) + ear(205) +
    '<path d="M100,58 Q100,44 116,44 L184,44 Q200,44 200,58 L204,112 Q205,132 188,142 L176,150 Q170,166 150,170 Q130,166 124,150 L112,142 Q95,132 96,112 Z" fill="' + A + '" stroke="' + K + '" stroke-width="5.5" stroke-linejoin="round"/>' +
    '<path d="M100,58 Q100,44 116,44 L130,44 L118,150 L112,142 Q95,132 96,112 Z" fill="' + Ah + '" opacity="0.85"/>' +
    '<path d="M196,60 L204,112 Q205,132 188,142 L178,148 L188,60 Z" fill="' + As + '" opacity="0.55"/>' +
    '<path d="M120,46 L180,46 Q188,48 185,60 L176,72 Q150,65 124,72 L115,60 Q112,48 120,46 Z" fill="' + G + '" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M126,52 L174,52" stroke="' + Gh + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M108,98 Q108,90 120,90 L180,90 Q192,90 192,98 L194,124 Q194,133 183,135 L168,139 Q160,150 150,150 Q140,150 132,139 L117,135 Q106,133 106,124 Z" fill="' + VIS + '" stroke="' + K + '" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<path d="M114,96 L150,93 L140,104 L116,106 Z" fill="#FFFFFF" opacity="0.10"/>' +
    eyes(expr) +
    '<path d="M134,150 Q150,148 166,150 L160,166 Q150,172 140,166 Z" fill="' + As + '" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M142,156 L158,156" stroke="' + C + '" stroke-width="2.5" stroke-linecap="round"/>'
  );
}
function finStr() {
  return (
    '<path d="M138,52 C140,28 146,16 150,10 C154,16 160,28 162,52 C156,46 144,46 138,52 Z" fill="' + C + '" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/><path d="M147,44 C148,28 149,20 150,16 C151,20 152,28 153,44 Z" fill="' + Ch + '"/>'
  );
}
function bodyStr() {
  return (
    seg("M140,238 L130,268", 22, A) + seg("M130,268 L124,298", 18, A) + seg("M160,238 L170,268", 22, A) + seg("M170,268 L176,298", 18, A) +
    '<path d="M108,292 Q106,284 116,282 L130,282 Q139,284 137,296 L135,314 Q133,324 121,324 Q110,324 108,314 Z" fill="' + A + '" stroke="' + K + '" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<rect x="110" y="314" width="26" height="8" rx="3" fill="' + C + '" stroke="' + K + '" stroke-width="3"/>' +
    '<path d="M163,292 Q165,284 175,282 L189,282 Q198,284 196,296 L194,314 Q192,324 180,324 Q169,324 167,314 Z" fill="' + A + '" stroke="' + K + '" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<rect x="165" y="314" width="26" height="8" rx="3" fill="' + C + '" stroke="' + K + '" stroke-width="3"/>' +
    joint(130, 268, 9) + joint(170, 268, 9) +
    '<path d="M122,262 Q130,256 138,262 L136,272 Q130,276 124,272 Z" fill="' + G + '" stroke="' + K + '" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M178,262 Q170,256 162,262 L164,272 Q170,276 176,272 Z" fill="' + G + '" stroke="' + K + '" stroke-width="3.5" stroke-linejoin="round"/>' +
    seg("M122,200 L106,224", 18, A) + seg("M106,224 L100,248", 15, A) + joint(106, 224, 8) + fist(99, 256) +
    '<path d="M126,172 Q150,166 174,172 L180,208 Q180,226 162,232 L138,232 Q120,226 120,208 Z" fill="' + A + '" stroke="' + K + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M132,176 Q150,172 150,172 L150,224 Q138,222 130,210 Z" fill="' + Ah + '" opacity="0.7"/>' +
    '<path d="M140,184 L150,194 L160,184" fill="none" stroke="' + C + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="150" cy="206" r="6" fill="' + G + '" stroke="' + K + '" stroke-width="3"/>' +
    '<path d="M124,222 Q150,230 176,222 L174,236 Q150,244 126,236 Z" fill="' + C + '" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M132,229 L168,229" stroke="' + Cs + '" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M104,192 Q106,178 124,180 Q134,186 130,200 Q120,210 108,204 Q100,200 104,192 Z" fill="' + G + '" stroke="' + K + '" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<path d="M112,186 Q120,184 124,190" fill="none" stroke="' + Gh + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M196,192 Q194,178 176,180 Q166,186 170,200 Q180,210 192,204 Q200,200 196,192 Z" fill="' + G + '" stroke="' + K + '" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<path d="M188,186 Q180,184 176,190" fill="none" stroke="' + Gh + '" stroke-width="3" stroke-linecap="round"/>' +
    '<g class="mecharm">' + seg("M178,200 L202,202", 18, A) + seg("M202,202 L228,194", 15, A) + joint(202, 202, 8) + fist(232, 191) + "</g>"
  );
}

export interface BlexyOpts {
  head?: boolean;
}

export function buildBlexy(expr: BlexyExpr = "idle", opts: BlexyOpts = {}): string {
  const p = "bx";
  if (opts.head) {
    return (
      '<svg class="blexy" data-expr="' + expr + '" viewBox="82 22 136 136" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blexy mech">' +
      '<g class="botbob">' + finStr() + helmetBlock(expr) + "</g></svg>"
    );
  }
  return (
    '<svg class="blexy" data-expr="' + expr + '" viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blexy mech">' +
    '<defs><linearGradient id="' + p + '-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + Ch + '"/><stop offset="0.55" stop-color="' + C + '"/><stop offset="1" stop-color="' + Cs + '" stop-opacity="0.2"/></linearGradient></defs>' +
    '<ellipse cx="150" cy="344" rx="60" ry="9" fill="#000" opacity="0.32"/>' +
    flame(120, p) + flame(180, p) +
    '<g class="botbob">' + finStr() + bodyStr() + helmetBlock(expr) + "</g>" +
    extras(expr) +
    "</svg>"
  );
}
