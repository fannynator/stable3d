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

function makeStringWrongs(correct: string, pool: string[], count = 3): string[] {
  const others = [...new Set(pool.filter((x) => x !== correct))];
  return shuffle(others).slice(0, Math.min(count, others.length));
}

type T = Task & { correctIdx?: number; words?: { text: string; answer: string }[] };

function choiceStrT(
  emoji: string, badge: string, badgeClass: string,
  question: string, correct: string, wrongPool: string[], count: number,
  explanation: string
): T {
  const wrongs = makeStringWrongs(correct, wrongPool, count);
  const allOptions = shuffle([correct, ...wrongs]);
  const correctIdx = allOptions.findIndex((opt) => opt === correct);
  return { type: "choice", emoji, badge, badgeClass, question, options: allOptions, correctIdx, correctAns: correct, explanation };
}

function inputT(
  emoji: string, badge: string, badgeClass: string,
  question: string, correct: string, explanation: string
): T {
  return { type: "input", emoji, badge, badgeClass, question, correctAns: correct, explanation };
}

function pairT(
  emoji: string, badge: string, badgeClass: string,
  question: string,
  pairs: { left: string; right: string; answer: string }[],
  explanation: string
): T {
  return { type: "pair", emoji, badge, badgeClass, question, pairs, explanation };
}

function visualT(
  emoji: string, badge: string, badgeClass: string,
  svg: string, question: string, correct: string,
  options: string[], explanation: string
): T {
  const allOpts = options.includes(correct) ? options : [correct, ...options];
  const uniqueOpts = [...new Set(allOpts)];
  const correctIdx = uniqueOpts.findIndex((opt) => opt === correct);
  return { type: "visual", emoji, badge, badgeClass, svg, question, options: uniqueOpts, correctIdx, correctAns: correct, explanation };
}

// ═══ SVG helpers ═══

function letterChoiceSVG(word: string, missingIdx: number, options: string[]): string {
  const chars = word.split("");
  const boxSize = 28;
  const W = chars.length * boxSize + 20;
  const H = 62;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  chars.forEach((ch, i) => {
    const x = 10 + i * boxSize;
    if (i === missingIdx) {
      out += `<rect x="${x}" y="10" width="${boxSize - 4}" height="${boxSize}" rx="6" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 2"/>
<text x="${x + (boxSize - 4) / 2}" y="32" text-anchor="middle" font-size="16" fill="#F59E0B" font-weight="800">?</text>`;
    } else {
      out += `<text x="${x + (boxSize - 4) / 2}" y="32" text-anchor="middle" font-size="16" fill="#1E293B" font-weight="600">${ch}</text>`;
    }
  });
  out += `<text x="${W / 2}" y="58" text-anchor="middle" font-size="11" fill="#94A3B8">${options.join(" или ")}</text>`;
  out += "</svg>";
  return out;
}

function compareSVG(word1: string, word2: string, question: string): string {
  const W = 280; const H = 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect x="10" y="6" width="120" height="32" rx="8" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1.5"/>
<text x="70" y="27" text-anchor="middle" font-size="14" fill="#1E293B" font-weight="700">${word1}</text>
<rect x="150" y="6" width="120" height="32" rx="8" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
<text x="210" y="27" text-anchor="middle" font-size="14" fill="#1E293B" font-weight="700">${word2}</text>
<text x="140" y="62" text-anchor="middle" font-size="12" fill="#64748B" font-weight="600">${question}</text>
</svg>`;
}

// ═══ Alphabet ═══

export function generateAlphabetLesson(diff: DifficultyLevel = 2): T[] {
  const letters = "абвгдежзийклмнопрстуфхцчшщъыьэюя".split("");
  const tasks: T[] = [];

  // Warmup — choose the right letter
  const l1 = letters[rnd(0, letters.length - 1)];
  const wrong1 = letters[rnd(0, letters.length - 1)];
  const wrong2 = letters[rnd(0, letters.length - 1)];
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `Какая буква: «${l1.toUpperCase()}»?`, l1,
    [wrong1, wrong2, "ё"], 2,
    `${l1} — это буква «${l1}»`));

  // Visual — find letter in word
  const words = ["кот", "лес", "дом", "река", "море", "шар", "ёж", "мяч"];
  const word = words[rnd(0, words.length - 1)];
  const midx = rnd(0, word.length - 1);
  const vAns = word[midx];
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    letterChoiceSVG(word, midx, [vAns, ...shuffle(letters.filter((l) => l !== vAns)).slice(0, 2)]),
    "Какая буква на месте «?»", vAns,
    shuffle([vAns, letters[rnd(0, letters.length - 1)], letters[rnd(0, letters.length - 1)]]),
    `В слове «${word}» на этом месте буква «${vAns}»`));

  // Choice
  const l2 = letters[rnd(0, letters.length - 1)];
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `Буква после «${l2}» в алфавите?`,
    letters[(letters.indexOf(l2) + 1) % letters.length],
    shuffle(letters).slice(0, 3), 2,
    "Вспоминаем порядок алфавита"));

  // Input — write the letter
  const l3 = letters[rnd(0, letters.length - 1)];
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Напиши букву «${l3}»`, l3,
    `Это буква «${l3}»`));

  // Pair — match uppercase to lowercase
  if (diff >= 2) {
    tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини большую букву с маленькой:", [
      { left: "А", right: "а", answer: "а" },
      { left: "Б", right: "б", answer: "б" },
      { left: "В", right: "в", answer: "в" },
    ], "Заглавная → строчная"));
  }

  return tasks;
}

