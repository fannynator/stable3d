// js/app.js

import { $, $$, showToast } from './utils.js';
import { state, loadState, saveState, unlockAchievement, checkAchievements, applyTheme, checkThemeUnlocks } from './state.js';
import { SUBJECTS, CAT_SPEECH, SUBJECT_EMOJI, getTheme } from './config.js';
import { renderSkillTree } from './components/skillTree.js';
import { startLesson, closeLesson, nextLessonStep, checkSavedLesson } from './components/lesson.js';
import { openStoryPanel, closeStory, nextStoryStep } from './components/story.js';
import { renderTrapsPanel, updateTrapsBadge } from './components/trap.js';
import { renderProfile } from './components/profile.js';
import { startTutorial } from './components/tutorial.js';
import { playSound, spawnLeaves, spawnGems } from './sounds.js';

export function updateStats() {
    const oldGems = parseInt($('#gemCount').textContent) || state.gems;
    $('#gemCount').textContent = state.gems;
    $('#streakCount').textContent = state.streak;
    
    // Огонёк при streak >= 7
    const streakEl = $('#streakCount');
    if (streakEl) {
        if (state.streak >= 7) {
            streakEl.classList.add('streak-fire');
        } else {
            streakEl.classList.remove('streak-fire');
        }
    }
    
    // Гемы летят
    if (state.gems > oldGems) {
        const diff = state.gems - oldGems;
        const gemEl = $('#gemCount');
        if (gemEl && diff > 0) {
            const rect = gemEl.getBoundingClientRect();
            spawnGems(Math.min(diff, 5), rect.left, rect.top - 30, gemEl);
        }
    }
}

export function showAchievementToast(name, desc) {
    const toast = document.getElementById('achToast');
    const text = document.getElementById('achToastText');
    if (!toast || !text) return;
    text.textContent = name + ' — ' + desc;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

export function setCatMood(mood) {
    const catBody = $('#catBody');
    if (!catBody) return;

    const moods = {
        happy: '😺',
        proud: '😸',
        love: '😻',
        sad: '😿',
        wow: '🙀',
        normal: state.subject === SUBJECTS.MATH ? '🐱' : '😺'
    };

    const emoji = moods[mood] || moods.normal;
    catBody.textContent = emoji;

    catBody.style.transform = 'scale(1.2)';
    setTimeout(() => { catBody.style.transform = 'scale(1)'; }, 200);

    clearTimeout(catBody._moodTimeout);
    catBody._moodTimeout = setTimeout(() => {
        catBody.textContent = moods.normal;
    }, 2000);
}

export function updateSubjectUI() {
    const im = state.subject === SUBJECTS.MATH;
    $('#headerBar').className = 'header ' + (im ? 'math-header' : 'rus-header');
    $('#catStage').className = 'cat-stage ' + (im ? 'math-stage' : 'rus-stage');
    $('#btnMath').classList.toggle('active', im);
    $('#btnRus').classList.toggle('active', !im);
    $('#app').className = 'app' + (im ? '' : ' rus-mode');
    const catSpeech = $('#catSpeech');
    const catBody = $('#catBody');
    if (catSpeech) catSpeech.textContent = im ? CAT_SPEECH.math : CAT_SPEECH.russian;
    if (catBody) {
        const theme = getTheme(state.theme);
        catBody.textContent = theme.catEmoji || SUBJECT_EMOJI[state.subject];
    }
}

function setupCatPet() {
    const catBody = $('#catBody');
    const catSpeech = $('#catSpeech');
    if (!catBody || !catSpeech) return;

    catBody.addEventListener('click', () => {
        catBody.classList.add('petted');
        setTimeout(() => catBody.classList.remove('petted'), 600);
        state.totalPets++;
        playSound('pet', state.theme);
        setCatMood('love');
        checkAchievements((name, desc) => showAchievementToast(name, desc));

        const particle = document.createElement('span');
        particle.className = 'hearts-particle';
        particle.textContent = ['❤️', '💕', '✨', '💖'][Math.floor(Math.random() * 4)];
        particle.style.left = (Math.random() * 30 - 10) + 'px';
        catBody.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);

        catSpeech.textContent = CAT_SPEECH.pet(state.totalPets);
        saveState();
    });
}

