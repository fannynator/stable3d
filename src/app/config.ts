import type { Subject, Skill, Achievement, Theme, CatState, ThemeId } from "./types";

export const STORAGE_KEY = "kot_ucheniy_v15";
export const TUTORIAL_KEY = "kot_ucheniy_tutorial_done";
export const ROOM_STORAGE_KEY = "kotik_room";

export const SUBJECTS: Record<string, Subject> = { MATH: "math", RUSSIAN: "russian" };

export const GEMS = {
  CORRECT_ANSWER: 5,
  LESSON_XP_PER_CORRECT: 5,
  LESSON_PERFECT_BONUS: 25,
  BONUS_REPEAT_XP: 3,
  ACHIEVEMENT_REWARD: 15,
  TRAP_BASE_REWARD: 5,
  TRAP_DEFUSE_MULTIPLIER: 3,
  STORY_MATH_REWARD: 40,
  STORY_RUS_REWARD: 50,
};

export const TRAP = { MAX_DEFUSES: 1, DELAY_SLOTS: [1, 3, 7, 14] };
export const SKILL = { PROGRESS_TO_COMPLETE: 100 };

export const DEFAULT_CAT: CatState = {
  mood: "happy",
  hunger: 100,
  energy: 100,
  lastUpdate: Date.now(),
  hat: null,
  ownedHats: ["crown"],
  toys: [],
};

export const ACHIEVEMENTS_DEF: Record<string, Achievement> = {
  detective:  { name: "🕵️ Детектив",   desc: "Пройти 1 историю",        unlocked: false },
  sherlock:   { name: "🔍 Шерлок",      desc: "Пройти 2 истории",        unlocked: false },
  holmes:     { name: "🎩 Холмс",       desc: "Пройти 3 истории",        unlocked: false },
  saper:      { name: "🪤 Сапёр",       desc: "Обезвредить ловушку",     unlocked: false },
  hunter:     { name: "💣 Охотник",     desc: "Обезвредить 3",           unlocked: false },
  murmur:     { name: "🐱 Мур-мур",     desc: "Погладить 10 раз",        unlocked: false },
  erudite:    { name: "📚 Эрудит",      desc: "Переключить предмет 5 раз", unlocked: false },
  firstBlood: { name: "💎 Первая кровь", desc: "Ошибка → ловушки",        unlocked: false },
  student:    { name: "🎓 Ученик",      desc: "Пройти 1 урок",           unlocked: false },
  master:     { name: "🏅 Мастер",      desc: "Урок без ошибок",         unlocked: false },
};