// ═══ ЖИ/ШИ, ЧА/ЩА, ЧУ/ЩУ ═══

export function generateZhishiLesson(diff: DifficultyLevel = 2): T[] {
  const fullDict = [
    { word: "ж_раф", ans: "и", hint: "ЖИ пиши с И", wrong: "ы" },
    { word: "ш_шка", ans: "и", hint: "ШИ пиши с И", wrong: "ы" },
    { word: "маш_на", ans: "и", hint: "ШИ пиши с И", wrong: "ы" },
    { word: "ч_шка", ans: "а", hint: "ЧА пиши с А", wrong: "я" },
    { word: "щ_вель", ans: "а", hint: "ЩА пиши с А", wrong: "я" },
    { word: "ч_до", ans: "у", hint: "ЧУ пиши с У", wrong: "ю" },
    { word: "щ_ка", ans: "у", hint: "ЩУ пиши с У", wrong: "ю" },
    { word: "ж_знь", ans: "и", hint: "ЖИ пиши с И", wrong: "ы" },
    { word: "ч_деса", ans: "у", hint: "ЧУ пиши с У", wrong: "ю" },
    { word: "рощ_", ans: "а", hint: "ЩА пиши с А", wrong: "я" },
  ];
  const sel = shuffle(fullDict).slice(0, 8);
  const tasks: T[] = [];

  const d0 = sel[0];
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `Вставь букву: «${d0.word}»`, d0.ans, [d0.wrong, "ы", "я"], 2, d0.hint));

  const d1 = sel[1];
  const midx1 = d1.word.indexOf("_");
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    letterChoiceSVG(d1.word.replace("_", "?"), midx1, [d1.ans, d1.wrong]),
    "Какая буква на месте «?»", d1.ans,
    shuffle([d1.ans, d1.wrong, d1.wrong === "ы" ? "я" : "ы"]),
    d1.hint));

  const d2 = sel[2];
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${d2.word}» — какая буква?`, d2.ans, ["и", "а", "у", "ы", "я", "ю"], 3, d2.hint));

  // Pair
  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "ж_раф", right: "и", answer: "и" },
    { left: "ч_до", right: "у", answer: "у" },
    { left: "щ_вель", right: "а", answer: "а" },
  ], "ЖИ-ШИ с И, ЧА-ЩА с А, ЧУ-ЩУ с У"));

  const d4 = sel[4];
  tasks.push(inputT("✏️", "Ввод", "badge-input", `Впиши букву: «${d4.word}»`, d4.ans, d4.hint));

  // Trap — explain WHY
  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«ж_раф» — почему И, а не Ы?",
    "ЖИ пиши с И",
    ["Потому что Ы", "ЖИ пиши с Ы", "Нет правила"],
    2,
    "Правило: ЖИ-ШИ пиши с буквой И!"));

  // Dual input
  if (diff >= 2) {
    const d6 = sel[6];
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«${d6.word}» и «${sel[7].word}» (две буквы через запятую)`,
      `${d6.ans},${sel[7].ans}`,
      `${d6.hint}; ${sel[7].hint}`));
  }

  // Boss — multi-word fill
  if (diff >= 2) {
    tasks.push({
      type: "boss_zhishi", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь буквы во все слова:",
      correctAns: "",
      words: [
        { text: "ж_раф", answer: "и" },
        { text: "ч_до", answer: "у" },
        { text: "щ_ка", answer: "у" },
      ],
      explanation: "ЖИ, ЧУ, ЩУ",
    });
  }

  return tasks;
}

// ═══ Мягкий знак ═══

