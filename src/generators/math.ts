import type { Task } from "../app/types";

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
  const wrongs = new Set<number>();
  while (wrongs.size < count) {
    let delta: number;
    if (correct <= 10) delta = rnd(-3, 3);
    else if (correct <= 50) delta = rnd(-Math.floor(correct * 0.3), Math.floor(correct * 0.3));
    else delta = rnd(-Math.floor(correct * 0.2), Math.floor(correct * 0.2));
    const candidate = correct + delta;
    if (candidate !== correct && candidate >= 0 && !wrongs.has(candidate)) wrongs.add(candidate);
  }
  return [...wrongs];
}

function choiceT(emoji: string, badge: string, badgeClass: string, question: string, correct: string | number, explanation: string): Task {
  const allOptions = [correct, ...makeWrongs(correct as number)];
  const options = shuffle(allOptions);
  return { type: 'choice', emoji, badge, badgeClass, question, options, correctAns: correct, explanation };
}

function inputT(emoji: string, badge: string, badgeClass: string, question: string, correct: string | number, explanation: string): Task {
  return { type: 'input', emoji, badge, badgeClass, question, correctAns: correct, explanation };
}

function pairT(emoji: string, badge: string, badgeClass: string, question: string, pairs: { left: string; right: string; answer: string | number }[], explanation: string): Task {
  return { type: 'pair', emoji, badge, badgeClass, question, correctAns: pairs[0]?.answer ?? '', pairs, explanation };
}

function visualT(emoji: string, badge: string, badgeClass: string, svg: string, question: string, correct: string | number, options: (string | number)[], explanation: string): Task {
  const allOpts = options.includes(correct) ? options : [correct, ...options];
  const uniqueOpts = [...new Set(allOpts)];
  return { type: 'visual', emoji, badge, badgeClass, svg, question, options: uniqueOpts, correctAns: correct, explanation };
}

