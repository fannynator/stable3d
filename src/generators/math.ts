import type { DifficultyLevel } from "../core/fgos/adaptive";
import type { Task } from "../app/types";

// ═══ Helpers ═══

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeWrongs(correct: number, count = 3): number[] {
  // Ensure wrong answers are positive and at least somewhat different
  const spread = Math.max(1, Math.ceil(correct * 0.15));
  const wrongs = new Set<number>();
  let attempts = 0;
  while (wrongs.size < count && attempts < 100) {
    attempts++;
    const delta = rnd(-spread * 2, spread * 2);
    const candidate = correct + delta;
    if (candidate !== correct && candidate > 0 && !wrongs.has(candidate)) {
      wrongs.add(candidate);
    }
  }
  return [...wrongs];
}

// ═══ Task constructors ═══

function choiceT(
  emoji: string, badge: string, badgeClass: string,
  question: string, correct: number, explanation: string
): Task {
  const options = shuffle([correct, ...makeWrongs(correct, 3)]);
  return { type: "choice", emoji, badge, badgeClass, question, options, correctAns: correct, explanation };
}

function inputT(
  emoji: string, badge: string, badgeClass: string,
  question: string, correct: number, explanation: string
): Task {
  return { type: "input", emoji, badge, badgeClass, question, correctAns: correct, explanation };
}

function pairT(
  emoji: string, badge: string, badgeClass: string,
  question: string,
  pairs: { left: string; right: string; answer: string | number }[],
  explanation: string
): Task {
  return { type: "pair", emoji, badge, badgeClass, question, correctAns: pairs[0]?.answer ?? "", pairs, explanation };
}

function visualT(
  emoji: string, badge: string, badgeClass: string,
  svg: string, question: string, correct: number,
  wrongOpts: number[], explanation: string
): Task {
  const all = [...new Set([correct, ...wrongOpts])].filter((n) => n > 0 || n === 0);
  return { type: "visual", emoji, badge, badgeClass, svg, question, options: all, correctAns: correct, explanation };
}

// ═══ SVG helpers ═══