export function generateSoftLesson(diff: DifficultyLevel = 2): T[] {
  const fullDict = [
    { word: "в_юга", ans: "ь", hint: "Ь — разделительный в корне", wrong: "ъ" },
    { word: "сем_я", ans: "ь", hint: "Ь в корне", wrong: "ъ" },
    { word: "руч_и", ans: "ь", hint: "Ь в корне", wrong: "ъ" },
    { word: "вороб_и", ans: "ь", hint: "Ь в корне", wrong: "ъ" },
    { word: "ноч_ю", ans: "ь", hint: "Ь для мягкости", wrong: "ъ" },
    { word: "мал_чик", ans: "ь", hint: "Ь для мягкости", wrong: "ъ" },
    { word: "пал_то", ans: "ь", hint: "Ь в корне (словарное)", wrong: "ъ" },
    { word: "кон_ки", ans: "ь", hint: "Ь для мягкости", wrong: "ъ" },
  ];
  const sel = shuffle(fullDict).slice(0, 8);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — Ь или Ъ?`, sel[0].ans, ["ь", "ъ"], 1, sel[0].hint));

  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("в_юга", "под_езд", "Где Ь, а где Ъ?"),
    "Где Ь, а где Ъ?",
    "вьюга — Ь, подъезд — Ъ",
    ["вьюга — Ь, подъезд — Ъ", "вьюга — Ъ, подъезд — Ь", "оба с Ь", "оба с Ъ"],
    "Ь в корне, Ъ после приставки"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — какая буква?`, sel[2].ans, ["ь", "ъ"], 1, sel[2].hint));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с нужным знаком:", [
    { left: "в_юга (корень)", right: "Ь", answer: "Ь" },
    { left: "под_езд (приставка)", right: "Ъ", answer: "Ъ" },
    { left: "сем_я (корень)", right: "Ь", answer: "Ь" },
  ], "Ь в корне, Ъ после приставки"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши знак (ь/ъ): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  if (diff >= 2) {
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«под_езд» и «руч_и» (два знака через запятую)`,
      "ъ,ь", "подЪезд (приставка), ручЬи (корень)"));
  }

  if (diff >= 2) {
    tasks.push({
      type: "boss_soft", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь Ь или Ъ:",
      correctAns: "",
      words: [
        { text: "в_юга", answer: "ь" },
        { text: "под_езд", answer: "ъ" },
        { text: "об_явление", answer: "ъ" },
      ],
      explanation: "Ь в корне, Ъ после приставок",
    });
  }

  return tasks;
}

// ═══ Разделительный Ъ ═══

export function generateHardSignLesson(diff: DifficultyLevel = 2): T[] {
  const fullDict = [
    { word: "под_езд", ans: "ъ", hint: "Ъ после приставки на согласный", wrong: "ь" },
    { word: "об_ём", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "с_ехал", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "об_явление", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "раз_ярённый", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "в_езд", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "из_ян", ans: "ъ", hint: "Исключение! Ъ в корне", wrong: "ь" },
    { word: "об_яснить", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
  ];
  const sel = shuffle(fullDict).slice(0, 7);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — Ъ или Ь?`, sel[0].ans, ["ъ", "ь"], 1, sel[0].hint));

  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("об_явление", "вороб_и", "Где Ъ, а где Ь?"),
    "Где Ъ, а где Ь?",
    "обЪявление — Ъ, воробЬи — Ь",
    ["обЪявление — Ъ, воробЬи — Ь", "оба с Ъ", "оба с Ь", "обЬявление — Ь"],
    "Ъ после приставки, Ь в корне"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — ?`, sel[2].ans, ["ъ", "ь"], 1, sel[2].hint));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с правилом:", [
    { left: "под_езд", right: "Ъ (приставка)", answer: "Ъ" },
    { left: "руч_и", right: "Ь (корень)", answer: "Ь" },
    { left: "с_ехал", right: "Ъ (приставка)", answer: "Ъ" },
  ], "Ъ после приставки, Ь в корне"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши (ъ/ь): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«об_ём» — почему Ъ, а не Ь?",
    "После приставки ОБ-",
    ["После приставки ОБ-", "В корне", "Перед гласной Ё", "Это словарное слово"],
    2,
    "Ъ пишется после приставки на согласный перед Е, Ё, Ю, Я"));

  if (diff >= 2) {
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«под_езд» и «с_ехал» (два знака через запятую)`,
      "ъ,ъ", "подЪезд, сЪехал — оба после приставки"));
  }

  return tasks;
}

// ═══ Безударные гласные ═══

export function generateVowelLesson(diff: DifficultyLevel = 2): T[] {
  const fullDict = [
    { word: "л_сной", ans: "е", check: "лес", wrong: "и" },
    { word: "в_да", ans: "о", check: "воды", wrong: "а" },
    { word: "тр_ва", ans: "а", check: "травка", wrong: "о" },
    { word: "ст_на", ans: "е", check: "стены", wrong: "и" },
    { word: "з_мля", ans: "е", check: "земли", wrong: "и" },
    { word: "м_ря", ans: "о", check: "море", wrong: "а" },
    { word: "г_ра", ans: "о", check: "горы", wrong: "а" },
    { word: "сл_ды", ans: "е", check: "след", wrong: "и" },
    { word: "к_тёнок", ans: "о", check: "кот", wrong: "а" },
    { word: "в_сна", ans: "е", check: "вёсны", wrong: "и" },
    { word: "цв_ты", ans: "е", check: "цвет", wrong: "и" },
    { word: "с_сна", ans: "о", check: "сосны", wrong: "а" },
  ];
  const sel = shuffle(fullDict).slice(0, 8);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — проверка «${sel[0].check}». Буква?`,
    sel[0].ans, [sel[0].wrong, "о", "а"].filter((x, i, a) => a.indexOf(x) === i), 2,
    sel[0].check));

  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG(sel[1].word, sel[1].check, "Какая буква пропущена?"),
    "Какая буква пропущена?", sel[1].ans,
    shuffle([sel[1].ans, sel[1].wrong, sel[1].wrong === "и" ? "е" : "и"]),
    `Проверочное слово: ${sel[1].check}`));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — проверка «${sel[2].check}». Буква?`,
    sel[2].ans, ["е", "и", "о", "а"], 2, sel[2].check));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "л_сной", right: "е (лес)", answer: "е" },
    { left: "в_да", right: "о (воды)", answer: "о" },
    { left: "тр_ва", right: "а (травка)", answer: "а" },
  ], "Проверяем ударением"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши букву: «${sel[4].word}» (проверка: ${sel[4].check})`,
    sel[4].ans, `${sel[4].check} → ${sel[4].ans}`));

  // Trap — what to do without check word
  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«к_тёнок» — проверка «кот», пишем О. А если проверки нет?",
    "Смотрим в словарь",
    ["Смотрим в словарь", "Пишем А", "Пишем любую", "Пишем О всегда"],
    2,
    "Словарные слова надо запоминать!"));

  if (diff >= 2) {
    const d6 = sel[6];
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«${d6.word}» и «${sel[7].word}» (две буквы)`,
      `${d6.ans},${sel[7].ans}`,
      `${d6.check} → ${d6.ans}; ${sel[7].check} → ${sel[7].ans}`));
  }

  if (diff >= 2) {
    tasks.push({
      type: "boss_vowel", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь буквы (проверь ударением):",
      correctAns: "",
      words: [
        { text: "л_сной", answer: "е" },
        { text: "в_да", answer: "о" },
        { text: "з_мля", answer: "е" },
      ],
      explanation: "лЕс, вОды, зЕмли",
    });
  }

  return tasks;
}

