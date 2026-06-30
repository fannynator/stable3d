import { $, $$, showToast } from '../utils.js';
import { getCurrentSkills, state } from '../state.js';
import { startLesson } from './lesson.js';

export function renderSkillTree() {
    const skills = getCurrentSkills();
    const container = $('#skillTree');
    if (!container) return;

    container.innerHTML = '<div class="skill-path">' + skills.map(s => {
        const nc = s.status === 'completed' ? 'completed' : s.status === 'current' ? 'current' : '';
        const cc = s.status === 'locked' ? 'locked' : s.status === 'completed' ? 'completed' : 'current';
        const se = s.status === 'completed' ? '✅' : s.status === 'current' ? '▶️' : '🔒';
        const pt = s.progress === 100 ? 'Пройдено' : s.progress > 0 ? `${s.progress}%` : (s.status === 'current' ? 'Готов к старту 🚀' : 'Не начато');
        return `<div class="skill-node ${nc}">
            <div class="skill-card ${cc}" data-id="${s.id}" data-status="${s.status}">
                <div class="skill-icon-box" style="background:${s.color}15;color:${s.color};">${s.icon}</div>
                <div class="skill-info">
                    <div class="skill-name">${s.name}</div>
                    <div class="skill-progress-text">${pt}</div>
                    <div class="skill-progress-bar"><div class="skill-progress-fill" style="width:${s.progress}%;background:${s.color};"></div></div>
                </div>
                <div class="skill-badge">${se}</div>
            </div>
        </div>`;
    }).join('') + '</div>';

    $$('#skillTree .skill-card').forEach(card => {
        card.addEventListener('click', () => {
            const st = card.dataset.status;
            const id = card.dataset.id;
            if (st === 'locked') showToast('🔒', 'Пройди предыдущий!', $('#toast'));
            else if (st === 'completed') showToast('✅', 'Уже пройден!', $('#toast'));
            else startLesson(id);
        });
    });
}