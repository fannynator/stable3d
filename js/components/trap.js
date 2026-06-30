// js/components/trap.js

import { $, $$, showToast } from '../utils.js';
import { state, saveState, getAvailableTraps, getDefusedTraps, unlockAchievement, checkAchievements } from '../state.js';
import { GEMS, TRAP } from '../config.js';
import { updateStats, showAchievementToast } from '../app.js';
import { renderSkillTree } from './skillTree.js';
import { spawnLeaves } from '../sounds.js';

export function updateTrapsBadge() {
    const badge = $('#trapsBadge');
    if (!badge) return;
    const a = getAvailableTraps().length;
    if (a > 0) { badge.style.display = 'flex'; badge.textContent = a; }
    else { badge.style.display = 'none'; }
}

export function renderTrapsPanel() {
    const av = getAvailableTraps();
    const de = getDefusedTraps();
    
    let html = '';
    
    if (!av.length && !de.length) {
        html = `
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:56px;margin-bottom:16px;">🏆</div>
                <div style="font-weight:800;font-size:16px;color:var(--text);margin-bottom:8px;">Ловушек нет!</div>
                <div style="color:var(--text-light);font-size:13px;line-height:1.5;">Ошибайся в уроках —<br>ловушки появятся здесь</div>
            </div>`;
    } else {
        if (av.length) {
            html += '<div style="font-weight:800;color:var(--red);margin-bottom:10px;display:flex;align-items:center;gap:6px;font-size:14px;"><span style="font-size:18px;">🔴</span> Нужно разобрать (' + av.length + ')</div>';
            av.forEach(t => {
                const subjEmoji = t.subject === 'math' ? '🧮' : '📝';
                html += `
                <div class="trap-item danger" data-id="${t.id}">
                    <div class="trap-icon">🪤</div>
                    <div class="trap-info">
                        <div class="trap-name">${t.question}</div>
                        <div class="trap-source">${subjEmoji} ${t.source}</div>
                    </div>
                    <span class="trap-status status-danger">Разобрать</span>
                </div>`;
            });
        }
        
        if (de.length) {
            html += '<div style="font-weight:800;color:var(--green);margin:16px 0 10px;display:flex;align-items:center;gap:6px;font-size:14px;"><span style="font-size:18px;">🟢</span> Разобраны (' + de.length + ')</div>';
            de.forEach(t => {
                const subjEmoji = t.subject === 'math' ? '🧮' : '📝';
                html += `
                <div class="trap-item defused">
                    <div class="trap-icon">✅</div>
                    <div class="trap-info">
                        <div class="trap-name">${t.question}</div>
                        <div class="trap-source">${subjEmoji} ${t.source}</div>
                    </div>
                    <span class="trap-status status-defused">Готово</span>
                </div>`;
            });
        }
    }
    
    $('#trapsList').innerHTML = html;
    $('#trapsSubtitle').textContent = av.length ? `${av.length} ловушка(и) ждёт разбора` : 'Все ловушки разобраны!';
    
    $$('#trapsList .trap-item.danger').forEach(el => {
        el.addEventListener('click', () => {
            const t = state.traps.find(x => x.id === el.dataset.id);
            if (t) openTrapQuiz(t);
        });
    });
}

