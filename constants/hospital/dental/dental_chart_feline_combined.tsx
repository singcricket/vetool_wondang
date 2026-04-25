
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

export const toothNames_kr: Record<string, string> = {
  "101":"우측 상악 제1절치","102":"우측 상악 제2절치","103":"우측 상악 제3절치",
  "104":"우측 상악 견치","105":"우측 상악 제1전구치","106":"우측 상악 제2전구치",
  "107":"우측 상악 제3전구치","108":"우측 상악 제4전구치 (P4)","109":"우측 상악 제1후구치","110":"우측 상악 제2후구치",
  "201":"좌측 상악 제1절치","202":"좌측 상악 제2절치","203":"좌측 상악 제3절치",
  "204":"좌측 상악 견치","205":"좌측 상악 제1전구치","206":"좌측 상악 제2전구치",
  "207":"좌측 상악 제3전구치","208":"좌측 상악 제4전구치 (P4)","209":"좌측 상악 제1후구치","210":"좌측 상악 제2후구치",
  "301":"좌측 하악 제1절치","302":"좌측 하악 제2절치","303":"좌측 하악 제3절치",
  "304":"좌측 하악 견치","305":"좌측 하악 제1전구치","306":"좌측 하악 제2전구치",
  "307":"좌측 하악 제3전구치","308":"좌측 하악 제4전구치","309":"좌측 하악 제1후구치 (M1)","310":"좌측 하악 제2후구치","311":"좌측 하악 제3후구치",
  "401":"우측 하악 제1절치","402":"우측 하악 제2절치","403":"우측 하악 제3절치",
  "404":"우측 하악 견치","405":"우측 하악 제1전구치","406":"우측 하악 제2전구치",
  "407":"우측 하악 제3전구치","408":"우측 하악 제4전구치","409":"우측 하악 제1후구치 (M1)","410":"우측 하악 제2후구치","411":"우측 하악 제3후구치"
};

import type { DentalTooth } from "@/types/dental/dental-type";

export interface DentalChartFelineCombinedProps extends React.SVGProps<SVGSVGElement> {
  selectedToothId?: string | null;
  selectedToothIds?: string[];
  onToothClick?: (toothId: string, e?: React.MouseEvent) => void;
  teeth?: DentalTooth[];
}

// ────────────────────────────────────────────────────────────────────
// 갭 분석으로 도출한 치아별 실제 X 경계 (SVG 소스 좌표계)
// 각 SVG는 독립적인 좌표계를 가짐
// ────────────────────────────────────────────────────────────────────

// 고양이상악A (3444px wide) — buccal/lateral view
const maxA_teeth: [string, number, number][] = [
  ["110",    0,  180],
  ["109",  221,  395],
  ["108",  409,  555],
  ["107",  603,  715],
  ["106",  775,  875],
  ["105",  929, 1000],
  ["104", 1010, 1250],
  ["103", 1270, 1420],
  ["102", 1440, 1590],
  ["101", 1610, 1770],
  ["201", 1790, 1940],
  ["202", 1950, 2100],
  ["203", 2120, 2275],
  ["204", 2280, 2500],
  ["205", 2510, 2620],
  ["206", 2620, 2770],
  ["207", 2780, 2920],
  ["208", 2940, 3150],
  ["209", 3160,3325],
  ["210", 3330,3480]
];

