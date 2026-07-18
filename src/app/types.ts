export type Subject = "math" | "russian";
export type Tab = "home" | "stories" | "traps" | "games" | "catroom";
export type SkillStatus = "locked" | "current" | "completed";
export type CatMood = "happy" | "sleepy" | "hungry" | "playful";
export type ThemeId = "light" | "dark" | "forest" | "space" | "underwater";

export interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
  status: SkillStatus;
  gradient: string;
  shadow: string;
}

export interface Task {
  type: string;
  emoji: string;
  badge?: string;
  badgeClass?: string;
  question: string;
  correctAns: string | number;
  explanation: string;
  options?: (string | number)[];
  pairs?: { left: string; right: string; answer: string | number }[];
  svg?: string;
  words?: { text: string; answer: string }[];
}

export interface Trap {
  id: string;
  question: string;
  options: (string | number)[] | null;
  correct: number | null;
  answer: string | number | null;
  explanation: string;
  source: string;
  defuses: number;
  nextDate: string;
  isInput: boolean;
  subject: Subject;
}

export interface Achievement {
  name: string;
  desc: string;
  unlocked: boolean;
}

export interface Theme {
  id: ThemeId;
  name: string;
  catEmoji: string;
  bg: string;
  card: string;
  text: string;
  textLight: string;
  primary: string;
  accent: string;
  gradient: string;
  bgEffect: string;
  unlocked: boolean;
  unlockAt?: number;
}

export interface CatState {
  mood: CatMood;
  hunger: number;
  energy: number;
  lastUpdate: number;
  hat: string | null;
  ownedHats: string[];
  toys: string[];
}

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  color: string;
  storyId: string;
  description: string;
}

export interface GameState {
  subject: Subject;
  streak: number;
  gems: number;
  totalPets: number;
  storiesCompleted: { math: boolean; rus1: boolean; rus2: boolean };
  traps: Trap[];
  achievements: Record<string, Achievement>;
  skills: {
    math: Skill[];
    russian: Skill[];
  };
  subjectSwitches: number;
  theme: ThemeId;
  unlockedThemes: ThemeId[];
  cat: CatState;
  pets: string[];
}