function applesSVG(count: number, color = '#EF4444'): string {
  const rows = Math.ceil(count / 5);
  let circles = '';
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
  out += `<text x="75" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">🍎 группа А</text>`;
  for (let r = 0; r < rowsA; r++) {
    const inRow = r === rowsA - 1 ? (a % 5 || 5) : 5;
    for (let c = 0; c < inRow; c++) {
      const cx = 35 + c * 28 + (rowsA > 1 && r === rowsA - 1 ? (5 - inRow) * 14 : 0);
      const cy = 30 + r * 32;
      out += `<circle cx="${cx}" cy="${cy}" r="11" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#7F1D1D" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  out += `<text x="225" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">🍎 группа Б</text>`;
  for (let r = 0; r < rowsB; r++) {
    const inRow = r === rowsB - 1 ? (b % 5 || 5) : 5;
    for (let c = 0; c < inRow; c++) {
      const cx = 185 + c * 28 + (rowsB > 1 && r === rowsB - 1 ? (5 - inRow) * 14 : 0);
      const cy = 30 + r * 32;
      out += `<circle cx="${cx}" cy="${cy}" r="11" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#92400E" stroke-width="2" stroke-linecap="round"/>`;
    }
  }
  out += '</svg>';
  return out;
}

function subSVG(total: number, eaten: number): string {
  const H = Math.ceil(total / 5) * 32 + 30;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 ${H}" width="280" height="${H}">`;
  out += `<text x="140" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">Было ${total} 🍎</text>`;
  for (let r = 0; r < Math.ceil(total / 5); r++) {
    const inRow = r === Math.ceil(total / 5) - 1 ? (total % 5 || 5) : 5;
    for (let c = 0; c < (r < Math.ceil(total / 5) - 1 ? 5 : inRow); c++) {
      const idx = r * 5 + c;
      const cx = 40 + c * 36;
      const cy = 30 + r * 32;
      const isEaten = idx < eaten;
      const fill = isEaten ? '#E2E8F0' : '#EF4444';
      const stroke = isEaten ? '#CBD5E1' : '#B91C1C';
      out += `<circle cx="${cx}" cy="${cy}" r="11" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="${isEaten ? '3 2' : 'none'}"/>`;
      if (isEaten) {
        out += `<line x1="${cx - 5}" y1="${cy - 5}" x2="${cx + 5}" y2="${cy + 5}" stroke="#CBD5E1" stroke-width="2"/>
<line x1="${cx + 5}" y1="${cy - 5}" x2="${cx - 5}" y2="${cy + 5}" stroke="#CBD5E1" stroke-width="2"/>`;
      } else {
        out += `<line x1="${cx - 4}" y1="${cy - 5}" x2="${cx + 1}" y2="${cy - 9}" stroke="#7F1D1D" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
  }
  out += '</svg>';
  return out;
}

function mulGridSVG(rows: number, cols: number): string {
  const W = Math.min(300, cols * 36 + 20);
  const H = rows * 32 + 30;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  out += `<text x="${W / 2}" y="14" text-anchor="middle" font-size="11" fill="#94A3B8" font-weight="700">${rows} ряда × ${cols} 🍎</text>`;
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
  out += '</svg>';
  return out;
}

function divBasketsSVG(total: number, baskets: number): string {
  const perBasket = Math.floor(total / baskets);
  const rem = total - perBasket * baskets;
  const W = baskets * 60 + 20;
  const H = (perBasket + (rem > 0 ? 1 : 0)) * 22 + 80;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  out += `<text x="${W / 2}" y="12" text-anchor="middle" font-size="10" fill="#94A3B8" font-weight="700">${total} 🍎 в ${baskets} корзинах</text>`;
  for (let b = 0; b < baskets; b++) {
    const bx = 14 + b * 60;
    out += `<path d="M${bx} 40 L${bx + 10} ${H - 16} L${bx + 38} ${H - 16} L${bx + 48} 40 Z" fill="#D4A373" stroke="#B8845A" stroke-width="1.5"/>`;
    const count = b < rem ? perBasket + 1 : perBasket;
    for (let a = 0; a < count; a++) {
      const ax = bx + 14 + (a % 3) * 16;
      const ay = H - 28 - Math.floor(a / 3) * 18;
      out += `<circle cx="${ax}" cy="${ay}" r="5" fill="#EF4444" stroke="#B91C1C" stroke-width="0.8"/>`;
    }
  }
  out += '</svg>';
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
    slices.push(`<path d="M100 100 L${x1} ${y1} A70 70 0 0 1 ${x2} ${y2} Z" fill="${eatenSlice ? '#E2E8F0' : '#F59E0B'}" stroke="#92400E" stroke-width="1.5"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
${slices.join('')}
<text x="100" y="190" text-anchor="middle" font-size="12" fill="#94A3B8" font-weight="700">Съедено ${eaten} из ${total}</text>
</svg>`;
}

function generateAddLesson(): Task[] {
  const t: Task[] = [];
  const add = (a: number, b: number): number => a + b;

  {
    const [a, b] = [rnd(3, 15), rnd(3, 15)];
    t.push(choiceT('🔥', 'Разминка', 'badge-warmup', `${a} + ${b} = ?`, add(a, b), 'Просто складываем два числа'));
  }
  {
    const [a, b] = [rnd(3, 7), rnd(3, 7)];
    const svg = applesTwoGroups(a, b);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg, `Сколько всего яблок?`, add(a, b), makeWrongs(add(a, b)), `${a} красных + ${b} жёлтых = ${add(a, b)}`));
  }
  {
    const [a, b] = [rnd(10, 40), rnd(10, 40)];
    t.push(choiceT('🎯', 'Выбор', 'badge-choice', `${a} + ${b} = ?`, add(a, b), `Складываем: ${a} + ${b}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [];
    const used = new Set<number>();
    while (pd.length < 3) {
      const [a, b] = [rnd(5, 30), rnd(5, 30)];
      const ans = add(a, b);
      if (!used.has(ans)) { used.add(ans); pd.push({ left: `${a} + ${b}`, right: `${ans}`, answer: ans }); }
    }
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини выражение с ответом:', pd, 'Сопоставляем суммы'));
  }
  {
    const [a, b] = [rnd(15, 60), rnd(10, 40)];
    t.push(inputT('✏️', 'Ввод', 'badge-input', `${a} + ${b} = ?`, add(a, b), `${a} + ${b} = ${add(a, b)}`));
  }
  {
    const secret = rnd(10, 30);
    t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
      `Если у Маши ${secret} конфет, а Петя дал ей ещё 0, сколько стало?`,
      secret,
      'Если прибавить 0 — ничего не меняется! Не дай себя обмануть'));
  }
  {
    const [a, b, c] = [rnd(10, 30), rnd(10, 30), rnd(10, 30)];
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `${a} + ${b} + ${c} = ?`, add(add(a, b), c),
      `${a}+${b}=${add(a, b)}, +${c}=${add(add(a, b), c)}`));
  }
  {
    const [apples, more] = [rnd(20, 50), rnd(10, 30)];
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `В саду было ${apples} яблок. Привезли ещё ${more}. Сколько всего?`,
      add(apples, more),
      `${apples} + ${more} = ${add(apples, more)}`));
  }
  return t;
}

