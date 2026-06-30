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

function makeStringWrongs(correct: string, pool: string[], count: number = 3): string[] {
  const others = [...new Set(pool.filter(x => x !== correct))];
  const shuf = shuffle(others);
  return shuf.slice(0, Math.min(count, shuf.length));
}

type T = Task & { correctIdx?: number };

function choiceStrT(emoji: string, badge: string, badgeClass: string, question: string, correct: string, wrongPool: string[], count: number, explanation: string): T {
  const wrongs = makeStringWrongs(correct, wrongPool, count);
  const allOptions = shuffle([correct, ...wrongs]);
  const correctIdx = allOptions.findIndex(opt => opt === correct);
  return { type: "choice", emoji, badge, badgeClass, question, options: allOptions, correctIdx, correctAns: correct, explanation };
}

function inputT(emoji: string, badge: string, badgeClass: string, question: string, correct: string, explanation: string): T {
  return { type: "input", emoji, badge, badgeClass, question, correctAns: correct, explanation };
}

function pairT(emoji: string, badge: string, badgeClass: string, question: string, pairs: { left: string; right: string; answer: string }[], explanation: string): T {
  return { type: "pair", emoji, badge, badgeClass, question, pairs, explanation };
}

function visualT(emoji: string, badge: string, badgeClass: string, svg: string, question: string, correct: string, options: string[], explanation: string): T {
  const allOpts = options.includes(correct) ? options : [correct, ...options];
  const uniqueOpts = [...new Set(allOpts)];
  const correctIdx = uniqueOpts.findIndex(opt => opt === correct);
  return { type: "visual", emoji, badge, badgeClass, svg, question, options: uniqueOpts, correctIdx, correctAns: correct, explanation };
}

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

function ruleHintSVG(rule: string): string {
  const W = 280; const H = 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <rect x="10" y="4" width="260" height="40" rx="8" fill="#D1FAE5" stroke="#10B981" stroke-width="1.5"/>
        <text x="140" y="30" text-anchor="middle" font-size="13" fill="#065F46" font-weight="700">📏 ${rule}</text>
    </svg>`;
}

export function generateZhishiLesson(): Task[] {
  const t: T[] = [];
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
    { word: "рощ_", ans: "а", hint: "ЩА пиши с А", wrong: "я" }
  ];
  const sel = shuffle(fullDict).slice(0, 8);

  const d0 = sel[0];
  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `Вставь букву: «${d0.word}»`, d0.ans, [d0.wrong, "ы", "я"], 2, d0.hint));

  const d1 = sel[1];
  const midx1 = d1.word.indexOf("_");
  const dispOpts = [d1.ans, d1.wrong];
  t.push(visualT("🖼️", "Визуальное", "badge-visual",
    letterChoiceSVG(d1.word.replace("_", "?"), midx1, dispOpts),
    `Какая буква на месте «?»`, d1.ans,
    shuffle([d1.ans, d1.wrong, d1.wrong === "ы" ? "я" : "ы"]),
    d1.hint));

  const d2 = sel[2];
  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${d2.word}» — какая буква?`, d2.ans, ["и", "а", "у", "ы", "я", "ю"], 3, d2.hint));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "ж_раф", right: "и", answer: "и" },
    { left: "ч_до", right: "у", answer: "у" },
    { left: "щ_вель", right: "а", answer: "а" }
  ], "ЖИ-ШИ с И, ЧА-ЩА с А, ЧУ-ЩУ с У"));

  const d4 = sel[4];
  t.push(inputT("✏️", "Ввод", "badge-input", `Впиши букву: «${d4.word}»`, d4.ans, d4.hint));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«ж_раф» — почему И, а не Ы?",
    "ЖИ пиши с И",
    ["Потому что Ы", "ЖИ пиши с Ы", "Нет правила"],
    2,
    "Правило: ЖИ-ШИ пиши с буквой И!"));

  const d6 = sel[6];
  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши: «${d6.word}» и «${sel[7].word}» (две буквы через запятую)`,
    `${d6.ans},${sel[7].ans}`,
    `${d6.hint}; ${sel[7].hint}`));

  t.push({
    type: "boss_zhishi", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь буквы во все слова:",
    correctAns: "",
    words: [
      { text: "ж_раф", answer: "и" },
      { text: "ч_до", answer: "у" },
      { text: "щ_ка", answer: "у" }
    ],
    explanation: "ЖИ, ЧУ, ЩУ"
  });

  return t;
}

export function generateSoftLesson(): Task[] {
  const t: T[] = [];
  const fullDict = [
    { word: "в_юга", ans: "ь", hint: "Ь — разделительный в корне", wrong: "ъ" },
    { word: "под_езд", ans: "ъ", hint: "Ъ — после приставки на согласный", wrong: "ь" },
    { word: "сем_я", ans: "ь", hint: "Ь в корне", wrong: "ъ" },
    { word: "об_ём", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "руч_и", ans: "ь", hint: "Ь в корне", wrong: "ъ" },
    { word: "с_ехал", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" },
    { word: "вороб_и", ans: "ь", hint: "Ь в корне", wrong: "ъ" },
    { word: "об_явление", ans: "ъ", hint: "Ъ после приставки", wrong: "ь" }
  ];
  const sel = shuffle(fullDict).slice(0, 8);

  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — Ь или Ъ?`, sel[0].ans, ["ь", "ъ"], 1, sel[0].hint));

  const correctAns = "вьюга — Ь, подъезд — Ъ";
  t.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG("в_юга", "под_езд", "Где Ь, а где Ъ?"),
    "Где Ь, а где Ъ?", correctAns,
    ["вьюга — Ь, подъезд — Ъ", "вьюга — Ъ, подъезд — Ь", "оба с Ь", "оба с Ъ"],
    "Ь в корне, Ъ после приставки"));

  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — какая буква?`, sel[2].ans, ["ь", "ъ"], 1, sel[2].hint));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с нужным знаком:", [
    { left: "в_юга (корень)", right: "Ь", answer: "Ь" },
    { left: "под_езд (приставка)", right: "Ъ", answer: "Ъ" },
    { left: "сем_я (корень)", right: "Ь", answer: "Ь" }
  ], "Ь в корне, Ъ после приставки"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши (ь/ъ): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«об_ём» — почему Ъ, а не Ь?",
    "После приставки ОБ-",
    ["После приставки ОБ-", "В корне", "Перед гласной Ё", "Это словарное слово"],
    2,
    "Ъ пишется после приставки на согласный перед Е, Ё, Ю, Я"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Вставь знаки: «под_езд» и «руч_и» (два знака через запятую)`,
    "ъ,ь",
    "подЪезд (приставка), ручЬи (корень)"));

  t.push({
    type: "boss_soft", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь Ь или Ъ:",
    correctAns: "",
    words: [
      { text: "в_юга", answer: "ь" },
      { text: "под_езд", answer: "ъ" },
      { text: "об_явление", answer: "ъ" }
    ],
    explanation: "Ь в корне, Ъ после приставок"
  });

  return t;
}

