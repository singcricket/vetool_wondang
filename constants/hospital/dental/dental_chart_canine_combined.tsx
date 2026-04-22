
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

import type { DentalTooth } from "@/types/dental/dental-type";

export interface DentalChartCanineCombinedProps extends React.SVGProps<SVGSVGElement> {
  selectedToothId?: string | null;
  onToothClick?: (toothId: string) => void;
  teeth?: DentalTooth[];
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
  ["202", 1950, 2100], // 2157 → 2207
  ["203", 2120, 2275], // 2335 → 2558
  ["204", 2280, 2500], // canine
  ["205", 2510, 2620], // 2797 → 2873
  ["206", 2620, 2770], // 2986 → 3090
  ["207", 2780, 2920], // 3196 → 3265
  ["208", 2940, 3150], // 3358 → end
  ["209", 3160,3325],
   ["210", 3330,3480]
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
  ["304", 2240, 2410],
  ["305", 2420, 2530],
  ["306", 2535, 2680],
  ["307", 2685, 2830],
  ["308", 2840, 2980],
  ["309", 2990, 3210],
  ["310", 3215,3360],
  ["311", 3365,3480],
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
  id, x1, x2, srcW, rowY, rowH, selected, onClick, toothData
}: {
  id: string; x1: number; x2: number; srcW: number;
  rowY: number; rowH: number; selected: boolean; onClick: () => void;
  toothData?: DentalTooth;
}) {
  const dx = scaleX(x1, srcW);
  const dw = scaleX(x2, srcW) - dx;

  let fill = "rgba(0,0,0,0)";
  let stroke = "transparent";
  let strokeWidth = 0;
  let strokeDasharray = "none";

  if (selected) {
    fill = "rgba(34,85,170,0.18)";
    stroke = "#2255aa";
    strokeWidth = 1.5;
    strokeDasharray = "4 2";
  } else if (toothData) {
    const isExtractedDone = toothData.treatment_done?.some(t => ['X', 'XS', 'XSS'].includes(t));
    const isExtractionPlanned = toothData.treatment_plan?.some(t => ['X', 'XS', 'XSS'].includes(t));
    const isMissing = toothData.status === 'FE' || toothData.status === 'ANO';
    const hasOtherTx = toothData.treatment_done && toothData.treatment_done.some(t => !['X', 'XS', 'XSS'].includes(t));
    const hasLesion = (toothData.fracture && toothData.fracture !== 'none') || 
                      (toothData.caries && toothData.caries !== 'none') || 
                      (toothData.resorption_stage && toothData.resorption_stage !== 'none');

    if (isMissing) {
      fill = "rgba(128, 128, 128, 0.5)";
    } else if (isExtractedDone) {
      fill = "rgba(255, 0, 0, 0.2)";
    } else if (isExtractionPlanned) {
      fill = "rgba(255, 0, 0, 0.08)";
      stroke = "red";
      strokeWidth = 1.5;
      strokeDasharray = "4 2";
    } else if (hasOtherTx) {
      stroke = "green";
      strokeWidth = 1.5;
    } else if (hasLesion) {
      stroke = "orange";
      strokeWidth = 2;
    }
  }

  return (
    <rect
      id={`hit-${id}`}
      x={dx} y={rowY}
      width={dw} height={rowH}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
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
  teeth = [],
  ...props
}: DentalChartCanineCombinedProps) => {
  const click = (id: string) => () => onToothClick?.(id);
  const sel   = (id: string) => selectedToothId === id;
  const getData = (id: string) => teeth.find(t => String(t.tooth_id) === id);

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
      {/* <rect width={DISPLAY_W} height={TOTAL_H} fill="#fafaf8" rx="3"/> */}

      <g transform="translate(-30, 0)">
        {/* 4개 SVG 이미지 (public/dental/) */}
        <image
          href="/dental/%EA%B0%9C%EC%83%81%EC%95%85A.svg"
          x={15} y={ROW.maxA.y}
          width={DISPLAY_W - 10} height={ROW.maxA.h}
          preserveAspectRatio="xMidYMid meet"
        />
        <image
          href="/dental/%EA%B0%9C%EC%83%81%EC%95%85B.svg"
          x={15} y={ROW.maxB.y}
          width={DISPLAY_W - 10} height={ROW.maxB.h}
          preserveAspectRatio="xMidYMid meet"
        />
        <image
          href="/dental/%EA%B0%9C%ED%95%98%EC%95%85B.svg"
          x={15} y={ROW.manB.y}
          width={DISPLAY_W - 10} height={ROW.manB.h}
          preserveAspectRatio="xMidYMid meet"
        />
        <image
          href="/dental/%EA%B0%9C%ED%95%98%EC%95%85A.svg"
          x={15} y={ROW.manA.y}
          width={DISPLAY_W - 10} height={ROW.manA.h}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* ── Row labels ── */}
        {/* <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.maxA.y + ROW.maxA.h/2} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(90,${DISPLAY_W-2},${ROW.maxA.y + ROW.maxA.h/2})`}>Buccal</text>
        <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.maxB.y + ROW.maxB.h/2} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(90,${DISPLAY_W-2},${ROW.maxB.y + ROW.maxB.h/2})`}>Occlusal</text>
        <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.manB.y + ROW.manB.h/2} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(90,${DISPLAY_W-2},${ROW.manB.y + ROW.manB.h/2})`}>Occlusal</text>
        <text className="dc-lbl" x={DISPLAY_W - 2} y={ROW.manA.y + ROW.manA.h/2} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(90,${DISPLAY_W-2},${ROW.manA.y + ROW.manA.h/2})`}>Buccal</text> */}

        ── Section labels ──
        {/* <text className="dc-sec" x={3} y={ROW.maxA.y + ROW.maxA.h/2} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(-90,3,${ROW.maxA.y + ROW.maxA.h/2})`}>MAXILLA 상악</text>
        <text className="dc-sec" x={3} y={ROW.manA.y + ROW.manA.h/2} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(-90,3,${ROW.manA.y + ROW.manA.h/2})`}>MANDIBLE 하악</text> */}

        {/* ── Side labels ── */}
        {/* <text className="dc-lbl" x={100} y={6} textAnchor="start">← Right 우측</text>
        <text className="dc-lbl" x={DISPLAY_W - 100} y={6} textAnchor="end">Left 좌측 →</text>
        <text className="dc-lbl" x={100} y={TOTAL_H - 2} textAnchor="start">← Right 우측</text>
        <text className="dc-lbl" x={DISPLAY_W - 100} y={TOTAL_H - 2} textAnchor="end">Left 좌측 →</text> */}

        {/* ── Dividers ── */}
        <line x1={15} y1={ROW.maxB.y} x2={DISPLAY_W-15} y2={ROW.maxB.y} stroke="#ddd" strokeWidth="0.5" strokeDasharray="4 3" style={{ pointerEvents: 'none' }}/>
        <line x1={0} y1={ROW.manB.y} x2={DISPLAY_W} y2={ROW.manB.y} stroke="#94a3b8" strokeWidth="1.5" style={{ pointerEvents: 'none' }}/>
        <line x1={15} y1={ROW.manA.y} x2={DISPLAY_W-15} y2={ROW.manA.y} stroke="#ddd" strokeWidth="0.5" strokeDasharray="4 3" style={{ pointerEvents: 'none' }}/>
        {/* 4분할을 위한 중심선 (Midline & Jaw Divider) */}
        <line x1={DISPLAY_W/2 + 30} y1={0} x2={DISPLAY_W/2 + 25} y2={TOTAL_H} stroke="#94a3b8" strokeWidth="1.5" style={{ pointerEvents: 'none' }}/>

        {/* 클릭 영역 */}
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
              toothData={getData(id)}
            />
          ))}
        </g>
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
              toothData={getData(id)}
            />
          ))}
        </g>

        {/* 치아 번호 레이블 */}
        {maxA_teeth.map(([id, x1, x2]) => {
          const cx = scaleX((x1 + x2) / 2, maxA_srcW);
          return (
            <text key={`n-${id}`}
              x={cx} y={ROW.maxB.y + ROW.maxB.h - 3}
              textAnchor="middle"
              style={{
                font: `${sel(id) ? "bold " : ""}10px sans-serif`,
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
                font: `${sel(id) ? "bold " : ""}10px sans-serif`,
                fill: sel(id) ? "#2255aa" : "#ccc",
                pointerEvents: "none",
              }}
            >{id}</text>
          );
        })}
      </g>
    </svg>
  );
};