// 개상악B (3444px wide) — occlusal/crown view
const maxB_teeth: [string, number, number][] = [
  ["110",    0,  175],
  ["109",  222,  415],
  ["108",  417,  555],
  ["107",  608,  718],
  ["106",  765,  875],
  ["105",  914, 1000],
  ["104", 1097, 1160],
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

const maxA_dispH = Math.round(DISPLAY_W * maxA_srcH / maxA_srcW);
const maxB_dispH = Math.round(DISPLAY_W * maxB_srcH / maxB_srcW);
const manB_dispH = Math.round(DISPLAY_W * manB_srcH / manB_srcW);
const manA_dispH = Math.round(DISPLAY_W * manA_srcH / manA_srcW);

const ROW = {
  maxA: { y: 12,  h: 115 }, // 상악 옆면
  maxB: { y: 127, h: 68  }, // 상악 크라운
  manB: { y: 195, h: 62  }, // 하악 크라운
  manA: { y: 257, h: 125 }, // 하악 옆면
};
const TOTAL_H = ROW.manA.y + ROW.manA.h + 16; // 398

function scaleX(srcX: number, srcW: number): number {
  return Math.round((srcX / srcW) * DISPLAY_W);
}

function ToothHit({
  id, x1, x2, srcW, rowY, rowH, selected, onClick, toothData
}: {
  id: string; x1: number; x2: number; srcW: number;
  rowY: number; rowH: number; selected: boolean; onClick: (e: React.MouseEvent) => void;
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
    const isExtractedDone =  toothData.treatment_done?.some(t => ['X', 'XS', 'XSS'].includes(t));
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

const FELINE_MISSING = new Set([
  "110", "105", "205", "210", 
  "411", "410", "406", "405", "305", "306", "310", "311"
]);

export const DentalChartFelineCombined = ({
  selectedToothId,
  selectedToothIds = [],
  onToothClick,
  teeth = [],
  ...props
}: DentalChartFelineCombinedProps) => {
  const click = (id: string) => (e: React.MouseEvent) => onToothClick?.(id, e);
  const sel   = (id: string) => selectedToothIds.includes(id) || selectedToothId === id;
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

      <g transform="translate(-30, 0)">
        <image
          href="/dental/%EA%B3%A0%EC%96%91%EC%9D%B4%EC%83%81%EC%95%85A.svg"
          x={15} y={ROW.maxA.y}
          width={DISPLAY_W - 10} height={ROW.maxA.h}
          preserveAspectRatio="none"
        />
        <image
          href="/dental/%EA%B3%A0%EC%96%91%EC%9D%B4%EC%83%81%EC%95%85B.svg"
          x={15} y={ROW.maxB.y}
          width={DISPLAY_W - 10} height={ROW.maxB.h}
          preserveAspectRatio="none"
        />
        <image
          href="/dental/%EA%B3%A0%EC%96%91%EC%9D%B4%ED%95%98%EC%95%85B.svg"
          x={15} y={ROW.manB.y}
          width={DISPLAY_W - 10} height={ROW.manB.h}
          preserveAspectRatio="none"
        />
        <image
          href="/dental/%EA%B3%A0%EC%96%91%EC%9D%B4%ED%95%98%EC%95%85A.svg"
          x={15} y={ROW.manA.y}
          width={DISPLAY_W - 10} height={ROW.manA.h}
          preserveAspectRatio="none"
        />

        <line x1={15} y1={ROW.maxB.y} x2={DISPLAY_W-15} y2={ROW.maxB.y} stroke="#ddd" strokeWidth="0.5" strokeDasharray="4 3" style={{ pointerEvents: 'none' }}/>
        <line x1={0} y1={ROW.manB.y} x2={DISPLAY_W} y2={ROW.manB.y} stroke="#94a3b8" strokeWidth="1.5" style={{ pointerEvents: 'none' }}/>
        <line x1={15} y1={ROW.manA.y} x2={DISPLAY_W-15} y2={ROW.manA.y} stroke="#ddd" strokeWidth="0.5" strokeDasharray="4 3" style={{ pointerEvents: 'none' }}/>
        <line x1={DISPLAY_W/2 + 30} y1={0} x2={DISPLAY_W/2 + 25} y2={TOTAL_H} stroke="#94a3b8" strokeWidth="1.5" style={{ pointerEvents: 'none' }}/>

        <g id="hits-maxilla">
          {maxA_teeth.map(([id, x1, x2]) => {
            if (FELINE_MISSING.has(id)) return null;
            return (
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
            );
          })}
        </g>
        <g id="hits-mandible">
          {manA_teeth.map(([id, x1, x2]) => {
            if (FELINE_MISSING.has(id)) return null;
            return (
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
            );
          })}
        </g>

        {maxA_teeth.map(([id, x1, x2]) => {
          if (FELINE_MISSING.has(id)) return null;
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
          if (FELINE_MISSING.has(id)) return null;
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