function applesSVG(count: number, color = "#EF4444"): string {
  const rows = Math.ceil(count / 5);
  let circles = "";
  for (let r = 0; r < rows; r++) {
    const inRow = r === rows - 1 ? (count % 5 || 5) : 5;
    for (let c = 0; c < inRow; c++) {
      const cx = 20 + c * 28 + (rows > 1 && r === rows - 1 ? (5 - inRow) * 14 : 0);
      const cy = 25 + r * 32;
      circles += `<circle cx="${cx}" cy="${cy}" r="11" fill="${color}" stroke="#B91C1C" stroke-width="1.5"/>
<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#7F1D1D" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  const h = Math.max(60, rows * 32 + 16);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 ${h}" width="150" height="${h}">${circles}</svg>`;
}

function applesTwoGroups(a: number, b: number): string {
  const rowsA = Math.ceil(a / 5);
  const rowsB = Math.ceil(b / 5);
  const H = Math.max(rowsA, rowsB) * 32 + 30;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${H}" width="300" height="${H}">`;
  out += `<text x="75" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">Группа А</text>`;
  for (let r = 0; r < rowsA; r++) {
    const inRow = r === rowsA - 1 ? (a % 5 || 5) : 5;
    for (let c = 0; c < inRow; c++) {
      const cx = 35 + c * 28 + (rowsA > 1 && r === rowsA - 1 ? (5 - inRow) * 14 : 0);
      const cy = 30 + r * 32;
      out += `<circle cx="${cx}" cy="${cy}" r="11" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#7F1D1D" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  out += `<text x="225" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">Группа Б</text>`;
  for (let r = 0; r < rowsB; r++) {
    const inRow = r === rowsB - 1 ? (b % 5 || 5) : 5;
    for (let c = 0; c < inRow; c++) {
      const cx = 185 + c * 28 + (rowsB > 1 && r === rowsB - 1 ? (5 - inRow) * 14 : 0);
      const cy = 30 + r * 32;
      out += `<circle cx="${cx}" cy="${cy}" r="11" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#92400E" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  out += "</svg>";
  return out;
}

function subSVG(total: number, eaten: number): string {
  const H = Math.ceil(total / 5) * 32 + 30;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 ${H}" width="280" height="${H}">`;
  out += `<text x="140" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">Было ${total} яблок</text>`;
  for (let r = 0; r < Math.ceil(total / 5); r++) {
    const inRow = r === Math.ceil(total / 5) - 1 ? (total % 5 || 5) : 5;
    for (let c = 0; c < (r < Math.ceil(total / 5) - 1 ? 5 : inRow); c++) {
      const idx = r * 5 + c;
      const cx = 40 + c * 36;
      const cy = 30 + r * 32;
      const isEaten = idx < eaten;
      const fill = isEaten ? "#E2E8F0" : "#EF4444";
      const stroke = isEaten ? "#CBD5E1" : "#B91C1C";
      out += `<circle cx="${cx}" cy="${cy}" r="11" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="${isEaten ? "3 2" : "none"}"/>`;
      if (isEaten) {
        out += `<line x1="${cx - 5}" y1="${cy - 5}" x2="${cx + 5}" y2="${cy + 5}" stroke="#CBD5E1" stroke-width="2"/>
<line x1="${cx + 5}" y1="${cy - 5}" x2="${cx - 5}" y2="${cy + 5}" stroke="#CBD5E1" stroke-width="2"/>`;
      } else {
        out += `<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#7F1D1D" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
  }
  out += "</svg>";
  return out;
}

function mulGridSVG(rows: number, cols: number): string {
  const W = Math.min(300, cols * 36 + 20);
  const H = rows * 32 + 30;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  out += `<text x="${W / 2}" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">${rows} ряда × ${cols} яблок</text>`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cols <= 8) {
        const cxc = 14 + c * ((W - 20) / cols) + (W - 20) / cols / 2;
        const cy = 28 + r * 32;
        out += `<circle cx="${cxc}" cy="${cy}" r="10" fill="#F59E0B" stroke="#D97706" stroke-width="1.2"/>`;
        out += `<line x1="${cxc - 3}" y1="${cy - 4}" x2="${cxc + 1}" y2="${cy - 8}" stroke="#92400E" stroke-width="1.8" stroke-linecap="round"/>`;
      }
    }
  }
  out += "</svg>";
  return out;
}

function eqScaleSVG(leftExpr: string, rightVal: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" width="240" height="100">
<polygon points="120,15 135,30 105,30" fill="#94A3B8"/>
<line x1="120" y1="30" x2="120" y2="50" stroke="#94A3B8" stroke-width="3"/>
<line x1="30" y1="50" x2="210" y2="50" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
<circle cx="120" cy="50" r="4" fill="#64748B"/>
<path d="M40 50 L50 70 L90 70 L100 50 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
<text x="70" y="63" text-anchor="middle" font-size="14" fill="#1E293B" font-weight="800">${leftExpr}</text>
<path d="M140 50 L150 70 L190 70 L200 50 Z" fill="#FEF3C7" stroke="#FBBF24" stroke-width="1.5"/>
<text x="170" y="63" text-anchor="middle" font-size="14" fill="#92400E" font-weight="800">?</text>
</svg>`;
}

function geomRectSVG(w: number, h: number, label: string): string {
  const scale = Math.min(200 / w, 120 / h, 30);
  const rw = w * scale;
  const rh = h * scale;
  const W = rw + 40;
  const H = rh + 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect x="20" y="25" width="${rw}" height="${rh}" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2"/>
<text x="${20 + rw / 2}" y="20" text-anchor="middle" font-size="11" fill="#3B82F6" font-weight="700">${w}</text>
<text x="${rw + 28}" y="${25 + rh / 2}" font-size="11" fill="#3B82F6" font-weight="700">${h}</text>
<text x="${20 + rw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#3B82F6" font-weight="700">${label}</text>
</svg>`;
}

function pizzaSVG(eaten: number, total: number): string {
  const slices: string[] = [];
  for (let i = 0; i < total; i++) {
    const fromAngle = (i / total) * 360;
    const toAngle = ((i + 1) / total) * 360;
    const fromRad = (fromAngle - 90) * Math.PI / 180;
    const toRad = (toAngle - 90) * Math.PI / 180;
    const x1 = 100 + 70 * Math.cos(fromRad);
    const y1 = 100 + 70 * Math.sin(fromRad);
    const x2 = 100 + 70 * Math.cos(toRad);
    const y2 = 100 + 70 * Math.sin(toRad);
    const eatenSlice = i < eaten;
    slices.push(`<path d="M100 100 L${x1} ${y1} A70 70 0 0 1 ${x2} ${y2} Z" fill="${eatenSlice ? "#E2E8F0" : "#F59E0B"}" stroke="#92400E" stroke-width="1.5"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
${slices.join("")}
<text x="100" y="190" text-anchor="middle" font-size="12" fill="#94A3B8" font-weight="700">Съедено ${eaten} из ${total}</text>
</svg>`;
}

// ═══ Shuffle tasks for variety (except warmup first, boss last) ═══

function shuffleTasks(tasks: Task[]): Task[] {
  const [warmup, ...rest] = tasks;
  const boss = rest.pop();
  const middle = shuffle(rest);
  return [warmup, ...middle, ...(boss ? [boss] : [])];
}

interface RangeMap {
  [key: number]: { a: [number, number]; b: [number, number] };
}

const ADD_RANGES: RangeMap = {
  1: { a: [1, 10], b: [1, 5] },
  2: { a: [5, 50], b: [3, 30] },
  3: { a: [10, 99], b: [5, 70] },
};

const SUB_RANGES: RangeMap = {
  1: { a: [5, 12], b: [1, 5] },
  2: { a: [10, 50], b: [3, 25] },
  3: { a: [20, 99], b: [5, 40] },
};

const MUL_RANGES: Record<number, { a: [number, number]; b: [number, number] }> = {
  1: { a: [2, 5], b: [2, 5] },
  2: { a: [2, 9], b: [2, 9] },
  3: { a: [6, 12], b: [3, 12] },
};

const DIV_RANGE = { b: [2, 9], c: [2, 9] } as const;

const EQ_RANGES: RangeMap = {
  1: { a: [2, 8], b: [1, 4] },
  2: { a: [3, 12], b: [2, 6] },
  3: { a: [5, 20], b: [3, 10] },
};

const GEOM_RECT: Record<number, { w: [number, number]; h: [number, number] }> = {
  1: { w: [2, 5], h: [2, 5] },
  2: { w: [3, 8], h: [3, 8] },
  3: { w: [5, 12], h: [4, 10] },
};

// ═══ Generators ═══

export function generateAddLesson(diff: DifficultyLevel = 2): Task[] {
  const R = ADD_RANGES[diff];
  const add = (a: number, b: number) => a + b;
  const tasks: Task[] = [];

  // Warmup — always easy
  const [wa, wb] = [rnd(R.a[0], Math.min(R.a[1], 15)), rnd(R.b[0], Math.min(R.b[1], 10))];
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} + ${wb} = ?`, add(wa, wb), "Просто складываем два числа"));

  // Visual — apples
  const [va, vb] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  const sumV = add(va, vb);
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    applesTwoGroups(va, vb), "Сколько всего яблок?", sumV, makeWrongs(sumV, 3),
    `${va} красных + ${vb} жёлтых = ${sumV}`));

  // Choice
  const [ca, cb] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} + ${cb} = ?`, add(ca, cb), `Складываем: ${ca} + ${cb}`));

  // Input
  const [ia, ib] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} + ${ib} = ?`, add(ia, ib), `${ia} + ${ib} = ${add(ia, ib)}`));

  // Trap — add 0
  const trap = rnd(3, 20);
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `У Маши ${trap} конфет, Петя дал ещё 0. Сколько стало?`,
    trap, "Если прибавить 0 — ничего не меняется!"));

  // Boss — word problem
  const [bossA, bossB, bossC] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1]), rnd(R.b[0], R.b[1])];
  const bossSum = bossA + bossB + bossC;
  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `В саду ${bossA} яблок, привезли ${bossB} и ещё ${bossC}. Сколько всего?`,
    bossSum, `${bossA}+${bossB}+${bossC}=${bossSum}`));

  return shuffleTasks(tasks);
}

export function generateSubLesson(diff: DifficultyLevel = 2): Task[] {
  const R = SUB_RANGES[diff];
  const tasks: Task[] = [];

  const p = (): [number, number] => {
    const a = rnd(R.a[0], R.a[1]);
    const b = rnd(R.b[0], Math.min(a - 1, R.b[1]));
    return [a, b || 1];
  };

  // Warmup
  const [wa, wb] = p();
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} − ${wb} = ?`, wa - wb, "Вычитаем меньшее из большего"));

  // Visual
  const totalV = rnd(5, 12);
  const eatenV = rnd(2, totalV - 1);
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    subSVG(totalV, eatenV), "Сколько яблок осталось?", totalV - eatenV,
    makeWrongs(totalV - eatenV, 3),
    `Было ${totalV}, съели ${eatenV} → осталось ${totalV - eatenV}`));

  // Choice
  const [ca, cb] = p();
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} − ${cb} = ?`, ca - cb, `${ca} − ${cb} = ${ca - cb}`));

  // Input
  const [ia, ib] = p();
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} − ${ib} = ?`, ia - ib, `${ia} − ${ib} = ${ia - ib}`));

  // Trap — add then subtract back
  const n = rnd(5, 20);
  const decoy = rnd(2, 5);
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `${n} − ${decoy} + ${decoy} = ?`, n,
    `Вычли ${decoy}, потом прибавили — вернулись к ${n}!`));

  // Boss
  const [money, book, pen] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1]), rnd(R.b[0], R.b[1])];
  const bossAns = money - book - pen;
  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `Было ${money}₽. Купила книгу за ${book}₽ и ручку за ${pen}₽. Осталось?`,
    bossAns, `${money}−${book}−${pen}=${bossAns}`));

  return shuffleTasks(tasks);
}

