
import * as React from "react";

export const toothNames: Record<string, string> = {
  "101":"Rt Max 1st Incisor","102":"Rt Max 2nd Incisor","103":"Rt Max 3rd Incisor",
  "104":"Rt Max Canine","105":"Rt Max 1st PM","106":"Rt Max 2nd PM",
  "107":"Rt Max 3rd PM","108":"Rt Max 4th PM (P4)","109":"Rt Max 1st Molar","110":"Rt Max 2nd Molar",
  "201":"Lt Max 1st Incisor","202":"Lt Max 2nd Incisor","203":"Lt Max 3rd Incisor",
  "204":"Lt Max Canine","205":"Lt Max 1st PM","206":"Lt Max 2nd PM",
  "207":"Lt Max 3rd PM","208":"Lt Max 4th PM (P4)","209":"Lt Max 1st Molar","210":"Lt Max 2nd Molar",
  "301":"Lt Mand 1st Incisor","302":"Lt Mand 2nd Incisor","303":"Lt Mand 3rd Incisor",
  "304":"Lt Mand Canine","305":"Lt Mand 1st PM","306":"Lt Mand 2nd PM",
  "307":"Lt Mand 3rd PM","308":"Lt Mand 4th PM","309":"Lt Mand 1st Molar (M1)","310":"Lt Mand 2nd Molar","311":"Lt Mand 3rd Molar",
  "401":"Rt Mand 1st Incisor","402":"Rt Mand 2nd Incisor","403":"Rt Mand 3rd Incisor",
  "404":"Rt Mand Canine","405":"Rt Mand 1st PM","406":"Rt Mand 2nd PM",
  "407":"Rt Mand 3rd PM","408":"Rt Mand 4th PM","409":"Rt Mand 1st Molar (M1)","410":"Rt Mand 2nd Molar","411":"Rt Mand 3rd Molar"
};

export interface DentalChartCanineCombinedProps extends React.SVGProps<SVGSVGElement> {
  selectedToothId?: string | null;
  onToothClick?: (toothId: string) => void;
}

// ────────────────────────────────────────────────────────────────────
// 갭 분석으로 도출한 치아별 실제 X 경계 (SVG 소스 좌표계)
// 각 SVG는 독립적인 좌표계를 가짐
// ────────────────────────────────────────────────────────────────────

// 개상악A (3444px wide) — buccal/lateral view
// 갭: 106→221, 280→409, 510→603, 671→775, 832→929, 1140→1303, 1347→1498,
//     1530→1687, 1712→1848, 1872→2006, 2036→2157, 2207→2335, 2558→2649,
//     2707→2797, 2873→2986, 3090→3196, 3265→3358
const maxA_teeth: [string, number, number][] = [
  ["110",    0,  180], // 0 → gap@106(+buffer)
  ["109",  221,  395], // 221 → 280
  ["108",  409,  555], // 409 → 510
  ["107",  603,  715], // 603 → 671
  ["106",  775,  875], // 775 → 832
  ["105",  929, 1000], // 929 → 1140
  ["104", 1010, 1250], // 1303 → 1347 (canine)
  ["103", 1270, 1420], // 1498 → 1530
  ["102", 1440, 1590], // 1687 → 1712
  ["101", 1610, 1770], // 1848 → 1872
  ["201", 1790, 1940], // 2006 → 2036
  ["202", 1950, 2080], // 2157 → 2207
  ["203", 2090, 2230], // 2335 → 2558
  ["204", 2250, 2450], // canine
  ["205", 2470, 2580], // 2797 → 2873
  ["206", 2585, 2730], // 2986 → 3090
  ["207", 2735, 2880], // 3196 → 3265
  ["208", 2890, 3100], // 3358 → end
  ["209", 3110,3275],
   ["210", 3280,3430]
  // 209, 210 not visible in this arrangement (only 18 shown)
];

