import { useState, useEffect, useCallback, useMemo } from "react";
import type { Tab, Subject, Skill, Trap } from "./types";
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

type Screen = "main" | "lesson" | "story" | "speed" | "memory" | "flappy" | "doodle" | "hillclimb";

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

  const skills = getCurrentSkills();
  const availableTraps = getAvailableTraps();
  const defusedTraps = getDefusedTraps();
  const theme = getTheme(state.theme);
  const catEmoji = theme.catEmoji || "🐱";

  const generateLesson = useCallback((skillId: string) => {
    if (state.subject === "math") return generateMathLesson(skillId);
    return generateRusLesson(skillId);
  }, [state.subject]);

  const handleSkillClick = useCallback((skill: Skill) => {
    if (skill.status === "locked") return;
    if (skill.status === "completed") return;
    setActiveSkill(skill);
    setScreen("lesson");
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

  const handleAddTrap = useCallback((trap: Trap) => {
    addTrap(trap);
  }, [addTrap]);

  const handleDefuseTrap = useCallback((trap: Trap) => {
    setDefusingTrap(trap);
  }, []);

  const handleTrapResolve = useCallback((correct: boolean) => {
    if (!defusingTrap) return;
    if (correct) {
      defuseTrap(defusingTrap.id);
    }
    setDefusingTrap(null);
    checkAchievements();
  }, [defusingTrap, defuseTrap, checkAchievements]);

  const handleRoomZoneClick = useCallback((zone: string) => {
    switch (zone) {
      case "computer":
        setShowFunGames(true);
        break;
      case "bed":
        updateCatState({ energy: Math.min(100, (state.cat.energy || 0) + 30) });
        break;
      case "plant":
        updateCatState({ hunger: Math.min(100, (state.cat.hunger || 0) + 10), energy: Math.min(100, (state.cat.energy || 0) + 10) });
        break;
      case "photos":
        setTab("stories");
        break;
      case "bookshelf":
        setTab("home");
        break;
    }
  }, [updateCatState, state.cat]);

  const handleStoryClick = useCallback((id: string) => {
    setActiveStoryId(id);
    setScreen("story");
  }, []);

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
    if (!lastVisit) {
      localStorage.setItem("kot_ucheniy_last_visit", today);
      return;
    }
    if (lastVisit === today) return;
    localStorage.setItem("kot_ucheniy_last_visit", today);
  }, []);

  useEffect(() => {
    dailyStreakUpdate();
  }, []);

  const lessonTasks = useMemo(() => {
    if (!activeSkill) return [];
    return generateLesson(activeSkill.id);
  }, [activeSkill, generateLesson]);

  // Full-screen overlays
  if (screen === "lesson" && activeSkill) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#2D1B69" }}>
        <LessonScreen
          skill={activeSkill}
          tasks={lessonTasks}
          onFinish={handleLessonFinish}
          onAddTrap={handleAddTrap}
          onClose={goMain}
        />
      </div>
    );
  }

  if (screen === "story" && activeStoryId) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#2D1B69" }}>
        <StoryScreen
          storyId={activeStoryId}
          onFinish={handleStoryFinish}
          onClose={goMain}
        />
      </div>
    );
  }

  if (screen === "speed") {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#1E1B4B" }}>
        <SpeedGame onBack={goMain} />
      </div>
    );
  }

  if (screen === "memory") {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#7C2D12" }}>
        <MemoryGame onBack={goMain} />
      </div>
    );
  }

  if (screen === "flappy") {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#1a0a3e" }}>
        <FlappyCat onBack={goMain} />
      </div>
    );
  }

  if (screen === "doodle") {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}>
        <DoodleCat onBack={goMain} />
      </div>
    );
  }

  if (screen === "hillclimb") {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: "#0a1628" }}>
        <HillClimbCat onBack={goMain} />
      </div>
    );
  }

  // Main app shell with tabs
  return (
    <div className="min-h-screen flex items-start justify-center"
      style={{ background: "linear-gradient(160deg,#3B1F6B,#5B21B6,#7C3AED)" }}>
      <div className="relative w-full max-w-md min-h-screen flex flex-col overflow-hidden">
        <div className="relative flex-shrink-0 overflow-hidden"
          style={{ background: "linear-gradient(160deg,#4C1D95 0%,#6D28D9 55%,#8B5CF6 100%)" }}>
          <TopBar gems={state.gems} streak={state.streak} />
          <div className="h-8 rounded-t-[2rem] mt-2.5" style={{ background: "#F0EBFF" }} />
        </div>

        {tab === "home" && (
          <SkillsScreen
            subject={state.subject}
            skills={skills}
            onSubjectChange={switchSubject}
            onSkillClick={handleSkillClick}
          />
        )}
        {tab === "stories" && (
          <StoriesList
            completed={state.storiesCompleted}
            onStoryClick={handleStoryClick}
          />
        )}
        {tab === "traps" && (
          <TrapPanel
            subject={state.subject}
            available={availableTraps}
            defused={defusedTraps}
            onDefuse={handleDefuseTrap}
          />
        )}
        {tab === "games" && (
          <GamesHub onGameClick={handleGameClick} />
        )}
        {tab === "catroom" && (
          <div className="flex-1 relative" style={{ background: "#1a1040" }}>
            <CatRoom
              cat={state.cat}
              totalPets={state.totalPets}
              ownedPetIds={state.pets}
              gems={state.gems}
              onPet={petCat}
              onUpdateCat={updateCatState}
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

        <BottomNav
          active={tab}
          onChange={setTab}
          trapsBadge={availableTraps.length}
        />

        {defusingTrap && (
          <TrapQuiz
            trap={defusingTrap}
            catEmoji={catEmoji}
            onResolve={(correct) => handleTrapResolve(correct)}
            onClose={() => setDefusingTrap(null)}
          />
        )}

        {showFunGames && (
          <FunGamesHub
            onGameClick={handleGameClick}
            onClose={() => setShowFunGames(false)}
          />
        )}
      </div>
    </div>
  );
}