export function generateMulLesson(diff: DifficultyLevel = 2): Task[] {
  const R = MUL_RANGES[diff];
  const tasks: Task[] = [];
  const p = (): [number, number] => [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];

  // Warmup
  const [wa, wb] = p();
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} × ${wb} = ?`, wa * wb, "Умножаем — это сложить b раз число a"));

  // Visual grid
  const [rows, cols] = [rnd(2, Math.min(4, R.a[1])), rnd(2, Math.min(5, R.b[1]))];
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    mulGridSVG(rows, cols), "Сколько всего яблок?", rows * cols,
    makeWrongs(rows * cols, 3), `${rows} ряда × ${cols} = ${rows * cols}`));

  // Choice
  const [ca, cb] = p();
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} × ${cb} = ?`, ca * cb, `${ca} × ${cb} = ${ca * cb}`));

  // Input
  const [ia, ib] = p();
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} × ${ib} = ?`, ia * ib, `${ia} × ${ib} = ${ia * ib}`));

  // Trap — multiply by 1
  const tn = rnd(2, 9);
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `${tn} × 1 × 1 = ?`, tn, `Умножать на 1 не меняет число! ${tn} × 1 = ${tn}`));

  // Boss
  const [shelves, books] = [rnd(2, Math.min(8, R.a[1])), rnd(2, Math.min(6, R.b[1]))];
  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `${shelves} полки по ${books} книг. Сколько всего?`,
    shelves * books, `${shelves} × ${books} = ${shelves * books}`));

  return shuffleTasks(tasks);
}

export function generateDivLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  // Generate two numbers that divide evenly
  const p = (): [number, number] => {
    const b = rnd(DIV_RANGE.b[0], DIV_RANGE.b[1]);
    const c = rnd(DIV_RANGE.c[0], DIV_RANGE.c[1]);
    return [b * c, b];
  };

  const div = (a: number, b: number) => a / b;

  // Warmup
  const [wa, wb] = p();
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} ÷ ${wb} = ?`, div(wa, wb), "Делим поровну"));

  // Choice
  const [ca, cb] = p();
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} ÷ ${cb} = ?`, div(ca, cb), `${ca} ÷ ${cb} = ${div(ca, cb)}`));

  // Input
  const [ia, ib] = p();
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} ÷ ${ib} = ?`, div(ia, ib), `${ia} ÷ ${ib} = ${div(ia, ib)}`));

  // Trap — divide by 1
  const tn = rnd(5, 30);
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `${tn} ÷ 1 = ?`, tn, `Любое число ÷ 1 = оно же!`));

  // Division with remainder
  if (diff >= 2) {
    const [a, b] = [rnd(15, 50), rnd(2, 7)];
    const quot = Math.floor(a / b);
    const rem = a - quot * b;
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `${a} ÷ ${b} = ? (целая часть)`,
      quot, `${a} ÷ ${b} = ${quot} (остаток ${rem})`));
  }

  // Boss
  const [candies, friends] = [rnd(12, 40), rnd(2, 5)];
  const bossAns = Math.floor(candies / friends);
  const bossRem = candies - bossAns * friends;
  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `${candies} конфет на ${friends} друзей. Каждому? (ост.${bossRem})`,
    bossAns, `${candies} ÷ ${friends} = ${bossAns}`));

  return shuffleTasks(tasks);
}