// ═══ Парные согласные ═══

export function generateConsonantLesson(diff: DifficultyLevel = 2): T[] {
  const fullDict = [
    { word: "ду_", ans: "б", check: "дубы", wrong: "п" },
    { word: "зу_", ans: "б", check: "зубы", wrong: "п" },
    { word: "гла_", ans: "з", check: "глаза", wrong: "с" },
    { word: "но_", ans: "ж", check: "ножи", wrong: "ш" },
    { word: "шка_", ans: "ф", check: "шкафы", wrong: "в" },
    { word: "су_", ans: "п", check: "супы", wrong: "б" },
    { word: "лу_", ans: "г", check: "луга", wrong: "к" },
    { word: "ле_", ans: "в", check: "львы", wrong: "ф" },
  ];
  const sel = shuffle(fullDict).slice(0, 7);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — какая буква? Проверка: ${sel[0].check}`,
    sel[0].ans, [sel[0].wrong, "з", "ж", "с"].filter((x, i, a) => a.indexOf(x) === i), 2,
    sel[0].check));

  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG(sel[1].word, sel[1].check, "Какая буква на конце?"),
    "Какая буква на конце?", sel[1].ans,
    [sel[1].ans, sel[1].wrong, "т", "д"],
    `Проверка: ${sel[1].check} → слышим «${sel[1].wrong}», пишем «${sel[1].ans}»`));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — какая буква? Проверка: ${sel[2].check}`,
    sel[2].ans, ["б", "п", "з", "с", "ж", "ш"], 3, sel[2].check));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "ду_ (дубы)", right: "б", answer: "б" },
    { left: "зу_ (зубы)", right: "б", answer: "б" },
    { left: "но_ (ножи)", right: "ж", answer: "ж" },
  ], "Проверяем — изменяем слово"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши: «${sel[4].word}» (проверка: ${sel[4].check})`,
    sel[4].ans, `${sel[4].check} → ${sel[4].ans}`));

  if (diff >= 2) {
    tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
      "«пру_» — пруд или прут?",
      "Зависит от значения",
      ["Зависит от значения", "Всегда Д", "Всегда Т", "Это словарное слово"],
      2,
      "ПруД (водоём) — пруДы. ПруТ (ветка) — пруТья. Смысл решает!"));
  }

  return tasks;
}

// ═══ Непроизносимые согласные ═══

export function generateSilentLesson(diff: DifficultyLevel = 2): T[] {
  const fullDict = [
    { word: "чес_ный", ans: "т", check: "честь" },
    { word: "грус_ный", ans: "т", check: "грусть" },
    { word: "радос_ный", ans: "т", check: "радость" },
    { word: "звёз_ный", ans: "д", check: "звезда" },
    { word: "праз_ник", ans: "д", check: "празден" },
    { word: "чу_ство", ans: "в", check: "чуВствую" },
    { word: "лес_ница", ans: "т", check: "лестница (словарное)" },
    { word: "со_нце", ans: "л", check: "солнышко" },
  ];
  const sel = shuffle(fullDict).slice(0, 8);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — есть буква? Проверка: «${sel[0].check}»`,
    sel[0].ans, ["т", "д", "л", "в"], 2,
    `Слышится? Нет. Пишется? Да — ${sel[0].ans}!`));

  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG(sel[1].word, sel[1].check, "Какая буква спряталась?"),
    "Какая буква спряталась?", sel[1].ans, ["т", "д", "л", "в"],
    `Проверка: ${sel[1].check} → ${sel[1].ans}`));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — какая буква?`, sel[2].ans,
    ["т", "д", "в", "л"], 2, sel[2].check));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "чес_ный", right: "т (честь)", answer: "т" },
    { left: "со_нце", right: "л (солнышко)", answer: "л" },
    { left: "звёз_ный", right: "д (звезда)", answer: "д" },
  ], "Проверяем родственным словом"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши букву: «${sel[4].word}»`, sel[4].ans,
    `${sel[4].check} → ${sel[4].ans}`));

  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«чу_ство» — есть ли буква В?",
    "Да — В (чуВствую)",
    ["Да — В (чуВствую)", "Нет, не пишется", "Пишется Д", "Это Л"],
    2,
    "Хотя не слышится, пишем В! Проверка: чувствовать"));

  if (diff >= 2) {
    const d6 = sel[6];
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `Впиши буквы: «${d6.word}» и «${sel[7].word}»`,
      `${d6.ans},${sel[7].ans}`,
      `${d6.check} → ${d6.ans}; ${sel[7].check} → ${sel[7].ans}`));
  }

  if (diff >= 2) {
    tasks.push({
      type: "boss_silent", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь буквы:",
      correctAns: "",
      words: [
        { text: "чес_ный", answer: "т" },
        { text: "со_нце", answer: "л" },
        { text: "праз_ник", answer: "д" },
      ],
      explanation: "чесТь, соЛнышко, празДник",
    });
  }

  return tasks;
}

