import type { AIStructuredTask } from "./ai-schema";
import type { FGOSTopic } from "../fgos/fgos-tree";
import type { DifficultyMode } from "../fgos/adaptive";
import { fetchTaskFromAI } from "./openrouter";

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeWrongs(correct: number, count: number = 3): number[] {
  const wrongs = new Set<number>();
  let attempts = 0;
  while (wrongs.size < count && attempts < 50) {
    attempts++;
    const delta = correct <= 10 ? rnd(-3, 3) : rnd(-Math.floor(correct * 0.3), Math.floor(correct * 0.3));
    const c = correct + delta;
    if (c !== correct && c >= 0 && !wrongs.has(c)) wrongs.add(c);
  }
  while (wrongs.size < count) wrongs.add(correct + wrongs.size + 1);
  return [...wrongs];
}

// ── Dynamic math generators ──

function genAdd(difficulty: number): AIStructuredTask {
  const a = difficulty <= 1 ? rnd(10, 30) : rnd(50, 200);
  const b = difficulty <= 1 ? rnd(1, 19) : rnd(20, 100);
  const correct = a + b;
  const opts = [correct, ...makeWrongs(correct)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  const narratives = [
    "Мур! Я кот-учёный и обожаю считать! Давай вместе решим пример? 🐱",
    "Мур-мур! Сложение — это весело! Готов? ✨",
    "Мяу! Давай посчитаем вместе! Справишься? 💪",
  ];

  return {
    catNarrative: pick(narratives),
    question: `Сколько будет ${a} + ${b}?`,
    options: shuffled.map(String) as [string, string, string, string],
    correctIndex: idx,
    catHint: `Сложи десятки и единицы! ${a} + ${b} = ? Попробуй по шагам.`,
    explanation: `${a} + ${b} = ${correct}. Правильно!`,
    difficulty,
    tags: ["сложение", "математика"],
  };
}

function genSub(difficulty: number): AIStructuredTask {
  const a = difficulty <= 1 ? rnd(20, 60) : rnd(50, 200);
  const b = difficulty <= 1 ? rnd(1, 18) : rnd(10, a - 1);
  const correct = a - b;
  const opts = [correct, ...makeWrongs(correct)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Вычитание — как отдать часть конфет другу! 🍬", "Мяу! Давай вычитать! У тебя получится! ⭐"]),
    question: `Сколько будет ${a} − ${b}?`,
    options: shuffled.map(String) as [string, string, string, string],
    correctIndex: idx,
    catHint: `${a} − ${b} = ${a} − 10 − ${Math.max(0, b - 10)}. Считай по шагам!`,
    explanation: `${a} − ${b} = ${correct}. Молодец!`,
    difficulty,
    tags: ["вычитание", "математика"],
  };
}

function genMul(difficulty: number): AIStructuredTask {
  const a = difficulty <= 1 ? rnd(2, 9) : rnd(2, 12);
  const b = difficulty <= 1 ? rnd(2, 5) : rnd(2, 10);
  const correct = a * b;
  const opts = [correct, ...makeWrongs(correct)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур-мур! Умножение — это супер-способность! ⚡", "Мяу! Давай умножать! Как в таблице! 🔢"]),
    question: `Сколько будет ${a} × ${b}?`,
    options: shuffled.map(String) as [string, string, string, string],
    correctIndex: idx,
    catHint: `Вспомни таблицу умножения! ${a} × ${b} = ?`,
    explanation: `${a} × ${b} = ${correct}. Отлично!`,
    difficulty,
    tags: ["умножение", "математика"],
  };
}

function genDiv(difficulty: number): AIStructuredTask {
  const b = difficulty <= 1 ? rnd(2, 5) : rnd(2, 9);
  const q = difficulty <= 1 ? rnd(2, 8) : rnd(3, 12);
  const a = b * q;
  const correct = q;
  const opts = [correct, ...makeWrongs(correct)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Деление — это когда мы делимся поровну! 🍕", "Мяу! Раздели конфеты между друзьями! 🍬"]),
    question: `Сколько будет ${a} ÷ ${b}?`,
    options: shuffled.map(String) as [string, string, string, string],
    correctIndex: idx,
    catHint: `${a} ÷ ${b} = ? Проверь: ${b} × ? = ${a}.`,
    explanation: `${a} ÷ ${b} = ${correct}. Проверка: ${b} × ${correct} = ${a}. Верно!`,
    difficulty,
    tags: ["деление", "математика"],
  };
}

function genEq(difficulty: number): AIStructuredTask {
  const op = pick(["+", "−"]);
  const x = difficulty <= 1 ? rnd(5, 30) : rnd(20, 100);
  const b = difficulty <= 1 ? rnd(5, 30) : rnd(10, 50);
  const correct = x;
  let question: string;
  if (op === "+") {
    const result = x + b;
    question = `Реши уравнение: x + ${b} = ${result}. Чему равен x?`;
  } else {
    const result = x - b;
    question = `Реши уравнение: x − ${b} = ${result}. Чему равен x?`;
  }
  const opts = [correct, ...makeWrongs(correct)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Уравнения — как детектив! Найди неизвестное! 🔍", "Мур-мур! Кот-детектив ищет x! Поможешь? 🕵️"]),
    question,
    options: shuffled.map(String) as [string, string, string, string],
    correctIndex: idx,
    catHint: `Перенеси число через знак равенства с противоположным знаком!`,
    explanation: `x = ${correct}. Проверь подстановкой!`,
    difficulty,
    tags: ["уравнения", "математика"],
  };
}

function genGeom(difficulty: number): AIStructuredTask {
  const a = difficulty <= 1 ? rnd(3, 15) : rnd(8, 30);
  const b = difficulty <= 1 ? rnd(2, 10) : rnd(5, 20);
  const isPerim = Math.random() > 0.5;
  const correct = isPerim ? 2 * (a + b) : a * b;
  const question = isPerim
    ? `Длина прямоугольника ${a} см, ширина ${b} см. Найди периметр.`
    : `Длина прямоугольника ${a} см, ширина ${b} см. Найди площадь.`;

  const opts = [correct, ...makeWrongs(correct)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Геометрия вокруг нас! 📏", "Мяу! Измерим фигуру! 🏠"]),
    question,
    options: shuffled.map(String) as [string, string, string, string],
    correctIndex: idx,
    catHint: isPerim ? `Периметр = (длина + ширина) × 2. (${a} + ${b}) × 2 = ?` : `Площадь = длина × ширина. ${a} × ${b} = ?`,
    explanation: isPerim ? `Периметр = (${a} + ${b}) × 2 = ${correct} см.` : `Площадь = ${a} × ${b} = ${correct} см².`,
    difficulty,
    tags: ["геометрия", "математика"],
  };
}

function genFrac(difficulty: number): AIStructuredTask {
  const denom = difficulty <= 1 ? rnd(2, 5) : rnd(3, 8);
  const num1 = rnd(1, denom - 1);
  const num2 = rnd(1, denom - 1);
  const sum = num1 + num2;
  const correctStr = `${sum}/${denom}`;
  const distractors = [
    `${sum}/${denom * 2}`,
    `${num1 + num2}/${denom - 1 || denom}`,
    `${num1}/${denom}${num2}`,
  ];

  const opts = [correctStr, ...distractors];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correctStr) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Дроби — как кусочки пиццы! 🍕", "Мур-мур! Сложим дроби вместе! 🧮"]),
    question: `Сложи дроби: ${num1}/${denom} + ${num2}/${denom} = ?`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: `Знаменатели одинаковые, складываем только числители: ${num1} + ${num2} = ${sum}.`,
    explanation: `${num1}/${denom} + ${num2}/${denom} = ${correctStr}. Отлично!`,
    difficulty,
    tags: ["дроби", "математика"],
  };
}

