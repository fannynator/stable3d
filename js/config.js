export const STORAGE_KEY = 'kot_ucheniy_v15';
export const TUTORIAL_KEY = 'kot_ucheniy_tutorial_done';

export const SUBJECTS = { MATH: 'math', RUSSIAN: 'russian' };

export const GEMS = {
    CORRECT_ANSWER: 5, LESSON_XP_PER_CORRECT: 5, LESSON_PERFECT_BONUS: 25,
    BONUS_REPEAT_XP: 3, ACHIEVEMENT_REWARD: 15, TRAP_BASE_REWARD: 5,
    TRAP_DEFUSE_MULTIPLIER: 3, STORY_MATH_REWARD: 40, STORY_RUS_REWARD: 50
};

export const TRAP = { MAX_DEFUSES: 1, DELAY_SLOTS: [1, 3, 7, 14] };
export const SKILL = { PROGRESS_TO_COMPLETE: 100 };

export const ACHIEVEMENTS_DEF = {
    detective:  { name: '🕵️ Детектив',   desc: 'Пройти 1 историю',        unlocked: false },
    sherlock:   { name: '🔍 Шерлок',      desc: 'Пройти 2 истории',        unlocked: false },
    holmes:     { name: '🎩 Холмс',       desc: 'Пройти 3 истории',        unlocked: false },
    saper:      { name: '🪤 Сапёр',       desc: 'Обезвредить ловушку',     unlocked: false },
    hunter:     { name: '💣 Охотник',     desc: 'Обезвредить 3',           unlocked: false },
    murmur:     { name: '🐱 Мур-мур',     desc: 'Погладить 10 раз',        unlocked: false },
    erudite:    { name: '📚 Эрудит',      desc: 'Переключить предмет 5 раз', unlocked: false },
    firstBlood: { name: '💎 Первая кровь',desc: 'Ошибка → ловушки',        unlocked: false },
    student:    { name: '🎓 Ученик',      desc: 'Пройти 1 урок',           unlocked: false },
    master:     { name: '🏅 Мастер',      desc: 'Урок без ошибок',         unlocked: false }
};

export const MATH_SKILLS = [
    { id: 'add',  name: 'Сложение',           icon: '➕', color: '#3B82F6', progress: 0, status: 'current' },
    { id: 'sub',  name: 'Вычитание',          icon: '➖', color: '#EF4444', progress: 0, status: 'locked' },
    { id: 'mul',  name: 'Умножение',          icon: '✖️', color: '#F59E0B', progress: 0, status: 'locked' },
    { id: 'div',  name: 'Деление',            icon: '➗', color: '#8B5CF6', progress: 0, status: 'locked' },
    { id: 'eq',   name: 'Уравнения',          icon: '🔎', color: '#EC4899', progress: 0, status: 'locked' },
    { id: 'geom', name: 'Периметр и площадь', icon: '📏', color: '#14B8A6', progress: 0, status: 'locked' },
    { id: 'frac', name: 'Дроби',             icon: '🍕', color: '#F97316', progress: 0, status: 'locked' }
];

export const RUS_SKILLS = [
    { id: 'zhishi',  name: 'ЖИ/ШИ, ЧА/ЩА, ЧУ/ЩУ',  icon: '✍️',  color: '#7C3AED', progress: 0, status: 'current' },
    { id: 'soft',    name: 'Разделительный Ь и Ъ',   icon: '🧩', color: '#8B5CF6', progress: 0, status: 'locked' },
    { id: 'vowel',   name: 'Безударные гласные',     icon: '🔎', color: '#F59E0B', progress: 0, status: 'locked' },
    { id: 'silent',  name: 'Непроизносимые согласные',icon: '🗣️', color: '#EC4899', progress: 0, status: 'locked' },
    { id: 'tsya',    name: '-ТСЯ/-ТЬСЯ',             icon: '🔄', color: '#14B8A6', progress: 0, status: 'locked' },
    { id: 'prepri',  name: 'ПРЕ/ПРИ',                icon: '🎯', color: '#F97316', progress: 0, status: 'locked' },
    { id: 'nn',      name: 'Н и НН',                 icon: '📋', color: '#EF4444', progress: 0, status: 'locked' }
];

export const CAT_SPEECH = {
    math: 'Мур! Математика!',
    russian: 'Мур! Русский язык!',
    pet: (count) => count >= 10 ? 'Мур-мур! 💖' : 'Мррр!',
    lessonPerfect: 'Мур! Идеально! 🌟',
    lessonDone: 'Мур! Ошибки в ловушках 🪤',
    storyDone: 'Мур! Дело раскрыто! 🏆'
};

export const SUBJECT_EMOJI = { math: '🐱', russian: '😺' };

export const DEFAULT_THEME = 'light';

export const THEMES = {
    light: {
        id: 'light', name: '☀️ Солнечная', catEmoji: '🐱',
        bg: '#F8FAFC', card: '#FFFFFF', text: '#1E293B', textLight: '#94A3B8',
        primary: '#3B82F6', accent: '#F59E0B',
        gradient: 'linear-gradient(135deg, #E2E8F0 0%, #F1F5F9 50%, #E8EDF2 100%)',
        bgEffect: 'sunlight', unlocked: true
    },
    dark: {
        id: 'dark', name: '🌙 Ночная', catEmoji: '🐱',
        bg: '#0F172A', card: '#1E293B', text: '#F1F5F9', textLight: '#94A3B8',
        primary: '#818CF8', accent: '#FBBF24',
        gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        bgEffect: 'stars', unlocked: true
    },
    forest: {
        id: 'forest', name: '🌲 Лес', catEmoji: '🦊',
        bg: '#F0FDF4', card: '#FFFFFF', text: '#14532D', textLight: '#65A30D',
        primary: '#16A34A', accent: '#CA8A04',
        gradient: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFCCB 100%)',
        bgEffect: 'leaves', unlocked: false, unlockAt: 3 // пройти 3 урока
    },
    space: {
        id: 'space', name: '🚀 Космос', catEmoji: '👾',
        bg: '#0A0A1A', card: '#1A1A3E', text: '#E2E8F0', textLight: '#818CF8',
        primary: '#A855F7', accent: '#06B6D4',
        gradient: 'linear-gradient(135deg, #0A0A1A 0%, #1A1A3E 100%)',
        bgEffect: 'nebula', unlocked: false, unlockAt: 7 // пройти 7 уроков
    },
    underwater: {
        id: 'underwater', name: '🌊 Под водой', catEmoji: '🐠',
        bg: '#E0F2FE', card: '#FFFFFF', text: '#0C4A6E', textLight: '#0284C7',
        primary: '#0EA5E9', accent: '#F97316',
        gradient: 'linear-gradient(135deg, #BAE6FD 0%, #E0F2FE 50%, #7DD3FC 100%)',
        bgEffect: 'bubbles', unlocked: false, unlockAt: 12 // пройти 12 уроков
    }
};

export const getTheme = (id) => THEMES[id] || THEMES[DEFAULT_THEME];

/** Сколько уроков пройдено (completed skills) */
export const countCompletedLessons = (skills) => {
    if (!skills) return 0;
    return Object.values(skills).filter(s => s && s.progress >= 100).length;
};