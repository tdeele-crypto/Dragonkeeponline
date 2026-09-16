/**
 * Builds a printable weekly plan (PDF via expo-print) for a single dragon.
 *
 * Layout matches the user's A4-landscape mockup:
 *  - Title top-left: "Ugeoversigt - Printet d. DD/MM-YYYY"
 *  - Dragon id-card (avatar + name + age badge)
 *  - A 5-column grid: row 1 = Mon..Fri, row 2 = Sat, Sun + a "Vægt Kurve" card
 *    holding a line chart of the last 12 months of weight entries.
 *  - Each day lists its tasks as stacked, category-coloured cards.
 */

type Lang = 'da' | 'en';

interface WeekTask {
  time: string; // 'HH:MM'
  category: 'fodring' | 'pleje' | 'lys';
  item_names: string[];
  is_automatic: boolean;
}

interface WeekDay {
  date: string; // 'YYYY-MM-DD'
  tasks: WeekTask[];
}

interface WeightPoint {
  date: string; // 'YYYY-MM-DD'
  weight_grams: number;
}

const DAY_LABELS: Record<Lang, string[]> = {
  da: ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

const CAT_COLORS: Record<string, { light: string; border: string; text: string }> = {
  fodring: { light: '#E9F1EC', border: '#81B29A', text: '#2C4C3B' },
  pleje: { light: '#FBF2E1', border: '#F2CC8F', text: '#7A5B22' },
  lys: { light: '#ECECF1', border: '#3D405B', text: '#3D405B' },
};

const CAT_ICON: Record<string, string> = { fodring: '🦗', pleje: '💧', lys: '☀️' };

const TXT: Record<Lang, Record<string, string>> = {
  da: {
    printed: 'Ugeoversigt - Printet d.',
    automatic: 'AUTOMATISK',
    brumation: 'Brumation',
    active: 'Aktiv',
    none: 'Ingen opgaver',
    months: 'måneder',
    weightTitle: 'Vægt Kurve',
    weightSubtitle: 'Udvikling - sidste 12 måneder',
    weightEmpty: 'Ingen vægtdata',
  },
  en: {
    printed: 'Weekly overview - Printed',
    automatic: 'AUTOMATIC',
    brumation: 'Brumation',
    active: 'Active',
    none: 'No tasks',
    months: 'months',
    weightTitle: 'Weight curve',
    weightSubtitle: 'Development - last 12 months',
    weightEmpty: 'No weight data',
  },
};

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function photoSrc(photo?: string | null): string | null {
  if (!photo) return null;
  return photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** DD/MM-YYYY */
function formatPrintedDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** D/M short label for chart x-axis. */
function formatChartDate(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/**
 * Builds an SVG line chart (terracotta) of weight over the last 12 months.
 * Values are shown in grams (as stored). Returns '' when fewer than 2 points.
 */
function buildWeightChartSvg(points: WeightPoint[]): string {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const recent = points
    .filter((p) => new Date(p.date) >= cutoff)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (recent.length < 2) return '';

  const width = 340;
  const height = 260;
  const padLeft = 44;
  const padRight = 22;
  const padTop = 30;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const values = recent.map((p) => p.weight_grams);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  // Give the axis a little headroom below/above the data.
  const axisMin = 0;
  const axisMax = maxV + Math.max(1, Math.round(maxV * 0.05));
  const range = axisMax - axisMin || 1;
  const n = recent.length;

  const pts = recent.map((p, i) => {
    const x = padLeft + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    const y = padTop + chartH - ((p.weight_grams - axisMin) / range) * chartH;
    return { x, y, v: p.weight_grams, label: formatChartDate(new Date(p.date)) };
  });

  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const dots = pts
    .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#C15F3C" stroke="#fff" stroke-width="1.5" />`)
    .join('');

  // value labels above each point
  const valueLabels = pts
    .map(
      (p) =>
        `<text x="${p.x.toFixed(1)}" y="${(p.y - 9).toFixed(1)}" font-size="11" font-weight="700" fill="#44403C" text-anchor="middle">${p.v}</text>`
    )
    .join('');

  const labelStep = Math.max(1, Math.ceil(n / 6));
  const xLabels = pts
    .map((p, i) =>
      i % labelStep === 0 || i === n - 1
        ? `<text x="${p.x.toFixed(1)}" y="${height - 10}" font-size="10" fill="#78716C" text-anchor="middle">${p.label}</text>`
        : ''
    )
    .join('');

  const sections = 4;
  let grid = '';
  for (let s = 0; s <= sections; s++) {
    const yVal = axisMin + (range * s) / sections;
    const y = padTop + chartH - (s / sections) * chartH;
    grid += `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="#EDEBE8" stroke-width="1" />`;
    grid += `<text x="${padLeft - 8}" y="${(y + 3).toFixed(1)}" font-size="10" fill="#A8A29E" text-anchor="end">${Math.round(yVal)}</text>`;
  }

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    ${grid}
    <polyline points="${polyline}" fill="none" stroke="#C15F3C" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
    ${dots}
    ${valueLabels}
    ${xLabels}
  </svg>`;
}

export function buildWeekplanPdfHtml(options: {
  dragonName: string;
  ageCategory: string;
  activityState: string;
  photoBase64?: string | null;
  days: WeekDay[]; // exactly 7, Monday..Sunday
  weightEntries?: WeightPoint[];
  language: Lang;
}): string {
  const { dragonName, ageCategory, activityState, photoBase64, days, weightEntries = [], language } = options;
  const L = TXT[language] || TXT.da;
  const dayLabels = DAY_LABELS[language] || DAY_LABELS.da;

  const dayCell = (label: string, tasks: WeekTask[]): string => {
    const cards = tasks
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((t) => {
        const c = CAT_COLORS[t.category] || CAT_COLORS.pleje;
        const auto = t.is_automatic ? `<span class="auto">${L.automatic}</span>` : '';
        const items = esc(t.item_names.join(' + '));
        const icon = CAT_ICON[t.category] || '•';
        return `<div class="card" style="background:${c.light};border-left:4px solid ${c.border};color:${c.text};">
          <div class="cardTop"><span class="ico">${icon}</span><span class="time">${esc(t.time)}</span>${auto}</div>
          <div class="items">${items || ''}</div>
        </div>`;
      })
      .join('');
    const body = cards || `<div class="empty">${L.none}</div>`;
    return `<div class="cell">
      <div class="dayHead">${esc(label)}</div>
      ${body}
    </div>`;
  };

  const dayCells = dayLabels.map((label, i) => dayCell(label, days[i]?.tasks || [])).join('');

  const chartSvg = buildWeightChartSvg(weightEntries);
  const weightCell = `<div class="cell weightCell">
    <div class="dayHead">${L.weightTitle}</div>
    <div class="chartCard">
      <div class="chartTitle">${L.weightSubtitle}</div>
      <div class="chartBox">${chartSvg || `<div class="empty">${L.weightEmpty}</div>`}</div>
    </div>
  </div>`;

  const activityLabel = activityState === 'brumation' ? L.brumation : L.active;
  const ageLabel = `${ageCategory} ${L.months}`;
  const img = photoSrc(photoBase64);
  const avatar = img
    ? `<img class="avatar" src="${img}" />`
    : `<div class="avatar placeholder"></div>`;

  const printedDate = formatPrintedDate(new Date());

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1917; background: #fff; margin: 0; }

  .title { font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 700; color: #1C1917; margin: 0 0 10px; }

  .idblock { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .avatar { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; background: #F1F0EE; }
  .avatar.placeholder { background: #EDEBE8; }
  .dname { font-size: 16px; font-weight: 800; color: #1C1917; }
  .badge { display: inline-block; margin-top: 4px; background: #FBE4DC; color: #E07A5F; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 999px; }

  .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px 12px; }
  .cell { min-width: 0; }
  .dayHead { font-family: Georgia, 'Times New Roman', serif; font-size: 21px; font-weight: 700; color: #1C1917; margin-bottom: 8px; }

  .card { border-radius: 8px; padding: 6px 8px; margin-bottom: 7px; }
  .cardTop { display: flex; align-items: center; gap: 5px; }
  .cardTop .ico { font-size: 10px; }
  .cardTop .time { font-size: 11px; font-weight: 800; letter-spacing: 0.2px; }
  .auto { margin-left: 4px; background: rgba(0,0,0,0.06); color: #57534E; border-radius: 4px; padding: 1px 5px; font-size: 7px; font-weight: 800; letter-spacing: 0.4px; }
  .items { margin-top: 3px; font-size: 9px; font-weight: 600; line-height: 1.3; }
  .empty { color: #C7C2BD; font-size: 10px; padding: 6px 0; }

  .weightCell .chartCard { border: 1px solid #EDEBE8; border-radius: 16px; padding: 12px 12px 6px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .chartTitle { font-size: 13px; font-weight: 800; color: #1C1917; margin-bottom: 4px; }
  .chartBox { width: 100%; height: 190px; }
</style>
</head>
<body>
  <div class="title">${L.printed} ${printedDate}</div>

  <div class="idblock">
    ${avatar}
    <div>
      <div class="dname">${esc(dragonName)}</div>
      <span class="badge">${esc(ageLabel)}${activityState === 'brumation' ? ' · ' + activityLabel : ''}</span>
    </div>
  </div>

  <div class="grid">
    ${dayCells}
    ${weightCell}
  </div>
</body>
</html>`;
}