const MATH_GENS: Record<string, (d: number) => AIStructuredTask> = {
  add: genAdd, sub: genSub, mul: genMul, div: genDiv,
  eq: genEq, geom: genGeom, frac: genFrac,
};

// ── Dynamic Russian generators ──

const ZHISHI_WORDS = [
  ["ж...раф", "жираф", "жыраф", "жэраф", "жерaф"],
  ["ш...на", "шина", "шына", "шэна", "шенa"],
  ["ч...до", "чудо", "чюдо", "чoдо", "чёдо"],
  ["щ...ка", "щука", "щюка", "щoка", "щeка"],
  ["ч...ща", "чаща", "чяща", "чaщa", "чэща"],
  ["маш...на", "машина", "машына", "машэна", "машена"],
  ["ж...знь", "жизнь", "жызнь", "жэзнь", "жезнь"],
];

function genZhiShi(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(ZHISHI_WORDS);
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Русский язык — это волшебство! ✨", "Мяу! Вспомним правила орфографии! 📝"]),
    question: `Выбери правильное написание: ${blank}`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: "ЖИ-ШИ пиши с буквой И! ЧА-ЩА — с А! ЧУ-ЩУ — с У!",
    explanation: `Правильно: ${correct}. ЖИ-ШИ с И, ЧА-ЩА с А, ЧУ-ЩУ с У.`,
    difficulty,
    tags: ["русский язык", "жи-ши", "орфография"],
  };
}

