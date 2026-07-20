import type { AIStructuredTask } from "./ai-schema";
import type { SkillNode } from "../fgos/fgos-tree";
import type { DifficultyLevel } from "../fgos/adaptive";
import { fetchTaskFromDeepSeek } from "./deepseek";
import { fetchTaskFromLlama } from "./local-llama";
import { getSubscriptionStatus } from "../../app/useSubscription";
import { buildCacheKey, addToPool, pickFromPool } from "../cache/GlobalCache";

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
  compare: genAdd, word: genAdd, time: genAdd, units: genAdd, money: genAdd, logic: genAdd,
  speed: genAdd, charts: genAdd,
  column_add: genAdd, column_mul: genMul, column_div: genDiv,
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
  ["ч...й", "чай", "чяй", "чaй", "чэй"],
  ["щ...вель", "щавель", "щявель", "щaвель", "щэвель"],
  ["ж...вот", "живот", "жывот", "жэвот", "жевот"],
  ["ш...ть", "шить", "шытъ", "шэть", "шетъ"],
  ["ч...шка", "чашка", "чяшка", "чaшка", "чэшка"],
  ["пруж...на", "пружина", "пружына", "пружэна", "пружена"],
  ["снеж...нка", "снежинка", "снежынка", "снежэнка", "снеженка"],
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
  ["руч...и", "ручьи", "ручи", "ручъи", "ручий"],
  ["вороб...и", "воробьи", "вороби", "воробъи", "воробий"],
  ["плат...е", "платье", "плате", "платъе", "платей"],
  ["брат...я", "братья", "братя", "братъя", "братий"],
  ["крыл...я", "крылья", "крыля", "крылъя", "крылий"],
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
  ["р...ка", "река", "рика", "рока", "рука", "рéки"],
  ["гр...за", "гроза", "гриза", "гроза", "груза", "грóзы"],
  ["с...ды", "сады", "соды", "суды", "седы", "сад"],
  ["м...ря", "моря", "маря", "муря", "меря", "мóре"],
  ["цв...ты", "цветы", "цвиты", "цвоты", "цвуты", "цвет"],
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
  ["радос...ный", "радостный", "радосный", "радостныйй", "радосной", "радость"],
  ["мес...ный", "местный", "месный", "местныйй", "месной", "место"],
  ["извес...ный", "известный", "извесный", "известныйй", "извесной", "известие"],
  ["чудес...ный", "чудесный", "чудестный", "чудесныйй", "чудесной", "чудеса"],
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
  ["купат...ся", "купаться", "купатся", "купатца", "купатъся", "Что делать?"],
  ["одевает...ся", "одевается", "одеваться", "одеваеться", "одеваится", "Что делает?"],
  ["строит...ся", "строиться", "строится", "строитца", "строитъся", "Что делать?"],
  ["катает...ся", "катается", "кататься", "катаеться", "катаится", "Что делает?"],
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
  ["пр...школьный", "пришкольный", "прешкольный", "пришколный", "прешколный", "близость"],
  ["пр...одолеть", "преодолеть", "приодолеть", "преодолет", "приодолет", "пере-"],
  ["пр...вокзальный", "привокзальный", "превокзальный", "привокзалный", "превокзалный", "близость"],
  ["пр...огромный", "преогромный", "приогромный", "преогромний", "приогромний", "очень"],
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
  ["оловя...ый", "оловянный", "оловяный", "оловяной", "оловянний", "исключение"],
  ["песча...ый", "песчаный", "песчанный", "песчаной", "песчанний", "НЕ исключение"],
  ["глиня...ый", "глиняный", "глинянный", "глиняной", "глинянний", "НЕ исключение"],
  ["тума...ый", "туманный", "туманый", "туманой", "туманний", "основа на Н + Н"],
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

// ── NEW: Части речи ──
const SPEECH_PARTS_WORDS = [
  { word: "кошка",   type: "существительное" },
  { word: "бежит",   type: "глагол" },
  { word: "красный", type: "прилагательное" },
  { word: "школа",   type: "существительное" },
  { word: "читает",  type: "глагол" },
  { word: "большой", type: "прилагательное" },
  { word: "машина",  type: "существительное" },
  { word: "прыгает", type: "глагол" },
  { word: "умный",   type: "прилагательное" },
  { word: "дерево",  type: "существительное" },
  { word: "пишет",   type: "глагол" },
  { word: "весёлый", type: "прилагательное" },
];

