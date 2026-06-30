// js/components/lesson.js

import { $, $$, showToast } from '../utils.js';
import { state, saveState, getCurrentSkills, unlockAchievement, checkAchievements } from '../state.js';
import { GEMS, SKILL, CAT_SPEECH, STORAGE_KEY } from '../config.js';
import { generateMathLesson } from '../generators/math.js';
import { generateRusLesson } from '../generators/russian.js';
import { renderTask } from './taskRenderer.js';
import { renderSkillTree } from './skillTree.js';
import { updateTrapsBadge } from './trap.js';
import { updateStats, showAchievementToast } from '../app.js';
import { playSound, spawnLeaves } from '../sounds.js';

const LESSON_STORAGE_KEY = STORAGE_KEY + '_lesson_progress';
let stepHistory = [];

function generateLesson(skillId, subject) {
    if (subject === 'math') return generateMathLesson(skillId);
    return generateRusLesson(skillId);
}

function saveLessonProgress() {
    if (!state.currentLesson) return;
    const progress = {
        skillId: state.lessonSkillId, subject: state.subject,
        step: state.lessonStep, tasks: state.lessonTasks,
        correct: state.lessonCorrect, wrong: state.lessonWrong,
        stepHistory: stepHistory
    };
    localStorage.setItem(LESSON_STORAGE_KEY, JSON.stringify(progress));
}

function loadLessonProgress() {
    const saved = localStorage.getItem(LESSON_STORAGE_KEY);
    if (!saved) return false;
    try {
        const progress = JSON.parse(saved);
        if (!progress.skillId || !progress.tasks || progress.tasks.length === 0) return false;
        state.currentLesson = progress.skillId; state.lessonSkillId = progress.skillId;
        state.lessonStep = progress.step; state.lessonTasks = progress.tasks;
        state.lessonCorrect = progress.correct; state.lessonWrong = progress.wrong;
        stepHistory = progress.stepHistory || [];
        return true;
    } catch (e) { return false; }
}

function clearLessonProgress() { localStorage.removeItem(LESSON_STORAGE_KEY); }

function initStepHistory() {
    const total = state.lessonTasks.length;
    stepHistory = new Array(total).fill('pending');
}

function updateProgressBar() {
    const total = state.lessonTasks.length;
    const done = state.lessonStep;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const bar = $('#lessonProgressBar');
    if (bar) { bar.style.width = percent + '%'; bar.classList.toggle('complete', percent >= 100); }
}

function renderDots() {
    const container = $('#lessonSteps');
    if (!container) return;
    const total = state.lessonTasks.length;
    let html = '';
    for (let i = 0; i < total; i++) {
        let dotClass = 'lstep-dot';
        if (stepHistory[i] === 'correct') dotClass += ' done';
        else if (stepHistory[i] === 'wrong') dotClass += ' wrong';
        else if (i === state.lessonStep && stepHistory[i] === 'pending') dotClass += ' current';
        html += `<span class="${dotClass}"></span>`;
    }
    container.innerHTML = html;
}

