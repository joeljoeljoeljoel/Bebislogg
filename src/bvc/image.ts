// The BVC summary as an image. Always the light theme: it is read by someone else, maybe printed.
import type { BvcSummary } from '../domain/bvc';
import { dur, hmm, shortDate } from '../domain/time';
import { cap } from '../domain/wording';

export type Op =
  | {
      t: 'text';
      x: number;
      /** Baseline */
      y: number;
      text: string;
      size: number;
      weight?: 400 | 500;
      color: string;
      align?: 'left' | 'right' | 'center';
    }
  | { t: 'rect'; x: number; y: number; w: number; h: number; r: number; color: string }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; color: string }
  /** A check mark centered on (x, y) */
  | { t: 'check'; x: number; y: number; color: string };

/** Logical width; the PNG is drawn at 3× (1080 px). */
export const IMAGE_W = 360;
export const IMAGE_SCALE = 3;
const PAD = 20;
const FONT = '-apple-system, system-ui, Roboto, "Segoe UI", sans-serif';

const C = {
  bg: '#fdfaf5',
  box: '#f2ebe2',
  text: '#26222f',
  muted: '#6d6777',
  accent: '#5a40b8',
  line: 'rgba(38, 34, 47, 0.14)',
  vitd: '#a37a00',
};

/** 8 → "8", 7.43 → "7,4" */
export const oneDecimal = (n: number) => n.toFixed(1).replace('.', ',').replace(/,0$/, '');

export function layoutBvcImage(s: BvcSummary): { width: number; height: number; ops: Op[] } {
  const ops: Op[] = [];
  const text = (x: number, y: number, t: string, size: number, color = C.text, extra: Partial<Extract<Op, { t: 'text' }>> = {}) =>
    ops.push({ t: 'text', x, y, text: t, size, color, ...extra });
  const right = IMAGE_W - PAD;
  let y = PAD;

  text(PAD, y + 10, 'BEBISLOGG · SAMMANFATTNING TILL BVC', 9.5, C.accent, { weight: 500 });
  y += 38;
  text(PAD, y, s.name, 22, C.text, { weight: 500 });
  y += 20;
  text(PAD, y, [s.age, `${s.periodLabel} (${s.rows.length} dygn)`].filter(Boolean).join(' · '), 12.5, C.muted);
  y += 18;

  // Averages, two per row
  const averages: [string, string][] = [
    ['Sömn per dygn', dur(s.avg.total)],
    ['Varav natt', dur(s.avg.night)],
    ['Längsta nattsömn, snitt', s.avg.nightLongest !== null ? dur(s.avg.nightLongest) : '–'],
    ['Tupplurar per dygn', oneDecimal(s.avg.naps)],
    [`${cap(s.words.many)} per dygn`, oneDecimal(s.avg.sessions)],
    ...(s.showMl ? ([['Flaska per dygn', `${Math.round(s.avg.ml)} ml`]] as [string, string][]) : []),
    ['D-droppar', `${s.vitd.given} av ${s.vitd.days} dagar`],
  ];
  const boxRows = Math.ceil(averages.length / 2);
  const boxH = 14 + boxRows * 44;
  ops.push({ t: 'rect', x: PAD, y, w: IMAGE_W - 2 * PAD, h: boxH, r: 10, color: C.box });
  averages.forEach(([label, value], i) => {
    const x = PAD + 14 + (i % 2) * ((IMAGE_W - 2 * PAD) / 2);
    const top = y + 14 + Math.floor(i / 2) * 44;
    text(x, top + 10, label, 10.5, C.muted);
    text(x, top + 29, value, 16, C.text, { weight: 500 });
  });
  y += boxH + 26;

  // Dygn by dygn
  text(PAD, y, 'Dygn för dygn', 14, C.text, { weight: 500 });
  y += 20;
  // Times (h:mm) need more room than counts; the check column the least.
  const cols: [string, number][] = [
    ['SÖMN', 1.35],
    ['NATT', 1.35],
    ['LÄNGST', 1.35],
    ['LURAR', 1],
    [s.words.tableHead.toUpperCase(), 1],
    ...(s.showMl ? ([['ML', 1]] as [string, number][]) : []),
    ['D', 0.75],
  ];
  const x0 = PAD + 76;
  const unit = (right - x0) / cols.reduce((sum, [, w]) => sum + w, 0);
  const edges = cols.map((_, i) => x0 + cols.slice(0, i + 1).reduce((sum, [, w]) => sum + w * unit, 0));
  const last = cols.length - 1;
  // Numbers are right-aligned at their column's right edge; the check is centered.
  const colX = (i: number) => (i === last ? edges[i] - (cols[i][1] * unit) / 2 : edges[i]);
  text(PAD, y, 'DYGN', 9, C.muted);
  cols.forEach(([c], i) => text(colX(i), y, c, 9, C.muted, { align: i === last ? 'center' : 'right' }));
  y += 8;
  ops.push({ t: 'line', x1: PAD, y1: y, x2: right, y2: y, color: C.line });
  for (const r of s.rows) {
    y += 22;
    const values = [hmm(r.total), hmm(r.night), hmm(r.nightLongest), String(r.naps), String(r.sessions), ...(s.showMl ? [String(r.ml)] : [])];
    text(PAD, y - 7, r.label, 12.5);
    values.forEach((v, i) => text(colX(i), y - 7, v, 12.5, C.text, { align: 'right' }));
    const dx = colX(last);
    if (r.vitd) ops.push({ t: 'check', x: dx, y: y - 11, color: C.vitd });
    else text(dx, y - 7, '–', 12.5, C.muted, { align: 'center' });
    ops.push({ t: 'line', x1: PAD, y1: y, x2: right, y2: y, color: C.line });
  }
  y += 20;

  text(PAD, y, `Ett dygn = ${s.dygnFrom}–${s.dygnFrom}, så natten räknas till dagen innan.`, 9.5, C.muted);
  y += 14;
  text(PAD, y, 'Tider i timmar:minuter. Längst = längsta sammanhängande sömn på natten.', 9.5, C.muted);
  y += 14;
  text(PAD, y, `D = D-droppar. Skapad ${shortDate(s.createdAt)} ${new Date(s.createdAt).getFullYear()} med Bebislogg.`, 9.5, C.muted);
  y += PAD;

  return { width: IMAGE_W, height: Math.ceil(y), ops };
}