const SOFT_WORDS = [
  ["кон...ки", "коньки", "конки", "конъки", "конкьи"],
  ["пис...мо", "письмо", "писмо", "писъмо", "писмьо"],
  ["ден...ки", "деньки", "денки", "денъки", "денкьи"],
  ["в...юга", "вьюга", "въюга", "вюга", "вьйуга"],
  ["сем...я", "семья", "семъя", "семя", "семйа"],
];

function genSoft(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(SOFT_WORDS);
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Мягкий знак — хитрый! Он звука не даёт, но слово меняет! 🐾", "Мяу! Разделительный Ь — он разделяет звуки! 🧩"]),
    question: `Где нужен Ь: «${blank}»?`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: "Ь для мягкости — внутри слова. Разделительный Ь — перед Е,Ё,Ю,Я.",
    explanation: `Правильно: ${correct}. Молодец!`,
    difficulty,
    tags: ["русский язык", "мягкий знак", "орфография"],
  };
}

const VOWEL_PAIRS = [
  ["тр...ва", "трава", "трова", "трува", "трева", "трáвы"],
  ["л...сной", "лесной", "лисной", "лосной", "лусной", "лес"],
  ["з...мля", "земля", "зимля", "зомля", "зумля", "зéмли"],
  ["в...да", "вода", "вада", "вуда", "веда", "вóды"],
  ["ст...на", "стена", "стина", "стона", "стуна", "стéны"],
];

function genVowel(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(VOWEL_PAIRS);
  const checkWord = wrongs.pop()!;
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Безударная гласная — как шпион! Надо найти проверочное слово! 🔍", "Мур-мур! Проверим безударную гласную! 🕵️"]),
    question: `Вставь букву: «${blank}» (проверка: ${checkWord})`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: `Под ударением в слове «${checkWord}» слышим гласную. Пишем её же в безударной позиции.`,
    explanation: `Правильно: ${correct}. Проверочное слово — «${checkWord}».`,
    difficulty,
    tags: ["русский язык", "безударные гласные", "орфография"],
  };
}

const SILENT_WORDS = [
  ["сер...це", "сердце", "серце", "сертце", "сердцэ", "сердечный"],
  ["сол...це", "солнце", "сонце", "солнцэ", "солнтсе", "солнечный"],
  ["чес...ный", "честный", "чесный", "честныйй", "честной", "честь"],
  ["грус...ный", "грустный", "грусный", "грустныйй", "грусной", "грусть"],
];

function genSilent(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(SILENT_WORDS);
  const checkWord = wrongs.pop()!;
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Непроизносимые согласные — их не слышно, но они есть! 👻", "Мяу! Найди скрытую букву! 🎯"]),
    question: `Выбери верный вариант: ${blank} (проверка: ${checkWord})`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: `Проверь словом «${checkWord}» — слышишь согласную? Значит, она пишется!`,
    explanation: `Правильно: ${correct}. Проверочное слово — «${checkWord}».`,
    difficulty,
    tags: ["русский язык", "непроизносимые согласные", "орфография"],
  };
}

const TSYA_PAIRS = [
  ["учит...ся", "учиться", "учится", "учитца", "учитъся", "Что делать?"],
  ["умывает...ся", "умывается", "умываться", "умываеться", "умываится", "Что делает?"],
  ["смеят...ся", "смеяться", "смеятся", "смеятца", "смеятъся", "Что делать?"],
  ["радует...ся", "радуется", "радоваться", "радуеться", "радуится", "Что делает?"],
];

function genTsya(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(TSYA_PAIRS);
  const questionLabel = wrongs.pop()!;
  const hasSoft = correct.includes("ь");
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! -ТСЯ или -ТЬСЯ? Вот в чём вопрос! 🤔", "Мур-мур! Проверим мягкий знак в глаголах! 🧐"]),
    question: `Выбери верное написание: ${blank} (${questionLabel})`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: hasSoft ? "В вопросе есть Ь (делатЬ?) — значит в глаголе тоже Ь!" : "В вопросе нет Ь (делает?) — значит в глаголе без Ь!",
    explanation: `${questionLabel} → ${correct}. Правило: вопрос с Ь → глагол с Ь, вопрос без Ь → глагол без Ь.`,
    difficulty,
    tags: ["русский язык", "-тся/-ться", "глаголы"],
  };
}

