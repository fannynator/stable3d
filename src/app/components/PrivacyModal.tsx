import { useState } from "react";

const PRIVACY_KEY = "kot_ucheniy_privacy_v1";

export function hasAcceptedPrivacy(): boolean {
  return localStorage.getItem(PRIVACY_KEY) === "true";
}

interface PrivacyModalProps {
  onAccept: () => void;
}

export function PrivacyModal({ onAccept }: PrivacyModalProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 10, 40, 0.92)", backdropFilter: "blur(10px)" }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ animation: "fadeSlideUp 0.35s ease-out" }}>
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🐱</div>
          <h1 className="font-black text-xl text-gray-800">Кот Учёный</h1>
          <p className="text-purple-500 font-bold text-sm mt-1">Приложение для обучения</p>
        </div>

        <div className="text-sm text-gray-600 leading-relaxed space-y-3 mb-5">
          <h2 className="font-black text-base text-gray-800">Политика конфиденциальности</h2>

          <p>
            Приложение «Кот Учёный» создано для обучения детей 6-12 лет математике и русскому языку.
            Мы серьёзно относимся к безопасности и приватности.
          </p>

          <h3 className="font-black text-sm text-gray-700">Какие данные мы собираем?</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Никаких личных данных</strong> — мы не спрашиваем имя, возраст, email или телефон.</li>
            <li>Прогресс обучения (звёзды, пройденные уроки) хранится <strong>только на вашем устройстве</strong> в памяти браузера (localStorage).</li>
            <li>Настройки (тема, шляпы кота, питомцы) — тоже только локально.</li>
          </ul>

          <h3 className="font-black text-sm text-gray-700">Используется ли интернет?</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Приложение может <strong>опционально</strong> использовать AI-сервис для генерации новых учебных заданий.</li>
            <li>При этом отправляется только тема задания (например, «Сложение, 2 класс») — <strong>никакие личные данные не передаются</strong>.</li>
            <li>AI-генерация необязательна: все задания доступны в офлайн-режиме без интернета.</li>
          </ul>

          <h3 className="font-black text-sm text-gray-700">Реклама и покупки</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>В приложении <strong>нет рекламы</strong>.</li>
            <li>Все игровые предметы (шляпы, питомцы) <strong>зарабатываются бесплатно</strong> за успехи в учёбе.</li>
            <li>Премиум-подписка (299 ₽/мес) открывает AI-голос кота, распознавание речи и безлимитные уроки.</li>
          </ul>

          <h3 className="font-black text-sm text-gray-700">Безопасность детей</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Контент соответствует возрасту 6+.</li>
            <li>Нет чатов, комментариев, публикации пользовательского контента.</li>
            <li>Нет ссылок на внешние сайты.</li>
          </ul>

          <p className="text-xs text-gray-400 pt-2">
            По вопросам: поддержка через страницу приложения в RuStore.
            Политика соответствует требованиям 152-ФЗ «О персональных данных».
          </p>
        </div>

        <label className="flex items-start gap-3 mb-4 p-3 rounded-2xl bg-purple-50 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-purple-600"
          />
          <span className="text-sm text-gray-700 font-semibold">
            Я — родитель или законный представитель. Я ознакомлен(а) с политикой конфиденциальности и разрешаю ребёнку пользоваться приложением.
          </span>
        </label>

        <button
          disabled={!agreed}
          onClick={() => {
            localStorage.setItem(PRIVACY_KEY, "true");
            onAccept();
          }}
          className="w-full py-3.5 rounded-2xl font-black text-white text-sm disabled:opacity-40 active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>
          Продолжить 🚀
        </button>
      </div>
    </div>
  );
}