export function generateEqLesson(diff: DifficultyLevel = 2): Task[] {
  const R = EQ_RANGES[diff];
  const tasks: Task[] = [];

  // Simple x + a = b
  const x1 = rnd(R.a[0], R.a[1]);
  const a1 = rnd(R.b[0], R.b[1]);
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    `x + ${a1} = ${x1 + a1}. x = ?`, x1,
    `x = ${x1 + a1} − ${a1} = ${x1}`));

  // Visual scale
  const xv = rnd(R.a[0], R.a[1]);
  const av = rnd(R.b[0], R.b[1]);
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    eqScaleSVG(`x + ${av}`, xv + av), "Чему равен x?", xv,
    makeWrongs(xv, 3), `На весах: x + ${av} = ${xv + av}. x = ${xv}`));

  // Multiply
  const xm = rnd(R.a[0], R.a[1]);
  const mul = rnd(R.b[0], R.b[1]);
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    `${mul} × x = ${mul * xm}. x = ?`, xm,
    `x = ${mul * xm} ÷ ${mul} = ${xm}`));

  // Input
  const xi = rnd(R.a[0], R.a[1]);
  const ai = rnd(R.b[0], R.b[1]);
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `x + ${ai} = ${xi + ai}. x = ?`, xi,
    `x = ${xi + ai} − ${ai} = ${xi}`));

  // Trap — two step
  if (diff >= 2) {
    const xt = rnd(R.a[0], R.a[1]);
    tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
      `2 × x + 3 = ${2 * xt + 3}. x = ?`, xt,
      `2x+3=${2 * xt + 3} → 2x=${2 * xt} → x=${xt}`));
  }

  // Boss
  if (diff >= 2) {
    const xb = rnd(R.a[0], R.a[1]);
    const mb = rnd(R.b[0], R.b[1]);
    tasks.push(inputT("⭐", "Босс", "badge-boss",
      `${mb} × x − 2 = ${mb * xb - 2}. x = ?`, xb,
      `Прибавим 2: ${mb}x=${mb * xb} → x=${xb}`));
  }

  return shuffleTasks(tasks);
}

