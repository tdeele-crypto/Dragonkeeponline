/**
 * Builds a printable weekly plan (PDF via expo-print) for a single dragon.
 * Layout matches the Overview page: days Monday..Sunday as columns, task
 * times as rows, cells coloured by category (fodring/pleje/lys).
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

const DAY_LABELS: Record<Lang, string[]> = {
  da: ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

const CAT_COLORS: Record<string, { light: string; border: string; text: string; bg: string }> = {
  fodring: { light: '#E9F1EC', border: '#C3DBD0', text: '#2C4C3B', bg: '#81B29A' },
  pleje: { light: '#FBF2E1', border: '#F0DEB0', text: '#7A5B22', bg: '#F2CC8F' },
  lys: { light: '#E7E7EE', border: '#C7C7D3', text: '#3D405B', bg: '#3D405B' },
};

const TXT: Record<Lang, Record<string, string>> = {
  da: { title: 'Ugeplan', time: 'Tid', automatic: 'AUTO', generatedOn: 'Genereret', age: 'Alder', brumation: 'Brumation', active: 'Aktiv', noTasks: '—' },
  en: { title: 'Weekly plan', time: 'Time', automatic: 'AUTO', generatedOn: 'Generated', age: 'Age', brumation: 'Brumation', active: 'Active', noTasks: '—' },
};

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildWeekplanPdfHtml(options: {
  dragonName: string;
  ageCategory: string;
  activityState: string;
  days: WeekDay[]; // exactly 7, Monday..Sunday
  language: Lang;
}): string {
  const { dragonName, ageCategory, activityState, days, language } = options;
  const L = TXT[language] || TXT.da;
  const dayLabels = DAY_LABELS[language] || DAY_LABELS.da;

  // distinct sorted times across the whole week
  const timeSet = new Set<string>();
  days.forEach((d) => d.tasks.forEach((t) => timeSet.add(t.time)));
  const times = Array.from(timeSet).sort();

  const dateLabel = (iso: string) => {
    const [, m, dd] = iso.split('-');
    return `${dd}/${m}`;
  };

  const headerCells = days
    .map((d, i) => `<th class="day"><div class="dayName">${esc(dayLabels[i])}</div><div class="dayDate">${dateLabel(d.date)}</div></th>`)
    .join('');

  const rows = times
    .map((time) => {
      const cells = days
        .map((d) => {
          const tasks = d.tasks.filter((t) => t.time === time);
          if (tasks.length === 0) return `<td class="cell empty">${L.noTasks}</td>`;
          const inner = tasks
            .map((t) => {
              const c = CAT_COLORS[t.category] || CAT_COLORS.pleje;
              const auto = t.is_automatic ? `<span class="auto">${L.automatic}</span>` : '';
              const items = esc(t.item_names.join(' + '));
              return `<div class="task" style="background:${c.light};border-left:4px solid ${c.bg};color:${c.text};">${auto}${items}</div>`;
            })
            .join('');
          return `<td class="cell">${inner}</td>`;
        })
        .join('');
      return `<tr><td class="timeCell">${esc(time)}</td>${cells}</tr>`;
    })
    .join('');

  const emptyState = times.length === 0
    ? `<tr><td class="timeCell">${L.noTasks}</td><td class="cell empty" colspan="7">${L.noTasks}</td></tr>`
    : '';

  const activityLabel = activityState === 'brumation' ? L.brumation : L.active;
  const now = new Date();
  const generated = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1917; background: #FAF9F6; margin: 0; }
  .header { display:flex; align-items:flex-end; justify-content:space-between; border-bottom: 3px solid #E07A5F; padding-bottom: 10px; margin-bottom: 14px; }
  .title { font-size: 22px; font-weight: 800; color: #E07A5F; margin: 0; }
  .subtitle { font-size: 13px; color: #78716C; margin-top: 4px; }
  .meta { font-size: 11px; color: #A8A29E; text-align: right; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #E7E5E4; vertical-align: top; }
  th.time, td.timeCell { width: 66px; }
  th { background: #3D405B; color: #fff; padding: 8px 4px; font-size: 12px; }
  th.day .dayName { font-weight: 800; }
  th.day .dayDate { font-weight: 500; font-size: 10px; opacity: 0.85; }
  td.timeCell { background: #F1F0EE; font-weight: 800; font-size: 13px; text-align: center; padding: 8px 4px; color:#3D405B; }
  td.cell { padding: 5px; font-size: 10.5px; }
  td.cell.empty { color: #D6D3D1; text-align: center; font-size: 12px; }
  .task { border-radius: 6px; padding: 5px 6px; margin-bottom: 5px; font-weight: 600; line-height: 1.25; }
  .task:last-child { margin-bottom: 0; }
  .auto { display:inline-block; background: rgba(0,0,0,0.10); border-radius: 4px; padding: 0 4px; font-size: 8px; font-weight: 800; margin-right: 4px; vertical-align: middle; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${L.title} — ${esc(dragonName)}</h1>
      <div class="subtitle">${L.age}: ${esc(ageCategory)} · ${activityLabel}</div>
    </div>
    <div class="meta">${L.generatedOn}: ${generated}</div>
  </div>
  <table>
    <thead>
      <tr><th class="time">${L.time}</th>${headerCells}</tr>
    </thead>
    <tbody>
      ${rows}${emptyState}
    </tbody>
  </table>
</body>
</html>`;
}
