import type { FGOSGameConfig } from "./FGOSDoodlePhysics";

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MATH_PROMPTS: { prompt: string; gen: () => { correct: string[]; wrong: string[] } }[] = [
  {
    prompt: "Прыгай на чётные числа!",
    gen: () => {
      const correct = Array.from({ length: 6 }, () => String(rnd(1, 10) * 2));
      const wrong = Array.from({ length: 6 }, () => String(rnd(0, 5) * 2 + 1));
      return { correct, wrong };
    },
  },
  {
    prompt: "Прыгай на нечётные числа!",
    gen: () => {
      const wrong = Array.from({ length: 6 }, () => String(rnd(1, 10) * 2));
      const correct = Array.from({ length: 6 }, () => String(rnd(0, 5) * 2 + 1));
      return { correct, wrong };
    },
  },
  {
    prompt: "Прыгай на числа, кратные 5!",
    gen: () => {
      const correct = Array.from({ length: 6 }, () => String(rnd(1, 6) * 5));
      const wrong = Array.from({ length: 6 }, () => {
        let n: number; do { n = rnd(1, 30); } while (n % 5 === 0); return String(n);
      });
      return { correct, wrong };
    },
  },
  {
    prompt: "Прыгай на числа > 20!",
    gen: () => {
      const correct = Array.from({ length: 6 }, () => String(rnd(21, 50)));
      const wrong = Array.from({ length: 6 }, () => String(rnd(1, 19)));
      return { correct, wrong };
    },
  },
  {
    prompt: "Прыгай на числа < 15!",
    gen: () => {
      const correct = Array.from({ length: 6 }, () => String(rnd(1, 14)));
      const wrong = Array.from({ length: 6 }, () => String(rnd(16, 40)));
      return { correct, wrong };
    },
  },
  {
    prompt: "Прыгай на квадраты чисел!",
    gen: () => {
      const squares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
      const correct = Array.from({ length: 6 }, () => String(pick(squares)));
      const wrong = Array.from({ length: 6 }, () => {
        let n; do { n = rnd(2, 50); } while (squares.includes(n)); return String(n);
      });
      return { correct, wrong };
    },
  },
];

const RUSSIAN_PROMPTS: { prompt: string; gen: () => { correct: string[]; wrong: string[] } }[] = [
  {
    prompt: "Прыгай на слова с ЖИ/ШИ!",
    gen: () => ({
      correct: ["ЖИ", "ШИ", "ЖИР", "ШИП", "ЖИЗНЬ", "ШИНА"],
      wrong: ["ЖЫ", "ШЫ", "ЖЫР", "ШЫП", "ЖЫЗНЬ", "ШЫНА"],
    }),
  },
  {
    prompt: "Прыгай на слова с ЧА/ЩА!",
    gen: () => ({
      correct: ["ЧА", "ЩА", "ЧАС", "ЩАВЕЛЬ", "ЧАЩА", "РОЩА"],
      wrong: ["ЧЯ", "ЩЯ", "ЧЯС", "ЩЯВЕЛЬ", "ЧЯЩЯ", "РОЩЯ"],
    }),
  },
  {
    prompt: "Прыгай на слова с ЧУ/ЩУ!",
    gen: () => ({
      correct: ["ЧУ", "ЩУ", "ЧУДО", "ЩУКА", "ЧУЛАН", "ЩУП"],
      wrong: ["ЧЮ", "ЩЮ", "ЧЮДО", "ЩЮКА", "ЧЮЛАН", "ЩЮП"],
    }),
  },
  {
    prompt: "Прыгай на слова с Ь!",
    gen: () => ({
      correct: ["КОНЬ", "ДЕНЬ", "ПЕНЬ", "СОЛЬ", "ЛОСЬ", "РЫСЬ"],
      wrong: ["КОН", "ДЕН", "ПЕН", "СОЛ", "ЛОС", "РЫС"],
    }),
  },
  {
    prompt: "Прыгай на глаголы с -ТЬСЯ!",
    gen: () => ({
      correct: ["УЧИТЬСЯ", "МЫТЬСЯ", "БРИТЬСЯ", "СМЕЯТЬСЯ", "КУПАТЬСЯ", "ОДЕТЬСЯ"],
      wrong: ["УЧИТСЯ", "МЫТСЯ", "БРИТСЯ", "СМЕЯТСЯ", "КУПАТСЯ", "ОДЕТСЯ"],
    }),
  },
  {
    prompt: "Прыгай на глаголы с -ТСЯ!",
    gen: () => ({
      correct: ["УЧИТСЯ", "МОЕТСЯ", "БРЕЕТСЯ", "СМЕЁТСЯ", "КУПАЕТСЯ", "ОДЕВАЕТСЯ"],
      wrong: ["УЧИТЬСЯ", "МЫТЬСЯ", "БРИТЬСЯ", "СМЕЯТЬСЯ", "КУПАТЬСЯ", "ОДЕТЬСЯ"],
    }),
  },
];

export function generateFGOSConfig(subject: "math" | "russian"): FGOSGameConfig {
  const pool = subject === "math" ? MATH_PROMPTS : RUSSIAN_PROMPTS;
  const template = pick(pool);
  const { correct, wrong } = template.gen();
  return {
    prompt: template.prompt,
    correctValues: correct,
    wrongValues: wrong,
  };
}