export function generateGeomLesson(diff: DifficultyLevel = 2): Task[] {
  const R = GEOM_RECT[diff];
  const tasks: Task[] = [];

  const rect = (): [number, number] => [rnd(R.w[0], R.w[1]), rnd(R.h[0], R.h[1])];
  const sq = () => rnd(R.w[0], R.w[1]);

  // Square perimeter
  const s1 = sq();
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    `Квадрат, сторона ${s1}. Периметр?`, 4 * s1,
    `P = 4 × ${s1} = ${4 * s1}`));

  // Rectangle visual
  const [vw, vh] = rect();
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    geomRectSVG(vw, vh, "Периметр?"), "Периметр?", 2 * (vw + vh),
    makeWrongs(2 * (vw + vh), 3), `P = 2×(${vw}+${vh}) = ${2 * (vw + vh)}`));

  // Area
  const [aw, ah] = rect();
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    `Прямоугольник ${aw}×${ah}. Площадь?`, aw * ah,
    `S = ${aw} × ${ah} = ${aw * ah}`));

  // Input perimeter
  const [iw, ih] = rect();
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Прямоугольник ${iw}×${ih}. Периметр?`, 2 * (iw + ih),
    `P = 2×(${iw}+${ih}) = ${2 * (iw + ih)}`));

  // Trap — perimeter vs area
  const ts = sq();
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `Квадрат, сторона ${ts}. Периметр? (НЕ площадь!)`, 4 * ts,
    `P = 4 × ${ts} = ${4 * ts}. S = ${ts * ts} — не перепутай!`));

  // Boss
  if (diff >= 2) {
    const [bw, bh] = [rnd(R.w[0], R.w[1]), rnd(R.h[0], R.h[1])];
    tasks.push(inputT("⭐", "Босс", "badge-boss",
      `Комната ${bw}×${bh} м. Периметр и площадь (через запятую)`,
      `${2 * (bw + bh)},${bw * bh}` as any,
      `P=${2 * (bw + bh)}, S=${bw * bh}`));
  }

  return shuffleTasks(tasks);
}

export function generateFracLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  // Compare fractions
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    "Какая дробь больше: 1/4 или 3/4?", "3/4" as any,
    "Одинаковый знаменатель → больше та, где больше числитель"));

  // Pizza visual
  const total = 8;
  const eaten = rnd(2, 5);
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    pizzaSVG(eaten, total), `Какая часть пиццы осталась? (N/${total})`,
    `${total - eaten}/${total}` as any,
    [`${total - eaten}/${total}`, `${eaten}/${total}`, `${total - eaten - 1}/${total}`, `${total - eaten + 1}/${total}`] as any,
    `Было ${total}, съели ${eaten} → осталось ${total - eaten}/${total}`));

  // Simplify
  if (diff >= 2) {
    const num = rnd(2, 4);
    const den = num * rnd(2, 3);
    tasks.push(choiceT("🎯", "Выбор", "badge-choice",
      `Сократи: ${num}/${den}`, `${1}/${den / num}` as any,
      `Делим на ${num} → ${1}/${den / num}`));
  }

  // Fraction of a number
  const den = rnd(2, 5);
  const totalF = den * rnd(2, 6);
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `1/${den} от ${totalF} = ?`, totalF / den,
    `${totalF} ÷ ${den} = ${totalF / den}`));

  // Trap — 1/2 + 1/2
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    "1/2 + 1/2 = ? (не 2/4!)", "1" as any,
    "1/2 + 1/2 = 2/2 = 1 целое! Знаменатели НЕ складываем!"));

  // Boss
  const totalB = rnd(8, 12);
  const eatenB = rnd(2, totalB - 2);
  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `Торт из ${totalB} кусков. Съели ${eatenB}. Осталось? (N/${totalB})`,
    `${totalB - eatenB}/${totalB}` as any,
    `${totalB}−${eatenB}=${totalB - eatenB} → ${totalB - eatenB}/${totalB}`));

  return shuffleTasks(tasks);
}

// ═══ New generators ═══

export function generateCompareLesson(diff: DifficultyLevel = 2): Task[] {
  const ranges = { 1: { min: 1, max: 20 }, 2: { min: 5, max: 99 }, 3: { min: 10, max: 999 } };
  const R = ranges[diff];
  const tasks: Task[] = [];

  const p = (): [number, number] => {
    const a = rnd(R.min, R.max);
    const b = rnd(R.min, R.max);
    return a !== b ? [a, b] : [a, a + 1];
  };

  const [wa, wb] = p();
  const sign1 = wa > wb ? ">" : "<";
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    `${wa} ? ${wb} (>, < или =)`, sign1 as any,
    `${wa} ${sign1} ${wb}`));

  const [ca, cb] = p();
  const sign2 = ca > cb ? ">" : "<";
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    `${ca} ? ${cb}`, sign2 as any,
    `${ca} ${sign2} ${cb}`));

  const [ia, ib] = p();
  const sign3 = ia > ib ? ">" : "<";
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `${ia} ? ${ib} (>, < или =)`, sign3 as any,
    `${ia} ${sign3} ${ib}`));

  // Trap — equals
  const eq = rnd(R.min, R.max);
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `${eq} ? ${eq} — какой знак?`, "=" as any,
    "Одинаковые числа — ставим равно!"));

  return shuffleTasks(tasks);
}

export function generateWordLesson(diff: DifficultyLevel = 2): Task[] {
  const ranges = {
    1: { a: [2, 10], b: [1, 5] },
    2: { a: [5, 30], b: [3, 15] },
    3: { a: [10, 50], b: [5, 30] },
  };
  const R = ranges[diff];
  const tasks: Task[] = [];

  // Addition word problem
  const [apples, more] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    `У Маши ${apples} яблок. Петя дал ещё ${more}. Сколько всего?`,
    apples + more, `${apples} + ${more} = ${apples + more}`));

  // Subtraction
  const [candy, ate] = [rnd(R.a[0] + R.b[0], R.a[1] + R.b[1]), rnd(R.b[0], R.b[1])];
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Было ${candy} конфет. Съели ${ate}. Сколько осталось?`,
    candy - ate, `${candy} − ${ate} = ${candy - ate}`));

  // Compare
  const [vasya, petya] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  const bigger = Math.max(vasya, petya);
  const smaller = Math.min(vasya, petya);
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    `У Васи ${vasya} марок, у Пети ${petya}. У кого больше и на сколько?`,
    bigger - smaller, `У ${vasya > petya ? "Васи" : "Пети"} на ${Math.abs(vasya - petya)} больше`));

  return shuffleTasks(tasks);
}

