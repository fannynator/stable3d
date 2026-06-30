// js/components/profile.js

import { $, $$, showToast } from '../utils.js';
import { state, resetAllProgress, applyTheme, saveState, checkThemeUnlocks } from '../state.js';
import { SUBJECTS, THEMES, countCompletedLessons, CAT_SPEECH } from '../config.js';
import { renderSkillTree } from './skillTree.js';
import { updateStats } from '../app.js';

export function renderProfile() {
    const im = state.subject === SUBJECTS.MATH;
    const done = (state.storiesCompleted.math ? 1 : 0) + (state.storiesCompleted.rus1 ? 1 : 0) + (state.storiesCompleted.rus2 ? 1 : 0);
    const def = state.traps.reduce((s, t) => s + t.defuses, 0);
    const unl = Object.values(state.achievements).filter(a => a.unlocked).length;
    const total = Object.values(state.achievements).length;
    const totalLessons = countCompletedLessons(state.skills[SUBJECTS.MATH]) + countCompletedLessons(state.skills[SUBJECTS.RUSSIAN]);

    let html = `
    <div class="profile-hero">
        <div class="profile-avatar">${im ? '🐱' : '😺'}</div>
        <div class="profile-name">Кот Учёный</div>
        <div class="profile-role">${im ? 'Математик' : 'Филолог'} · Уровень ${totalLessons + 1}</div>
        <div class="profile-stats-row">
            <div class="profile-stat-card">
                <div class="stat-icon">📚</div>
                <div class="stat-value">${totalLessons}</div>
                <div class="stat-label">Уроков</div>
            </div>
            <div class="profile-stat-card">
                <div class="stat-icon">🧮</div>
                <div class="stat-value">${done}</div>
                <div class="stat-label">Историй</div>
            </div>
            <div class="profile-stat-card">
                <div class="stat-icon">🪤</div>
                <div class="stat-value">${def}</div>
                <div class="stat-label">Ловушек</div>
            </div>
            <div class="profile-stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">${unl}</div>
                <div class="stat-label">Ачивок</div>
            </div>
        </div>
    </div>

    <div class="profile-section">
        <div class="profile-section-title">
            <span>🏆</span> Достижения <span class="section-badge">${unl}/${total}</span>
        </div>
        <div class="ach-grid">`;

    Object.values(state.achievements).forEach(a => {
        const cls = a.unlocked ? 'unlocked' : 'locked';
        const icon = a.unlocked ? a.name.split(' ')[0] : '🔒';
        const name = a.name.split(' ').slice(1).join(' ');
        html += `
        <div class="ach-item ${cls}">
            <div class="ach-icon">${icon}</div>
            <div class="ach-name">${name}</div>
            <div class="ach-desc">${a.desc}</div>
        </div>`;
    });

    // Селектор тем
    html += `
        </div>
    </div>

    <div class="profile-section">
        <div class="profile-section-title"><span>🎨</span> Оформление</div>
        <div class="theme-grid">`;

    const totalDone = countCompletedLessons(state.skills[SUBJECTS.MATH]) + countCompletedLessons(state.skills[SUBJECTS.RUSSIAN]);
    Object.values(THEMES).forEach(t => {
        const isUnlocked = t.unlocked || (t.unlockAt && totalDone >= t.unlockAt);
        const isActive = state.theme === t.id;
        const lockEmoji = isUnlocked ? '' : `<span class="theme-lock">🔒</span>`;
        html += `
        <div class="theme-card ${isActive ? 'active' : ''} ${isUnlocked ? '' : 'locked'}" data-theme="${t.id}" data-unlocked="${isUnlocked ? '1' : '0'}">
            ${lockEmoji}
            <div class="theme-emoji">${t.catEmoji}</div>
            <div class="theme-name">${t.name}</div>
        </div>`;
    });

    html += `
        </div>
    </div>
    <button class="reset-progress-btn" id="resetProgressBtn">🔄 Сбросить прогресс</button>`;

    $('#profileContent').innerHTML = html;

    // Переключение тем
    $$('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const themeId = card.dataset.theme;
            const unlocked = card.dataset.unlocked === '1';
            if (!unlocked) {
                const t = THEMES[themeId];
                showToast('🔒', `Разблокируется после ${t.unlockAt} уроков`, $('#toast'));
                return;
            }
            applyTheme(themeId);
            saveState();
            // Обновляем активную карточку
            $$('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            // Обновляем шапку под текущий предмет
            const im = state.subject === SUBJECTS.MATH;
            const headerBar = document.getElementById('headerBar');
            const catStage = document.getElementById('catStage');
            if (headerBar) headerBar.className = 'header ' + (im ? 'math-header' : 'rus-header');
            if (catStage) catStage.className = 'cat-stage ' + (im ? 'math-stage' : 'rus-stage');
            const btnMath = document.getElementById('btnMath');
            const btnRus = document.getElementById('btnRus');
            if (btnMath) btnMath.classList.toggle('active', im);
            if (btnRus) btnRus.classList.toggle('active', !im);
            const appEl = document.getElementById('app');
            if (appEl) appEl.className = 'app' + (im ? '' : ' rus-mode');
            const catSpeech = document.getElementById('catSpeech');
            if (catSpeech) catSpeech.textContent = im ? CAT_SPEECH.math : CAT_SPEECH.russian;
        });
    });

    // Сброс прогресса
    $('#resetProgressBtn').addEventListener('click', () => {
        if (confirm('Точно сбросить ВЕСЬ прогресс? Это нельзя отменить!')) {
            if (confirm('Последний шанс. Сбросить?')) {
                resetAllProgress();
                renderProfile();
                renderSkillTree();
                updateStats();
                const catSpeech = $('#catSpeech');
                const catBody = $('#catBody');
                if (catSpeech) catSpeech.textContent = 'Мур! Начинаем заново!';
                if (catBody) catBody.textContent = '🐱';
                document.getElementById('headerBar').className = 'header math-header';
                document.getElementById('catStage').className = 'cat-stage math-stage';
                document.getElementById('app').classList.remove('rus-mode');
            }
        }
    });
}