function paint(ctx: CanvasRenderingContext2D, ops: Op[]) {
  for (const op of ops) {
    if (op.t === 'text') {
      ctx.font = `${op.weight ?? 400} ${op.size}px ${FONT}`;
      ctx.fillStyle = op.color;
      ctx.textAlign = op.align ?? 'left';
      ctx.fillText(op.text, op.x, op.y);
    } else if (op.t === 'rect') {
      ctx.fillStyle = op.color;
      ctx.beginPath();
      ctx.roundRect(op.x, op.y, op.w, op.h, op.r);
      ctx.fill();
    } else if (op.t === 'line') {
      ctx.strokeStyle = op.color;
      ctx.lineWidth = 1 / IMAGE_SCALE;
      ctx.beginPath();
      ctx.moveTo(op.x1, op.y1);
      ctx.lineTo(op.x2, op.y2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = op.color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(op.x - 4.5, op.y);
      ctx.lineTo(op.x - 1.5, op.y + 3);
      ctx.lineTo(op.x + 4.5, op.y - 3.5);
      ctx.stroke();
    }
  }
}

/** Draws the summary to a PNG. */
export function renderBvcImage(s: BvcSummary): Promise<Blob> {
  const { width, height, ops } = layoutBvcImage(s);
  const canvas = document.createElement('canvas');
  canvas.width = width * IMAGE_SCALE;
  canvas.height = height * IMAGE_SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(IMAGE_SCALE, IMAGE_SCALE);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = 'alphabetic';
  paint(ctx, ops);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Kunde inte skapa bilden'))), 'image/png'),
  );
}