function generateSubLesson(): Task[] {
  const t: Task[] = [];
  const g = (): [number, number] => { const x = rnd(15, 50); const y = rnd(3, x - 3); return [x, y]; };
  const sub = (a: number, b: number): number => a - b;

  {
    const [a, b] = g();
    t.push(choiceT('🔥', 'Разминка', 'badge-warmup', `${a} − ${b} = ?`, sub(a, b), 'Вычитаем меньшее из большего'));
  }
  {
    const total = rnd(8, 15);
    const eaten = rnd(2, total - 2);
    const svg = subSVG(total, eaten);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg,
      `Сколько яблок осталось?`, total - eaten,
      makeWrongs(total - eaten),
      `Было ${total}, съели ${eaten} → осталось ${total - eaten}`));
  }
  {
    const [a, b] = g();
    t.push(choiceT('🎯', 'Выбор', 'badge-choice', `${a} − ${b} = ?`, sub(a, b), `${a} − ${b} = ${sub(a, b)}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [];
    const used = new Set<number>();
    while (pd.length < 3) {
      const [a, b] = g();
      const ans = sub(a, b);
      if (!used.has(ans)) { used.add(ans); pd.push({ left: `${a} − ${b}`, right: `${ans}`, answer: ans }); }
    }
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини выражение с ответом:', pd, 'Сопоставляем разности'));
  }
  {
    const [a, b] = g();
    t.push(inputT('✏️', 'Ввод', 'badge-input', `${a} − ${b} = ?`, sub(a, b), `${a} − ${b} = ${sub(a, b)}`));
  }
  {
    const n = rnd(10, 25);
    const decoy = rnd(3, 8);
    t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
      `${n} − ${decoy} + ${decoy} = ?`,
      n,
      `Сначала вычли ${decoy}, потом прибавили — вернулись к ${n}! Порядок действий важен`));
  }
  {
    const [money, book, pen] = [rnd(40, 90), rnd(10, 25), rnd(5, 12)];
    const ans7 = money - book - pen;
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `У Маши ${money} руб. Купила книгу за ${book} руб. и ручку за ${pen} руб. Осталось?`,
      ans7,
      `${money} − ${book} − ${pen} = ${ans7}`));
  }
  {
    const [was, spent, earned] = [rnd(60, 150), rnd(20, 60), rnd(10, 40)];
    const ans8 = was - spent + earned;
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `На счету было ${was}₽. Потратили ${spent}₽, потом пришло ${earned}₽. Сколько стало?`,
      ans8,
      `${was} − ${spent} + ${earned} = ${ans8}`));
  }
  return t;
}

function generateMulLesson(): Task[] {
  const t: Task[] = [];
  const g = (): [number, number] => [rnd(2, 10), rnd(2, 10)];
  const mul = (a: number, b: number): number => a * b;

  {
    const [a, b] = g();
    t.push(choiceT('🔥', 'Разминка', 'badge-warmup', `${a} × ${b} = ?`, mul(a, b), 'Умножаем — это как сложить b раз число a'));
  }
  {
    const [rows, cols] = [rnd(2, 5), rnd(3, 6)];
    const svg = mulGridSVG(rows, cols);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg,
      `Сколько всего яблок?`, mul(rows, cols),
      makeWrongs(mul(rows, cols)),
      `${rows} ряда × ${cols} в ряду = ${mul(rows, cols)}`));
  }
  {
    const [a, b] = g();
    t.push(choiceT('🎯', 'Выбор', 'badge-choice', `${a} × ${b} = ?`, mul(a, b), `${a} × ${b} = ${mul(a, b)}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [];
    const used = new Set<number>();
    while (pd.length < 3) {
      const [a, b] = g();
      const ans = mul(a, b);
      if (!used.has(ans)) { used.add(ans); pd.push({ left: `${a} × ${b}`, right: `${ans}`, answer: ans }); }
    }
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини выражение с ответом:', pd, 'Сопоставляем произведения'));
  }
  {
    const [a, b] = g();
    t.push(inputT('✏️', 'Ввод', 'badge-input', `${a} × ${b} = ?`, mul(a, b), `${a} × ${b} = ${mul(a, b)}`));
  }
  {
    const n = rnd(3, 9);
    t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
      `${n} × 1 × 1 × 1 = ?`,
      n,
      `Умножать на 1 можно сколько угодно — число не изменится! ${n} × 1 = ${n}`));
  }
  {
    const [a, b, c] = [rnd(2, 6), rnd(2, 6), rnd(2, 5)];
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `${a} × ${b} × ${c} = ?`,
      mul(mul(a, b), c),
      `${a}×${b}=${mul(a, b)}, ×${c}=${mul(mul(a, b), c)}`));
  }
  {
    const [shelves, books] = [rnd(3, 7), rnd(4, 12)];
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `${shelves} полки, на каждой по ${books} книг. Сколько всего?`,
      mul(shelves, books),
      `${shelves} × ${books} = ${mul(shelves, books)}`));
  }
  return t;
}

