import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { FGOSDoodleGame } from "./components/games/FGOSDoodleGame";
import { HillClimbCat } from "./components/games/HillClimbCat";
import { generateMathLesson } from "../generators/math";
import { generateRusLesson } from "../generators/russian";
import { TaskModal } from "./components/TaskModal";
import { PrivacyModal, hasAcceptedPrivacy } from "./components/PrivacyModal";
import { ParentPanel, recordTaskSolved, recordPlayTime, isTimeExceeded, getDailyTimeLimitMs } from "./components/ParentPanel";
import { RoleScreen, getStoredRole, setStoredRole, type UserRole } from "./components/RoleScreen";
import { PaywallModal } from "./components/PaywallModal";
import { getSubscriptionStatus, startTrial } from "./useSubscription";

// Skill tree
import { MATH_SKILLS } from "../core/fgos/math-grades";
import { RUSSIAN_SKILLS } from "../core/fgos/russian-grades";
import { getDifficultyLevel } from "../core/fgos/adaptive";
import type { DifficultyLevel } from "../core/fgos/adaptive";
import type { SkillNode } from "../core/fgos/fgos-tree";
import { calculateLessonReward } from "../core/economy/gems";
import { generateAISession } from "../core/tasks/ai-adapter";
import type { AIStructuredTask } from "../core/tasks/ai-schema";

type Screen = "main" | "lesson" | "story" | "speed" | "memory" | "flappy" | "doodle" | "hillclimb";