// ═══ -ТСЯ/-ТЬСЯ ═══

export function generateTsyaLesson(diff: DifficultyLevel = 2): T[] {
  const dict = [
    { phrase: "Он учит_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Надо учит_ся", ans: "ться", hint: "Что делать?" },
    { phrase: "Мне нравит_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Это может случит_ся", ans: "ться", hint: "Что сделать?" },
    { phrase: "Солнце садит_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Пора просыпат_ся", ans: "ться", hint: "Что делать?" },
    { phrase: "Он смеёт_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Не надо боят_ся", ans: "ться", hint: "Что делать?" },
  ];
  const sel = shuffle(dict).slice(0, 8);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].phrase}» — ТСЯ или ТЬСЯ?`,
    sel[0].ans, ["тся", "ться"], 1, sel[0].hint));

  const tsyaCorrect = "Он учится — ТСЯ, Надо учиться — ТЬСЯ";
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("Он учит_ся", "Надо учит_ся", "Где ТСЯ, а где ТЬСЯ?"),
    "Где ТСЯ, а где ТЬСЯ?", tsyaCorrect,
    [tsyaCorrect, "оба с ТЬСЯ", "оба с ТСЯ", "Надо учится — ТСЯ"],
    "Что делает? → ТСЯ. Что делать? → ТЬСЯ"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].phrase}» — ?`, sel[2].ans, ["тся", "ться"], 1, sel[2].hint));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини фразу с окончанием:", [
    { left: "Он смеёт_ся", right: "тся", answer: "тся" },
    { left: "Надо учит_ся", right: "ться", answer: "ться" },
    { left: "Солнце садит_ся", right: "тся", answer: "тся" },
  ], "Задай вопрос к глаголу!"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши: «${sel[4].phrase}» (тся/ться)`, sel[4].ans, sel[4].hint));

  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«Мне нравит_ся этот кот» — почему без Ь?",
    "Что делает? → без Ь",
    ["Что делает? → без Ь", "Что делать? → с Ь", "Всегда с Ь", "Это исключение"],
    2,
    "Вопрос «Что делает?» → нет Ь → ТСЯ!"));

  if (diff >= 2) {
    const d6 = sel[6]; const d7 = sel[7];
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«${d6.phrase}» и «${d7.phrase}» (два ответа через запятую)`,
      `${d6.ans},${d7.ans}`, `${d6.hint}; ${d7.hint}`));
  }

  if (diff >= 2) {
    tasks.push({
      type: "boss_tsya", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь ТСЯ или ТЬСЯ:",
      correctAns: "",
      words: [
        { text: "не ошиба_", answer: "ться" },
        { text: "труди_", answer: "ться" },
        { text: "он старае_", answer: "тся" },
      ],
      explanation: "Что делать? → ТЬСЯ. Что делает? → ТСЯ",
    });
  }

  return tasks;
}

// ═══ Н/НН ═══

