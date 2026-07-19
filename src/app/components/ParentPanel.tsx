import { useState, useMemo, useCallback } from "react";
import type { Subject } from "../../types";

const PIN_KEY = "kot_ucheniy_parent_pin";
const LIMIT_KEY = "kot_ucheniy_daily_limit";
const STATS_KEY = "kot_ucheniy_stats";
const STATS_HISTORY_KEY = "kot_ucheniy_stats_history";

interface DailyStats {
  date: string;
  tasksSolved: number;
  correctAnswers: number;
  timeSpentMs: number;
  mathTasks: number;
  rusTasks: number;
}

interface ParentPanelProps {
  totalStars: number;
  totalGems: number;
  currentSubject: Subject;
  onResetProgress: () => void;
  onClose: () => void;
}

function loadStats(): DailyStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return createEmptyStats();
    const data = JSON.parse(raw);
    if (data.date === new Date().toDateString()) return data;
  } catch {}
  return createEmptyStats();
}

function createEmptyStats(): DailyStats {
  return {
    date: new Date().toDateString(),
    tasksSolved: 0,
    correctAnswers: 0,
    timeSpentMs: 0,
    mathTasks: 0,
    rusTasks: 0,
  };
}

function saveStats(stats: DailyStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  // Save to history
  const history = loadStatsHistory();
  history[stats.date] = stats;
  // Keep last 7 days
  const keys = Object.keys(history).sort().slice(-7);
  const trimmed: Record<string, DailyStats> = {};
  for (const k of keys) trimmed[k] = history[k];
  localStorage.setItem(STATS_HISTORY_KEY, JSON.stringify(trimmed));
}