// 개상악B (3444px wide) — occlusal/crown view
const maxB_teeth: [string, number, number][] = [
  ["110",    0,  175],
  ["109",  222,  415],
  ["108",  417,  555],
  ["107",  608,  718],
  ["106",  765,  875],
  ["105",  914, 1000],
  ["104", 1097, 1160], // corrected
  ["103", 1300, 1398],
  ["102", 1493, 1555],
  ["101", 1684, 1760],
  ["201", 1822, 1900],
  ["202", 1986, 2060],
  ["203", 2136, 2230],
  ["204", 2287, 2425],
  ["205", 2496, 2590],
  ["206", 2832, 2995],
  ["207", 2953, 3100],
  ["208", 3170, 3280],
  ["209", 3331, 3444],
];

// 개하악A (3483px wide) — buccal/lateral view
// 갭: 90→220, 281→397, 495→595, 646→779, 836→936, 971→1061, 1079→1191,
//     1212→1370, 1413→1544, 1568→1702, 1732→1854, 1879→1990, 2021→2111,
//     2154→2271, 2329→2443, 2617→2702, 2769→2860, 2938→3041, 3291→3380
const manA_teeth: [string, number, number][] = [
  ["411",    50,  180],
  ["410",  210,  345],
  ["409",  385,  555],
  ["408",  585,  715],
  ["407",  749,  895],
  ["406",  900, 1040],
  ["405", 1045, 1145],
  ["404", 1150, 1300],
  ["403", 1320, 1480],
  ["402", 1490, 1640],
  ["401", 1650, 1790],
  ["301", 1800, 1940],
  ["302", 1945, 2070],
  ["303", 2080, 2210],
  ["304", 2220, 2390],
  ["305", 2400, 2500],
  ["306", 2510, 2630],
  ["307", 2640, 2800],
  ["308", 2810, 2950],
  ["309", 2960, 3160],
  ["310", 3165,3280],
  ["311", 3300,3430],
];

// 개하악B (3483px wide) — occlusal/crown view
// 갭: 101→219, 282→387, 497→597, 664→769, 847→985, 985→1087, 1205→1371,
//     1398→1542, 1577→1699, 1725→1858, 1878→1984, 2015→2116, 2156→2271,
//     2363→2444, 2465→2549, 2935→3037, 3292→3387
const manB_teeth: [string, number, number][] = [
  ["411",    0,  160],
  ["410",  219,  340],
  ["409",  387,  550],
  ["408",  597,  720],
  ["407",  769,  900],
  ["406",  985, 1060],
  ["405", 1087, 1260],
  ["404", 1371, 1450],
  ["403", 1542, 1630],
  ["402", 1699, 1775],
  ["401", 1858, 1930],
  ["301", 1984, 2065],
  ["302", 2116, 2210],
  ["303", 2271, 2415],
  ["304", 2444, 2520],
  ["305", 2549, 2985],
  ["306", 3037, 3150],
  ["307", 3150, 3340],
  ["308", 3387, 3483],
];

// ────────────────────────────────────────────────────────────────────
// viewBox: 0 0 1400 430
// 각 행의 y 및 높이 (display 좌표)
// ────────────────────────────────────────────────────────────────────
const DISPLAY_W = 1400;
const maxA_srcW = 3444; const maxA_srcH = 283;
const maxB_srcW = 3444; const maxB_srcH = 272;
const manB_srcW = 3483; const manB_srcH = 236;
const manA_srcW = 3483; const manA_srcH = 305;

const maxA_dispH = Math.round(DISPLAY_W * maxA_srcH / maxA_srcW); // ~115
const maxB_dispH = Math.round(DISPLAY_W * maxB_srcH / maxB_srcW); // ~111 → use 68
const manB_dispH = Math.round(DISPLAY_W * manB_srcH / manB_srcW); // ~95 → use 60
const manA_dispH = Math.round(DISPLAY_W * manA_srcH / manA_srcW); // ~122

// Adjusted display heights to fit nicely
const ROW = {
  maxA: { y: 12,  h: 115 }, // 상악 옆면
  maxB: { y: 127, h: 68  }, // 상악 크라운
  manB: { y: 195, h: 62  }, // 하악 크라운
  manA: { y: 257, h: 125 }, // 하악 옆면
};
const TOTAL_H = ROW.manA.y + ROW.manA.h + 16; // 398