const PREPRI_WORDS = [
  ["пр...ехать", "приехать", "преехать", "приехоть", "преехоть", "приближение"],
  ["пр...мудрый", "премудрый", "примудрый", "премдрый", "прьмудрый", "очень мудрый"],
  ["пр...шить", "пришить", "прешить", "пришъть", "прешъть", "присоединение"],
  ["пр...красный", "прекрасный", "прикрасный", "прекрастный", "прикрастный", "очень красивый"],
];

function genPrePri(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(PREPRI_WORDS);
  const meaning = wrongs.pop()!;
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! ПРЕ- или ПРИ-? Это серьёзное расследование! 🔎", "Мяу! Премудрый кот спрашивает: ПРЕ- или ПРИ-? 🦉"]),
    question: `Выбери приставку: ${blank} (значение: ${meaning})`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: correct.startsWith("пре") ? "ПРЕ- = «очень» или «пере-»!" : "ПРИ- = приближение, присоединение, близость!",
    explanation: `Правильно: ${correct}. ${correct.startsWith("пре") ? "ПРЕ- в значении «очень» / «пере-»" : "ПРИ- в значении приближения / присоединения"}.`,
    difficulty,
    tags: ["русский язык", "пре/при", "приставки"],
  };
}

const NN_WORDS = [
  ["стекля...ый", "стеклянный", "стекляный", "стекляной", "стеклянний", "исключение"],
  ["кожа...ый", "кожаный", "кожанный", "кожаной", "кожанний", "НЕ исключение"],
  ["деревя...ый", "деревянный", "деревяный", "деревяной", "деревянний", "исключение"],
  ["серебря...ый", "серебряный", "серебрянный", "серебряной", "серебрянний", "НЕ исключение"],
];

function genNN(difficulty: number): AIStructuredTask {
  const [blank, correct, ...wrongs] = pick(NN_WORDS);
  const note = wrongs.pop()!;
  const opts = [correct, ...wrongs.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Н или НН? Одна из самых коварных тем! 💪", "Мур-мур! Проверим суффиксы! 👀"]),
    question: `Сколько Н: «${blank}»? (${note})`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: note === "исключение" ? "Это исключение! Стеклянный, оловянный, деревянный — с НН!" : "Суффикс -АН-/-ЯН- (не исключение) → одна Н.",
    explanation: `Правильно: ${correct}. ${note === "исключение" ? "Слово-исключение, пишется с НН." : "Одна Н, это не исключение."}`,
    difficulty,
    tags: ["русский язык", "н/нн", "прилагательные"],
  };
}

const RUSSIAN_GENS: Record<string, (d: number) => AIStructuredTask> = {
  zhishi: genZhiShi, soft: genSoft, vowel: genVowel,
  silent: genSilent, tsya: genTsya, prepri: genPrePri, nn: genNN,
};

// ── Unified generation ──

function generateOneLocalTask(topic: FGOSTopic, difficulty: number): AIStructuredTask {
  const gens = topic.subject === "math" ? MATH_GENS : RUSSIAN_GENS;
  const gen = gens[topic.generatorId];
  if (gen) return gen(difficulty);

  return {
    catNarrative: "Мур! Я Кот-учёный! Давай решать! 🐱",
    question: `Задание по теме «${topic.name}»`,
    options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    correctIndex: 0,
    catHint: "Подумай хорошо и выбери правильный ответ!",
    explanation: "Правильный ответ — первый вариант.",
    difficulty,
    tags: [topic.id, topic.name],
  };
}

export async function generateAITask(
  topic: FGOSTopic,
  mode: DifficultyMode = "standard"
): Promise<{ task: AIStructuredTask; source: "ai" | "local" }> {
  const difficulty = mode === "olympiad" ? 3 : mode === "remedial" ? 1 : 2;
  const subjectLabel = topic.subject === "math" ? "Математика" : "Русский язык";

  const aiResult = await fetchTaskFromAI(topic.name, subjectLabel, difficulty);
  if (aiResult) return { task: aiResult, source: "ai" };

  return { task: generateOneLocalTask(topic, difficulty), source: "local" };
}

export function generateAILesson(
  topic: FGOSTopic,
  mode: DifficultyMode = "standard"
): AIStructuredTask[] {
  const difficulty = mode === "olympiad" ? 3 : mode === "remedial" ? 1 : 2;
  return Array.from({ length: 5 }, () => generateOneLocalTask(topic, difficulty));
}