export function generateVowelLesson(): Task[] {
  const t: T[] = [];
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
    { word: "в_сна", ans: "е", check: "вёсны", wrong: "и" }
  ];
  const sel = shuffle(fullDict).slice(0, 8);

  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — какая буква? Проверка: «${sel[0].check}»`,
    sel[0].ans, [sel[0].wrong, "о", "а"].filter((x, i, a) => a.indexOf(x) === i), 2,
    sel[0].check));

  {
    const opts = shuffle([sel[1].ans, sel[1].wrong, sel[1].wrong === "и" ? "е" : "и"]);
    t.push(visualT("🖼️", "Визуальное", "badge-visual",
      compareSVG(sel[1].word, sel[1].check, "Какая буква пропущена?"),
      "Какая буква пропущена?", sel[1].ans, opts,
      `Проверочное слово: ${sel[1].check}`));
  }

  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — проверка «${sel[2].check}». Буква?`,
    sel[2].ans, ["е", "и", "о", "а"], 2, sel[2].check));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "л_сной", right: "е (лес)", answer: "е" },
    { left: "в_да", right: "о (воды)", answer: "о" },
    { left: "тр_ва", right: "а (травка)", answer: "а" }
  ], "Проверяем ударением"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши букву: «${sel[4].word}» (проверка: ${sel[4].check})`,
    sel[4].ans, `${sel[4].check} → ${sel[4].ans}`));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«к_тёнок» — проверка «кот», пишем О. А если проверки нет?",
    "Смотрим в словарь",
    ["Смотрим в словарь", "Пишем А", "Пишем любую", "Пишем О всегда"],
    2,
    "Словарные слова надо запоминать!"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши: «${sel[6].word}» и «${sel[7].word}» (две буквы)`,
    `${sel[6].ans},${sel[7].ans}`,
    `${sel[6].check} → ${sel[6].ans}; ${sel[7].check} → ${sel[7].ans}`));

  t.push({
    type: "boss_vowel", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь буквы (проверь ударением):",
    correctAns: "",
    words: [
      { text: "л_сной", answer: "е" },
      { text: "в_да", answer: "о" },
      { text: "з_мля", answer: "е" }
    ],
    explanation: "лЕс, вОды, зЕмли"
  });

  return t;
}