export function startLesson(skillId) {
    const saved = localStorage.getItem(LESSON_STORAGE_KEY);
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            if (progress.skillId === skillId && progress.tasks && progress.tasks.length > 0) {
                const skill = getCurrentSkills().find(s => s.id === skillId);
                const skillName = skill ? skill.name : 'Неизвестно';
                const resume = confirm(`🐱 У тебя есть незавершённый урок!\n\n📚 Тема: «${skillName}»\n📍 Пройдено: ${progress.step} из ${progress.tasks.length} заданий\n✅ Верных ответов: ${progress.correct}\n\nПродолжить урок?`);
                if (resume && loadLessonProgress()) {
                    const im = state.subject === 'math';
                    $('#lessonTitle').textContent = (im ? '🧮 ' : '📝 ') + skillName;
                    $('#lessonContainer').className = 'lesson-container ' + (im ? 'math-lesson' : 'rus-lesson');
                    $('#lessonHeader').className = 'lesson-header ' + (im ? 'math-bar' : 'rus-bar');
                    $('#lessonNextBtn').className = 'lesson-next ' + (im ? 'math-next' : 'rus-next');
                    $('#btnLessonFinish').className = 'btn-lesson-finish ' + (im ? 'math-finish' : 'rus-finish');
                    updateProgressBar(); renderDots();
                    $('#lessonOverlay').classList.add('active');
                    $('#lessonNextBtn').classList.remove('show');
                    $('#lessonFinishBlock').classList.remove('show');
                    $('#lessonScene').style.display = 'flex';
                    renderLessonStep();
                    return;
                }
            }
        } catch (e) {}
        clearLessonProgress();
    }

    const im = state.subject === 'math';
    state.currentLesson = skillId; state.lessonSkillId = skillId;
    state.lessonStep = 0; state.lessonCorrect = 0; state.lessonWrong = 0;
    state.lessonTasks = generateLesson(skillId, state.subject);
    initStepHistory();

    const skill = getCurrentSkills().find(s => s.id === skillId);
    $('#lessonTitle').textContent = (im ? '🧮 ' : '📝 ') + (skill ? skill.name : 'Урок');
    $('#lessonContainer').className = 'lesson-container ' + (im ? 'math-lesson' : 'rus-lesson');
    $('#lessonHeader').className = 'lesson-header ' + (im ? 'math-bar' : 'rus-bar');
    $('#lessonNextBtn').className = 'lesson-next ' + (im ? 'math-next' : 'rus-next');
    $('#btnLessonFinish').className = 'btn-lesson-finish ' + (im ? 'math-finish' : 'rus-finish');

    updateProgressBar(); renderDots();
    $('#lessonOverlay').classList.add('active');
    $('#lessonNextBtn').classList.remove('show');
    $('#lessonFinishBlock').classList.remove('show');
    $('#lessonScene').style.display = 'flex';
    saveLessonProgress();
    renderLessonStep();
}

export async function closeLesson() {
    $('#lessonOverlay').classList.remove('active');
    state.currentLesson = null; state.lessonTasks = []; stepHistory = [];
    renderSkillTree();
    checkAchievements((name, desc) => showAchievementToast(name, desc));
    updateTrapsBadge();
    saveState();
}

function unlockNext(currentSkill) {
    const skills = getCurrentSkills();
    const ci = skills.findIndex(s => s.id === currentSkill.id);
    if (ci >= 0 && ci + 1 < skills.length && skills[ci + 1].status === 'locked') {
        skills[ci + 1].status = 'current';
        showToast('🔓', 'Новый навык открыт!', $('#toast'));
        spawnLeaves();
    }
}

async function renderLessonStep() {
    const task = state.lessonTasks[state.lessonStep];
    if (!task) { finishLesson(); return; }

    $('#lessonNextBtn').classList.remove('show');
    $('#lessonFinishBlock').classList.remove('show');
    const scene = $('#lessonScene');

    if (scene.children.length > 0) {
        scene.classList.add('task-transition');
        await new Promise(r => setTimeout(r, 200));
        scene.classList.remove('task-transition');
    }
    scene.style.display = 'flex';
    scene.style.animation = 'none'; scene.offsetHeight; scene.style.animation = '';

    const result = await renderTask(scene, task, { isBonus: false });

    if (state.lessonStep < stepHistory.length) {
        stepHistory[state.lessonStep] = result.isCorrect ? 'correct' : 'wrong';
    }

    if (result.isCorrect) { state.lessonCorrect++; }
    else { state.lessonWrong++; addLessonTrap(task); }

    renderDots(); updateProgressBar(); saveLessonProgress();
    setTimeout(() => $('#lessonNextBtn').classList.add('show'), 1000);
    scene.scrollTop = 0;
}

function addLessonTrap(task) {
    const id = 'lesson_' + state.lessonSkillId + '_' + Date.now();
    state.traps.push({
        id, question: task.question, options: task.options || null,
        correct: task.correctIdx ?? null, answer: task.correctAns,
        explanation: task.explanation,
        source: 'Урок: ' + ($('#lessonTitle')?.textContent || 'Неизвестно'),
        defuses: 0, nextDate: new Date().toISOString(),
        isInput: task.type === 'input' || (task.type && task.type.startsWith('boss')),
        subject: state.subject
    });
    unlockAchievement('firstBlood', (n, d) => showAchievementToast(n, d));
    saveState();
}