export function generateTimeLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  // Hours to minutes
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    "1 час = ? минут", 60, "В одном часе 60 минут"));

  const hrs = rnd(1, 4);
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `${hrs} часа — сколько минут?`, hrs * 60,
    `${hrs} × 60 = ${hrs * 60} минут`));

  // Half hour
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    "Полчаса — это сколько минут?", 30,
    "Половина от 60 минут = 30 минут"));

  // Days in week
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    "Сколько дней в неделе?", 7,
    "Понедельник, вторник, ..., воскресенье — 7 дней"));

  if (diff >= 2) {
    tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
      "Сколько месяцев в году? Не путай с неделями!",
      12, "В году 12 месяцев: январь-декабрь"));
  }

  return shuffleTasks(tasks);
}

export function generateUnitsLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  // cm to m
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    "1 метр = ? сантиметров", 100, "В 1 метре 100 сантиметров"));

  const m = rnd(2, 5);
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `${m} метра = ? см`, m * 100, `${m} × 100 = ${m * 100} см`));

  // kg to g
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    "1 килограмм = ? граммов", 1000, "1 кг = 1000 г"));

  if (diff >= 2) {
    const cm = rnd(120, 300);
    const meters = Math.floor(cm / 100);
    const cmRem = cm % 100;
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `${cm} см = ? м ? см (через запятую)`,
      `${meters},${cmRem}` as any,
      `${cm} ÷ 100 = ${meters} м ${cmRem} см`));
  }

  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    "Сколько сантиметров в 1 дециметре?",
    10, "1 дм = 10 см. Не путай с метром (100 см)!"));

  return shuffleTasks(tasks);
}