export function generateSilentLesson(): Task[] {
  const t: T[] = [];
  const fullDict = [
    { word: "чес_ный", ans: "т", check: "честь" },
    { word: "грус_ный", ans: "т", check: "грусть" },
    { word: "радос_ный", ans: "т", check: "радость" },
    { word: "звёз_ный", ans: "д", check: "звезда" },
    { word: "праз_ник", ans: "д", check: "празден (словарное)" },
    { word: "чу_ство", ans: "в", check: "чуВствую" },
    { word: "лес_ница", ans: "т", check: "лестница (словарное)" },
    { word: "со_нце", ans: "л", check: "солнышко" }
  ];
  const sel = shuffle(fullDict).slice(0, 8);

  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — есть буква? Проверка: «${sel[0].check}»`,
    sel[0].ans, ["т", "д", "л", "в"], 2,
    `Слышится? Нет. Пишется? Да — ${sel[0].ans}!`));

  t.push(visualT("🖼️", "Визуальное", "badge-visual",
    compareSVG(sel[1].word, sel[1].check, "Какая буква спряталась?"),
    "Какая буква спряталась?", sel[1].ans, ["т", "д", "л", "в"],
    `Проверка: ${sel[1].check} → ${sel[1].ans}`));

  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — какая буква?`, sel[2].ans,
    ["т", "д", "в", "л"], 2, sel[2].check));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с буквой:", [
    { left: "чес_ный", right: "т (честь)", answer: "т" },
    { left: "со_нце", right: "л (солнышко)", answer: "л" },
    { left: "звёз_ный", right: "д (звезда)", answer: "д" }
  ], "Проверяем родственным словом"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши пропущенную букву: «${sel[4].word}»`, sel[4].ans,
    `${sel[4].check} → ${sel[4].ans}`));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«чу_ство» — есть ли буква В?",
    "Да — В (чуВствую)",
    ["Да — В (чуВствую)", "Нет, не пишется", "Пишется Д", "Это Л"],
    2,
    "Хотя не слышится, пишем В! Проверка: чувствовать"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши буквы: «${sel[6].word}» и «${sel[7].word}»`,
    `${sel[6].ans},${sel[7].ans}`,
    `${sel[6].check} → ${sel[6].ans}; ${sel[7].check} → ${sel[7].ans}`));

  t.push({
    type: "boss_silent", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь буквы:",
    correctAns: "",
    words: [
      { text: "чес_ный", answer: "т" },
      { text: "со_нце", answer: "л" },
      { text: "праз_ник", answer: "д" }
    ],
    explanation: "чесТь, соЛнышко, празДник"
  });

  return t;
}