/** Get a skill node by its ID */
function getSkillById(subject: Subject, skillId: string): SkillNode | undefined {
  const skills = subject === "math" ? MATH_SKILLS : RUSSIAN_SKILLS;
  return skills.find((s) => s.id === skillId);
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
  const [privacyAccepted, setPrivacyAccepted] = useState(hasAcceptedPrivacy);
  const [parentOpen, setParentOpen] = useState(false);
  const [timeExceeded, setTimeExceeded] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(getStoredRole);
  const [subStatus] = useState(getSubscriptionStatus);
  const [taskCount, setTaskCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false); // Only shown from room, not at startup

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

  // Delay catroom Canvas mount by 300ms to let GPU free avatar's context first
  useEffect(() => {
    if (tab === "catroom") {
      setRoomReady(false);
      const timer = setTimeout(() => setRoomReady(true), 300);
      return () => clearTimeout(timer);
    }
    setRoomReady(false);
  }, [tab]);

  // AbortController for in-flight AI requests
  const abortRef = useRef<AbortController | null>(null);
  // Guard against double-click on session answers
  const answerLockRef = useRef(false);

  const legacySkills = getCurrentSkills();

  // Collect completed skill IDs and progress from legacy state
  const completedIds = useMemo(
    () => new Set(legacySkills.filter(s => s.progress >= 100).map(s => s.id)),
    [legacySkills]
  );
  const progressMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of legacySkills) {
      map.set(s.id, s.progress);
    }
    return map;
  }, [legacySkills]);

  // Build skill list from tree + legacy completion status
  const skills: Skill[] = useMemo(() => {
    const allNodes = state.subject === "math" ? MATH_SKILLS : RUSSIAN_SKILLS;

    // Grade completion tracking
    const gradeTot: Record<number, number> = {};
    const gradeDone: Record<number, number> = {};
    for (const sk of allNodes) {
      gradeTot[sk.grade] = (gradeTot[sk.grade] || 0) + 1;
      if (completedIds.has(sk.id)) gradeDone[sk.grade] = (gradeDone[sk.grade] || 0) + 1;
    }

    return allNodes.map((sk): Skill => {
      const isCompleted = completedIds.has(sk.id);
      const currentProgress = progressMap.get(sk.id) || 0;
      let isUnlocked = false;

      if (sk.grade === 1) {
        isUnlocked = true;
      } else {
        const prevGrade = sk.grade - 1;
        const prevTot = gradeTot[prevGrade] || 0;
        const prevDoneVal = gradeDone[prevGrade] || 0;
        isUnlocked = prevTot > 0 ? prevDoneVal / prevTot >= 0.7 : true;
      }

      // Skills with any progress are considered unlocked (in progress)
      if (!isUnlocked && currentProgress > 0) isUnlocked = true;

      return {
        id: sk.id,
        name: sk.name,
        icon: sk.icon,
        color: sk.color,
        progress: currentProgress,
        status: isCompleted ? "completed" : isUnlocked ? "current" : "locked",
        gradient: `linear-gradient(135deg,${sk.color},${sk.color}dd)`,
        shadow: `0 8px 20px ${sk.color}66`,
        difficulty: isCompleted ? 3 : isUnlocked ? 1 : undefined,
      };
    });
  }, [state.subject, completedIds]);

  const availableTraps = getAvailableTraps();
  const defusedTraps = getDefusedTraps();
  const theme = getTheme(state.theme);
  const catEmoji = theme.catEmoji || "🐱";

  // XP metrics for TopBar
  const totalCompleted = completedIds.size;
  const totalSkills = (state.subject === "math" ? MATH_SKILLS : RUSSIAN_SKILLS).length;
  const xpPct = totalSkills > 0 ? Math.round((totalCompleted / totalSkills) * 100) : 0;
  const xpLabel = `${totalCompleted} / ${totalSkills}`;
  const playerLevel = Math.floor(totalCompleted / 5) + 1;

  const subjectPhrase = state.subject === "math"
    ? "Мур-р! Давай считать! 🐾"
    : "Мур-р! Учим русский! 📖";

  const generateLesson = useCallback((skillId: string) => {
    if (state.subject === "math") return generateMathLesson(skillId, 1);
    return generateRusLesson(skillId, 1);
  }, [state.subject]);

  // Click skill → generate a 5-question mastery session
  const handleSkillClick = useCallback(async (skill: Skill) => {
    if (skill.status === "locked") return;
    if (skill.status === "completed") return;

    const skillNode = getSkillById(state.subject, skill.id);
    if (!skillNode) {
      setActiveSkill(skill);
      setScreen("lesson");
      return;
    }

    // Difficulty = 1 at start, then auto-adaptive based on analytics
    const difficulty: DifficultyLevel = 1;

    setTaskLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    answerLockRef.current = false;

    try {
      const { tasks, source } = await generateAISession(skillNode, difficulty, 5, controller.signal);
      setSession({
        tasks: tasks.map(t => ({ ...t, difficulty })),
        currentIndex: 0,
        source,
        topicId: skillNode.id,
        correct: 0,
        wrong: 0,
      });
    } catch {
      setActiveSkill(skill);
      setScreen("lesson");
    } finally {
      setTaskLoading(false);
    }
  }, [state.subject]);

  // Handle one answer in the session
  const handleSessionAnswer = useCallback((isCorrect: boolean) => {
    if (!session || answerLockRef.current) return;
    const nextIndex = session.currentIndex + 1;
    const nextCorrect = session.correct + (isCorrect ? 1 : 0);
    const nextWrong = session.wrong + (isCorrect ? 0 : 1);

    // Reward gems for correct answer
    if (isCorrect) {
      addGems(calculateLessonReward(1, 1));
    }

    recordTaskSolved(state.subject, isCorrect);

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

    // Lock to prevent double processing of final answer
    answerLockRef.current = true;

    // Session complete — update skill progress always, proportional to score
    const skillId = session.topicId;
    const ratio = nextCorrect / session.tasks.length;
    updateSkillProgress(skillId, ratio);
    if (nextCorrect >= 4) {
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
    answerLockRef.current = false;
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
    abortRef.current?.abort();
    setScreen("main");
    setActiveSkill(null);
    setActiveStoryId(null);
    setActiveGame(null);
    setTaskLoading(false);
  }, []);

  const dailyStreakUpdate = useCallback(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem("kot_ucheniy_last_visit");
    if (!lastVisit) {
      localStorage.setItem("kot_ucheniy_last_visit", today);
      setState(prev => ({ ...prev, streak: 1 }));
      return;
    }
    if (lastVisit === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    localStorage.setItem("kot_ucheniy_last_visit", today);
    setState(prev => ({
      ...prev,
      streak: lastVisit === yesterday ? prev.streak + 1 : 1,
    }));
  }, [setState]);

  useEffect(() => {
    dailyStreakUpdate();
    // Preload Kokoro TTS model in background (non-blocking)
    import("./voice/engines/engine-kokoro").then(m => m.preload()).catch(() => {});
    return () => abortRef.current?.abort();
  }, []);

  // Track play time every 10s + check limit
  useEffect(() => {
    const limit = getDailyTimeLimitMs();
    if (limit <= 0) return;
    // Check immediately on mount (user may have already exceeded today)
    if (isTimeExceeded()) { setTimeExceeded(true); return; }
    const interval = setInterval(() => {
      recordPlayTime(10000);
      if (isTimeExceeded()) setTimeExceeded(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const lessonTasks = useMemo(() => {
    if (!activeSkill) return [];
    return generateLesson(activeSkill.id);
  }, [activeSkill, generateLesson]);

  // ── Role selection ──
  if (!userRole) {
    return <RoleScreen onSelect={(role) => setUserRole(role)} />;
  }

  // ── Privacy consent ──
  if (!privacyAccepted) {
    return <PrivacyModal onAccept={() => setPrivacyAccepted(true)} />;
  }

  // ── Parent mode: show PIN on first visit ──
  const parentFirstVisit = userRole === "parent" && !localStorage.getItem("kot_ucheniy_parent_pin");
  if (parentFirstVisit && !parentOpen) {
    return (
      <ParentPanel
        totalStars={totalCompleted}
        totalGems={state.gems}
        currentSubject={state.subject}
        onResetProgress={resetAllProgress}
        onClose={() => setParentOpen(false)}
      />
    );
  }

  // ── Parent panel (from long-press) ──
  if (parentOpen) {
    return (
      <ParentPanel
        totalStars={totalCompleted}
        totalGems={state.gems}
        currentSubject={state.subject}
        onResetProgress={resetAllProgress}
        onClose={() => setParentOpen(false)}
      />
    );
  }

  // ── Paywall (triggered from cat room) ──
  if (showPaywall) {
    return <PaywallModal onSubscribe={() => setShowPaywall(false)} onClose={() => setShowPaywall(false)} />;
  }

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
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}><FGOSDoodleGame subject={state.subject} onBack={goMain} onReward={(gems) => addGems(gems)} /></div>);
  }
  if (screen === "hillclimb") {
    return (<div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}><HillClimbCat onBack={goMain} /></div>);
  }

  // ── Main app shell ──
  return (
    <div className="min-h-screen flex items-start justify-center"
      style={{ background: "linear-gradient(160deg,#3B1F6B,#5B21B6,#7C3AED)" }}>
      <div className="relative w-full max-w-md min-h-screen flex flex-col overflow-hidden">
        {/* Header — unmounted on catroom to free GPU for full-screen 3D */}
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
            onParentAccess={() => setParentOpen(true)}
          />
        )}

        {tab === "home" && (
          <SkillsScreen
            skills={skills}
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
        {tab === "catroom" && roomReady && (
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
              onOpenPaywall={() => setShowPaywall(true)}
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
            difficulty={session.tasks[0]?.difficulty || 1}
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

        {/* Time Exceeded Overlay */}
        {timeExceeded && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6" style={{ background: "rgba(15,10,40,0.95)", backdropFilter: "blur(12px)" }}>
            <div className="text-center max-w-xs">
              <div className="text-7xl mb-4">⏰</div>
              <h2 className="text-white font-black text-2xl mb-2">Время вышло!</h2>
              <p className="text-purple-200 text-sm mb-1">Ты отлично позанимался сегодня!</p>
              <p className="text-purple-300/50 text-xs mb-6">Лимит игрового времени на сегодня исчерпан. Приходи завтра!</p>
              <div className="text-4xl mb-6">🐱💤</div>
              <button onClick={() => setParentOpen(true)}
                className="text-white/30 text-xs underline hover:text-white/60 transition-colors">
                Я родитель — снять лимит
              </button>
            </div>
          </div>
        )}

        {/* Parent Panel */}
        {parentOpen && (
          <ParentPanel
            totalStars={totalCompleted}
            totalGems={state.gems}
            currentSubject={state.subject}
            onResetProgress={resetAllProgress}
            onClose={() => setParentOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
