import { useState } from "react";

const ROLE_KEY = "kot_ucheniy_role";

export type UserRole = "child" | "parent" | null;

export function getStoredRole(): UserRole {
  const raw = localStorage.getItem(ROLE_KEY);
  if (raw === "child" || raw === "parent") return raw;
  return null;
}

export function setStoredRole(role: UserRole): void {
  if (role) localStorage.setItem(ROLE_KEY, role);
}

interface RoleScreenProps {
  onSelect: (role: "child" | "parent") => void;
}

export function RoleScreen({ onSelect }: RoleScreenProps) {
  const [selected, setSelected] = useState<"child" | "parent" | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    setStoredRole(selected);
    onSelect(selected);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, #2D1B69, #1a0a3e, #0a1628)" }}>
      <div className="w-full max-w-sm text-center" style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
        {/* Cat */}
        <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: "2.5s" }}>🐱</div>

        <h1 className="text-white font-black text-3xl mb-2">Кот Учёный</h1>
        <p className="text-purple-300 text-sm mb-8">Учимся, играем, говорим!</p>

        {/* Role cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelected("child")}
            className={`w-full p-5 rounded-3xl text-left transition-all active:scale-95 flex items-center gap-4 ${selected === "child"
              ? "bg-white/20 border-2 border-white shadow-lg shadow-purple-500/20"
              : "bg-white/8 border-2 border-white/10 hover:bg-white/12"}`}
          >
            <span className="text-4xl">👧</span>
            <div>
              <div className="text-white font-black text-lg">Я буду учиться</div>
              <div className="text-purple-300 text-xs">Уроки, игры, кот-друг!</div>
            </div>
          </button>

          <button
            onClick={() => setSelected("parent")}
            className={`w-full p-5 rounded-3xl text-left transition-all active:scale-95 flex items-center gap-4 ${selected === "parent"
              ? "bg-white/20 border-2 border-white shadow-lg shadow-purple-500/20"
              : "bg-white/8 border-2 border-white/10 hover:bg-white/12"}`}
          >
            <span className="text-4xl">👨‍👩‍👧</span>
            <div>
              <div className="text-white font-black text-lg">Я родитель</div>
              <div className="text-purple-300 text-xs">Контроль, статистика, лимиты</div>
            </div>
          </button>
        </div>

        {/* Confirm */}
        <button
          disabled={!selected}
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-30 active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
          Продолжить 🚀
        </button>

        {/* Hint */}
        <p className="text-purple-400/50 text-xs mt-4">
          Выбор можно изменить в настройках
        </p>
      </div>
    </div>
  );
}
