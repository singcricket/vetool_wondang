// Main app — patient header, two species pages (Dog / Cat), toolbar, print.

const { useState, useEffect, useRef, useCallback } = React;

const STORAGE_KEY = 'vetOphthalmicMarkings.v1';

const SECTIONS = [
  { kind: 'external', no: '01', ko: '외안부',  en: 'External' },
  { kind: 'cornea',   no: '02', ko: '각막',    en: 'Cornea (Clock Map)' },
  { kind: 'lens',     no: '03', ko: '수정체',  en: 'Lens' },
  { kind: 'fundus',   no: '04', ko: '안저',    en: 'Fundus' },
];

const SECTION_NOTE = {
  external: '안검·결막·각막 외부 소견',
  cornea:   '시계방향 위치 · 침범 영역',
  lens:     '전낭·후낭·피질·핵 부위',
  fundus:   '시신경유두·휘판·혈관',
};

// ─────────────────────────────────────────────────────────────────────────

function App() {
  const [tool, setTool] = useState(null); // marker type id, 'eraser', or null
  const [patient, setPatient] = useState(() => loadPatient());
  const [markers, setMarkers] = useState(() => loadMarkers());
  const [notes, setNotes] = useState(() => loadNotes());

  useEffect(() => { localStorage.setItem(STORAGE_KEY + '.markers', JSON.stringify(markers)); }, [markers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY + '.patient', JSON.stringify(patient)); }, [patient]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY + '.notes', JSON.stringify(notes)); }, [notes]);

  const handleSchematicClick = useCallback((species, kind, side, e) => {
    if (!tool || tool === 'eraser') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setMarkers((prev) => [...prev, { id, species, kind, side, x, y, type: tool }]);
  }, [tool]);

  const removeMarker = useCallback((id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearAll = () => {
    if (confirm('모든 마킹을 삭제할까요?')) setMarkers([]);
  };

  const clearSpecies = (species) => {
    if (confirm(`${species === 'dog' ? '개' : '고양이'} 페이지의 마킹을 모두 삭제할까요?`)) {
      setMarkers((prev) => prev.filter((m) => m.species !== species));
    }
  };

  return (
    <div className="app">
      <SpeciesPage species="dog"
        patient={patient} setPatient={setPatient}
        notes={notes} setNotes={setNotes}
        markers={markers} onClickSchematic={handleSchematicClick}
        onRemoveMarker={removeMarker}
        tool={tool}
        onClearSpecies={() => clearSpecies('dog')} />
      <SpeciesPage species="cat"
        patient={patient} setPatient={setPatient}
        notes={notes} setNotes={setNotes}
        markers={markers} onClickSchematic={handleSchematicClick}
        onRemoveMarker={removeMarker}
        tool={tool}
        onClearSpecies={() => clearSpecies('cat')} />

      <Toolbar tool={tool} setTool={setTool} clearAll={clearAll} totalMarkers={markers.length} />
    </div>
  );
}

// ─── Species page (A4 landscape) ─────────────────────────────────────────

function SpeciesPage({ species, patient, setPatient, notes, setNotes, markers, onClickSchematic, onRemoveMarker, tool, onClearSpecies }) {
  return (
    <section className="page" data-species={species}>
      <PageHeader species={species} patient={patient} setPatient={setPatient} onClearSpecies={onClearSpecies} />

      <div className="grid">
        {SECTIONS.map((sec) => (
          <SectionBlock key={sec.kind}
            section={sec}
            species={species}
            markers={markers.filter((m) => m.species === species && m.kind === sec.kind)}
            onClickSchematic={onClickSchematic}
            onRemoveMarker={onRemoveMarker}
            tool={tool}
          />
        ))}
      </div>

      <Footer species={species} notes={notes[species] || ''} setNotes={(v) => setNotes({ ...notes, [species]: v })} />
    </section>
  );
}

function PageHeader({ species, patient, setPatient, onClearSpecies }) {
  const FIELDS = [
    ['name',   '환자명 / Patient',      8],
    ['breed',  '품종 / Breed',          7],
    ['sex',    '성별 / Sex',            3],
    ['age',    '나이 / Age',            3],
    ['weight', '체중 / Weight',         3],
    ['date',   '일자 / Date',           5],
    ['chart',  '차트번호 / Chart No.',  5],
    ['vet',    '담당의 / Veterinarian', 6],
  ];
  return (
    <header className="page-header">
      <div className="title-row">
        <div className="title-block">
          <div className="kicker">VETERINARY OPHTHALMIC EXAMINATION</div>
          <h1>{species === 'dog' ? '개' : '고양이'} 안과 모식도<span className="title-en"> · {species === 'dog' ? 'Canine' : 'Feline'} Marking Template</span></h1>
        </div>
        <div className="species-badge">
          <span className="badge-no">{species === 'dog' ? 'I' : 'II'}</span>
          <span className="badge-label">{species === 'dog' ? 'DOG · 개' : 'CAT · 고양이'}</span>
          <button className="no-print clear-species" onClick={onClearSpecies}>이 페이지 마킹 지우기</button>
        </div>
      </div>
      <div className="fields">
        {FIELDS.map(([key, label, grow]) => (
          <label key={key} className="field" style={{ flexGrow: grow }}>
            <span className="field-label">{label}</span>
            <input
              className="field-input"
              value={patient[key] || ''}
              onChange={(e) => setPatient({ ...patient, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </header>
  );
}

function SectionBlock({ section, species, markers, onClickSchematic, onRemoveMarker, tool }) {
  return (
    <div className="section">
      <div className="section-head">
        <span className="section-no">{section.no}</span>
        <div className="section-titles">
          <div className="section-ko">{section.ko}</div>
          <div className="section-en">{section.en}</div>
        </div>
        <div className="section-note">{SECTION_NOTE[section.kind]}</div>
      </div>
      <div className="eyes">
        {['OD', 'OS'].map((side) => (
          <div key={side} className="eye">
            <div className="eye-label">
              <span className="eye-side">{side}</span>
              <span className="eye-side-ko">{side === 'OD' ? '우안' : '좌안'}</span>
            </div>
            <SchematicSlot
              kind={section.kind}
              species={species}
              side={side}
              markers={markers.filter((m) => m.side === side)}
              onClick={(e) => onClickSchematic(species, section.kind, side, e)}
              onRemoveMarker={onRemoveMarker}
              tool={tool}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SchematicSlot({ kind, species, side, markers, onClick, onRemoveMarker, tool }) {
  return (
    <div className={`slot ${tool && tool !== 'eraser' ? 'armed' : ''}`} onClick={onClick}>
      <Schematic kind={kind} species={species} side={side} />
      <div className="marker-layer">
        {markers.map((m) => (
          <MarkerOnSchematic key={m.id} marker={m} onRemove={tool === 'eraser' ? onRemoveMarker : onRemoveMarker} />
        ))}
      </div>
    </div>
  );
}

// ─── Footer: legend + notes ──────────────────────────────────────────────

function Footer({ species, notes, setNotes }) {
  return (
    <footer className="page-footer">
      <div className="legend">
        <div className="legend-label">범례 / Legend</div>
        <div className="legend-items">
          {MARKER_TYPES.map((t) => (
            <div key={t.id} className="legend-item">
              <MarkerGlyph type={t.id} size={20} />
              <div className="legend-text">
                <span className="legend-ko">{t.ko}</span>
                <span className="legend-en">{t.en}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="notes">
        <div className="notes-label">소견 및 처치 / Findings & Plan</div>
        <textarea
          className="notes-area"
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="signature">
          <span className="sig-label">서명 / Signature</span>
          <span className="sig-line" />
        </div>
      </div>
    </footer>
  );
}

// ─── Floating toolbar ────────────────────────────────────────────────────

function Toolbar({ tool, setTool, clearAll, totalMarkers }) {
  return (
    <div className="toolbar no-print" role="toolbar" aria-label="Marking tools">
      <div className="tb-group">
        <div className="tb-title">마킹 도구</div>
        <div className="tb-row">
          {MARKER_TYPES.map((t) => (
            <button key={t.id}
              className={`tb-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(tool === t.id ? null : t.id)}
              title={`${t.ko} · ${t.en}`}>
              <MarkerGlyph type={t.id} size={20} />
              <span className="tb-btn-label">{t.ko}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="tb-divider" />
      <div className="tb-group">
        <div className="tb-title">동작</div>
        <div className="tb-row">
          <button className={`tb-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool(tool === 'eraser' ? null : 'eraser')} title="지우개">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M16 4 L20 8 L10 18 L4 18 L4 14 Z" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span className="tb-btn-label">지우개</span>
          </button>
          <button className="tb-btn" onClick={clearAll} title="전체 삭제">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M5 7 L19 7" /><path d="M9 7 V5 H15 V7" />
              <path d="M7 7 L8 20 H16 L17 7" />
            </svg>
            <span className="tb-btn-label">전체</span>
          </button>
          <button className="tb-btn" onClick={() => window.print()} title="인쇄">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M7 9 V4 H17 V9" />
              <rect x="4" y="9" width="16" height="8" />
              <rect x="7" y="14" width="10" height="6" />
            </svg>
            <span className="tb-btn-label">인쇄</span>
          </button>
        </div>
      </div>
      <div className="tb-status">
        {tool === 'eraser'
          ? '마커를 클릭하여 삭제'
          : tool
            ? <>도구 선택됨 · 도식을 클릭하여 마킹</>
            : <>도구를 선택하세요</>}
        <span className="tb-count">{totalMarkers}개 마킹</span>
      </div>
    </div>
  );
}

// ─── persistence ─────────────────────────────────────────────────────────

function loadPatient() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY + '.patient')) || {}; }
  catch { return {}; }
}
function loadMarkers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY + '.markers')) || []; }
  catch { return []; }
}
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY + '.notes')) || {}; }
  catch { return {}; }
}

// ─── mount ───────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
