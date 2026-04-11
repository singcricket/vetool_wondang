// =============================================
// 심장초음파 자동 계산 공식 (서버 전용)
// =============================================

import type { EchoFormula } from '@/types/echocardio/echocardio-type'
import { getMmodeRef, MMODE_REF_DOG } from './mmode-ref-dog'

type CalcInput = Record<string, string>

/**
 * 수치 범위 판정
 * thresholds: [t1, t2, ...] → value < t1 → index 0, t1 ≤ value < t2 → index 1, ...
 */
export function getRangeIndex(value: number, thresholds: number[]): number {
  if (thresholds.length === 0) return 0
  const idx = thresholds.findIndex((t) => value < t)
  return idx === -1 ? thresholds.length : idx
}
export function getRangeIndexString(value: string, thresholds: string[]): number {
  if (thresholds.length === 0) return 0
  const idx = thresholds.findIndex((t) => value === t)
  return idx === -1 ? thresholds.length : idx
}
/**
 * 공식별 계산 함수
 * 입력값이 없거나 계산 불가능한 경우 null 반환
 */
const CALCULATORS: Record<EchoFormula, (inputs: CalcInput) => number | string | null> =
  {
    // FS (Fractional Shortening) = (LVd - LVs) / LVd × 100
    LVFS: ({ LVd, LVs }) => {
      const d = parseFloat(LVd)
      const s = parseFloat(LVs)
      if (isNaN(d) || isNaN(s) || d === 0) return null
      return ((d - s) / d) * 100
    },

    // EF (Ejection Fraction) - 직접 입력이므로 계산 없음
    EF: () => null,

    // LVIDDN = LVd / BW^0.294
    LVIDDN: ({ LVd, BW_kg }) => {
      const d = parseFloat(LVd)
      const bw = parseFloat(BW_kg)
      if (isNaN(d) || isNaN(bw) || bw <= 0) return null
      return (d/10) / Math.pow(bw, 0.294)
    },

    // ESVI = ESV / BSA  (BSA = 0.1 × BW^0.67 for dogs)
    ESVI: ({ ESV, BW_kg }) => {
      const esv = parseFloat(ESV)
      const bw = parseFloat(BW_kg)
      if (isNaN(esv) || isNaN(bw) || bw <= 0) return null
      const bsa = 0.1 * Math.pow(bw, 0.67)
      return esv / bsa
    },

    // LA:AO ratio = LA / AO
    LAAOratio: ({ LA, AO }) => {
      const la = parseFloat(LA)
      const ao = parseFloat(AO)
      if (isNaN(la) || isNaN(ao) || ao === 0) return null
      return la / ao
    },

    // MV E:A ratio = MV_Ewave / MV_Awave
    MV_EAratio: ({ MV_Ewave, MV_Awave }) => {
      const e = parseFloat(MV_Ewave)
      const a = parseFloat(MV_Awave)
      if (isNaN(e) || isNaN(a) || a === 0) return null
      return e / a
    },

    // LVEIO = MV_Ewave / VTI
    LVEIO: ({ MV_Ewave, VTI }) => {
      const e = parseFloat(MV_Ewave)
      const vti = parseFloat(VTI)
      if (isNaN(e) || isNaN(vti) || vti === 0) return null
      return e / vti
    },

    // E/IVRT = MV_Ewave / IVRT
    EIVRT: ({ MV_Ewave, IVRT }) => {
      const e = parseFloat(MV_Ewave)
      const ivrt = parseFloat(IVRT)
      if (isNaN(e) || isNaN(ivrt) || ivrt === 0) return null
      return e / (ivrt / 100)
    },

    // E/Em = MV_Ewave / Em (TDI)
    EEm: ({ MV_Ewave, Em }) => {
      const e = parseFloat(MV_Ewave)
      const em = parseFloat(Em)
      if (isNaN(e) || isNaN(em) || em === 0) return null
      return e / em
    },

    // LA FS = (LAdMax - LAdMin) / LAdMax × 100
    LAFS: ({ LAdMax, LAdMin }) => {
      const max = parseFloat(LAdMax)
      const min = parseFloat(LAdMin)
      if (isNaN(max) || isNaN(min) || max === 0) return null
      return ((max - min) / max) * 100
    },

    // PG (Pressure Gradient) = 4 × v²
    PG: (inputs) => {
      // velocity keywordID는 단일 dependency에서 동적으로 전달
      const vel = Object.values(inputs)[0]
      const v = parseFloat(vel)
      if (isNaN(v)) return null
      return 4 * v * v
    },

    // Em / Am
    EmAm: ({ Em, Am }) => {
      const em = parseFloat(Em)
      const am = parseFloat(Am)
      if (isNaN(em) || isNaN(am) || am === 0) return null
      return em / am
    },
    //Ra pressure //
    RApressure : ({CVCcollapse}) => {
      //"<20%","20-50%",">50%"
      if(CVCcollapse === "<20%") return 5
      if(CVCcollapse === ">50%") return 15
      if(CVCcollapse === "20-50%") return 10
      return null
    },
    //Pa pressure//
    PApressure : ({RApressure,TRPG}) => {
      const rap = parseFloat(RApressure)
      const trpg = parseFloat(TRPG)
      if (isNaN(rap) || isNaN(trpg) || trpg === 0) return null
      return trpg + rap
    },
    PAAO : ({PA,AO}) => {
      const pa = parseFloat(PA)
      const ao = parseFloat(AO)
      if (isNaN(pa) || isNaN(ao) || ao === 0) return null
      return pa / ao
    },
    ATET: ({ AT, ET }) => {
      const at = parseFloat(AT)
      const et = parseFloat(ET)
      if (isNaN(at) || isNaN(et) || et === 0) return null
      return at / et
    },
    RPADi: ({RPAmax,RPAmin}) => {
      const max = parseFloat(RPAmax)
      const min = parseFloat(RPAmin)
      if (isNaN(max) || isNaN(min) || max === 0) return null
      return ((max - min) / max) * 100
    },
    MINE_LAAO : ({LAAOratio}) => {
      const laao = parseFloat(LAAOratio)
      if (isNaN(laao) || laao === 0) return 0
      if (laao < 1.7) return 1
      if (laao >= 1.7 && laao <1.9) return 2
      if(laao >= 1.9 && laao <2.5) return 3
      return 4
    },
    MINE_LVIDDN: ({LVIDDN}) => {
       const lviddn = parseFloat(LVIDDN)
       if(isNaN(lviddn) || lviddn === 0) return 0
       if(lviddn < 1.7) return 1
       if(lviddn>=1.7 && lviddn <2) return 2
       if(lviddn>=2 && lviddn <2.3) return 3
       return 4
    },
    MINE_FS : ({LVFS}) => {
      const lvfs = parseFloat(LVFS)
      if (isNaN(lvfs) || lvfs === 0) return 0
      if (lvfs < 45) return 1
      if (lvfs >= 45 && lvfs <50) return 2
      return 3
    },
    MINE_Ewave : ({MV_Ewave}) => {
      const ewave = parseFloat(MV_Ewave)
      if (isNaN(ewave) || ewave === 0) return 0
      if (ewave < 1.2) return 1
      if (ewave >=1.2 && ewave <1.5) return 2
      return 3
    },
    MINE_score : ({MINE_LAAO,MINE_LVIDDN,MINE_FS,MINE_Ewave}) => {
      const laao = isNaN(parseFloat(MINE_LAAO)) ? 0 : parseFloat(MINE_LAAO)
      const lviddn = isNaN(parseFloat(MINE_LVIDDN)) ? 0 : parseFloat(MINE_LVIDDN)
      const fs = isNaN(parseFloat(MINE_FS)) ? 0 : parseFloat(MINE_FS)
      const ewave = isNaN(parseFloat(MINE_Ewave)) ? 0 : parseFloat(MINE_Ewave)
       
      return laao + lviddn + fs + ewave
    },
    decreasedSizeOfLV: ({LVd,BW_kg}) => {
      const bwlbs = getMmodeRef(parseFloat(BW_kg),"LVd");
      const lvdVal = parseFloat(LVd);
      if(!bwlbs || !lvdVal) return "";
      const [lvdmin,lvdmax] = bwlbs;
      if(lvdVal<lvdmin){
        return "yes";
      }else{
        return "";
      }  
    },
    anatomic_PAAO : ({PAAO}) => {
      const paao = parseFloat(PAAO)
      if(isNaN(paao) || paao === 0) return ""
      return ( paao ) > 1 ? "yes" : ""
    },
    anatomic_PR_vel : ({PR_vel}) => {
      const prvel = parseFloat(PR_vel)
      if(isNaN(prvel) || prvel === 0) return ""
      return ( prvel ) > 2.5 ? "yes" : ""
    },
     anatomic_RPADi : ({RPADi}) =>{
      const rpadis = parseFloat(RPADi)
      if(isNaN(rpadis) || rpadis === 0) return ""
      return ( rpadis ) < 30 ? "yes" : ""
     },
     anatomic_AT : ({AT}) =>{
      const at = parseFloat(AT)
      if(isNaN(at) || at === 0) return ""
      return ( at ) <= 52 ? "yes" : ""
     },
     anatomic_ATET : ({ATET}) =>{
      const atet = parseFloat(ATET)
      if(isNaN(atet) || atet === 0) return ""
      return ( atet ) < 0.3 ? "yes" : ""
     },
     anatomic_number1 : ({IVS_flattening,decreasedSizeOfLV,RVhypertrophy,RVsystolicDysfunction}) =>{
       const count = [IVS_flattening,decreasedSizeOfLV,RVhypertrophy,RVsystolicDysfunction].filter(x=>"yes"===x).length;
       if(count>0) return 1
       return 0;
     },
     anatomic_number2 : ({anatomic_PAAO,anatomic_PR_vel,anatomic_RPADi,anatomic_AT,anatomic_ATET,SystolicNotch}) =>{
       const count = [anatomic_PAAO,anatomic_PR_vel,anatomic_RPADi,anatomic_AT,anatomic_ATET,SystolicNotch].filter(x=>"yes"===x).length;
       if(count>0) return 1
       return 0;
     },
     anatomic_number3 : ({RAenlargement,CVCenlargement}) =>{
       const count = [RAenlargement,CVCenlargement].filter(x=>"yes"===x).length;
       if(count>0) return 1
       return 0;
     },
     anatomic_numbertotal : ({anatomic_number1,anatomic_number2,anatomic_number3}) =>{
      const f1 = isNaN(parseFloat(anatomic_number1)) ? 0 : parseFloat(anatomic_number1)
      const f2 = isNaN(parseFloat(anatomic_number2)) ? 0 : parseFloat(anatomic_number2)
      const f3 = isNaN(parseFloat(anatomic_number3)) ? 0 : parseFloat(anatomic_number3)
      // if(isNaN(f1) || isNaN(f2) || isNaN(f3)) return 0
      return f1+f2+f3
     },
     PHprob : ({anatomic_numbertotal,TR_vel}) =>{
      const no = isNaN(parseFloat(anatomic_numbertotal)) ? 0 : parseFloat(anatomic_numbertotal)
      const tr = isNaN(parseFloat(TR_vel)) ? 0 : parseFloat(TR_vel)
      if((!tr||tr<=3)&&(no===0||no===1)) return "Low"
      if(!tr||tr<=3&&no===2) return "Intermediate"
      if((tr>3&&tr<=3.4)&&(no===0||no===1)) return "Intermediate"
      if(tr>3.4&&no===0) return "Intermediate"
      if((!tr||tr<=3)&&no===3) return "High"
      if(tr>3&&tr<=3.4&&no>=2) return "High"
      if(tr>3.4&&no>=1) return "High"
      return ""
     }
     
  }

/**
 * 계산 실행
 * @param formula 공식 이름
 * @param inputs { keywordID: value } 형태의 의존 필드 값
 * @returns 계산 결과 (소수점 2자리) 또는 null
 */
// export function calculate(
//   formula: EchoFormula,
//   inputs: CalcInput,
// ): number | string | null {
//   const fn = CALCULATORS[formula]
//   if (!fn) return null
//   const result = fn(inputs)
//   if(typeof result === 'string' && result ==="" ) return null
//   if(typeof result === 'string') return result
//   if (result === null || isNaN(result)) return null
//   return Math.round(result * 100) / 100
// }
export function calculate(
  formula: EchoFormula,
  inputs: CalcInput,
): number | string | null {
  const fn = CALCULATORS[formula]
  if (!fn) return null
  const result = fn(inputs)

  // 1. 문자열인 경우 즉시 리턴
  if (typeof result === 'string') return result
  
  // 2. null이거나 실제 NaN(숫자 연산 오류)인 경우 리턴
  if (result === null || isNaN(result)) return null
  
  // 3. 위 조건들을 통과했다면 result는 확실히 number이므로 안심하고 계산
  return Math.round(result * 100) / 100
}