// Scale source x-coords to display x-coords
function scaleX(srcX: number, srcW: number): number {
  return Math.round((srcX / srcW) * DISPLAY_W);
}

// A single clickable tooth overlay (transparent rect that sits on top of the image)
function ToothHit({
  id, x1, x2, srcW, rowY, rowH, selected, onClick,
}: {
  id: string; x1: number; x2: number; srcW: number;
  rowY: number; rowH: number; selected: boolean; onClick: () => void;
}) {
  const dx = scaleX(x1, srcW);
  const dw = scaleX(x2, srcW) - dx;
  return (
    <rect
      id={`hit-${id}`}
      x={dx} y={rowY}
      width={dw} height={rowH}
      fill={selected ? "rgba(34,85,170,0.18)" : "rgba(0,0,0,0)"}
      stroke={selected ? "#2255aa" : "transparent"}
      strokeWidth={selected ? 1.5 : 0}
      strokeDasharray={selected ? "4 2" : "none"}
      rx={3}
      cursor="pointer"
      onClick={onClick}
      style={{ transition: "fill 0.1s" }}
    />
  );
}

export const DentalChartCanineCombined = ({
  selectedToothId,
  onToothClick,
  ...props
}: DentalChartCanineCombinedProps) => {
  const click = (id: string) => () => onToothClick?.(id);
  const sel   = (id: string) => selectedToothId === id;

  return (
    <svg
      {...props}
      viewBox={`0 0 ${DISPLAY_W} ${TOTAL_H}`}
      xmlns="http://www.w3.org/2000/svg"
      id="dental-chart"
    >
      <defs>
        <style dangerouslySetInnerHTML={{ __html: `
          #dental-chart rect[id^="hit-"]:hover { fill: rgba(34,85,170,0.09) !important; }
          .dc-lbl { font: 9px sans-serif; fill: #888; }
          .dc-sec { font: bold 9px sans-serif; fill: #666; }
        `}}/>
      </defs>

      {/* Background */}
      <rect width={DISPLAY_W} height={TOTAL_H} fill="#fafaf8" rx="3"/>

      {/* ── Row labels ── */}
      <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.maxA.y + ROW.maxA.h/2} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(90,${DISPLAY_W-2},${ROW.maxA.y + ROW.maxA.h/2})`}>Buccal</text>
      <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.maxB.y + ROW.maxB.h/2} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(90,${DISPLAY_W-2},${ROW.maxB.y + ROW.maxB.h/2})`}>Occlusal</text>
      <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.manB.y + ROW.manB.h/2} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(90,${DISPLAY_W-2},${ROW.manB.y + ROW.manB.h/2})`}>Occlusal</text>
      <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.manA.y + ROW.manA.h/2} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(90,${DISPLAY_W-2},${ROW.manA.y + ROW.manA.h/2})`}>Buccal</text>

      {/* ── Section labels ── */}
      <text className="dc-sec" x={3} y={ROW.maxA.y + ROW.maxA.h/2} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(-90,3,${ROW.maxA.y + ROW.maxA.h/2})`}>MAXILLA 상악</text>
      <text className="dc-sec" x={3} y={ROW.manA.y + ROW.manA.h/2} textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(-90,3,${ROW.manA.y + ROW.manA.h/2})`}>MANDIBLE 하악</text>

      {/* ── Side labels ── */}
      <text className="dc-lbl" x={100} y={6} textAnchor="start">← Right 우측</text>
      <text className="dc-lbl" x={DISPLAY_W - 100} y={6} textAnchor="end">Left 좌측 →</text>
      <text className="dc-lbl" x={100} y={TOTAL_H - 2} textAnchor="start">← Right 우측</text>
      <text className="dc-lbl" x={DISPLAY_W - 100} y={TOTAL_H - 2} textAnchor="end">Left 좌측 →</text>

      {/* ── Dividers ── */}
      <line x1={15} y1={ROW.maxB.y} x2={DISPLAY_W-15} y2={ROW.maxB.y} stroke="#ddd" strokeWidth="0.5" strokeDasharray="4 3"/>
      <line x1={15} y1={ROW.manB.y} x2={DISPLAY_W-15} y2={ROW.manB.y} stroke="#ccc" strokeWidth="1" strokeDasharray="6 4"/>
      <line x1={15} y1={ROW.manA.y} x2={DISPLAY_W-15} y2={ROW.manA.y} stroke="#ddd" strokeWidth="0.5" strokeDasharray="4 3"/>
      {/* Midline */}
      <line x1={700} y1={0} x2={700} y2={TOTAL_H} stroke="#e8e8d8" strokeWidth="0.8" strokeDasharray="5 4"/>

      {/* ════════════════════════════════════════════════════════
          4개 SVG 이미지 (public/dental/)
          ════════════════════════════════════════════════════════ */}

      {/* 상악 옆면 (개상악A) */}
      <image
        href="/dental/%EA%B0%9C%EC%83%81%EC%95%85A.svg"
        x={15} y={ROW.maxA.y}
        width={DISPLAY_W - 30} height={ROW.maxA.h}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* 상악 크라운 (개상악B) */}
      <image
        href="/dental/%EA%B0%9C%EC%83%81%EC%95%85B.svg"
        x={15} y={ROW.maxB.y}
        width={DISPLAY_W - 30} height={ROW.maxB.h}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* 하악 크라운 (개하악B) */}
      <image
        href="/dental/%EA%B0%9C%ED%95%98%EC%95%85B.svg"
        x={15} y={ROW.manB.y}
        width={DISPLAY_W - 30} height={ROW.manB.h}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* 하악 옆면 (개하악A) */}
      <image
        href="/dental/%EA%B0%9C%ED%95%98%EC%95%85A.svg"
        x={15} y={ROW.manA.y}
        width={DISPLAY_W - 30} height={ROW.manA.h}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* ════════════════════════════════════════════════════════
          클릭 영역 — 갭 분석으로 도출한 정확한 치아별 X 경계
          상악: buccal + occlusal 두 행을 합쳐 하나의 hit area
          하악: occlusal + buccal 두 행을 합쳐 하나의 hit area
          ════════════════════════════════════════════════════════ */}

      {/* 상악 hit areas (maxA_teeth 기준 x, 두 행 높이 합산) */}
      <g id="hits-maxilla">
        {maxA_teeth.map(([id, x1, x2]) => (
          <ToothHit
            key={id}
            id={id}
            x1={x1} x2={x2}
            srcW={maxA_srcW}
            rowY={ROW.maxA.y}
            rowH={ROW.maxA.h + ROW.maxB.h}
            selected={sel(id)}
            onClick={click(id)}
          />
        ))}
      </g>

      {/* 하악 hit areas (manA_teeth 기준 x, 두 행 높이 합산) */}
      <g id="hits-mandible">
        {manA_teeth.map(([id, x1, x2]) => (
          <ToothHit
            key={id}
            id={id}
            x1={x1} x2={x2}
            srcW={manA_srcW}
            rowY={ROW.manB.y}
            rowH={ROW.manB.h + ROW.manA.h}
            selected={sel(id)}
            onClick={click(id)}
          />
        ))}
      </g>

      {/* ── 치아 번호 레이블 (하단 경계에 표시) ── */}
      {maxA_teeth.map(([id, x1, x2]) => {
        const cx = scaleX((x1 + x2) / 2, maxA_srcW);
        return (
          <text key={`n-${id}`}
            x={cx} y={ROW.maxB.y + ROW.maxB.h - 3}
            textAnchor="middle"
            style={{
              font: `${sel(id) ? "bold " : ""}7px sans-serif`,
              fill: sel(id) ? "#2255aa" : "#ccc",
              pointerEvents: "none",
            }}
          >{id}</text>
        );
      })}
      {manA_teeth.map(([id, x1, x2]) => {
        const cx = scaleX((x1 + x2) / 2, manA_srcW);
        return (
          <text key={`n-${id}`}
            x={cx} y={ROW.manB.y + 9}
            textAnchor="middle"
            style={{
              font: `${sel(id) ? "bold " : ""}7px sans-serif`,
              fill: sel(id) ? "#2255aa" : "#ccc",
              pointerEvents: "none",
            }}
          >{id}</text>
        );
      })}
    </svg>
  );
};