function bindEvents() {
    $('#btnMath').addEventListener('click', () => {
        if (state.subject !== SUBJECTS.MATH) {
            state.subject = SUBJECTS.MATH;
            state.subjectSwitches++;
            if (state.subjectSwitches >= 5) unlockAchievement('erudite', (n, d) => showAchievementToast(n, d));
            updateSubjectUI();
            renderSkillTree();
            updateTrapsBadge();
            saveState();
        }
    });

    $('#btnRus').addEventListener('click', () => {
        if (state.subject !== SUBJECTS.RUSSIAN) {
            state.subject = SUBJECTS.RUSSIAN;
            state.subjectSwitches++;
            if (state.subjectSwitches >= 5) unlockAchievement('erudite', (n, d) => showAchievementToast(n, d));
            updateSubjectUI();
            renderSkillTree();
            updateTrapsBadge();
            saveState();
        }
    });

    const setActiveNav = (btn) => { $$('.nav-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); };

    $('#navHome').addEventListener('click', () => setActiveNav($('#navHome')));
    $('#navStories').addEventListener('click', () => { setActiveNav($('#navStories')); openStoryPanel(); });
    $('#navTraps').addEventListener('click', () => { setActiveNav($('#navTraps')); renderTrapsPanel(); $('#trapsPanel').classList.add('active'); });
    $('#navProfile').addEventListener('click', () => { setActiveNav($('#navProfile')); renderProfile(); $('#profilePanel').classList.add('active'); });

    $('#btnStoryPanelClose').addEventListener('click', () => $('#storyPanel').classList.remove('active'));
    $('#btnTrapsPanelClose').addEventListener('click', () => $('#trapsPanel').classList.remove('active'));
    $('#btnProfilePanelClose').addEventListener('click', () => $('#profilePanel').classList.remove('active'));

    $('#trapQuizOverlay').addEventListener('click', e => { if (e.target === $('#trapQuizOverlay')) { $('#trapQuizOverlay').classList.remove('active'); updateTrapsBadge(); renderTrapsPanel(); } });

    $('#lessonCloseBtn').addEventListener('click', closeLesson);
    $('#lessonNextBtn').addEventListener('click', nextLessonStep);
    $('#btnLessonFinish').addEventListener('click', closeLesson);

    $('#storyNextBtn').addEventListener('click', nextStoryStep);
    $('#storyCloseBtn').addEventListener('click', closeStory);
    $('#btnFinishStory').addEventListener('click', closeStory);
}

function updateDailyStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('kot_ucheniy_last_visit');
    
    if (!lastVisit) {
        // Первый визит
        state.streak = 1;
    } else if (lastVisit === today) {
        // Уже заходил сегодня — ничего не делаем
        return;
    } else {
        const lastDate = new Date(lastVisit);
        const diffDays = Math.floor((new Date() - lastDate) / 86400000);
        
        if (diffDays === 1) {
            // Заходил вчера — увеличиваем streak
            state.streak++;
        } else {
            // Пропустил день — сброс
            state.streak = 1;
        }
    }
    
    localStorage.setItem('kot_ucheniy_last_visit', today);
    saveState();
    updateStats();
    
    if (state.streak >= 7) {
        showAchievementToast('🔥 Ударный режим!', `${state.streak} дней подряд!`);
    }
}

function init() {
    loadState();
    // Применяем тему
    applyTheme(state.theme || 'light');
    // Проверяем разблокировку тем
    checkThemeUnlocks();
    // Ежедневный streak
    updateDailyStreak();
    // Приветственное мяу
    setTimeout(() => playSound('meow', state.theme), 500);
    updateSubjectUI();
    renderSkillTree();
    updateTrapsBadge();
    updateStats();
    setupCatPet();
    bindEvents();
    startTutorial();
    setTimeout(() => checkSavedLesson(), 500);
    console.log('🐱 v15 — готов к мурчанию!');
}

document.addEventListener('DOMContentLoaded', init);
