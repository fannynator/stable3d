import { useState, useCallback, useEffect } from "react";
import type { GameState, Subject, Skill, Trap, Achievement, CatState, CatMood, ThemeId } from "./types";
import {
  STORAGE_KEY, ROOM_STORAGE_KEY, SUBJECTS,
  ACHIEVEMENTS_DEF, MATH_SKILLS, RUS_SKILLS,
  DEFAULT_THEME, DEFAULT_CAT,
  THEMES, GEMS, TRAP, SKILL, PET_DEFS,
} from "./config";
import { deriveCatMood, decayCat } from "../core/player/cat";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function createDefaultState(): GameState {
  return {
    subject: SUBJECTS.MATH,
    streak: 7,
    gems: 245,
    totalPets: 0,
    storiesCompleted: { math: false, rus1: false, rus2: false },
    traps: [],
    achievements: deepClone(ACHIEVEMENTS_DEF),
    skills: {
      math: deepClone(MATH_SKILLS),
      russian: deepClone(RUS_SKILLS),
    },
    subjectSwitches: 0,
    theme: DEFAULT_THEME,
    cat: { ...DEFAULT_CAT },
    pets: [],
  };
}

function loadState(): GameState {
  const defaultState = createDefaultState();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState;
  try {
    const data = JSON.parse(saved);
    if (data.skills) {
      defaultState.skills.math = data.skills.math || defaultState.skills.math;
      defaultState.skills.russian = data.skills.russian || defaultState.skills.russian;
    }
    if (data.gems !== undefined) defaultState.gems = data.gems;
    if (data.streak !== undefined) defaultState.streak = data.streak;
    if (data.storiesCompleted) defaultState.storiesCompleted = { ...defaultState.storiesCompleted, ...data.storiesCompleted };
    if (data.traps) defaultState.traps = data.traps;
    if (data.achievements) {
      Object.keys(data.achievements).forEach(key => {
        if (defaultState.achievements[key] && data.achievements[key].unlocked) {
          defaultState.achievements[key].unlocked = true;
        }
      });
    }
    if (data.totalPets !== undefined) defaultState.totalPets = data.totalPets;
    if (data.subject) defaultState.subject = data.subject;
    if (data.subjectSwitches !== undefined) defaultState.subjectSwitches = data.subjectSwitches;
    if (data.theme) defaultState.theme = data.theme;
    if (data.pets) defaultState.pets = data.pets;

    // Load cat state from room storage
    const roomSaved = localStorage.getItem(ROOM_STORAGE_KEY);
    if (roomSaved) {
      try {
        const roomData = JSON.parse(roomSaved);
        if (roomData.cat) {
          defaultState.cat = decayCat({
            mood: roomData.cat.mood || "happy",
            hunger: roomData.cat.hunger ?? 100,
            energy: roomData.cat.energy ?? 100,
            lastUpdate: roomData.cat.lastUpdate || Date.now(),
            hat: roomData.cat.hat || null,
            ownedHats: roomData.cat.ownedHats || ["crown"],
            toys: roomData.cat.toys || [],
          });
          defaultState.cat.mood = deriveCatMood(defaultState.cat);
        }
      } catch { /* ignore */ }
    }

    return defaultState;
  } catch {
    return defaultState;
  }
}