export function generateNNLesson(diff: DifficultyLevel = 2): T[] {
  const dict = [
    { word: "кури_ый", ans: "н", hint: "Суффикс -ИН- → одна Н", wrong: "нн" },
    { word: "соломе_ый", ans: "нн", hint: "Суффикс -ЕНН- → НН", wrong: "н" },
    { word: "стекля_ый", ans: "нн", hint: "Исключение! Стеклянный, оловянный, деревянный", wrong: "н" },
    { word: "ветре_ый", ans: "н", hint: "Исключение! Ветреный — одна Н", wrong: "нн" },
    { word: "пусты_ый", ans: "нн", hint: "Стык корня и суффикса: пустыН-Н-ый", wrong: "н" },
    { word: "кожа_ый", ans: "н", hint: "Суффикс -АН- → одна Н", wrong: "нн" },
    { word: "обеде_ый", ans: "нн", hint: "Суффикс -ЕНН- → НН", wrong: "н" },
    { word: "глиня_ый", ans: "н", hint: "Суффикс -ЯН- → одна Н", wrong: "нн" },
  ];
  const sel = shuffle(dict).slice(0, 8);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — Н или НН?`,
    sel[0].ans === "н" ? "Н" : "НН",
    ["Н", "НН"], 1, sel[0].hint));

  const nnCorrect = "курИ-Н-ый → Н, солом-ЕНН-ый → НН";
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("кури_ый", "соломе_ый", "Где Н, а где НН?"),
    "Где Н, а где НН?", nnCorrect,
    [nnCorrect, "оба с НН", "оба с Н", "курИ-НН-ый → НН"],
    "-ИН- → Н, -ЕНН- → НН"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — ?`, sel[2].ans === "н" ? "Н" : "НН",
    ["Н", "НН"], 1, sel[2].hint));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с количеством Н:", [
    { left: "кури_ый (-ИН-)", right: "Н", answer: "Н" },
    { left: "соломе_ый (-ЕНН-)", right: "НН", answer: "НН" },
    { left: "стекля_ый (искл.)", right: "НН", answer: "НН" },
  ], "-АН/-ЯН/-ИН → Н, -ЕНН/-ОНН → НН"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши (н/нн): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«ветре_ый» — почему одна Н?",
    "Исключение",
    ["Исключение", "Суффикс -ЕН-", "Суффикс -ИН-", "Краткая форма"],
    2,
    "Ветреный — исключение, одна Н. Но: безветреННый!"));

  if (diff >= 2) {
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«${sel[6].word}» и «${sel[7].word}» (через запятую)`,
      `${sel[6].ans},${sel[7].ans}`,
      `${sel[6].hint}; ${sel[7].hint}`));
  }

  if (diff >= 2) {
    tasks.push({
      type: "boss_nn", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь Н или НН:",
      correctAns: "",
      words: [
        { text: "стекля_ый", answer: "нн" },
        { text: "кожа_ый", answer: "н" },
        { text: "деревя_ый", answer: "нн" },
      ],
      explanation: "стекляННый (искл), кожаНый (-АН-), деревяННый (искл)",
    });
  }

  return tasks;
}

// ═══ ПРЕ/ПРИ ═══

export function generatePrepriLesson(diff: DifficultyLevel = 2): T[] {
  const dict = [
    { word: "пр_бывать", ans: "и", hint: "приближаться" },
    { word: "пр_мудрый", ans: "е", hint: "очень (= пере-)" },
    { word: "пр_шить", ans: "и", hint: "присоединить" },
    { word: "пр_красный", ans: "е", hint: "очень красивый" },
    { word: "пр_вокзальный", ans: "и", hint: "рядом с вокзалом" },
    { word: "пр_градить", ans: "е", hint: "перегородить" },
    { word: "пр_открыть", ans: "и", hint: "не полностью" },
    { word: "пр_увеличить", ans: "е", hint: "очень увеличить" },
  ];
  const sel = shuffle(dict).slice(0, 8);
  const tasks: T[] = [];

  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — ПРЕ или ПРИ?`,
    sel[0].ans === "е" ? "ПРЕ" : "ПРИ",
    ["ПРЕ", "ПРИ"], 1, sel[0].hint));

  const pCorrect = "прИбывать — ПРИ, прЕмудрый — ПРЕ";
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("пр_бывать", "пр_мудрый", "Где ПРИ, а где ПРЕ?"),
    "Где ПРИ, а где ПРЕ?", pCorrect,
    [pCorrect, "оба с ПРЕ", "оба с ПРИ", "прЕбывать — ПРЕ"],
    "ПРИ = приближение, ПРЕ = очень"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — ?`, sel[2].ans === "е" ? "ПРЕ" : "ПРИ",
    ["ПРЕ", "ПРИ"], 1, sel[2].hint));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с приставкой:", [
    { left: "пр_бывать (приближение)", right: "ПРИ", answer: "ПРИ" },
    { left: "пр_мудрый (очень)", right: "ПРЕ", answer: "ПРЕ" },
    { left: "пр_открыть (не полностью)", right: "ПРИ", answer: "ПРИ" },
  ], "ПРИ — приближение/неполнота, ПРЕ — очень/пере"));

  tasks.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши (и/е): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«пр_дать друга» — ПРЕ или ПРИ?",
    "ПРЕ (передать)",
    ["ПРЕ (передать)", "ПРИ (приблизить)", "ПРИ (присоединить)", "ПРЕ (очень)"],
    2,
    "ПРЕдать = пере-дать! Не путай с «придать значение»"));

  if (diff >= 2) {
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      `«${sel[6].word}» и «${sel[7].word}»`,
      `${sel[6].ans},${sel[7].ans}`,
      `${sel[6].hint}; ${sel[7].hint}`));
  }

  if (diff >= 2) {
    tasks.push({
      type: "boss_prepri", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
      question: "Вставь ПРЕ или ПРИ:",
      correctAns: "",
      words: [
        { text: "Пр_мудрый", answer: "е" },
        { text: "пр_был", answer: "и" },
        { text: "пр_вокзальный", answer: "и" },
      ],
      explanation: "ПРЕ, ПРИ, ПРИ",
    });
  }

  return tasks;
}

// ═══ Большая буква ═══

export function generateCapitalLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // Warmup — names
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Какое слово пишется с большой буквы?",
    "Москва", ["кот", "Москва", "школа", "река"], 2,
    "Имена, города и страны пишутся с большой буквы"));

  // Visual — find capital letter
  tasks.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("маша", "Маша", "Где правильно?"),
    "Какое слово написано верно?",
    "Маша",
    ["Маша", "маша", "МАША", "мАша"],
    "Имена всегда с большой буквы: Маша"));

  // Choice
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "«...оссия» — с какой буквы?",
    "Россия", ["Россия", "россия", "Росія"], 1,
    "Названия стран — с большой буквы"));

  // Pair
  tasks.push(pairT("🔗", "Парное", "badge-pair", "Где нужна большая буква?", [
    { left: "имя девочки", right: "Большая", answer: "Большая" },
    { left: "название города", right: "Большая", answer: "Большая" },
    { left: "обычное слово", right: "Маленькая", answer: "Маленькая" },
  ], "Имена собственные → большая буква"));

  // Input
  tasks.push(inputT("✏️", "Ввод", "badge-input",
    "Напиши имя столицы России с большой буквы",
    "Москва",
    "Столица России — Москва"));

  // Trap — Kitten name
  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«кот барсик» — где нужна большая буква?",
    "Барсик",
    ["Барсик", "кот", "оба слова", "нигде"],
    2,
    "Клички животных — с большой буквы! кот Барсик"));

  if (diff >= 2) {
    tasks.push(inputT("✏️", "Ввод", "badge-input",
      "Напиши с большой буквы: «петя и ваня»",
      "Петя,Ваня",
      "Имена: Петя и Ваня"));
  }

  return tasks;
}

// ═══ Падежи / склонения ═══

export function generateCasesLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // Warmup
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Кто? Что? — какой это падеж?",
    "Именительный",
    ["Именительный", "Родительный", "Дательный", "Винительный"],
    2,
    "Кто? Что? — Именительный падеж"));

  // Choice
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "«нет (кого? чего?) кота» — какой падеж?",
    "Родительный",
    ["Родительный", "Дательный", "Творительный", "Именительный"],
    2,
    "Нет кого? чего? — Родительный"));

  // Pair
  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини вопрос с падежом:", [
    { left: "Кто? Что?", right: "И.п.", answer: "И.п." },
    { left: "Кого? Чего?", right: "Р.п.", answer: "Р.п." },
    { left: "Кому? Чему?", right: "Д.п.", answer: "Д.п." },
  ], "Запоминаем вопросы к падежам"));

  // Input — pick correct ending
  if (diff >= 1) {
    tasks.push(choiceStrT("✏️", "Ввод", "badge-input",
      "Думаю о кот... (предложный падеж)",
      "е", ["е", "а", "у", "ом"],
      2,
      "О ком? о чём? — Предложный: о котЕ"));
  }

  // Trap
  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«Вижу (кого? что?) кот...» — винительный падеж",
    "а",
    ["а", "у", "е", "ом"],
    2,
    "Вижу кого? что? — Винительный: вижу котА"));

  return tasks;
}

// ═══ Глаголы / спряжение ═══

export function generateVerbsLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // Warmup
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Какое слово — глагол?",
    "бежать", ["бежать", "бег", "беговой", "бегом"], 2,
    "Глагол отвечает на вопрос «что делать?»"));

  // Choice — tense
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "«читал» — какое время?",
    "Прошедшее",
    ["Прошедшее", "Настоящее", "Будущее"],
    1,
    "Суффикс -Л- → прошедшее время"));

  // Pair
  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини глагол со временем:", [
    { left: "читаю", right: "Настоящее", answer: "Настоящее" },
    { left: "читал", right: "Прошедшее", answer: "Прошедшее" },
    { left: "прочитаю", right: "Будущее", answer: "Будущее" },
  ], "Время глагола: что делает? делал? сделает?"));

  // Input — conjugation
  if (diff >= 2) {
    tasks.push(choiceStrT("✏️", "Ввод", "badge-input",
      "Я пиш..., ты пиш... (наст. время)",
      "у,ешь", ["у,ешь", "у,ишь", "ю,ешь", "у,ёшь"],
      2,
      "Писать — 1 спряжение: я пишУ, ты пишЕШЬ"));
  }

  // Trap — infinitive vs 3rd person
  tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«Он (что делает?) игра...» — какое окончание?",
    "ет",
    ["ет", "ить", "ать", "ют"],
    2,
    "3 лицо: он играЕТ (не путай с инфинитивом «играть»)"));

  return tasks;
}

// ═══ New generators ═══

export function generateWordPartsLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // Root
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Какая часть слова главная (несёт смысл)?",
    "Корень",
    ["Корень", "Суффикс", "Приставка", "Окончание"],
    2,
    "Корень — главная часть слова. Лес, лесной, лесник — корень «лес»"));

  // Find root
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "Общий корень слов: «вода», «водный», «подводный»?",
    "вод",
    ["вод", "под", "ный", "а"],
    2,
    "Корень -вод-: вода, водный, подводный"));

  // Prefix
  tasks.push(choiceStrT("✏️", "Ввод", "badge-input",
    "В слове «пришёл» часть «при» — это?",
    "Приставка",
    "Приставка стоит перед корнем: ПРИ-шёл"));

  // Suffix
  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини часть слова с примером:", [
    { left: "Корень", right: "лес (лесной)", answer: "лес" },
    { left: "Приставка", right: "при (пришёл)", answer: "при" },
    { left: "Суффикс", right: "н (лесной)", answer: "н" },
  ], "Корень — основа, приставка спереди, суффикс сзади"));

  if (diff >= 2) {
    tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
      "В слове «домик» часть «ик» — это суффикс или окончание?",
      "Суффикс",
      ["Суффикс", "Окончание", "Корень", "Приставка"],
      2,
      "Суффикс стоит после корня и меняет смысл: дом → домик (маленький)"));
  }

  return tasks;
}

export function generatePunctLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // End of sentence
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Какой знак в конце вопроса?",
    "?",
    ["?", "!", "."],
    1,
    "Вопросительные предложения заканчиваются на ?"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "«Как красиво!» — какой знак?",
    "!",
    ["!", "?", ".", ","],
    2,
    "Восклицательный знак для эмоций!"));

  tasks.push(choiceStrT("✏️", "Ввод", "badge-input",
    "«Сегодня холодно» — нужен знак? Какой?",
    ".",
    "Точка в конце обычного предложения"));

  // Comma in enumeration
  if (diff >= 2) {
    tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
      "«Я люблю кошек собак и рыбок» — где запятая?",
      "После «кошек»",
      ["После «кошек»", "После «собак»", "После «люблю»", "Не нужна"],
      2,
      "При перечислении ставим запятые: кошек, собак и рыбок"));
  }

  return tasks;
}

export function generateSynonymsLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // Synonym
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Синоним к слову «большой»?",
    "Огромный",
    ["Огромный", "Маленький", "Странный", "Красивый"],
    2,
    "Синонимы — слова, близкие по смыслу"));

  // Antonym
  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "Антоним к слову «горячий»?",
    "Холодный",
    ["Холодный", "Тёплый", "Жаркий", "Красный"],
    2,
    "Антонимы — противоположные по смыслу слова"));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с антонимом:", [
    { left: "высокий", right: "низкий", answer: "низкий" },
    { left: "быстрый", right: "медленный", answer: "медленный" },
    { left: "добрый", right: "злой", answer: "злой" },
  ], "Антонимы — слова с противоположным значением"));

  if (diff >= 2) {
    tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
      "«Храбрый» и «смелый» — синонимы или антонимы?",
      "Синонимы",
      ["Синонимы", "Антонимы", "Омонимы", "Ни то, ни другое"],
      2,
      "Храбрый ≈ смелый — это синонимы (близкие по смыслу)"));
  }

  return tasks;
}

export function generatePronounsLesson(diff: DifficultyLevel = 2): T[] {
  const tasks: T[] = [];

  // Personal pronouns
  tasks.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    "Вместо «Маша» можно сказать...?",
    "она",
    ["она", "он", "оно", "они"],
    2,
    "Маша — она. Местоимения заменяют имена"));

  tasks.push(choiceStrT("🎯", "Выбор", "badge-choice",
    "«Я, ты, он, она» — это...?",
    "Личные местоимения",
    ["Личные местоимения", "Прилагательные", "Глаголы", "Существительные"],
    2,
    "Я, ты, он, она, мы, вы, они — личные местоимения"));

  tasks.push(pairT("🔗", "Парное", "badge-pair", "Соедини местоимение с лицом:", [
    { left: "я", right: "1 лицо", answer: "1 лицо" },
    { left: "ты", right: "2 лицо", answer: "2 лицо" },
    { left: "он", right: "3 лицо", answer: "3 лицо" },
  ], "1 лицо — я/мы, 2 лицо — ты/вы, 3 лицо — он/она/они"));

  if (diff >= 2) {
    tasks.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
      "«Его» — это чьё: моё, твоё или его?",
      "Его (3 лицо)",
      ["Его (3 лицо)", "Моё (1 лицо)", "Твоё (2 лицо)", "Наше"],
      2,
      "Его дом = дом, принадлежащий ему (3 лицо)"));
  }

  return tasks;
}

// ═══ Registry ═══

export type RussianGeneratorId =
  | "alphabet" | "zhishi" | "soft" | "capital"
  | "vowel" | "consonant" | "silent" | "hard_sign"
  | "tsya" | "nn" | "cases"
  | "prepri" | "verbs"
  | "word_parts" | "punct" | "synonyms" | "pronouns";

const RUS_GENS: Record<RussianGeneratorId, (diff: DifficultyLevel) => T[]> = {
  alphabet: generateAlphabetLesson,
  zhishi: generateZhishiLesson,
  soft: generateSoftLesson,
  capital: generateCapitalLesson,
  vowel: generateVowelLesson,
  consonant: generateConsonantLesson,
  silent: generateSilentLesson,
  hard_sign: generateHardSignLesson,
  tsya: generateTsyaLesson,
  nn: generateNNLesson,
  cases: generateCasesLesson,
  prepri: generatePrepriLesson,
  verbs: generateVerbsLesson,
  word_parts: generateWordPartsLesson,
  punct: generatePunctLesson,
  synonyms: generateSynonymsLesson,
  pronouns: generatePronounsLesson,
};

export function generateRusLesson(generatorId: string, diff: DifficultyLevel = 2): T[] {
  const gen = RUS_GENS[generatorId as RussianGeneratorId];
  return gen ? gen(diff) : generateZhishiLesson(diff);
}