function loadStatsHistory(): Record<string, DailyStats> {
  try {
    const raw = localStorage.getItem(STATS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordTaskSolved(subject: Subject, correct: boolean) {
  const stats = loadStats();
  stats.tasksSolved++;
  if (correct) stats.correctAnswers++;
  if (subject === "math") stats.mathTasks++;
  else stats.rusTasks++;
  saveStats(stats);
}

export function recordStarEarned() {
  // deprecated — no stars system anymore, progress tracked via tasks
}

export function recordPlayTime(ms: number) {
  const stats = loadStats();
  stats.timeSpentMs += ms;
  saveStats(stats);
}

export function getDailyTimeLimitMs(): number {
  const raw = localStorage.getItem(LIMIT_KEY);
  const minutes = raw ? parseInt(raw) : 0;
  return minutes > 0 ? minutes * 60 * 1000 : 0;
}

export function isTimeExceeded(): boolean {
  const limit = getDailyTimeLimitMs();
  if (limit <= 0) return false;
  return loadStats().timeSpentMs >= limit;
}

export function ParentPanel({ totalStars, totalGems, currentSubject, onResetProgress, onClose }: ParentPanelProps) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [settingPin, setSettingPin] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(() => {
    const raw = localStorage.getItem(LIMIT_KEY);
    return raw ? parseInt(raw) : 0;
  });
  const [stats] = useState(loadStats);
  const [tab, setTab] = useState<"stats" | "week" | "limit" | "reset">("stats");
  const weekHistory = useMemo(() => loadStatsHistory(), []);

  const savedPin = localStorage.getItem(PIN_KEY);

  const checkPin = useCallback((entered: string) => {
    if (entered.length < 4) return;
    if (entered === savedPin || (savedPin === null && entered === "0000")) {
      setAuthenticated(true);
      setPin("");
    } else {
      setPin("");
    }
  }, [savedPin]);

  const handleSetupPin = useCallback(() => {
    if (setupPin.length < 4 || setupConfirm.length < 4) return;
    if (setupPin !== setupConfirm) {
      setSetupPin("");
      setSetupConfirm("");
      return;
    }
    localStorage.setItem(PIN_KEY, setupPin);
    setSettingPin(false);
    setAuthenticated(true);
  }, [setupPin, setupConfirm]);

  const handleSetLimit = useCallback((minutes: number) => {
    setDailyLimit(minutes);
    localStorage.setItem(LIMIT_KEY, String(minutes));
  }, []);

  // PIN entry screen
  if (!authenticated) {
    if (savedPin === null && !settingPin) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,10,40,0.92)", backdropFilter: "blur(10px)" }}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔐</div>
              <h2 className="font-black text-xl text-gray-800">Родительский раздел</h2>
              <p className="text-gray-500 text-sm mt-1">Придумайте PIN-код (4 цифры). Без него не выйти.</p>
            </div>
            {!settingPin ? (
              <button onClick={() => setSettingPin(true)}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>
                Установить PIN-код
              </button>
            ) : (
              <div className="space-y-3">
                <input type="password" inputMode="numeric" maxLength={4} value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Придумайте 4 цифры" className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl border-2 border-purple-200 outline-none focus:border-purple-500" />
                <input type="password" inputMode="numeric" maxLength={4} value={setupConfirm} onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Повторите PIN" className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl border-2 border-purple-200 outline-none focus:border-purple-500" />
                {setupPin.length === 4 && setupConfirm.length === 4 && setupPin !== setupConfirm && (
                  <p className="text-red-500 text-sm text-center">PIN-коды не совпадают!</p>
                )}
                <button onClick={handleSetupPin} disabled={setupPin.length < 4 || setupConfirm.length < 4}
                  className="w-full py-3 rounded-2xl font-black text-white text-sm disabled:opacity-40 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>
                  Сохранить
                </button>
              </div>
            )}
            {savedPin !== null && (
              <button onClick={onClose} className="w-full mt-3 py-3 rounded-2xl font-bold text-gray-400 text-sm">Закрыть</button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(15,10,40,0.92)", backdropFilter: "blur(10px)" }}>
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🔐</div>
            <h2 className="font-black text-xl text-gray-800">Введите PIN-код</h2>
            <p className="text-gray-400 text-sm mt-1">Родительский раздел</p>
          </div>
          <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setPin(v);
            if (v.length === 4) setTimeout(() => checkPin(v), 150);
          }}
            placeholder="Введите PIN"
            className="w-full text-center text-3xl tracking-[0.5em] py-3 rounded-2xl border-2 border-purple-200 outline-none focus:border-purple-500" />
          <button onClick={onClose} className="w-full mt-4 py-3 rounded-2xl font-bold text-gray-400 text-sm">Закрыть</button>
        </div>
      </div>
    );
  }

  // Authenticated dashboard
  const accuracy = stats.tasksSolved > 0 ? Math.round((stats.correctAnswers / stats.tasksSolved) * 100) : 0;
  const playMinutes = Math.round(stats.timeSpentMs / 60000);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-12 overflow-y-auto" style={{ background: "rgba(15,10,40,0.92)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3" style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-black text-lg">📊 Родительский раздел</h2>
              <p className="text-purple-200 text-xs mt-0.5">Статистика и настройки</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">✕</button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-white/15 rounded-2xl p-1">
            {(["stats", "week", "limit", "reset"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${tab === t ? "bg-white text-purple-700" : "text-white/70"}`}>
                {t === "stats" ? "📈 Сегодня" : t === "week" ? "📅 Неделя" : t === "limit" ? "⏱️ Лимит" : "🔄 Сброс"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === "stats" && (
            <div className="space-y-3">
              <h3 className="font-black text-sm text-gray-600 uppercase">Сегодня</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox emoji="✅" label="Решено задач" value={String(stats.tasksSolved)} />
                <StatBox emoji="🎯" label="Правильно" value={`${accuracy}%`} sub={`${stats.correctAnswers}/${stats.tasksSolved}`} />
                <StatBox emoji="⏱️" label="Время игры" value={`${playMinutes} мин`} />
                <StatBox emoji="📊" label="Точность" value={`${accuracy}%`} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <StatBox emoji="🧮" label="Математика" value={String(stats.mathTasks)} />
                <StatBox emoji="📝" label="Русский" value={String(stats.rusTasks)} />
              </div>
              <h3 className="font-black text-sm text-gray-600 uppercase mt-4">Всего</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox emoji="⭐" label="Всего звёзд" value={String(totalStars)} />
                <StatBox emoji="💎" label="Всего гемов" value={String(totalGems)} />
              </div>
            </div>
          )}

          {tab === "week" && (
            <div className="space-y-2">
              <h3 className="font-black text-sm text-gray-600 uppercase">Последние 7 дней</h3>
              {Object.keys(weekHistory).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Нет данных за неделю</p>
              ) : (
                Object.entries(weekHistory)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([date, day]) => {
                    const d = new Date(date);
                    const dayName = d.toLocaleDateString("ru-RU", { weekday: "short" });
                    const dayAcc = day.tasksSolved > 0 ? Math.round((day.correctAnswers / day.tasksSolved) * 100) : 0;
                    return (
                      <div key={date} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                        <div>
                          <div className="font-bold text-sm text-gray-700">{dayName}, {d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</div>
                          <div className="text-xs text-gray-400">{day.tasksSolved} задач · {Math.round(day.timeSpentMs / 60000)} мин</div>
                        </div>
                        <div className="font-black text-lg" style={{ color: dayAcc >= 70 ? "#10B981" : dayAcc >= 40 ? "#F59E0B" : "#EF4444" }}>
                          {dayAcc}%
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {tab === "limit" && (
            <div className="space-y-3">
              <h3 className="font-black text-sm text-gray-600 uppercase">Дневной лимит времени</h3>
              <p className="text-xs text-gray-500">Когда время истечёт, приложение покажет экран «Время вышло» и ребёнок не сможет продолжить.</p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 15, 30, 45, 60, 90].map(m => (
                  <button key={m} onClick={() => handleSetLimit(m)}
                    className={`py-3 rounded-2xl font-bold text-sm transition-all ${dailyLimit === m ? "bg-purple-500 text-white shadow-lg" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}>
                    {m === 0 ? "Без лимита" : `${m} мин`}
                  </button>
                ))}
              </div>
              {dailyLimit > 0 && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs text-amber-800 font-semibold">Лимит {dailyLimit} мин/день. Сегодня использовано: {playMinutes} мин.</p>
                </div>
              )}
            </div>
          )}

          {tab === "reset" && (
            <div className="space-y-3">
              <h3 className="font-black text-sm text-gray-600 uppercase">Сброс прогресса</h3>
              <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200">
                <p className="text-sm text-red-700 font-semibold mb-2">⚠️ Это действие нельзя отменить!</p>
                <p className="text-xs text-red-500 mb-3">Будут удалены: прогресс по всем навыкам, звёзды, ловушки, достижения, питомцы, шляпы.</p>
                <button onClick={() => { onResetProgress(); onClose(); }}
                  className="w-full py-3 rounded-2xl font-black text-white text-sm active:scale-95"
                  style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
                  Сбросить всё
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <p className="text-sm text-purple-700 font-semibold mb-1">🔑 Сменить PIN-код</p>
                <button onClick={() => { setAuthenticated(false); setSettingPin(true); }}
                  className="mt-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs">
                  Сменить PIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-black text-xl text-gray-800">{value}</div>
      <div className="text-[10px] text-gray-400 font-bold uppercase">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