export function generateMoneyLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  // Simple addition
  const r1 = rnd(2, 8); const r2 = rnd(2, 8);
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    `${r1} руб. + ${r2} руб. = ?`, r1 + r2,
    `Складываем рубли: ${r1} + ${r2} = ${r1 + r2}`));

  // Buying
  const [have, item] = [rnd(30, 70), rnd(10, 25)];
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Было ${have}₽. Купил ручку за ${item}₽. Осталось?`,
    have - item, `${have} − ${item} = ${have - item}₽`));

  // Multi-item
  const [a, b] = [rnd(10, 30), rnd(5, 15)];
  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    `Тетрадь ${a}₽, карандаш ${b}₽. Сколько вместе?`,
    a + b, `${a} + ${b} = ${a + b}₽`));

  if (diff >= 2) {
    const [have2, item2, item3] = [rnd(50, 100), rnd(10, 30), rnd(10, 20)];
    const change = have2 - item2 - item3;
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `Было ${have2}₽. Купил за ${item2}₽ и ${item3}₽. Сдача?`,
      change, `${have2} − ${item2} − ${item3} = ${change}₽`));
  }

  return shuffleTasks(tasks);
}

export function generateLogicLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  const start = rnd(2, 9);
  const step = rnd(2, 4);
  const seq = [start, start + step, start + step * 2];
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    `${seq.join(", ")}, ? — какое число дальше?`,
    seq[2] + step, `+${step} к каждому: ${seq[2]} + ${step} = ${seq[2] + step}`));

  tasks.push(choiceT("🎯", "Выбор", "badge-choice",
    "Что лишнее: 2, 4, 7, 8?",
    "7" as any, "2, 4, 8 — чётные, а 7 — нечётное"));

  if (diff >= 2) {
    tasks.push(choiceT("✏️", "Ввод", "badge-input",
      "Продолжи: 1, 4, 9, 16, ?",
      "25" as any, "Это квадраты: 1²,2²,3²,4²,5²=25"));
  }

  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    "У трёх котов 12 лап. Сколько лап у одного кота?",
    4, "12 ÷ 3 = 4 лапы у каждого кота"));

  return shuffleTasks(tasks);
}

export function generateSpeedLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    "Что такое скорость? Как её найти?",
    "расстояние ÷ время" as any,
    "Скорость = путь ÷ время. Например: 60 км за 2 ч = 30 км/ч"));

  const [dist, time] = [rnd(20, 100), rnd(1, 4)];
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `${dist} км за ${time} ч. Скорость? (км/ч)`,
    Math.round(dist / time),
    `${dist} ÷ ${time} = ${Math.round(dist / time)} км/ч`));

  if (diff >= 2) {
    const [speed, time2] = [rnd(20, 80), rnd(1, 5)];
    tasks.push(choiceT("🎯", "Выбор", "badge-choice",
      `Скорость ${speed} км/ч, время ${time2} ч. Путь?`,
      speed * time2,
      `${speed} × ${time2} = ${speed * time2} км`));
  }

  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    "Скорость = расстояние ÷ время или время ÷ расстояние?",
    "расстояние ÷ время" as any,
    "Не перепутай! Скорость = путь ÷ время"));

  if (diff >= 2) {
    const [d2, t2] = [rnd(30, 120), rnd(2, 5)];
    tasks.push(inputT("⭐", "Босс", "badge-boss",
      `Поехал кот на ${d2} км за ${t2} ч. Скорость?`,
      Math.round(d2 / t2),
      `${d2} ÷ ${t2} = ${Math.round(d2 / t2)} км/ч`));
  }

  return shuffleTasks(tasks);
}

export function generateChartsLesson(diff: DifficultyLevel = 2): Task[] {
  const tasks: Task[] = [];

  tasks.push(choiceT("🔥", "Разминка", "badge-warmup",
    "В таблице: яблок — 5, груш — 3, слив — 7. Чего больше?",
    "слив" as any, "Слив больше всех: 7 > 5 > 3"));

  // Read from table
  const [mon, tue, wed] = [rnd(4, 15), rnd(4, 15), rnd(4, 15)];
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Пн: ${mon} книг, Вт: ${tue}, Ср: ${wed}. Сколько всего за 3 дня?`,
    mon + tue + wed,
    `${mon} + ${tue} + ${wed} = ${mon + tue + wed}`));

  // Find max
  if (diff >= 2) {
    const vals = [rnd(3, 20), rnd(3, 20), rnd(3, 20)];
    const max = Math.max(...vals);
    const names = ["котов", "собак", "рыбок"];
    const maxName = names[vals.indexOf(max)];
    tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
      `В зоомагазине: котов — ${vals[0]}, собак — ${vals[1]}, рыбок — ${vals[2]}. Кого больше всех?`,
      maxName as any,
      `Больше всего ${maxName}: ${max}`));
  }

  return shuffleTasks(tasks);
}

// ═══ 4th grade multi-digit generators ═══

export function generateColumnAddLesson(diff: DifficultyLevel = 2): Task[] {
  const ranges: Record<number, { a: [number, number]; b: [number, number] }> = {
    1: { a: [100, 500], b: [50, 300] },
    2: { a: [200, 2000], b: [100, 1500] },
    3: { a: [500, 9999], b: [200, 5000] },
  };
  const R = ranges[diff];
  const add = (a: number, b: number) => a + b;
  const tasks: Task[] = [];

  const [wa, wb] = [rnd(R.a[0], Math.min(R.a[1], 800)), rnd(R.b[0], Math.min(R.b[1], 500))];
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} + ${wb} = ?`, add(wa, wb), "Складываем большие числа"));

  const [ca, cb] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} + ${cb} = ?`, add(ca, cb), `${ca} + ${cb} = ${add(ca, cb)}`));

  const [ia, ib] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} + ${ib} = ?`, add(ia, ib), `${ia} + ${ib} = ${add(ia, ib)}`));

  const [ta, tb, tc] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1]), rnd(R.b[0], R.b[1])];
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ta} + ${tb} + ${tc} = ?`, add(add(ta, tb), tc), `${ta}+${tb}=${add(ta, tb)}, +${tc}=${add(add(ta, tb), tc)}`));

  const [trapVal, shift] = [rnd(R.a[0], Math.min(R.a[1], 500)), rnd(10, 100)];
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `(${trapVal} + ${shift}) − ${shift} = ?`, trapVal,
    `Прибавили ${shift}, потом вычли — вернулись к ${trapVal}!`));

  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `В магазин привезли ${rnd(R.a[0], R.a[1])} тетрадей и ${rnd(R.b[0], R.b[1])}. Продали ${rnd(R.b[0], R.b[1])}. Осталось?`,
    0, ""));
  // Fix the boss task with calculated values
  const [t1, t2, sold] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1]), rnd(R.b[0], Math.min(rnd(R.b[0], R.b[1]) + rnd(R.a[0], R.a[1]) - 1, R.b[1]))];
  tasks.pop();
  tasks.push(inputT("⭐", "Босс", "badge-boss",
    `Привезли ${t1} и ${t2} тетр. Продали ${sold}. Осталось?`,
    t1 + t2 - sold, `${t1}+${t2}=${t1 + t2}, −${sold}=${t1 + t2 - sold}`));

  return shuffleTasks(tasks);
}