export function nextLessonStep() {
    state.lessonStep++;
    if (state.lessonStep >= state.lessonTasks.length) { finishLesson(); }
    else { saveLessonProgress(); renderDots(); updateProgressBar(); renderLessonStep(); $('#lessonScene').scrollTop = 0; }
}

function finishLesson() {
    clearLessonProgress();
    $('#lessonScene').style.display = 'none';
    $('#lessonNextBtn').classList.remove('show');
    $('#lessonFinishBlock').classList.add('show');

    const c = state.lessonCorrect, w = state.lessonWrong;
    $('#lfinishCorrect').textContent = c; $('#lfinishWrong').textContent = w;
    const totalTasks = state.lessonTasks.length;
    const xp = c * GEMS.LESSON_XP_PER_CORRECT + (w === 0 ? GEMS.LESSON_PERFECT_BONUS : 0);
    $('#lfinishXP').textContent = '+' + xp + ' 💎';

    if (w === 0) {
        $('#lfinishTitle').textContent = 'Идеально! 🌟';
        $('#lfinishSubtitle').textContent = 'Навык пройден!';
    } else {
        $('#lfinishTitle').textContent = 'Урок пройден!';
        $('#lfinishSubtitle').textContent = `${c}/${c + w} верно. Ошибки → 🪤`;
    }

    state.gems += xp; updateStats();
    unlockAchievement('student', (n, d) => showAchievementToast(n, d));
    if (w === 0) unlockAchievement('master', (n, d) => showAchievementToast(n, d));
    playSound(w === 0 ? 'achievement' : 'correct', state.theme);

    const skill = getCurrentSkills().find(s => s.id === state.lessonSkillId);
    if (skill) {
        const ratio = c / totalTasks;
        const np = Math.min(100, skill.progress + Math.round(ratio * 100));
        skill.progress = np;
        if (np >= SKILL.PROGRESS_TO_COMPLETE) { skill.status = 'completed'; unlockNext(skill); }
    }

    updateProgressBar();
    const catSpeech = $('#catSpeech');
    if (catSpeech) catSpeech.textContent = w === 0 ? CAT_SPEECH.lessonPerfect : CAT_SPEECH.lessonDone;

    stepHistory = []; updateTrapsBadge(); saveState();
    state.currentLesson = null; state.lessonTasks = [];
    renderSkillTree();
}

export function checkSavedLesson() {
    const saved = localStorage.getItem(LESSON_STORAGE_KEY);
    if (!saved) return false;
    try {
        const progress = JSON.parse(saved);
        if (!progress.skillId || !progress.tasks || progress.tasks.length === 0) { clearLessonProgress(); return false; }
        const skill = getCurrentSkills().find(s => s.id === progress.skillId);
        const skillName = skill ? skill.name : 'Неизвестно';
        const resume = confirm(`🐱 У тебя есть незавершённый урок!\n\n📚 Тема: «${skillName}»\n📍 Пройдено: ${progress.step} из ${progress.tasks.length} заданий\n✅ Верных ответов: ${progress.correct}\n\nПродолжить урок?`);
        if (resume && loadLessonProgress()) {
            const im = state.subject === 'math';
            $('#lessonTitle').textContent = (im ? '🧮 ' : '📝 ') + skillName;
            $('#lessonContainer').className = 'lesson-container ' + (im ? 'math-lesson' : 'rus-lesson');
            $('#lessonHeader').className = 'lesson-header ' + (im ? 'math-bar' : 'rus-bar');
            $('#lessonNextBtn').className = 'lesson-next ' + (im ? 'math-next' : 'rus-next');
            $('#btnLessonFinish').className = 'btn-lesson-finish ' + (im ? 'math-finish' : 'rus-finish');
            updateProgressBar(); renderDots();
            $('#lessonOverlay').classList.add('active');
            $('#lessonNextBtn').classList.remove('show');
            $('#lessonFinishBlock').classList.remove('show');
            $('#lessonScene').style.display = 'flex';
            renderLessonStep();
            return true;
        }
    } catch (e) {}
    clearLessonProgress();
    return false;
}