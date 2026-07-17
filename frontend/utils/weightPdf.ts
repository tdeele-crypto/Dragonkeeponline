import type { WeightEntry } from '@/types';
import type { Language, WeightUnit } from '@/i18n/translations';
import { formatDateLabel, formatDateShort, formatWeightDisplay, gramsToDisplay } from '@/i18n/translations';

export interface AgeLabels {
  years: string;
  months: string;
  month: string;
  underMonth: string;
}

export interface WeightPdfLabels {
  birthdayLabel: string;
  ageLabel: string;
  tableDate: string;
  tableWeight: string;
  tableNotes: string;
  noEntries: string;
  chartTitle: string;
  chartEmpty: string;
  generatedOn: string;
  historyTitle: string;
}

/** "2 years, 3 months" / "2 år, 3 måneder" style exact age from a birthday. */
export function computeExactAge(birthday: string, ageLabels: AgeLabels): string {
  const bd = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - bd.getFullYear();
  let months = now.getMonth() - bd.getMonth();
  if (now.getDate() < bd.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return ageLabels.underMonth;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${ageLabels.years}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? ageLabels.month : ageLabels.months}`);
  return parts.join(', ');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWeightChartSvg(sortedAsc: WeightEntry[], weightUnit: WeightUnit): string {
  const width = 680;
  const height = 260;
  const padLeft = 46;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const values = sortedAsc.map((e) => gramsToDisplay(e.weight_grams, weightUnit));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const n = sortedAsc.length;

  const points = sortedAsc.map((e, i) => {
    const x = padLeft + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    const y = padTop + chartH - ((values[i] - minV) / range) * chartH;
    return { x, y, label: formatDateShort(new Date(e.date)) };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const dots = points
    .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#3D6B54" />`)
    .join('');

  const labelStep = Math.max(1, Math.ceil(n / 9));
  const xLabels = points
    .map((p, i) =>
      i % labelStep === 0 || i === n - 1
        ? `<text x="${p.x.toFixed(1)}" y="${height - 10}" font-size="9" fill="#6b7280" text-anchor="middle">${p.label}</text>`
        : ''
    )
    .join('');

  const sections = 4;
  let gridLines = '';
  for (let s = 0; s <= sections; s++) {
    const yVal = minV + (range * s) / sections;
    const y = padTop + chartH - (s / sections) * chartH;
    gridLines += `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(
      1
    )}" stroke="#e5e7eb" stroke-width="1" />`;
    gridLines += `<text x="${padLeft - 8}" y="${(y + 3).toFixed(
      1
    )}" font-size="9" fill="#6b7280" text-anchor="end">${yVal.toFixed(0)}</text>`;
  }

  return `<svg width="100%" height="260" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    <polyline points="${polylinePoints}" fill="none" stroke="#3D6B54" stroke-width="2.5" />
    ${dots}
    ${xLabels}
  </svg>`;
}

export function buildWeightPdfHtml(options: {
  dragonName: string;
  birthday: string;
  ageText: string;
  entries: WeightEntry[];
  weightUnit: WeightUnit;
  language: Language;
  labels: WeightPdfLabels;
}): string {
  const { dragonName, birthday, ageText, entries, weightUnit, language, labels } = options;
  const sortedAsc = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));

  const tableRows = sortedAsc
    .map(
      (e) => `<tr>
        <td>${formatDateLabel(new Date(e.date), language)}</td>
        <td>${formatWeightDisplay(e.weight_grams, weightUnit)}</td>
        <td>${escapeHtml(e.note || '-')}</td>
      </tr>`
    )
    .join('');

  const tableHtml =
    sortedAsc.length > 0
      ? `<table>
          <thead>
            <tr>
              <th>${labels.tableDate}</th>
              <th>${labels.tableWeight}</th>
              <th>${labels.tableNotes}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`
      : `<div class="empty">${labels.noEntries}</div>`;

  const chartHtml =
    sortedAsc.length >= 2
      ? `<div class="chart-wrap">${buildWeightChartSvg(sortedAsc, weightUnit)}</div>`
      : `<div class="empty">${labels.chartEmpty}</div>`;

  const generatedOnLabel = formatDateLabel(new Date(), language);

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #22303C; padding: 28px; }
      h1 { font-size: 24px; margin: 0 0 6px; color: #22303C; }
      .meta { font-size: 13px; color: #55677A; margin-bottom: 26px; }
      h2 { font-size: 15px; color: #3D6B54; margin: 0 0 12px; border-bottom: 2px solid #E3EFE8; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th, td { text-align: left; padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #E5E7EB; }
      th { background: #F1F5F3; color: #3D6B54; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em; }
      .chart-wrap { text-align: center; margin-bottom: 10px; }
      .empty { color: #9AA5B1; font-size: 13px; padding: 10px 0 24px; }
      .footer { margin-top: 30px; font-size: 10px; color: #9AA5B1; text-align: right; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(dragonName)}</h1>
    <div class="meta">${labels.birthdayLabel}: ${formatDateLabel(new Date(birthday), language)} &nbsp;&middot;&nbsp; ${labels.ageLabel}: ${ageText}</div>

    <h2>${labels.historyTitle}</h2>
    ${tableHtml}

    <h2>${labels.chartTitle}</h2>
    ${chartHtml}

    <div class="footer">${labels.generatedOn}: ${generatedOnLabel}</div>
  </body>
  </html>`;
}