function genSpeechParts(difficulty: number): AIStructuredTask {
  const item = pick(SPEECH_PARTS_WORDS);
  const parts = ["существительное", "глагол", "прилагательное", difficulty <= 1 ? "предлог" : "наречие"];
  const correct = item.type;
  const opts = parts.filter(p => p !== correct).slice(0, 3);
  opts.push(correct);
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Разберёмся с частями речи! 📚", "Мяу! Кто есть кто в мире слов? 🔍"]),
    question: `Какая часть речи у слова «${item.word}»?`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: correct === "существительное" ? "Кто? Что? — это существительное!" : correct === "глагол" ? "Что делает? — это глагол!" : "Какой? Какая? — это прилагательное!",
    explanation: `«${item.word}» — ${correct}. ${correct === "существительное" ? "Обозначает предмет." : correct === "глагол" ? "Обозначает действие." : "Обозначает признак."}`,
    difficulty,
    tags: ["русский язык", "части речи"],
  };
}

// ── NEW: Падежи ──
const CASE_WORDS = [
  { sentence: "Кошка пьёт молоко", word: "кошка", case: "И.п.", hint: "Кто? Что?" },
  { sentence: "Нет кошки дома", word: "кошки", case: "Р.п.", hint: "Кого? Чего?" },
  { sentence: "Дал кошке рыбу", word: "кошке", case: "Д.п.", hint: "Кому? Чему?" },
  { sentence: "Вижу кошку", word: "кошку", case: "В.п.", hint: "Кого? Что?" },
  { sentence: "Горжусь кошкой", word: "кошкой", case: "Т.п.", hint: "Кем? Чем?" },
  { sentence: "Думаю о кошке", word: "о кошке", case: "П.п.", hint: "О ком? О чём?" },
];

function genCases(difficulty: number): AIStructuredTask {
  const item = pick(CASE_WORDS);
  const correct = item.case;
  const wrongs = CASE_WORDS.filter(c => c.case !== correct).map(c => c.case).slice(0, 3);
  const opts = [correct, ...wrongs];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Падежи — как пазл! 🧩", "Мур-мур! Определим падеж вместе! 🐱"]),
    question: `«${item.sentence}». В каком падеже слово «${item.word}»?`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: `Задай вопрос: ${item.hint}`,
    explanation: `«${item.word}» стоит в ${correct}. Вопрос: ${item.hint}.`,
    difficulty,
    tags: ["русский язык", "падежи"],
  };
}

// ── NEW: Состав слова ──
const WORD_COMP_DATA = [
  { word: "подводный", root: "вод", question: "корень" },
  { word: "переход", root: "ход", question: "корень" },
  { word: "заморский", root: "мор", question: "корень" },
  { word: "пришкольный", prefix: "при", question: "приставка" },
  { word: "уехать", prefix: "у", question: "приставка" },
  { word: "лесник", suffix: "ник", question: "суффикс" },
  { word: "домик", suffix: "ик", question: "суффикс" },
  { word: "котёнок", suffix: "ёнок", question: "суффикс" },
];

function genWordComp(difficulty: number): AIStructuredTask {
  const item = pick(WORD_COMP_DATA);
  const correct = item.root ?? item.prefix ?? item.suffix ?? "";
  const distractors = item.root ? ["лес", "сад", "гор"] : item.prefix ? ["по", "на", "за"] : ["ок", "ек", "чик"];
  const opts = [correct, ...distractors.slice(0, 3)];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Разберём слово по составу! 🔬", "Мяу! Найди часть слова! 🧩"]),
    question: `В слове «${item.word}» — какой ${item.question}?`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: item.question === "корень" ? "Корень — общая часть родственных слов." : item.question === "приставка" ? "Приставка стоит перед корнем." : "Суффикс стоит после корня.",
    explanation: `В слове «${item.word}» ${item.question} — «${correct}».`,
    difficulty,
    tags: ["русский язык", "состав слова"],
  };
}

// ── NEW: Синонимы / Антонимы ──
const SYN_ANT_WORDS = [
  { word: "большой", answer: "маленький", type: "антоним" },
  { word: "быстрый", answer: "медленный", type: "антоним" },
  { word: "красивый", answer: "прекрасный", type: "синоним" },
  { word: "грустный", answer: "весёлый", type: "антоним" },
  { word: "умный", answer: "мудрый", type: "синоним" },
  { word: "холодный", answer: "горячий", type: "антоним" },
  { word: "смелый", answer: "храбрый", type: "синоним" },
  { word: "добрый", answer: "злой", type: "антоним" },
  { word: "радостный", answer: "счастливый", type: "синоним" },
  { word: "лёгкий", answer: "тяжёлый", type: "антоним" },
];