export function generateTsyaLesson(): Task[] {
  const t: T[] = [];
  const dict = [
    { phrase: "Он учит_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Надо учит_ся", ans: "ться", hint: "Что делать?" },
    { phrase: "Мне нравит_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Это может случит_ся", ans: "ться", hint: "Что сделать?" },
    { phrase: "Солнце садит_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Пора просыпат_ся", ans: "ться", hint: "Что делать?" },
    { phrase: "Он смеёт_ся", ans: "тся", hint: "Что делает?" },
    { phrase: "Не надо боят_ся", ans: "ться", hint: "Что делать?" }
  ];
  const sel = shuffle(dict).slice(0, 8);

  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].phrase}» — ТСЯ или ТЬСЯ?`,
    sel[0].ans, ["тся", "ться"], 1, sel[0].hint));

  {
    const correctAns = "Он учится — ТСЯ, Надо учиться — ТЬСЯ";
    const opts = ["Он учится — ТСЯ, Надо учиться — ТЬСЯ", "оба с ТЬСЯ", "оба с ТСЯ", "Надо учится — ТСЯ"];
    t.push(visualT("🖼️", "Визуальное", "badge-visual",
      compareSVG("Он учит_ся", "Надо учит_ся", "Где ТСЯ, а где ТЬСЯ?"),
      "Где ТСЯ, а где ТЬСЯ?", correctAns, opts,
      "Что делает? → ТСЯ. Что делать? → ТЬСЯ"));
  }

  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].phrase}» — ?`, sel[2].ans, ["тся", "ться"], 1, sel[2].hint));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини фразу с окончанием:", [
    { left: "Он смеёт_ся", right: "тся", answer: "тся" },
    { left: "Надо учит_ся", right: "ться", answer: "ться" },
    { left: "Солнце садит_ся", right: "тся", answer: "тся" }
  ], "Задай вопрос к глаголу!"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши: «${sel[4].phrase}» (тся/ться)`, sel[4].ans,
    sel[4].hint));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«Мне нравит_ся этот кот» — почему ТСЯ без Ь?",
    "Что делает? — без Ь",
    ["Что делает? — без Ь", "Что делать? — с Ь", "Всегда с Ь", "Это исключение"],
    2,
    "Вопрос «Что делает?» → нет Ь → ТСЯ!"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `«${sel[6].phrase}» и «${sel[7].phrase}» (два ответа через запятую)`,
    `${sel[6].ans},${sel[7].ans}`,
    `${sel[6].hint}; ${sel[7].hint}`));

  t.push({
    type: "boss_tsya", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь ТСЯ или ТЬСЯ:",
    correctAns: "",
    words: [
      { text: "не ошиба_", answer: "ться" },
      { text: "труди_", answer: "ться" },
      { text: "он старае_", answer: "тся" }
    ],
    explanation: "Что делать? → ТЬСЯ. Что делает? → ТСЯ"
  });

  return t;
}

export function generatePrepriLesson(): Task[] {
  const t: T[] = [];
  const dict = [
    { word: "пр_бывать", ans: "и", hint: "приближаться" },
    { word: "пр_мудрый", ans: "е", hint: "очень (= пере-)" },
    { word: "пр_шить", ans: "и", hint: "присоединить" },
    { word: "пр_красный", ans: "е", hint: "очень красивый" },
    { word: "пр_вокзальный", ans: "и", hint: "рядом с вокзалом" },
    { word: "пр_градить", ans: "е", hint: "перегородить" },
    { word: "пр_открыть", ans: "и", hint: "не полностью" },
    { word: "пр_увеличить", ans: "е", hint: "очень увеличить" }
  ];
  const sel = shuffle(dict).slice(0, 8);

  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — ПРЕ или ПРИ?`,
    sel[0].ans === "е" ? "ПРЕ" : "ПРИ",
    ["ПРЕ", "ПРИ"], 1, sel[0].hint));

  {
    const correctAns = "прИбывать — ПРИ, прЕмудрый — ПРЕ";
    const opts = ["прИбывать — ПРИ, прЕмудрый — ПРЕ", "оба с ПРЕ", "оба с ПРИ", "прЕбывать — ПРЕ"];
    t.push(visualT("🖼️", "Визуальное", "badge-visual",
      compareSVG("пр_бывать", "пр_мудрый", "Где ПРИ, а где ПРЕ?"),
      "Где ПРИ, а где ПРЕ?", correctAns, opts,
      "ПРИ = приближение, ПРЕ = очень"));
  }

  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — ?`, sel[2].ans === "е" ? "ПРЕ" : "ПРИ",
    ["ПРЕ", "ПРИ"], 1, sel[2].hint));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с приставкой:", [
    { left: "пр_бывать (приближение)", right: "ПРИ", answer: "ПРИ" },
    { left: "пр_мудрый (очень)", right: "ПРЕ", answer: "ПРЕ" },
    { left: "пр_открыть (не полностью)", right: "ПРИ", answer: "ПРИ" }
  ], "ПРИ — приближение/неполнота, ПРЕ — очень/пере"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши (и/е): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«пр_дать друга» — ПРЕ или ПРИ?",
    "ПРЕ (передать)",
    ["ПРЕ (передать)", "ПРИ (приблизить)", "ПРИ (присоединить)", "ПРЕ (очень)"],
    2,
    "ПРЕдать = пере-дать! Не путай с «придать значение»"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши две буквы: «${sel[6].word}» и «${sel[7].word}»`,
    `${sel[6].ans},${sel[7].ans}`,
    `${sel[6].hint}; ${sel[7].hint}`));

  t.push({
    type: "boss_prepri", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь ПРЕ или ПРИ:",
    correctAns: "",
    words: [
      { text: "Пр_мудрый", answer: "е" },
      { text: "пр_был", answer: "и" },
      { text: "пр_вокзальный", answer: "и" }
    ],
    explanation: "ПРЕ, ПРИ, ПРИ"
  });

  return t;
}