function generateDivLesson(): Task[] {
  const t: Task[] = [];
  const g = (): [number, number] => { const b = rnd(2, 8); const c = rnd(2, 8); return [b * c, b]; };
  const div = (a: number, b: number): number => a / b;

  {
    const [a, b] = g();
    t.push(choiceT('🔥', 'Разминка', 'badge-warmup', `${a} ÷ ${b} = ?`, div(a, b), 'Делим поровну'));
  }
  {
    const total = rnd(8, 20);
    const baskets = rnd(2, 4);
    const svg = divBasketsSVG(total, baskets);
    const perBasket = Math.floor(total / baskets);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg,
      `Сколько яблок в одной корзине?`, perBasket,
      [...new Set([perBasket, perBasket + 1, perBasket - 1, total])],
      `${total} ÷ ${baskets} = ${perBasket} (остаток ${total - perBasket * baskets})`));
  }
  {
    const [a, b] = g();
    t.push(choiceT('🎯', 'Выбор', 'badge-choice', `${a} ÷ ${b} = ?`, div(a, b), `${a} ÷ ${b} = ${div(a, b)}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [];
    const used = new Set<number>();
    while (pd.length < 3) {
      const b = rnd(2, 7); const c = rnd(2, 7); const a = b * c;
      if (!used.has(c)) { used.add(c); pd.push({ left: `${a} ÷ ${b}`, right: `${c}`, answer: c }); }
    }
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини выражение с ответом:', pd, 'Сопоставляем частные'));
  }
  {
    const [a, b] = g();
    t.push(inputT('✏️', 'Ввод', 'badge-input', `${a} ÷ ${b} = ?`, div(a, b), `${a} ÷ ${b} = ${div(a, b)}`));
  }
  {
    const n = rnd(5, 30);
    t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
      `${n} ÷ 1 = ?`,
      n,
      `Любое число делить на 1 — остаётся собой! ${n} ÷ 1 = ${n}`));
  }
  {
    const [a, b] = [rnd(20, 60), rnd(2, 6)];
    const ans7 = Math.floor(a / b);
    const rem7 = a - ans7 * b;
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `${a} ÷ ${b} = ? (только целая часть)`,
      ans7,
      `${a} ÷ ${b} = ${ans7} (остаток ${rem7})`));
  }
  {
    const [candies, friends] = [rnd(20, 50), rnd(3, 7)];
    const ans8 = Math.floor(candies / friends);
    const rem8 = candies - ans8 * friends;
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `${candies} конфет на ${friends} друзей. Сколько каждому? (ост.${rem8})`,
      ans8,
      `${candies} ÷ ${friends} = ${ans8}`));
  }
  return t;
}

function generateEqLesson(): Task[] {
  const t: Task[] = [];

  {
    const x = rnd(2, 12); const a = rnd(1, 8);
    t.push(choiceT('🔥', 'Разминка', 'badge-warmup', `x + ${a} = ${x + a}. x = ?`, x, `x = ${x + a} − ${a} = ${x}`));
  }
  {
    const x = rnd(2, 10); const a = rnd(1, 6);
    const svg = eqScaleSVG(`x + ${a}`, x + a);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg,
      `Чему равен x?`, x,
      makeWrongs(x),
      `На весах слева x + ${a}, справа ${x + a}. Значит x = ${x}`));
  }
  {
    const x = rnd(2, 10); const mul = rnd(2, 5);
    t.push(choiceT('🎯', 'Выбор', 'badge-choice', `${mul} × x = ${mul * x}. x = ?`, x, `x = ${mul * x} ÷ ${mul} = ${x}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [];
    const used = new Set<number>();
    while (pd.length < 3) {
      const x = rnd(2, 10); const a = rnd(1, 6);
      const key = `x + ${a} = ${x + a}`;
      if (!used.has(x)) { used.add(x); pd.push({ left: key, right: `x = ${x}`, answer: x }); }
    }
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини уравнение с ответом:', pd, 'Решаем уравнения'));
  }
  {
    const x = rnd(2, 12); const a = rnd(2, 8);
    t.push(inputT('✏️', 'Ввод', 'badge-input', `x + ${a} = ${x + a}. x = ?`, x, `x = ${x + a} − ${a} = ${x}`));
  }
  {
    const x = rnd(3, 10);
    t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
      `2 × x + 3 = ${2 * x + 3}. x = ?`,
      x,
      `Сначала отними 3: 2x = ${2 * x}, потом раздели на 2 → x = ${x}`));
  }
  {
    const x = rnd(2, 8); const mul = rnd(2, 5);
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `${mul} × x − 2 = ${mul * x - 2}. x = ?`,
      x,
      `Сначала +2: ${mul}x = ${mul * x}, потом ÷${mul} → x = ${x}`));
  }
  {
    const x = rnd(3, 8);
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `3 коробки с яблоками и ещё 2 яблока = ${3 * x + 2}. Сколько в коробке?`,
      x,
      `${3 * x + 2} − 2 = ${3 * x}, ÷3 = ${x}`));
  }
  return t;
}

