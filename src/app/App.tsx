import { useState, useEffect, useCallback, useMemo } from "react";
import type { Tab, Skill, Trap } from "./types";
import type { Subject } from "./types";
import { useGameState } from "./state";
import { getTheme } from "./config";
import { TopBar } from "./components/TopBar";
import { BottomNav } from "./components/BottomNav";
import { SkillsScreen } from "./components/SkillsScreen";
import { CatRoom } from "./components/room/CatRoom";
import { LessonScreen } from "./components/lessons/LessonScreen";
import { TrapPanel } from "./components/traps/TrapPanel";
import { TrapQuiz } from "./components/traps/TrapQuiz";
import { StoriesList } from "./components/stories/StoriesList";
import { StoryScreen } from "./components/stories/StoryScreen";
import { GamesHub } from "./components/games/GamesHub";
import { FunGamesHub } from "./components/games/FunGamesHub";
import { SpeedGame } from "./components/games/SpeedGame";
import { MemoryGame } from "./components/games/MemoryGame";
import { FlappyCat } from "./components/games/FlappyCat";
import { DoodleCat } from "./components/games/DoodleCat";
import { HillClimbCat } from "./components/games/HillClimbCat";
import { generateMathLesson } from "../generators/math";
import { generateRusLesson } from "../generators/russian";
import { TaskModal } from "./components/TaskModal";

// FGOS integration
import { MATH_CURRICULUM } from "../core/fgos/math-grades";
import { RUSSIAN_CURRICULUM } from "../core/fgos/russian-grades";
import { flattenTopics } from "../core/fgos/progression";
import { calculateLessonReward } from "../core/economy/gems";
import { generateAITask } from "../core/tasks/ai-adapter";
import type { FGOSTopic } from "../core/fgos/fgos-tree";
import type { AIStructuredTask } from "../core/tasks/ai-schema";
import type { DifficultyMode } from "../core/fgos/adaptive";

type Screen = "main" | "lesson" | "story" | "speed" | "memory" | "flappy" | "doodle" | "hillclimb";

/** localStorage key for FGOS star progress (topicId → star count 1-3) */
const FGOS_STARS_KEY = "kot_ucheniy_stars_v1";

function loadStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem(FGOS_STARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStars(stars: Record<string, number>): void {
  localStorage.setItem(FGOS_STARS_KEY, JSON.stringify(stars));
}

/** Map star level to difficulty mode */
function starToMode(star: number): DifficultyMode {
  if (star <= 1) return "standard";   // 0 stars → standard easy
  if (star === 2) return "standard";   // 1 star → standard medium
  return "olympiad";                   // 2+ stars → olympiad hard
}

/** Map star level to numeric difficulty (1-5) */
function starToDifficulty(star: number): number {
  if (star === 0) return 1; // easy
  if (star === 1) return 2; // medium
  return 3;                  // hard/olympiad
}

/**
 * Derive completed FGOS topic IDs (topics with 3+ stars).
 * Uses explicit FGOS stars + legacy skill progress as fallback.
 */
function getCompletedFGOStopics(
  fgosStars: Record<string, number>,
  legacySkills: Skill[],
  subject: Subject
): string[] {
  const curriculum = subject === "math" ? MATH_CURRICULUM : RUSSIAN_CURRICULUM;
  const allTopics = flattenTopics(curriculum);
  const completed = new Set<string>();
  const consumedSkillIds = new Set<string>();

  for (const topic of allTopics) {
    // 1) Explicit FGOS completion (3+ stars)
    if ((fgosStars[topic.id] || 0) >= 3) {
      completed.add(topic.id);
      consumedSkillIds.add(topic.generatorId);
      continue;
    }

    // 2) Check prerequisites
    const prereqsMet = topic.prerequisites.every((prereq) => completed.has(prereq));
    if (!prereqsMet) continue;

    // 3) Legacy skill fallback
    const matchedSkill = legacySkills.find(
      (s) => s.id === topic.generatorId && !consumedSkillIds.has(s.id)
    );
    if (matchedSkill && matchedSkill.progress >= 100) {
      completed.add(topic.id);
      consumedSkillIds.add(matchedSkill.id);
    }
  }

  return [...completed];
}

/**
 * Build FGOS-based Skill[] for UI with star count.
 */
function buildFGOSSkills(
  subject: Subject,
  completedFGOSIds: Set<string>,
  fgosStars: Record<string, number>
): Skill[] {
  const curriculum = subject === "math" ? MATH_CURRICULUM : RUSSIAN_CURRICULUM;
  const allTopics = flattenTopics(curriculum);

  return allTopics.map((topic, index): Skill => {
    const isCompleted = completedFGOSIds.has(topic.id);
    const stars = fgosStars[topic.id] || 0;
    const isUnlocked =
      isCompleted ||
      topic.prerequisites.every((prereq) => completedFGOSIds.has(prereq));
    const isCurrent =
      !isCompleted &&
      isUnlocked &&
      allTopics.slice(0, index).every(
        (prev) => completedFGOSIds.has(prev.id) || !prev.prerequisites.every((p) => completedFGOSIds.has(p))
      );

    return {
      id: topic.id,
      name: topic.name,
      icon: topic.icon,
      color: topic.color,
      progress: isCompleted ? 100 : stars > 0 ? Math.round((stars / 3) * 100) : 0,
      status: isCompleted ? "completed" : isUnlocked ? "current" : "locked",
      gradient: `linear-gradient(135deg,${topic.color},${topic.color}dd)`,
      shadow: `0 8px 20px ${topic.color}66`,
    };
  });
}

function getFGOSTopicById(subject: Subject, skillId: string): FGOSTopic | undefined {
  const curriculum = subject === "math" ? MATH_CURRICULUM : RUSSIAN_CURRICULUM;
  return flattenTopics(curriculum).find((t) => t.id === skillId);
}

export default function App() {
  const game = useGameState();
  const { state, getCurrentSkills, getAvailableTraps, getDefusedTraps, switchSubject, addGems, petCat, updateSkillProgress, addTrap, defuseTrap, completeStory, setTheme, updateCatState, resetAllProgress, checkAchievements, unlockAchievement } = game;

  const [tab, setTab] = useState<Tab>("home");
  const [screen, setScreen] = useState<Screen>("main");
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [defusingTrap, setDefusingTrap] = useState<Trap | null>(null);
  const [showFunGames, setShowFunGames] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Session state — 5-question mastery session
  const [session, setSession] = useState<{
    tasks: AIStructuredTask[];
    currentIndex: number;
    source: "ai" | "local";
    topicId: string;
    correct: number;
    wrong: number;
  } | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // FGOS stars — topicId → star count (1-3), topic completed at 3
  const [fgosStars, setFgosStars] = useState<Record<string, number>>(loadStars);

  const legacySkills = getCurrentSkills();
  const completedFGOSIds = useMemo(
    () => new Set(getCompletedFGOStopics(fgosStars, legacySkills, state.subject)),
    [fgosStars, legacySkills, state.subject]
  );
  const fgosSkills = useMemo(
    () => buildFGOSSkills(state.subject, completedFGOSIds, fgosStars),
    [state.subject, completedFGOSIds, fgosStars]
  );
  const skills = fgosSkills;

  const availableTraps = getAvailableTraps();
  const defusedTraps = getDefusedTraps();
  const theme = getTheme(state.theme);
  const catEmoji = theme.catEmoji || "🐱";

  // XP metrics for TopBar
  const totalStars = useMemo(
    () => Object.values(fgosStars).reduce((s, v) => s + v, 0),
    [fgosStars]
  );
  const maxStars = useMemo(
    () => flattenTopics(state.subject === "math" ? MATH_CURRICULUM : RUSSIAN_CURRICULUM).length * 3,
    [state.subject]
  );
  const xpPct = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0;
  const xpLabel = `${totalStars} / ${maxStars}`;
  const playerLevel = Math.floor(totalStars / 3) + 1;

  const subjectPhrase = state.subject === "math"
    ? "Мур-р! Давай считать! 🐾"
    : "Мур-р! Учим русский! 📖";

  const generateLesson = useCallback((skillId: string) => {
    if (state.subject === "math") return generateMathLesson(skillId);
    return generateRusLesson(skillId);
  }, [state.subject]);

  // Click skill → generate a 5-question mastery session
  const handleSkillClick = useCallback(async (skill: Skill) => {
    if (skill.status === "locked") return;
    if (skill.status === "completed") return;

    const fgosTopic = getFGOSTopicById(state.subject, skill.id);
    if (!fgosTopic) {
      setActiveSkill(skill);
      setScreen("lesson");
      return;
    }

    const currentStars = fgosStars[fgosTopic.id] || 0;
    const mode = starToMode(currentStars);
    const difficulty = starToDifficulty(currentStars);

    setTaskLoading(true);
    try {
      // Generate 5 unique tasks
      const tasks: AIStructuredTask[] = [];
      for (let i = 0; i < 5; i++) {
        const { task } = await generateAITask(fgosTopic, mode);
        tasks.push({ ...task, difficulty });
      }
      setSession({
        tasks,
        currentIndex: 0,
        source: "local",
        topicId: fgosTopic.id,
        correct: 0,
        wrong: 0,
      });
    } catch {
      setActiveSkill(skill);
      setScreen("lesson");
    } finally {
      setTaskLoading(false);
    }
  }, [state.subject, fgosStars]);

  // Handle one answer in the session
  const handleSessionAnswer = useCallback((isCorrect: boolean) => {
    if (!session) return;
    const nextIndex = session.currentIndex + 1;
    const nextCorrect = session.correct + (isCorrect ? 1 : 0);
    const nextWrong = session.wrong + (isCorrect ? 0 : 1);

    // Reward gems for correct answer
    if (isCorrect) {
      addGems(calculateLessonReward(1, 1));
    }

    // If session is not over, advance to next task
    if (nextIndex < session.tasks.length) {
      setSession({
        ...session,
        currentIndex: nextIndex,
        correct: nextCorrect,
        wrong: nextWrong,
      });
      return;
    }

    // Session complete — award star if 4/5 or better
    const passed = nextCorrect >= 4;
    if (passed) {
      const topicId = session.topicId;
      setFgosStars(prev => {
        const current = prev[topicId] || 0;
        if (current >= 3) return prev; // already maxed
        const next = { ...prev, [topicId]: Math.min(3, current + 1) };
        saveStars(next);
        return next;
      });
      unlockAchievement("student");
      if (nextCorrect === 5) unlockAchievement("master");
    }
    checkAchievements();

    // Keep session visible for summary phase, mark as finished
    setSession({
      ...session,
      currentIndex: nextIndex,
      correct: nextCorrect,
      wrong: nextWrong,
    });
  }, [session, addGems, unlockAchievement, checkAchievements]);

  const handleSessionClose = useCallback(() => {
    setSession(null);
  }, []);

  const handleLessonFinish = useCallback((correct: number, wrong: number) => {
    if (!activeSkill) return;
    const total = correct + wrong;
    const ratio = total > 0 ? correct / total : 0;
    updateSkillProgress(activeSkill.id, ratio);
    const xp = correct * 5 + (wrong === 0 ? 25 : 0);
    addGems(xp);
    unlockAchievement("student");
    if (wrong === 0) unlockAchievement("master");
    setScreen("main");
    setActiveSkill(null);
    checkAchievements();
  }, [activeSkill, addGems, updateSkillProgress, unlockAchievement, checkAchievements]);

  const handleAddTrap = useCallback((trap: Trap) => { addTrap(trap); }, [addTrap]);
  const handleDefuseTrap = useCallback((trap: Trap) => { setDefusingTrap(trap); }, []);
  const handleTrapResolve = useCallback((correct: boolean) => {
    if (!defusingTrap) return;
    if (correct) defuseTrap(defusingTrap.id);
    setDefusingTrap(null);
    checkAchievements();
  }, [defusingTrap, defuseTrap, checkAchievements]);

  const handleRoomZoneClick = useCallback((zone: string) => {
    switch (zone) {
      case "computer": setShowFunGames(true); break;
      case "bed": updateCatState({ energy: Math.min(100, (state.cat.energy || 0) + 30) }); break;
      case "plant": updateCatState({ hunger: Math.min(100, (state.cat.hunger || 0) + 10), energy: Math.min(100, (state.cat.energy || 0) + 10) }); break;
      case "photos": setTab("stories"); break;
      case "bookshelf": setTab("home"); break;
    }
  }, [updateCatState, state.cat]);

  const handleStoryClick = useCallback((id: string) => { setActiveStoryId(id); setScreen("story"); }, []);
  const handleStoryFinish = useCallback(() => {
    if (!activeStoryId) return;
    completeStory(activeStoryId);
    setScreen("main");
    setActiveStoryId(null);
    checkAchievements();
  }, [activeStoryId, completeStory, checkAchievements]);

  const handleGameClick = useCallback((id: string) => {
    setActiveGame(id);
    if (id === "speed") setScreen("speed");
    else if (id === "memory") setScreen("memory");
    else if (id === "flappy") setScreen("flappy");
    else if (id === "doodle") setScreen("doodle");
    else if (id === "hillclimb") setScreen("hillclimb");
    else setScreen("main");
  }, []);

  const goMain = useCallback(() => {
    setScreen("main");
    setActiveSkill(null);
    setActiveStoryId(null);
    setActiveGame(null);
  }, []);

  const dailyStreakUpdate = useCallback(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem("kot_ucheniy_last_visit");
    if (!lastVisit) { localStorage.setItem("kot_ucheniy_last_visit", today); return; }
    if (lastVisit === today) return;
    localStorage.setItem("kot_ucheniy_last_visit", today);
  }, []);

  useEffect(() => { dailyStreakUpdate(); }, []);

  const lessonTasks = useMemo(() => {
    if (!activeSkill) return [];
    return generateLesson(activeSkill.id);
  }, [activeSkill, generateLesson]);

  // ── Screen overlays ──
  if (screen === "lesson" && activeSkill) {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#2D1B69" }}><LessonScreen skill={activeSkill} tasks={lessonTasks} onFinish={handleLessonFinish} onAddTrap={handleAddTrap} onClose={goMain} /></div>);
  }
  if (screen === "story" && activeStoryId) {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#2D1B69" }}><StoryScreen storyId={activeStoryId} onFinish={handleStoryFinish} onClose={goMain} /></div>);
  }
  if (screen === "speed") {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#1E1B4B" }}><SpeedGame onBack={goMain} /></div>);
  }
  if (screen === "memory") {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#7C2D12" }}><MemoryGame onBack={goMain} /></div>);
  }
  if (screen === "flappy") {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#1a0a3e" }}><FlappyCat onBack={goMain} /></div>);
  }
  if (screen === "doodle") {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}><DoodleCat onBack={goMain} /></div>);
  }
  if (screen === "hillclimb") {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}><HillClimbCat onBack={goMain} /></div>);
  }

  // ── Main app shell ──
  return (
    <div className="min-h-screen flex items-start justify-center"
      style={{ background: "linear-gradient(160deg,#3B1F6B,#5B21B6,#7C3AED)" }}>
      <div className="relative w-full max-w-md min-h-screen flex flex-col overflow-hidden">
        {/* Header — hidden on catroom tab for full-screen 3D */}
        {tab !== "catroom" && (
          <TopBar
            gems={state.gems}
            streak={state.streak}
            catMood={state.cat.mood}
            xp={xpPct}
            xpLabel={xpLabel}
            level={playerLevel}
            phrase={subjectPhrase}
            subject={state.subject}
            onSubjectChange={switchSubject}
          />
        )}

        {tab === "home" && (
          <SkillsScreen
            skills={skills}
            stars={fgosStars}
            onSkillClick={handleSkillClick}
          />
        )}
        {tab === "stories" && (
          <StoriesList completed={state.storiesCompleted} onStoryClick={handleStoryClick} />
        )}
        {tab === "traps" && (
          <TrapPanel subject={state.subject} available={availableTraps} defused={defusedTraps} onDefuse={handleDefuseTrap} />
        )}
        {tab === "games" && (<GamesHub onGameClick={handleGameClick} />)}
        {tab === "catroom" && (
          <div className="flex-1 relative" style={{ background: "#1a1040" }}>
            <CatRoom
              cat={state.cat} totalPets={state.totalPets} ownedPetIds={state.pets}
              gems={state.gems} onPet={petCat} onUpdateCat={updateCatState}
              onOpenZone={handleRoomZoneClick}
              onBuyHat={(hatId, price) => {
                if (state.gems >= price && !state.cat.ownedHats.includes(hatId)) {
                  addGems(-price);
                  updateCatState({ hat: hatId, ownedHats: [...state.cat.ownedHats, hatId] });
                }
              }}
            />
          </div>
        )}

        <BottomNav active={tab} onChange={setTab} trapsBadge={availableTraps.length} />

        {defusingTrap && (
          <TrapQuiz trap={defusingTrap} catEmoji={catEmoji}
            onResolve={(correct) => handleTrapResolve(correct)}
            onClose={() => setDefusingTrap(null)} />
        )}
        {showFunGames && (
          <FunGamesHub onGameClick={handleGameClick} onClose={() => setShowFunGames(false)} />
        )}

        {/* Session Modal */}
        {session && (
          <TaskModal
            tasks={session.tasks}
            currentIndex={session.currentIndex}
            source={session.source}
            correctCount={session.correct}
            wrongCount={session.wrong}
            topicId={session.topicId}
            stars={fgosStars[session.topicId] || 0}
            onAnswer={handleSessionAnswer}
            onClose={handleSessionClose}
          />
        )}

        {taskLoading && (
          <div className="fixed inset-0 z-[199] flex items-center justify-center"
            style={{ background: "rgba(15, 10, 40, 0.7)", backdropFilter: "blur(4px)" }}>
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl animate-bounce">🐱</div>
              <p className="text-white/80 text-sm font-semibold">Кот-учёный готовит задания...</p>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0s" }} />
                <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.15s" }} />
                <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