export function generateNNLesson(): Task[] {
  const t: T[] = [];
  const dict = [
    { word: "кури_ый", ans: "н", hint: "Суффикс -ИН- → одна Н", wrong: "нн" },
    { word: "соломе_ый", ans: "нн", hint: "Суффикс -ЕНН- → НН", wrong: "н" },
    { word: "стекля_ый", ans: "нн", hint: "Исключение! Стеклянный, оловянный, деревянный", wrong: "н" },
    { word: "ветре_ый", ans: "н", hint: "Исключение! Ветреный — одна Н", wrong: "нн" },
    { word: "пусты_ый", ans: "нн", hint: "Стык корня и суффикса: пустыН-Н-ый", wrong: "н" },
    { word: "кожа_ый", ans: "н", hint: "Суффикс -АН- → одна Н", wrong: "нн" },
    { word: "обеде_ый", ans: "нн", hint: "Суффикс -ЕНН- → НН", wrong: "н" },
    { word: "глиня_ый", ans: "н", hint: "Суффикс -ЯН- → одна Н", wrong: "нн" }
  ];
  const sel = shuffle(dict).slice(0, 8);

  t.push(choiceStrT("🔥", "Разминка", "badge-warmup",
    `«${sel[0].word}» — Н или НН?`,
    sel[0].ans === "н" ? "Н" : "НН",
    ["Н", "НН"], 1, sel[0].hint));

  {
    const correctAns = "курИ-Н-ый → Н, солом-ЕНН-ый → НН";
    const opts = ["курИ-Н-ый → Н, солом-ЕНН-ый → НН", "оба с НН", "оба с Н", "курИ-НН-ый → НН"];
    t.push(visualT("🖼️", "Визуальное", "badge-visual",
      compareSVG("кури_ый", "соломе_ый", "Где Н, а где НН?"),
      "Где Н, а где НН?", correctAns, opts,
      "-ИН- → Н, -ЕНН- → НН"));
  }

  t.push(choiceStrT("🎯", "Выбор", "badge-choice",
    `«${sel[2].word}» — ?`, sel[2].ans === "н" ? "Н" : "НН",
    ["Н", "НН"], 1, sel[2].hint));

  t.push(pairT("🔗", "Парное", "badge-pair", "Соедини слово с количеством Н:", [
    { left: "кури_ый (-ИН-)", right: "Н", answer: "Н" },
    { left: "соломе_ый (-ЕНН-)", right: "НН", answer: "НН" },
    { left: "стекля_ый (искл.)", right: "НН", answer: "НН" }
  ], "-АН/-ЯН/-ИН → Н, -ЕНН/-ОНН → НН"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши (н/нн): «${sel[4].word}»`, sel[4].ans, sel[4].hint));

  t.push(choiceStrT("⚠️", "Ловушка", "badge-trap",
    "«ветре_ый» — почему одна Н?",
    "Это исключение",
    ["Это исключение", "Суффикс -ЕН-", "Суффикс -ИН-", "Краткая форма"],
    2,
    "Ветреный — исключение, одна Н. Но: безветреННый!"));

  t.push(inputT("✏️", "Ввод", "badge-input",
    `Впиши: «${sel[6].word}» и «${sel[7].word}» (через запятую)`,
    `${sel[6].ans},${sel[7].ans}`,
    `${sel[6].hint}; ${sel[7].hint}`));

  t.push({
    type: "boss_nn", emoji: "⭐", badge: "Босс", badgeClass: "badge-boss",
    question: "Вставь Н или НН:",
    correctAns: "",
    words: [
      { text: "стекля_ый", answer: "нн" },
      { text: "кожа_ый", answer: "н" },
      { text: "деревя_ый", answer: "нн" }
    ],
    explanation: "стекляННый (искл), кожаНый (-АН-), деревяННый (искл)"
  });

  return t;
}

export function generateRusLesson(skillId: string): Task[] {
  const gens: Record<string, () => Task[]> = {
    zhishi: generateZhishiLesson,
    soft: generateSoftLesson,
    vowel: generateVowelLesson,
    silent: generateSilentLesson,
    tsya: generateTsyaLesson,
    prepri: generatePrepriLesson,
    nn: generateNNLesson
  };
  const gen = gens[skillId];
  return gen ? gen() : generateZhishiLesson();
}