function openTrapQuiz(trap) {
    const catEmoji = state.theme === 'forest' ? '🦊' : state.theme === 'space' ? '🚀' : state.theme === 'underwater' ? '🐙' : '🐱';
    
    let html = `
        <div style="text-align:center;margin-bottom:12px;">
            <div style="font-size:40px;margin-bottom:4px;">${catEmoji}</div>
            <div style="font-weight:800;font-size:14px;color:var(--text);">Кот-Учёный</div>
            <div style="font-size:12px;color:var(--text-light);margin-bottom:12px;">«Ой, тут мы ошиблись! Давай разберёмся вместе…»</div>
        </div>
        <div style="text-align:center;font-weight:700;font-size:13px;color:var(--text);margin-bottom:16px;line-height:1.5;padding:12px;background:var(--bg);border-radius:12px;border:1px solid var(--text-light);">
            ${trap.question}
        </div>`;
    
    if (trap.isInput) {
        html += `
            <div class="task-input-row">
                <input type="text" class="task-input" id="tqInp" placeholder="Ответ" autocomplete="off" style="color:var(--text);background:var(--bg);border-color:var(--text-light);">
                <button class="btn-submit" id="tqSub">✓</button>
            </div>`;
    } else {
        html += `<div class="task-options" id="tqOpts">`;
        trap.options.forEach((o, i) => {
            html += `<button class="task-option" data-idx="${i}" style="color:var(--text);border-color:var(--text-light);">${o}</button>`;
        });
        html += `</div>`;
    }
    
    html += `
        <div class="lesson-explanation" id="tqExpl"></div>
        <button class="panel-close" id="tqClose" style="margin-top:12px;">Закрыть</button>`;
    
    $('#trapQuizCard').innerHTML = html;
    $('#trapQuizOverlay').classList.add('active');

    const expl = $('#tqExpl');
    let done = false;

    const success = () => {
        trap.defuses++;
        
        const reward = GEMS.TRAP_BASE_REWARD + trap.defuses * GEMS.TRAP_DEFUSE_MULTIPLIER;
        state.gems += reward;
        updateStats();

        if (trap.defuses === 1 && trap.id && trap.id.startsWith('lesson_')) {
            const parts = trap.id.split('_');
            if (parts.length >= 2) {
                const skillId = parts[1];
                let skill = state.skills.math.find(s => s.id === skillId) || state.skills.russian.find(s => s.id === skillId);
                if (skill && skill.status === 'current' && skill.progress < 100) {
                    const allTraps = state.traps.filter(t => t.id && t.id.startsWith('lesson_' + skillId + '_'));
                    const defusedCount = allTraps.filter(t => t.defuses >= 1).length;
                    const totalTraps = allTraps.length;
                    const remaining = 100 - skill.progress;
                    const remainingTraps = totalTraps - defusedCount + 1;
                    const progressForThis = Math.min(20, Math.ceil(remaining / remainingTraps));
                    skill.progress = Math.min(100, skill.progress + progressForThis);
                    if (skill.progress >= 100) {
                        skill.status = 'completed';
                        const subject = trap.subject || state.subject;
                        const skills = state.skills[subject];
                        const ci = skills.findIndex(s => s.id === skillId);
                        if (ci >= 0 && ci + 1 < skills.length && skills[ci + 1].status === 'locked') {
                            skills[ci + 1].status = 'current';
                            showToast('🔓', 'Новый навык открыт через ловушки!', $('#toast'));
                            spawnLeaves();
                        }
                    }
                    saveState();
                    renderSkillTree();
                }
            }
        }

        showToast(
            trap.defuses >= TRAP.MAX_DEFUSES ? '🏆' : '✅',
            trap.defuses >= TRAP.MAX_DEFUSES ? 'Ловушка разобрана!' : `+${reward} 💎`,
            $('#toast')
        );
        checkAchievements((n, d) => showAchievementToast(n, d));
        updateTrapsBadge();
        renderTrapsPanel();
        saveState();
        setTimeout(() => $('#trapQuizOverlay').classList.remove('active'), 600);
    };

    if (trap.isInput) {
        const inp = $('#tqInp');
        const btn = $('#tqSub');
        const submit = () => {
            if (done) return;
            done = true;
            btn.disabled = true;
            inp.disabled = true;
            if (inp.value.trim().toLowerCase() === String(trap.answer).toLowerCase()) {
                inp.style.borderColor = 'var(--green)';
                inp.style.background = 'rgba(16,185,129,0.2)';
                expl.innerHTML = `<div style="font-size:24px;margin-bottom:4px;">${catEmoji}</div><div>«Отлично! А знаешь почему?»</div><div style="margin-top:6px;font-weight:700;">✅ ${trap.explanation}</div>`;
                expl.className = 'lesson-explanation show good';
                success();
            } else {
                inp.style.borderColor = 'var(--red)';
                inp.style.background = 'rgba(239,68,68,0.15)';
                expl.innerHTML = `<div style="font-size:24px;margin-bottom:4px;">${catEmoji}</div><div>«Вот тут подвох! Смотри…»</div><div style="margin-top:6px;font-weight:700;">🤔 ${trap.explanation}</div><div style="margin-top:4px;">✅ Правильный ответ: ${trap.answer}</div>`;
                expl.className = 'lesson-explanation show bad';
            }
        };
        btn.addEventListener('click', submit);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        setTimeout(() => inp.focus(), 300);
    } else {
        const opts = $$('#tqOpts .task-option');
        opts.forEach(o => o.addEventListener('click', () => {
            if (done) return;
            done = true;
            opts.forEach(x => x.style.pointerEvents = 'none');
            const idx = parseInt(o.dataset.idx);
            if (idx === trap.correct) {
                o.classList.add('correct-pick');
                expl.innerHTML = `<div style="font-size:24px;margin-bottom:4px;">${catEmoji}</div><div>«Отлично! А знаешь почему?»</div><div style="margin-top:6px;font-weight:700;">✅ ${trap.explanation}</div>`;
                expl.className = 'lesson-explanation show good';
                success();
            } else {
                o.classList.add('wrong-pick');
                opts[trap.correct].classList.add('correct-pick');
                expl.innerHTML = `<div style="font-size:24px;margin-bottom:4px;">${catEmoji}</div><div>«Вот тут подвох! Смотри…»</div><div style="margin-top:6px;font-weight:700;">🤔 ${trap.explanation}</div>`;
                expl.className = 'lesson-explanation show bad';
            }
        }));
    }
    $('#tqClose').addEventListener('click', () => {
        $('#trapQuizOverlay').classList.remove('active');
        updateTrapsBadge();
        renderTrapsPanel();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = $('#trapQuizOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                updateTrapsBadge();
                renderTrapsPanel();
            }
        });
    }
});