function genSynAnt(difficulty: number): AIStructuredTask {
  const item = pick(SYN_ANT_WORDS);
  const correct = item.answer;
  const distractors = SYN_ANT_WORDS.filter(w => w.answer !== correct).map(w => w.answer).slice(0, 3);
  const opts = [correct, ...distractors];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;
  const label = item.type === "синоним" ? "синоним" : "антоним";

  return {
    catNarrative: pick(["Мур! Слова-друзья и слова-враги! 🎭", "Мур-мур! Синонимы и антонимы! 🔄"]),
    question: `Найди ${label} к слову «${item.word}»`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: item.type === "синоним" ? "Синоним = близкое по смыслу слово." : "Антоним = противоположное по смыслу слово.",
    explanation: `«${correct}» — ${label} к слову «${item.word}».`,
    difficulty,
    tags: ["русский язык", label === "синоним" ? "синонимы" : "антонимы"],
  };
}

const RUSSIAN_GENS: Record<string, (d: number) => AIStructuredTask> = {
  zhishi: genZhiShi, soft: genSoft, vowel: genVowel,
  silent: genSilent, tsya: genTsya, prepri: genPrePri, nn: genNN,
  speechparts: genSpeechParts, cases: genCases, wordcomp: genWordComp, synonyms: genSynAnt,
  alphabet: genZhiShi, capital: genSpeechParts, consonant: genVowel, hard_sign: genSoft,
  word_parts: genWordComp, punct: genSpeechParts, pronouns: genSpeechParts,
};

// ── Unified generation ──

function generateOneLocalTask(skill: SkillNode, difficulty: number): AIStructuredTask {
  const gens = skill.subject === "math" ? MATH_GENS : RUSSIAN_GENS;
  const gen = gens[skill.generatorId];
  if (gen) return gen(difficulty);

  // Smart fallback for unknown generatorIds — use skill name for context
  const correctAnswer = skill.subject === "math"
    ? String(rnd(1 + difficulty * 5, 20 + difficulty * 10))
    : "правильно";

  const wrongAnswers = skill.subject === "math"
    ? makeWrongs(Number(correctAnswer), 3).map(String)
    : ["неправильно", "не верно", "ошибка"];

  const opts = [correctAnswer, ...wrongAnswers];
  const shuffled = opts.sort(() => Math.random() - 0.5);
  const idx = shuffled.indexOf(correctAnswer) as 0 | 1 | 2 | 3;

  return {
    catNarrative: pick(["Мур! Давай решать! 🐱", "Мур-мур! Интересная тема! 📚", "Мяу! Ты справишься! ⭐"]),
    question: `Задание по теме «${skill.name}»: выбери правильный ответ`,
    options: shuffled as [string, string, string, string],
    correctIndex: idx,
    catHint: `Подумай о теме «${skill.name}» и выбери верный вариант!`,
    explanation: `Правильный ответ: ${correctAnswer}. Тема «${skill.name}» — отлично!`,
    difficulty,
    tags: [skill.id, skill.name],
  };
}

export async function generateAISession(
  skill: SkillNode,
  difficulty: DifficultyLevel,
  count: number = 5,
  signal?: AbortSignal
): Promise<{ tasks: AIStructuredTask[]; source: "ai" | "local" }> {
  const subjectLabel = skill.subject === "math" ? "Математика" : "Русский язык";
  const cacheKey = buildCacheKey(skill.name, subjectLabel, difficulty);

  // 1) Try cache pool first — randomly pick up to `count` unique tasks
  const { tasks: cachedTasks, fromCache } = pickFromPool(cacheKey, count);

  // 2) Generate missing tasks via DeepSeek
  const remaining = count - fromCache;
  const newTasks: AIStructuredTask[] = [];
  let anyAi = fromCache > 0;

  for (let i = 0; i < remaining; i++) {
    let t: AIStructuredTask | null = null;

    if (navigator.onLine && !(signal && signal.aborted)) {
      t = await fetchTaskFromDeepSeek(skill.name, subjectLabel, difficulty, signal);
    }

    if (!t && (navigator.onLine === false || (signal && signal.aborted))) {
      t = await fetchTaskFromLlama(skill.name, subjectLabel, difficulty, signal);
    }

    if (!t) {
      t = generateOneLocalTask(skill, difficulty);
    } else {
      anyAi = true;
    }

    addToPool(cacheKey, t);
    newTasks.push(t);
  }

  // Mix cached + new, shuffle for variety
  const allTasks = [...cachedTasks, ...newTasks];
  return { tasks: allTasks, source: anyAi ? "ai" : "local" };
}

export function generateAILesson(
  skill: SkillNode,
  difficulty: DifficultyLevel
): AIStructuredTask[] {
  return Array.from({ length: 5 }, () => generateOneLocalTask(skill, difficulty));
}