function generateGeomLesson(): Task[] {
  const t: Task[] = [];
  const rect = (): [number, number] => [rnd(3, 8), rnd(3, 8)];
  const sq = (): number => rnd(3, 7);

  {
    const s = sq();
    t.push(choiceT('🔥', 'Разминка', 'badge-warmup', `Квадрат со стороной ${s}. Периметр?`, 4 * s, `P = 4 × ${s} = ${4 * s}`));
  }
  {
    const [w, h] = rect();
    const svg = geomRectSVG(w, h, `Периметр?`);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg,
      `Чему равен периметр?`, 2 * (w + h),
      makeWrongs(2 * (w + h)),
      `P = 2×(${w}+${h}) = ${2 * (w + h)}`));
  }
  {
    const [w, h] = rect();
    t.push(choiceT('🎯', 'Выбор', 'badge-choice', `Прямоугольник ${w}×${h}. Площадь?`, w * h, `S = ${w} × ${h} = ${w * h}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [];
    for (let i = 0; i < 3; i++) {
      const [w, h] = rect();
      pd.push({ left: `Прям. ${w}×${h} — S`, right: `${w * h}`, answer: w * h });
    }
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини фигуру с площадью:', pd, 'Сопоставляем площади'));
  }
  {
    const [w, h] = rect();
    t.push(inputT('✏️', 'Ввод', 'badge-input', `Прямоугольник ${w}×${h}. Периметр?`, 2 * (w + h), `P = 2×(${w}+${h}) = ${2 * (w + h)}`));
  }
  {
    const s = sq();
    t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
      `Квадрат со стороной ${s}. Периметр = ? (НЕ площадь!)`,
      4 * s,
      `P = 4 × ${s} = ${4 * s}. Не перепутай с S = ${s * s}!`));
  }
  {
    const [w, h] = rect();
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `Прямоугольник ${w}×${h}. Площадь?`,
      w * h,
      `S = ${w} × ${h} = ${w * h}`));
  }
  {
    const [w, h] = [rnd(4, 10), rnd(3, 8)];
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `Комната ${w}×${h} м. Периметр и площадь (через запятую)`,
      `${2 * (w + h)},${w * h}`,
      `P=${2 * (w + h)}, S=${w * h}`));
  }
  return t;
}

function generateFracLesson(): Task[] {
  const t: Task[] = [];

  t.push(choiceT('🔥', 'Разминка', 'badge-warmup',
    'Какая дробь больше: 1/4 или 3/4?', '3/4',
    'Одинаковый знаменатель → больше та, где больше числитель'));
  {
    const total = 8;
    const eaten = rnd(2, 5);
    const svg = pizzaSVG(eaten, total);
    t.push(visualT('🖼️', 'Визуальное', 'badge-visual', svg,
      `Какая часть пиццы осталась? (в формате N/${total})`,
      `${total - eaten}/${total}`,
      [`${total - eaten}/${total}`, `${eaten}/${total}`, `${total - eaten - 1}/${total}`, `${total - eaten + 1}/${total}`],
      `Было ${total}, съели ${eaten} → осталось ${total - eaten}/${total}`));
  }
  {
    const num = rnd(2, 6); const den = num * rnd(2, 4);
    const reducedNum = 1; const reducedDen = den / num;
    t.push(choiceT('🎯', 'Выбор', 'badge-choice',
      `Сократи дробь: ${num}/${den}`,
      `${reducedNum}/${reducedDen}`,
      `Делим числитель и знаменатель на ${num} → ${reducedNum}/${reducedDen}`));
  }
  {
    const pd: { left: string; right: string; answer: string | number }[] = [
      { left: '1/2 от 10', right: '5', answer: '5' },
      { left: '1/3 от 9', right: '3', answer: '3' },
      { left: '1/4 от 8', right: '2', answer: '2' }
    ];
    t.push(pairT('🔗', 'Парное', 'badge-pair', 'Соедини дробь от числа с ответом:', pd, 'Находим дробь от числа'));
  }
  {
    const den = rnd(3, 6);
    const total = den * rnd(3, 7);
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `1/${den} от ${total} = ?`,
      total / den,
      `${total} ÷ ${den} = ${total / den}`));
  }
  t.push(choiceT('⚠️', 'Ловушка', 'badge-trap',
    '1/2 + 1/2 = ? (не 2/4!)',
    '1',
    '1/2 + 1/2 = 2/2 = 1 целое! Знаменатели НЕ складываем!'));
  {
    const den = rnd(2, 5);
    const num = rnd(1, den - 1);
    const total = den * rnd(2, 6);
    t.push(inputT('✏️', 'Ввод', 'badge-input',
      `${num}/${den} от ${total} = ?`,
      Math.round(total * num / den),
      `${total} ÷ ${den} × ${num} = ${Math.round(total * num / den)}`));
  }
  {
    const total = 12;
    const eaten = rnd(3, 8);
    t.push(inputT('⭐', 'Босс', 'badge-boss',
      `Торт на ${total} кусков. Съели ${eaten}. Осталось? (формат N/${total})`,
      `${total - eaten}/${total}`,
      `${total} − ${eaten} = ${total - eaten} → ${total - eaten}/${total}`));
  }
  return t;
}

function generateMathLesson(skillId: string): Task[] {
  const gens: Record<string, () => Task[]> = { add: generateAddLesson, sub: generateSubLesson, mul: generateMulLesson, div: generateDivLesson, eq: generateEqLesson, geom: generateGeomLesson, frac: generateFracLesson };
  const gen = gens[skillId];
  return gen ? gen() : generateAddLesson();
}

export { generateAddLesson, generateSubLesson, generateMulLesson, generateDivLesson, generateEqLesson, generateGeomLesson, generateFracLesson, generateMathLesson };
