import type { OphTreatmentCategory, OphTreatmentOption } from './ophthalmic-types'

// ============================================================
// SECTION 17: TREATMENT STANDARDS
// ============================================================

export const ophthalmicTreatmentOptions: Record<OphTreatmentCategory, OphTreatmentOption[]> = {
  topical: [
    // 항생제
    { id: 'abx_fluoro', nameKo: '플루오로퀴놀론계 항생제', nameEn: 'Fluoroquinolones (Ofloxacin/Cravit)', clientTerm: '세균 감염 억제 및 예방 안약', group: 'antibiotic', frequency: '1일 4~6회' },
    { id: 'abx_viga', nameKo: '비가모스크 (목시플록사신)', nameEn: 'Vigamox (Moxifloxacin)', clientTerm: '고성능 4세대 항생제 안약', group: 'antibiotic', frequency: '1일 4회' },
    { id: 'abx_tobra', nameKo: '토브라마이신', nameEn: 'Tobramycin', clientTerm: '그람음성균 항생제 안약', group: 'antibiotic', frequency: '1일 4회' },
    { id: 'abx_genta', nameKo: '겐타마이신', nameEn: 'Gentamicin', clientTerm: '광범위 항생제 안약', group: 'antibiotic', frequency: '1일 4~6회' },
    { id: 'abx_chloramp', nameKo: '클로람페니콜', nameEn: 'Chloramphenicol', clientTerm: '고양이·소동물용 광범위 항생제 안약', group: 'antibiotic', frequency: '1일 4~6회' },
    { id: 'abx_triple', nameKo: '트리플 항생제', nameEn: 'Triple Antibiotic (Bacitracin/Neomycin/Polymyxin B)', clientTerm: '복합 성분 표면 감염 억제 안약', group: 'antibiotic', frequency: '1일 4회' },
    { id: 'abx_fusidic', nameKo: '퓨시딕산', nameEn: 'Fucithalmic (Fusidic Acid)', clientTerm: '포도상구균 등 그람양성균 항생제 안약', group: 'antibiotic', frequency: '1일 2회' },
    { id: 'abx_azithro', nameKo: '아지스로마이신', nameEn: 'AzaSite (Azithromycin)', clientTerm: '클라미디아·마이코플라즈마 항생제 안약', group: 'antibiotic', frequency: '1일 2회' },
    { id: 'abx_cefazolin', nameKo: '세파졸린 강화 제제', nameEn: 'Fortified Cefazolin', clientTerm: '중증 각막 감염 고농도 항생제 안약', group: 'antibiotic', frequency: '1일 6회' },
    // 스테로이드
    { id: 'steroid_pred', nameKo: '프레드니솔론 (1%)', nameEn: 'Prednisolone Acetate (1%)', clientTerm: '강력한 항염증 스테로이드 안약', group: 'steroid', frequency: '1일 4회' },
    { id: 'steroid_dexa', nameKo: '덱사메타손', nameEn: 'Dexamethasone', clientTerm: '항염증 스테로이드 안약', group: 'steroid', frequency: '1일 4회' },
    { id: 'steroid_fml', nameKo: '플루오로메타솔론', nameEn: 'FML (Fluorometholone)', clientTerm: '자극이 적은 중등도 스테로이드 안약', group: 'steroid', frequency: '1일 4회' },
    // NSAIDs
    { id: 'nsaid_neva', nameKo: '네바낙 (네파페낙)', nameEn: 'Nevanac (Nepafenac)', clientTerm: '비스테로이드성 통증 및 염증 완화 안약', group: 'nsaid', frequency: '1일 3회' },
    { id: 'nsaid_keto', nameKo: '케토롤락', nameEn: 'Acular (Ketorolac)', clientTerm: '통증·염증 완화 비스테로이드 안약', group: 'nsaid', frequency: '1일 4회' },
    { id: 'nsaid_brom', nameKo: '브롬페낙', nameEn: 'Bronuck (Bromfenac)', clientTerm: '수술 후 염증 억제 비스테로이드 안약', group: 'nsaid', frequency: '1일 2회' },
    { id: 'nsaid_diclo', nameKo: '디클로페낙', nameEn: 'Diclofenac', clientTerm: '염증 및 통증 조절 비스테로이드 안약', group: 'nsaid', frequency: '1일 4회' },
    // 녹내장
    { id: 'glaucoma_lata', nameKo: '라타노프로스트', nameEn: 'Latanoprost', clientTerm: '신속한 안압 강하 안약', group: 'glaucoma', frequency: '1일 1회 (야간)' },
    { id: 'glaucoma_dorzo', nameKo: '도르졸라미드/티몰롤', nameEn: 'Dorzolamide/Timolol (Cosopt)', clientTerm: '안압 생성 억제 및 유지 안약', group: 'glaucoma', frequency: '1일 2~3회' },
    { id: 'glaucoma_travo', nameKo: '트라보프로스트', nameEn: 'Travatan (Travoprost)', clientTerm: '프로스타글란딘 계열 안압 강하 안약', group: 'glaucoma', frequency: '1일 1회 (야간)' },
    { id: 'glaucoma_bima', nameKo: '비마토프로스트', nameEn: 'Lumigan (Bimatoprost)', clientTerm: '방수 배출 촉진 안압 강하 안약', group: 'glaucoma', frequency: '1일 1회 (야간)' },
    { id: 'glaucoma_timol', nameKo: '티몰롤', nameEn: 'Timolol (Beta-blocker)', clientTerm: '안방수 생성 억제 안압 강하 안약', group: 'glaucoma', frequency: '1일 2회' },
    { id: 'glaucoma_brinzo', nameKo: '브린졸라미드', nameEn: 'Azopt (Brinzolamide)', clientTerm: '탄산탈수효소 억제 안압 강하 안약', group: 'glaucoma', frequency: '1일 2~3회' },
    { id: 'glaucoma_brimo', nameKo: '브리모니딘', nameEn: 'Alphagan (Brimonidine)', clientTerm: '알파 작용제 안압 강하 및 신경보호 안약', group: 'glaucoma', frequency: '1일 2~3회' },
    // KCS / 건성안
    { id: 'kcs_cyclosporine', nameKo: '사이클로스포린', nameEn: 'Cyclosporine (Restasis/Optimmune)', clientTerm: '눈물 분비 촉진 및 면역 조절 안약', group: 'kcs', frequency: '1일 2회' },
    { id: 'kcs_tacrolimus', nameKo: '타크로리무스', nameEn: 'Tacrolimus', clientTerm: '만성 안구 건조증 개선 및 면역 조절 안약', group: 'kcs', frequency: '1일 2회' },
    // 산동제
    { id: 'mydriatic_atropine', nameKo: '아트로핀 (1%)', nameEn: 'Atropine Sulfate (1%)', clientTerm: '산동 및 모양체 근육 이완 안약 (통증 완화)', group: 'mydriatic', frequency: '1일 1~2회' },
    { id: 'mydriatic_tropi', nameKo: '트로피카미드 (1%)', nameEn: 'Tropicamide (1%)', clientTerm: '단시간 동공 확장 및 검사용 안약', group: 'mydriatic', frequency: '필요 시 (PRN)' },
    { id: 'mydriatic_phenyl', nameKo: '페닐에프린', nameEn: 'Phenylephrine', clientTerm: '동공 확장 및 충혈 완화 안약', group: 'mydriatic', frequency: '필요 시 (PRN)' },
    // 인공눈물 / 윤활제
    { id: 'lubricant_hyal', nameKo: '히알루론산', nameEn: 'Hyaluronic Acid', clientTerm: '각막 보호 및 보습 인공눈물', group: 'lubricant', frequency: '1일 4회 이상' },
    { id: 'lubricant_cmc', nameKo: '카복시메틸셀룰로스', nameEn: 'Carboxymethylcellulose (CMC)', clientTerm: '각막 수분 유지 인공눈물', group: 'lubricant', frequency: '1일 4회 이상' },
    { id: 'lubricant_pva', nameKo: '폴리비닐알코올', nameEn: 'Polyvinyl Alcohol (PVA)', clientTerm: '눈물막 안정화 인공눈물', group: 'lubricant', frequency: '1일 4회 이상' },
    { id: 'lubricant_carbomer', nameKo: '카보머 젤', nameEn: 'Carbomer Gel', clientTerm: '장시간 수분 유지 점안 젤', group: 'lubricant', frequency: '1일 4회' },
    { id: 'lubricant_oint', nameKo: '안연고 (바셀린계)', nameEn: 'Ophthalmic Ointment (Lacri-Lube)', clientTerm: '야간 각막 보호 및 윤활 안연고', group: 'lubricant', frequency: '취침 전 1회' },
    // 항바이러스제 (주로 고양이 FHV-1)
    { id: 'antiviral_idu', nameKo: '이독수리딘', nameEn: 'Idoxuridine (IDU)', clientTerm: '고양이 헤르페스 바이러스 억제 안약', group: 'antiviral', frequency: '1일 5~6회' },
    { id: 'antiviral_cido', nameKo: '시도포비어', nameEn: 'Cidofovir', clientTerm: '고양이 헤르페스 바이러스 항바이러스 안약', group: 'antiviral', frequency: '주 2회' },
    { id: 'antiviral_triflu', nameKo: '트리플루리딘', nameEn: 'Trifluridine', clientTerm: '헤르페스성 각막염 억제 안약', group: 'antiviral', frequency: '1일 5~9회' },
    // 항진균제
    { id: 'antifung_nata', nameKo: '나타마이신', nameEn: 'Natacyn (Natamycin)', clientTerm: '진균성 각막염 억제 안약', group: 'antifungal', frequency: '1일 4~6회' },
    { id: 'antifung_vori', nameKo: '보리코나졸', nameEn: 'Voriconazole', clientTerm: '광범위 항진균 각막염 치료 안약', group: 'antifungal', frequency: '1일 4회' },
    { id: 'antifung_mico', nameKo: '미코나졸', nameEn: 'Miconazole', clientTerm: '진균 감염 억제 안약', group: 'antifungal', frequency: '1일 4~6회' },
    // 국소마취제
    { id: 'anes_propa', nameKo: '프로파라카인', nameEn: 'Alcaine (Proparacaine)', clientTerm: '처치 전 일시적 통증 차단 마취 안약', group: 'anesthetic', frequency: '처치 시' },
    { id: 'anes_tetra', nameKo: '테트라카인', nameEn: 'Tetracaine', clientTerm: '각막·결막 처치용 마취 안약', group: 'anesthetic', frequency: '처치 시' },
    // 조제 제제 (Compounding)
    {
      id: 'comp_serum',
      nameKo: '혈청안약 (자가혈청)',
      nameEn: 'Autologous Serum Eye Drops',
      clientTerm: '자신의 혈액으로 만든 맞춤형 안약',
      group: 'compounding',
      frequency: '1일 4~6회',
      info: '① 채혈 후 실온에서 20~30분 응고 → ② 원심분리(3,000rpm, 10분) → ③ 혈청 분리 → ④ BSS 또는 멸균생리식염수로 20~50% 농도로 희석 → ⑤ 0.22μm 멸균 필터 여과 → ⑥ 멸균 점안병에 분주. 냉장(2~8°C) 보관, 개봉 후 1주 이내 사용. 장기 보관 시 냉동(−20°C) 가능.',
    },
    {
      id: 'comp_nac',
      nameKo: '아세틸시스테인 안약',
      nameEn: 'N-Acetylcysteine (NAC) Eye Drops',
      clientTerm: '각막 용해 억제 및 점액 분해 안약',
      group: 'compounding',
      frequency: '1일 4~6회',
      info: '① N-아세틸시스테인 주사제(200mg/mL) 또는 원료 분말 사용 → ② BSS 또는 인공눈물로 희석하여 2~5% 최종 농도 조제 → ③ 0.22μm 멸균 필터 여과 → ④ 냉장(4°C) 보관, 1주 이내 사용. 콜라게나제(collagenase) 억제 작용으로 각막 용해성 궤양(melting ulcer) 진행 억제 목적.',
    },
    {
      id: 'comp_nacl',
      nameKo: '고농도 NaCl 안약 (5%)',
      nameEn: 'Hypertonic Saline (5% NaCl)',
      clientTerm: '각막 부종 완화 고삼투압 안약',
      group: 'compounding',
      frequency: '1일 4~6회',
      info: '① 상용 제품(Muro 128, 5% NaCl) 사용 시 별도 조제 불필요. ② 직접 조제 시: 0.9% 생리식염수에 NaCl을 추가하여 3~5% 농도로 조제 → 0.22μm 멸균 필터 여과 → 멸균 점안병에 분주. 각막 실질 내 수분을 삼투압으로 끌어내 각막 부종(corneal edema) 완화 목적. 점안 시 일시적 자극감 있을 수 있음.',
    },
  ],
  oral: [
    // 항생제
    { id: 'oral_abx', nameKo: '전신 항생제 (일반)', nameEn: 'Systemic Antibiotics', clientTerm: '세균 감염 조절 내복약', frequency: '1일 2회' },
    { id: 'oral_doxy', nameKo: '독시사이클린', nameEn: 'Doxycycline', clientTerm: '클라미디아·마이코플라즈마 감염 항생제 내복약', frequency: '1일 2회' },
    { id: 'oral_amoxclav', nameKo: '아목시실린-클라불라네이트', nameEn: 'Amoxicillin-Clavulanate', clientTerm: '안와 주변 세균 감염 항생제 내복약', frequency: '1일 2~3회' },
    { id: 'oral_enro', nameKo: '엔로플록사신', nameEn: 'Enrofloxacin', clientTerm: '광범위 그람음성균 항생제 내복약', frequency: '1일 1회' },
    { id: 'oral_azithro', nameKo: '아지스로마이신', nameEn: 'Azithromycin', clientTerm: '비정형 세균 항생제 내복약', frequency: '1일 1회' },
    // NSAIDs
    { id: 'oral_nsaid', nameKo: '전신 NSAIDs (일반)', nameEn: 'Systemic NSAIDs', clientTerm: '소염 진통제 내복약', frequency: '1일 2회' },
    { id: 'oral_carprofen', nameKo: '카프로펜', nameEn: 'Carprofen (Rimadyl)', clientTerm: '수술 후 통증·염증 완화 내복약 (주로 개)', frequency: '1일 2회' },
    { id: 'oral_melox', nameKo: '멜록시캄', nameEn: 'Meloxicam', clientTerm: '통증 및 염증 완화 내복약', frequency: '1일 1회' },
    { id: 'oral_robena', nameKo: '로베나콕시브', nameEn: 'Robenacoxib (Onsior)', clientTerm: '단기 급성 통증·염증 완화 내복약', frequency: '1일 1회' },
    // 스테로이드
    { id: 'oral_steroid', nameKo: '전신 스테로이드 (일반)', nameEn: 'Systemic Steroids', clientTerm: '면역 조절 및 강력 소염 내복약', frequency: '1일 1~2회' },
    { id: 'oral_pred', nameKo: '프레드니솔론 내복', nameEn: 'Oral Prednisolone', clientTerm: '포도막염·면역매개 안질환 스테로이드 내복약', frequency: '1일 1~2회' },
    // 탄산탈수효소 억제제 (경구 안압강하)
    { id: 'oral_cai', nameKo: '아세타졸아미드', nameEn: 'Acetazolamide (Diamox)', clientTerm: '안압 하강 보조 내복약', frequency: '1일 2~3회' },
    { id: 'oral_methazol', nameKo: '메타졸아미드', nameEn: 'Methazolamide', clientTerm: '만성 녹내장 안압 조절 내복약', frequency: '1일 2~3회' },
    // 항바이러스
    { id: 'oral_famci', nameKo: '팜시클로비어', nameEn: 'Famciclovir', clientTerm: '고양이 헤르페스 바이러스 항바이러스 내복약', frequency: '1일 2~3회' },
    // 면역·영양 보조
    { id: 'oral_lysine', nameKo: 'L-라이신', nameEn: 'L-Lysine Supplement', clientTerm: '고양이 헤르페스 바이러스 억제 보조 영양제', frequency: '1일 2회' },
    { id: 'oral_omega3', nameKo: '오메가-3 지방산', nameEn: 'Omega-3 Fatty Acids', clientTerm: '눈물 분비 촉진 및 항염 영양 보조제', frequency: '1일 1회' },
    // 삼투압 이뇨제
    { id: 'oral_mannitol', nameKo: '만니톨 정맥주사', nameEn: 'Mannitol IV', clientTerm: '급성 녹내장 응급 안압 강하 수액 처치', frequency: '응급 1회' },
  ],
  procedure: [
    { id: 'proc_epilation', nameKo: '첩모 발거', nameEn: 'Cilia Epilation', clientTerm: '눈을 찌르는 속눈썹 제거' },
    { id: 'proc_flush', nameKo: '비루관 세척', nameEn: 'Nasolacrimal Duct Flush', clientTerm: '막힌 눈물관 개통 시술' },
    { id: 'proc_subconj_inj', nameKo: '결막하 주사', nameEn: 'Subconjunctival Injection', clientTerm: '안구 주변 고농도 약물 주입' },
    { id: 'proc_foreign_remove', nameKo: '각막 표면 이물 제거', nameEn: 'Corneal Foreign Body Removal', clientTerm: '각막에 박힌 이물질 제거' },
    { id: 'proc_stt', nameKo: '쉬르머 누액 검사', nameEn: 'Schirmer Tear Test (STT)', clientTerm: '눈물 분비량 측정 검사' },
    { id: 'proc_tono', nameKo: '안압 측정', nameEn: 'Tonometry (Tonovet/Tonopen)', clientTerm: '안압 수치 측정 검사' },
    { id: 'proc_fluor', nameKo: '형광 염색 검사', nameEn: 'Fluorescein Staining', clientTerm: '각막 상처 및 눈물막 확인 검사' },
    { id: 'proc_corneal_cyto', nameKo: '각막 세포진 검사', nameEn: 'Corneal Cytology', clientTerm: '각막 표면 세포 채취 검사' },
    { id: 'proc_culture', nameKo: '각막 배양 검사', nameEn: 'Corneal Culture & Sensitivity', clientTerm: '감염 원인균 및 항생제 감수성 검사' },
    { id: 'proc_debride', nameKo: '각막 변연 절제', nameEn: 'Corneal Debridement', clientTerm: '각막 상처 치유 촉진을 위한 변성 세포 제거 시술' },
    { id: 'proc_grid_kera', nameKo: '격자형 각막 절개', nameEn: 'Grid Keratotomy', clientTerm: '난치성 각막 궤양 치유를 위한 격자 절개 시술' },
    { id: 'proc_diamond_burr', nameKo: '다이아몬드 버 연마', nameEn: 'Diamond Burr Debridement', clientTerm: '각막 표면 미세 연마 치료 시술' },
    { id: 'proc_aqua_para', nameKo: '전방 천자', nameEn: 'Anterior Chamber Paracentesis', clientTerm: '안방수 채취 또는 압력 조절 시술' },
    { id: 'proc_meibomian', nameKo: '마이봄샘 압출', nameEn: 'Meibomian Gland Expression', clientTerm: '눈꺼풀 지질샘 분비물 배출 시술' },
    { id: 'proc_punctal_dil', nameKo: '누점 확장', nameEn: 'Punctal Dilation', clientTerm: '막힌 눈물점 개방 시술' },
    { id: 'proc_conjunctival_cyto', nameKo: '결막 세포진 검사', nameEn: 'Conjunctival Cytology', clientTerm: '결막 표면 세포 채취 감염·염증 진단 검사' },
    { id: 'proc_electrolysis', nameKo: '전기분해 (이소모낭)', nameEn: 'Electrolysis (Distichia)', clientTerm: '이소성 속눈썹 모낭 전기 파괴 시술' },
    { id: 'proc_cryo', nameKo: '냉동 요법', nameEn: 'Cryotherapy', clientTerm: '비정상 속눈썹·종양 조직 냉동 제거 시술' },
    { id: 'proc_nasolacrimal_cath', nameKo: '비루관 카테터 삽치', nameEn: 'Nasolacrimal Duct Catheterization', clientTerm: '비루관 폐색 해소 카테터 삽치 시술' },
  ],
  surgery: [
    { id: 'surg_phaco', nameKo: '백내장 수술 (수정체 유화)', nameEn: 'Phacoemulsification & IOL Implantation', clientTerm: '백내장 제거 및 인공 수정체 삽입 수술' },
    { id: 'surg_flap', nameKo: '결막 플랩', nameEn: 'Conjunctival Flap', clientTerm: '심한 각막 궤양 보호를 위한 결막 이식 수술' },
    { id: 'surg_conj_pedicle', nameKo: '결막 유경 이식편', nameEn: 'Conjunctival Pedicle Graft', clientTerm: '각막 결손 부위 복원을 위한 결막 이식 수술' },
    { id: 'surg_keratoplasty', nameKo: '각막 이식', nameEn: 'Keratoplasty (Corneal Grafting)', clientTerm: '손상된 각막 조직 이식 수술' },
    { id: 'surg_corneal_suture', nameKo: '각막 봉합', nameEn: 'Corneal Suturing', clientTerm: '각막 열상 또는 천공 봉합 수술' },
    { id: 'surg_enucleation', nameKo: '안구 적출', nameEn: 'Enucleation', clientTerm: '회복 불가능한 안구의 외과적 제거 수술' },
    { id: 'surg_evisceration', nameKo: '의안 삽입술', nameEn: 'Evisceration & Intrascleral Prosthesis', clientTerm: '안구 내용물 제거 후 인공 안구 삽입 수술' },
    { id: 'surg_entropion', nameKo: '안검 내번 교정', nameEn: 'Entropion Correction', clientTerm: '안으로 말린 눈꺼풀 교정 수술' },
    { id: 'surg_ectropion', nameKo: '안검 외번 교정', nameEn: 'Ectropion Correction', clientTerm: '밖으로 뒤집힌 눈꺼풀 교정 수술' },
    { id: 'surg_distichia_cryo', nameKo: '이소모낭 냉동 절제', nameEn: 'Distichia Cryoablation', clientTerm: '이중 속눈썹 모낭 냉동 영구 제거 수술' },
    { id: 'surg_ectopic_cilia', nameKo: '이소성 속눈썹 절제', nameEn: 'Ectopic Cilia Excision', clientTerm: '결막 내 잘못 난 속눈썹 외과적 제거 수술' },
    { id: 'surg_cherry_pocket', nameKo: '3안검 분비선 복원 (포켓법)', nameEn: 'Third Eyelid Gland Replacement (Pocket Technique)', clientTerm: '탈출된 눈물샘(체리아이) 복원 수술 (포켓법)' },
    { id: 'surg_cherry_orbital', nameKo: '3안검 분비선 복원 (안와연고정법)', nameEn: 'Third Eyelid Gland Replacement (Orbital Rim Technique)', clientTerm: '탈출된 눈물샘(체리아이) 복원 수술 (안와연고정법)' },
    { id: 'surg_tarsorrhaphy_temp', nameKo: '임시 안검 봉합', nameEn: 'Temporary Tarsorrhaphy', clientTerm: '각막 손상 회복을 위한 일시적 눈꺼풀 봉합 수술' },
    { id: 'surg_medial_cantho', nameKo: '내안각 성형술', nameEn: 'Medial Canthoplasty', clientTerm: '안각 절개로 눈꺼풀 각도를 교정하는 수술' },
    { id: 'surg_parotid_trans', nameKo: '이하선관 전위술', nameEn: 'Parotid Duct Transposition', clientTerm: '침샘관을 눈물길로 연결해 KCS 개선하는 수술' },
    { id: 'surg_eyelid_mass', nameKo: '안검 종양 절제', nameEn: 'Eyelid Mass Removal', clientTerm: '눈꺼풀 종양 외과적 제거 수술' },
    { id: 'surg_dermoid', nameKo: '피부양 결막 절제', nameEn: 'Dermoid Excision', clientTerm: '결막·각막의 선천성 피부 조직 제거 수술' },
    { id: 'surg_trabeculectomy', nameKo: '섬유주 절제술', nameEn: 'Trabeculectomy', clientTerm: '녹내장 방수 배출 통로 개설 수술' },
    { id: 'surg_ahmed_valve', nameKo: '방수 임플란트 (Ahmed Valve)', nameEn: 'Aqueous Humor Shunt (Ahmed Valve)', clientTerm: '만성 녹내장 안압 조절 임플란트 삽입 수술' },
  ],
  general: [
    { id: 'gen_collar', nameKo: '넥카라 착용', nameEn: 'E-collar Application', clientTerm: '안구 손상 방지를 위한 보호 가드 착용' },
    { id: 'gen_warm_compress', nameKo: '온찜질', nameEn: 'Warm Compress', clientTerm: '눈꺼풀 기능 개선 및 마이봄샘 활성화 온찜질' },
    { id: 'gen_cold_compress', nameKo: '냉찜질', nameEn: 'Cold Compress', clientTerm: '부종 및 급성 염증 완화 냉찜질' },
    { id: 'gen_eye_cleaning', nameKo: '눈 세척 및 세안', nameEn: 'Ocular Irrigation / Eye Cleaning', clientTerm: '분비물 제거 및 각막 세척 처치' },
    { id: 'gen_light_restrict', nameKo: '광선 제한', nameEn: 'Light Restriction', clientTerm: '포도막염·광과민성 환자 눈부심 완화 조치' },
    { id: 'gen_activity_restrict', nameKo: '운동 제한', nameEn: 'Activity Restriction', clientTerm: '안압 상승 및 안구 자극 방지를 위한 안정 권고' },
    { id: 'gen_monitoring_edu', nameKo: '자가 모니터링 교육', nameEn: 'Home Monitoring Education', clientTerm: '보호자에게 눈 상태 자가 관찰 방법 교육' },
    { id: 'gen_recheck', nameKo: '재검 일정 설정', nameEn: 'Recheck Schedule', clientTerm: '치료 경과 확인을 위한 다음 방문 일정 안내' },
  ]
}