function saveGameState(state: GameState) {
  const data = {
    skills: state.skills,
    gems: state.gems,
    streak: state.streak,
    storiesCompleted: state.storiesCompleted,
    traps: state.traps,
    achievements: state.achievements,
    totalPets: state.totalPets,
    subject: state.subject,
    subjectSwitches: state.subjectSwitches,
    theme: state.theme,
    pets: state.pets,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveCatState(cat: CatState) {
  const data = {
    cat: {
      mood: cat.mood,
      hunger: cat.hunger,
      energy: cat.energy,
      lastUpdate: cat.lastUpdate,
      hat: cat.hat,
      ownedHats: cat.ownedHats,
    },
  };
  localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(data));
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);

  // Persist on change
  useEffect(() => {
    saveGameState(state);
  }, [state]);

  // Decay cat stats every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const decayed = decayCat(prev.cat);
        decayed.mood = deriveCatMood(decayed);
        saveCatState(decayed);
        return { ...prev, cat: decayed };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentSkills = useCallback((): Skill[] => {
    return state.skills[state.subject];
  }, [state.subject, state.skills]);

  const countCompletedLessons = useCallback((): number => {
    const all = [...state.skills.math, ...state.skills.russian];
    return all.filter(s => s.progress >= SKILL.PROGRESS_TO_COMPLETE).length;
  }, [state.skills]);

  const getAvailableTraps = useCallback((): Trap[] => {
    return state.traps.filter(
      t => t.defuses < TRAP.MAX_DEFUSES && t.subject === state.subject
    );
  }, [state.traps, state.subject]);

  const getDefusedTraps = useCallback((): Trap[] => {
    return state.traps.filter(
      t => t.defuses >= TRAP.MAX_DEFUSES && t.subject === state.subject
    );
  }, [state.traps, state.subject]);

  const unlockAchievement = useCallback((id: string) => {
    let unlocked = false;
    setState(prev => {
      const ach = prev.achievements[id];
      if (!ach || ach.unlocked) return prev;
      return {
        ...prev,
        achievements: { ...prev.achievements, [id]: { ...ach, unlocked: true } },
        gems: prev.gems + GEMS.ACHIEVEMENT_REWARD,
      };
    });
    return unlocked;
  }, []);

  const checkAchievements = useCallback(() => {
    const done = (state.storiesCompleted.math ? 1 : 0) +
      (state.storiesCompleted.rus1 ? 1 : 0) +
      (state.storiesCompleted.rus2 ? 1 : 0);
    const def = state.traps.reduce((s, t) => s + t.defuses, 0);

    const checks: Record<string, boolean> = {
      detective: done >= 1,
      sherlock: done >= 2,
      holmes: done >= 3,
      saper: def >= 1,
      hunter: def >= 3,
      murmur: state.totalPets >= 10,
      firstBlood: state.traps.length > 0,
    };
    const unlocked: string[] = [];
    Object.entries(checks).forEach(([id, cond]) => {
      if (cond && !state.achievements[id]?.unlocked) {
        unlockAchievement(id);
        unlocked.push(id);
      }
    });
    return unlocked;
  }, [state, unlockAchievement]);

  const switchSubject = useCallback((subject: Subject) => {
    setState(prev => {
      if (prev.subject === subject) return prev;
      const newSwitches = prev.subjectSwitches + 1;
      const next = {
        ...prev,
        subject,
        subjectSwitches: newSwitches,
      };
      if (newSwitches >= 5) {
        const erudite = next.achievements.erudite;
        if (erudite && !erudite.unlocked) {
          next.achievements = { ...next.achievements, erudite: { ...erudite, unlocked: true } };
          next.gems += GEMS.ACHIEVEMENT_REWARD;
        }
      }
      return next;
    });
  }, []);

  const addGems = useCallback((amount: number) => {
    setState(prev => ({ ...prev, gems: prev.gems + amount }));
  }, []);

  const petCat = useCallback(() => {
    setState(prev => {
      const newTotal = prev.totalPets + 1;
      return { ...prev, totalPets: newTotal };
    });
  }, []);

  const updateSkillProgress = useCallback((skillId: string, ratio: number) => {
    setState(prev => {
      const skills = [...prev.skills[prev.subject]];
      const idx = skills.findIndex(s => s.id === skillId);
      if (idx < 0) return prev;
      const skill = { ...skills[idx] };
      skill.progress = Math.min(SKILL.PROGRESS_TO_COMPLETE, skill.progress + Math.round(ratio * 100));
      if (skill.progress >= SKILL.PROGRESS_TO_COMPLETE) {
        skill.status = "completed";
        // Unlock next skill
        if (idx + 1 < skills.length && skills[idx + 1].status === "locked") {
          skills[idx + 1] = { ...skills[idx + 1], status: "current" };
        }
      }
      skills[idx] = skill;
      return {
        ...prev,
        skills: { ...prev.skills, [prev.subject]: skills },
      };
    });

    // Check theme unlocks
    setState(prev => {
      const totalDone = countCompletedLessons();
      const newThemes = { ...THEMES };
      let changed = false;
      Object.values(newThemes).forEach(t => {
        if (!t.unlocked && t.unlockAt && totalDone >= t.unlockAt) {
          t.unlocked = true;
          changed = true;
        }
      });
      return changed ? { ...prev } : prev;
    });
  }, [countCompletedLessons]);

  const addTrap = useCallback((trap: Trap) => {
    setState(prev => {
      const hasFirstBlood = prev.traps.length > 0;
      const next = { ...prev, traps: [...prev.traps, trap] };
      if (!hasFirstBlood) {
        const ach = next.achievements.firstBlood;
        if (ach && !ach.unlocked) {
          next.achievements = { ...next.achievements, firstBlood: { ...ach, unlocked: true } };
          next.gems += GEMS.ACHIEVEMENT_REWARD;
        }
      }
      return next;
    });
  }, []);

  const defuseTrap = useCallback((trapId: string) => {
    setState(prev => {
      const traps = prev.traps.map(t =>
        t.id === trapId ? { ...t, defuses: t.defuses + 1 } : t
      );
      return { ...prev, traps };
    });
  }, []);

  const completeStory = useCallback((storyId: string) => {
    setState(prev => {
      const petDef = PET_DEFS.find(p => p.storyId === storyId);
      const newPets = petDef && !prev.pets.includes(petDef.id)
        ? [...prev.pets, petDef.id]
        : prev.pets;
      return {
        ...prev,
        storiesCompleted: { ...prev.storiesCompleted, [storyId]: true },
        gems: prev.gems + (storyId === "math" ? GEMS.STORY_MATH_REWARD : GEMS.STORY_RUS_REWARD),
        pets: newPets,
      };
    });
  }, []);

  const setTheme = useCallback((themeId: ThemeId) => {
    setState(prev => ({ ...prev, theme: themeId }));
    applyThemeToDOM(themeId);
  }, []);

  const updateCatState = useCallback((updates: Partial<CatState>) => {
    setState(prev => {
      const cat = {
        ...prev.cat,
        ...updates,
        lastUpdate: Date.now(),
      };
      cat.mood = deriveCatMood(cat);
      saveCatState(cat);
      return { ...prev, cat };
    });
  }, []);

  const resetAllProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROOM_STORAGE_KEY);
    setState(createDefaultState());
    applyThemeToDOM(DEFAULT_THEME);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyThemeToDOM(state.theme);
  }, [state.theme]);

  return {
    state,
    setState,
    getCurrentSkills,
    countCompletedLessons,
    getAvailableTraps,
    getDefusedTraps,
    unlockAchievement,
    checkAchievements,
    switchSubject,
    addGems,
    petCat,
    updateSkillProgress,
    addTrap,
    defuseTrap,
    completeStory,
    setTheme,
    updateCatState,
    resetAllProgress,
  };
}

export function applyThemeToDOM(themeId: ThemeId) {
  const t = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  root.style.setProperty("--bg", t.bg);
  root.style.setProperty("--card", t.card);
  root.style.setProperty("--text", t.text);
  root.style.setProperty("--text-light", t.textLight);
  root.style.setProperty("--theme-primary", t.primary);
  root.style.setProperty("--theme-accent", t.accent);
  document.body.style.background = t.gradient;
  document.body.style.backgroundSize = "400% 400%";

  // Remove old theme classes
  Object.keys(THEMES).forEach(k => document.body.classList.remove("theme-" + k));
  document.body.classList.add("theme-" + themeId);
}