export function generateColumnMulLesson(diff: DifficultyLevel = 2): Task[] {
  const ranges: Record<number, { a: [number, number]; b: [number, number] }> = {
    1: { a: [12, 50], b: [2, 9] },
    2: { a: [20, 200], b: [3, 12] },
    3: { a: [100, 999], b: [4, 15] },
  };
  const R = ranges[diff];
  const mul = (a: number, b: number) => a * b;
  const tasks: Task[] = [];

  const [wa, wb] = [rnd(R.a[0], Math.min(R.a[1], 30)), rnd(R.b[0], Math.min(R.b[1], 6))];
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} × ${wb} = ?`, mul(wa, wb), "Умножаем столбиком"));

  const [ca, cb] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} × ${cb} = ?`, mul(ca, cb), `${ca} × ${cb} = ${mul(ca, cb)}`));

  const [ia, ib] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} × ${ib} = ?`, mul(ia, ib), `${ia} × ${ib} = ${mul(ia, ib)}`));

  // Multiply by 10, 100 trap
  const tn = rnd(10, 50);
  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    `${tn} × 100 = ?`, tn * 100,
    `Умножаем на 100 — просто добавляем два нуля! ${tn} × 100 = ${tn * 100}`));

  if (diff >= 2) {
    const [ba, bb] = [rnd(R.a[0], R.a[1]), rnd(R.b[0], R.b[1])];
    tasks.push(inputT("⭐", "Босс", "badge-boss",
      `${ba} коробок по ${bb} яблок. Сколько всего?`,
      mul(ba, bb), `${ba} × ${bb} = ${mul(ba, bb)}`));
  }

  return shuffleTasks(tasks);
}

export function generateColumnDivLesson(diff: DifficultyLevel = 2): Task[] {
  const ranges: Record<number, { b: [number, number]; c: [number, number] }> = {
    1: { b: [2, 5], c: [2, 9] },
    2: { b: [3, 9], c: [3, 12] },
    3: { b: [4, 15], c: [5, 20] },
  };
  const R = ranges[diff];
  const tasks: Task[] = [];
  const p = (): [number, number] => {
    const b = rnd(R.b[0], R.b[1]);
    const c = rnd(R.c[0], R.c[1]);
    return [b * c, b];
  };

  const [wa, wb] = p();
  tasks.push(choiceT("🔥", "Разминка", "badge-warmup", `${wa} ÷ ${wb} = ?`, wa / wb, "Делим уголком"));

  const [ca, cb] = p();
  tasks.push(choiceT("🎯", "Выбор", "badge-choice", `${ca} ÷ ${cb} = ?`, ca / cb, `${ca} ÷ ${cb} = ${ca / cb}`));

  const [ia, ib] = p();
  tasks.push(inputT("✏️", "Ввод", "badge-input", `${ia} ÷ ${ib} = ?`, ia / ib, `${ia} ÷ ${ib} = ${ia / ib}`));

  // Divide with remainder
  const [a, b] = [rnd(100, 500), rnd(4, 15)];
  const quot = Math.floor(a / b);
  const rem = a - quot * b;
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `${a} ÷ ${b} = ? (целая часть)`, quot,
    `${a} ÷ ${b} = ${quot} (ост. ${rem})`));

  tasks.push(choiceT("⚠️", "Ловушка", "badge-trap",
    "1200 ÷ 100 = ? (подсказка: убери два нуля)",
    12, "1200 ÷ 100 = 12 — просто убираем два нуля!"));

  if (diff >= 2) {
    const [ba, bb] = [rnd(200, 1000), rnd(4, 15)];
    const bq = Math.floor(ba / bb);
    const br = ba - bq * bb;
    tasks.push(inputT("⭐", "Босс", "badge-boss",
      `${ba} книг на ${bb} полок. Поровну. Остаток?`,
      bq, `${ba} ÷ ${bb} = ${bq} (ост. ${br})`));
  }

  return shuffleTasks(tasks);
}

// ═══ Registry ═══

export type MathGeneratorId = "add" | "sub" | "mul" | "div" | "eq" | "geom" | "frac"
  | "compare" | "word" | "time" | "units" | "money" | "logic"
  | "speed" | "charts" | "column_add" | "column_mul" | "column_div";

const MATH_GENS: Record<MathGeneratorId, (diff: DifficultyLevel) => Task[]> = {
  add: generateAddLesson,
  sub: generateSubLesson,
  mul: generateMulLesson,
  div: generateDivLesson,
  eq: generateEqLesson,
  geom: generateGeomLesson,
  frac: generateFracLesson,
  compare: generateCompareLesson,
  word: generateWordLesson,
  time: generateTimeLesson,
  units: generateUnitsLesson,
  money: generateMoneyLesson,
  logic: generateLogicLesson,
  speed: generateSpeedLesson,
  charts: generateChartsLesson,
  column_add: generateColumnAddLesson,
  column_mul: generateColumnMulLesson,
  column_div: generateColumnDivLesson,
};

export function generateMathLesson(generatorId: string, diff: DifficultyLevel = 2): Task[] {
  const gen = MATH_GENS[generatorId as MathGeneratorId];
  return gen ? gen(diff) : generateAddLesson(diff);
}