export const MATH_SKILLS: Skill[] = [
  { id: "add",  name: "Сложение",           icon: "➕", color: "#3B82F6", progress: 0, status: "current", gradient: "linear-gradient(135deg,#3B82F6,#2563EB)", shadow: "0 8px 20px rgba(59,130,246,0.4)" },
  { id: "sub",  name: "Вычитание",          icon: "➖", color: "#EF4444", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#EF4444,#DC2626)", shadow: "0 8px 20px rgba(239,68,68,0.4)" },
  { id: "mul",  name: "Умножение",          icon: "✖️", color: "#F59E0B", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#F59E0B,#D97706)", shadow: "0 8px 20px rgba(245,158,11,0.4)" },
  { id: "div",  name: "Деление",            icon: "➗", color: "#8B5CF6", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)", shadow: "0 8px 20px rgba(139,92,246,0.4)" },
  { id: "eq",   name: "Уравнения",          icon: "🔎", color: "#EC4899", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#EC4899,#DB2777)", shadow: "0 8px 20px rgba(236,72,153,0.4)" },
  { id: "geom", name: "Периметр и площадь", icon: "📏", color: "#14B8A6", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#14B8A6,#0D9488)", shadow: "0 8px 20px rgba(20,184,166,0.4)" },
  { id: "frac", name: "Дроби",             icon: "🍕", color: "#F97316", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#F97316,#EA580C)", shadow: "0 8px 20px rgba(249,115,22,0.4)" },
];

export const RUS_SKILLS: Skill[] = [
  { id: "zhishi", name: "ЖИ/ШИ, ЧА/ЩА, ЧУ/ЩУ",  icon: "✍️",  color: "#7C3AED", progress: 0, status: "current", gradient: "linear-gradient(135deg,#7C3AED,#5B21B6)", shadow: "0 8px 20px rgba(124,58,237,0.4)" },
  { id: "soft",   name: "Разделительный Ь и Ъ",   icon: "🧩", color: "#8B5CF6", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)", shadow: "0 8px 20px rgba(139,92,246,0.4)" },
  { id: "vowel",  name: "Безударные гласные",     icon: "🔎", color: "#F59E0B", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#F59E0B,#D97706)", shadow: "0 8px 20px rgba(245,158,11,0.4)" },
  { id: "silent", name: "Непроизносимые согласные",icon: "🗣️", color: "#EC4899", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#EC4899,#DB2777)", shadow: "0 8px 20px rgba(236,72,153,0.4)" },
  { id: "tsya",   name: "-ТСЯ/-ТЬСЯ",             icon: "🔄", color: "#14B8A6", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#14B8A6,#0D9488)", shadow: "0 8px 20px rgba(20,184,166,0.4)" },
  { id: "prepri", name: "ПРЕ/ПРИ",                icon: "🎯", color: "#F97316", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#F97316,#EA580C)", shadow: "0 8px 20px rgba(249,115,22,0.4)" },
  { id: "nn",     name: "Н и НН",                 icon: "📋", color: "#EF4444", progress: 0, status: "locked",  gradient: "linear-gradient(135deg,#EF4444,#DC2626)", shadow: "0 8px 20px rgba(239,68,68,0.4)" },
];

export const CAT_SPEECH = {
  math: "Мур! Математика!",
  russian: "Мур! Русский язык!",
  pet: (count: number) => count >= 10 ? "Мур-мур! 💖" : "Мррр!",
  lessonPerfect: "Мур! Идеально! 🌟",
  lessonDone: "Мур! Ошибки в ловушках 🪤",
  storyDone: "Мур! Дело раскрыто! 🏆",
};

export const SUBJECT_EMOJI: Record<Subject, string> = { math: "🐱", russian: "😺" };

export const DEFAULT_THEME: ThemeId = "light";
export const DEFAULT_UNLOCKED_THEMES: ThemeId[] = ["light", "dark"];

export const THEMES: Record<ThemeId, Theme> = {
  light: {
    id: "light", name: "☀️ Солнечная", catEmoji: "🐱",
    bg: "#F8FAFC", card: "#FFFFFF", text: "#1E293B", textLight: "#94A3B8",
    primary: "#3B82F6", accent: "#F59E0B",
    gradient: "linear-gradient(135deg, #E2E8F0 0%, #F1F5F9 50%, #E8EDF2 100%)",
    bgEffect: "sunlight", unlocked: true,
  },
  dark: {
    id: "dark", name: "🌙 Ночная", catEmoji: "🐱",
    bg: "#0F172A", card: "#1E293B", text: "#F1F5F9", textLight: "#94A3B8",
    primary: "#818CF8", accent: "#FBBF24",
    gradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
    bgEffect: "stars", unlocked: true,
  },
  forest: {
    id: "forest", name: "🌲 Лес", catEmoji: "🦊",
    bg: "#F0FDF4", card: "#FFFFFF", text: "#14532D", textLight: "#65A30D",
    primary: "#16A34A", accent: "#CA8A04",
    gradient: "linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFCCB 100%)",
    bgEffect: "leaves", unlocked: false, unlockAt: 3,
  },
  space: {
    id: "space", name: "🚀 Космос", catEmoji: "👾",
    bg: "#0A0A1A", card: "#1A1A3E", text: "#E2E8F0", textLight: "#818CF8",
    primary: "#A855F7", accent: "#06B6D4",
    gradient: "linear-gradient(135deg, #0A0A1A 0%, #1A1A3E 100%)",
    bgEffect: "nebula", unlocked: false, unlockAt: 7,
  },
  underwater: {
    id: "underwater", name: "🌊 Под водой", catEmoji: "🐠",
    bg: "#E0F2FE", card: "#FFFFFF", text: "#0C4A6E", textLight: "#0284C7",
    primary: "#0EA5E9", accent: "#F97316",
    gradient: "linear-gradient(135deg, #BAE6FD 0%, #E0F2FE 50%, #7DD3FC 100%)",
    bgEffect: "bubbles", unlocked: false, unlockAt: 12,
  },
};

export const CAT_ROOM_PHRASES: Record<string, string[]> = {
  happy: ["Мяу! 🐱", "Я кот-учёный!", "Давай играть!", "Всё отлично!"],
  sleepy: ["*зевает* 😴", "Хочу спать...", "Нужен отдых..."],
  hungry: ["Хочу есть! 🍖", "*мурчит*", "Корми меня!"],
  playful: ["Давай! 🎮", "Я готов!", "Ооо, интересно!"],
};

export const PET_DEFS: { id: string; name: string; emoji: string; color: string; storyId: string; description: string }[] = [
  { id: "bear_detective", name: "Мишка-детектив", emoji: "🐻", color: "#8B6914", storyId: "math", description: "Помог раскрыть дело о торте!" },
  { id: "fox_editor", name: "Лиса-редактор", emoji: "🦊", color: "#EA580C", storyId: "rus1", description: "Спас язык от пропавших запятых!" },
  { id: "owl_librarian", name: "Сова-библиотекарь", emoji: "🦉", color: "#6D28D9", storyId: "rus2", description: "Нашла все пропавшие буквы Н!" },
  { id: "penguin_coder", name: "Пингвин-программист", emoji: "🐧", color: "#0369A1", storyId: "math2", description: "Пишет код с помощью математики!" },
  { id: "fox_scout", name: "Лиса-разведчик", emoji: "🦊", color: "#DC2626", storyId: "rus3", description: "Находит правильные ударения!" },
  { id: "bear_chef", name: "Мишка-повар", emoji: "🐻", color: "#92400E", storyId: "math3", description: "Готовит блюда с дробями!" },
  { id: "owl_wizard", name: "Сова-волшебник", emoji: "🦉", color: "#7C3AED", storyId: "rus4", description: "Заклинания из слов с -ТСЯ!" },
  { id: "penguin_artist", name: "Пингвин-художник", emoji: "🐧", color: "#0891B2", storyId: "math4", description: "Рисует фигуры с правильным периметром!" },
  { id: "fox_musician", name: "Лиса-музыкант", emoji: "🦊", color: "#DB2777", storyId: "rus5", description: "Поёт песни с правильными ПРЕ/ПРИ!" },
  { id: "bear_engineer", name: "Мишка-инженер", emoji: "🐻", color: "#4338CA", storyId: "math5", description: "Строит мосты с уравнениями!" },
];

export interface HatDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  unlocked: boolean;
  gradient: string;
}

export const HATS: HatDef[] = [
  { id: "crown", name: "Корона", emoji: "👑", price: 0, unlocked: true, gradient: "linear-gradient(135deg,#FCD34D,#F59E0B)" },
  { id: "wizard", name: "Шляпа волшебника", emoji: "🧙", price: 30, unlocked: false, gradient: "linear-gradient(135deg,#7C3AED,#4F46E5)" },
  { id: "pirate", name: "Пиратская", emoji: "🏴‍☠️", price: 25, unlocked: false, gradient: "linear-gradient(135deg,#1F2937,#374151)" },
  { id: "chef", name: "Поварской колпак", emoji: "👨‍🍳", price: 20, unlocked: false, gradient: "linear-gradient(135deg,#F8FAFC,#E2E8F0)" },
  { id: "superhero", name: "Супергерой", emoji: "🦸", price: 50, unlocked: false, gradient: "linear-gradient(135deg,#EF4444,#DC2626)" },
  { id: "explorer", name: "Шляпа путешественника", emoji: "🤠", price: 35, unlocked: false, gradient: "linear-gradient(135deg,#92400E,#78350F)" },
  { id: "musician", name: "Музыкант", emoji: "🎵", price: 15, unlocked: false, gradient: "linear-gradient(135deg,#EC4899,#DB2777)" },
  { id: "space", name: "Космонавт", emoji: "🚀", price: 60, unlocked: false, gradient: "linear-gradient(135deg,#0F172A,#1E293B)" },
];

export const getTheme = (id: ThemeId): Theme => THEMES[id] || THEMES[DEFAULT_THEME];
