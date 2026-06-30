import { $, $$, showToast } from '../utils.js';
import { state, saveState, unlockAchievement, checkAchievements } from '../state.js';
import { GEMS, SUBJECTS, CAT_SPEECH } from '../config.js';
import { renderTask } from './taskRenderer.js';
import { updateTrapsBadge } from './trap.js';
import { updateStats, showAchievementToast } from '../app.js';

const storySrc = {
    math: { id: 'math', title: '🧮 Дело о пропавшем торте', subj: 'math', scenes: [
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Мур! Украли торт!' },
        { type:'choice', speaker:'Следователь', emoji:'🔍', text:'3 ряда по 8 следов.', question:'3×8=?', options:['18','24','28','32'], correctAns:'24', explanation:'3×8=24 🐾', trapId:'smul' },
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'24 следа! Трое подозреваемых.' },
        { type:'input', speaker:'Бухгалтер', emoji:'🧾', text:'Торт 120 монет. Вор оставил половину.', question:'120÷2=?', correctAns:'60', explanation:'120÷2=60 💰', trapId:'sdiv' },
        { type:'choice', speaker:'Сорока', emoji:'🦜', text:'4 друга × 2 куска. Торт на 8.', question:'Хватит?', options:['Да','Нет','Ровно 8','Больше'], correctAns:'Ровно 8', explanation:'4×2=8! 🍰', trapId:'slog' },
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Енот! Дело закрыто! 🎉' }
    ]},
    rus1: { id:'rus1', title:'📝 Дело о пропавшей запятой', subj:'russian', scenes: [
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Из газеты исчезли запятые!' },
        { type:'choice', speaker:'Редактор', emoji:'📰', text:'"Кот пр...бывает".', question:'ПРЕ или ПРИ?', options:['Е','И','Ы','Э'], correctAns:'И', explanation:'ПРИбывает 🚂', trapId:'rpre' },
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Дальше — ресторан...' },
        { type:'choice', speaker:'Критик', emoji:'🍽️', text:'"Кури...ый суп".', question:'Н или НН?', options:['Н','НН'], correctAns:'Н', explanation:'Одна Н — суффикс -ИН- 🐔', trapId:'rnn' },
        { type:'choice', speaker:'Секретарша', emoji:'💼', text:'"Казнить нельзя помиловать".', question:'Где запятая?', options:['Казнить, нельзя','Казнить нельзя,','Казнить нельзя помиловать,','Не нужна'], correctAns:'Казнить нельзя,', explanation:'После «нельзя»! ☠️→😇', trapId:'rcom' },
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Язык спасён! 🎉📚' }
    ]},
    rus2: { id:'rus2', title:'📝 Дело о двойных согласных', subj:'russian', scenes: [
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'В библиотеке пропали буквы Н!' },
        { type:'choice', speaker:'Библиотекарь', emoji:'📚', text:'"Стекля...ый стакан".', question:'Н или НН?', options:['Н','НН'], correctAns:'НН', explanation:'СтекляННый — исключение! 🔮', trapId:'rnn2' },
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Ого! Исключение!' },
        { type:'choice', speaker:'Писатель', emoji:'✍️', text:'"Ветре...ый день".', question:'Н или НН?', options:['Н','НН'], correctAns:'Н', explanation:'ВетреНый — одна Н 🌬️', trapId:'rnn3' },
        { type:'input', speaker:'Поэт', emoji:'🎭', text:'"Пусты...ый пляж".', question:'Сколько Н?', correctAns:'нн', explanation:'ПустыННый — стык корня и суффикса 🏖️', trapId:'rnn4' },
        { type:'dialogue', speaker:'Кот', emoji:'🐱', text:'Все буквы на месте! 🎉' }
    ]}
};

const storyList = { math: [storySrc.math], russian: [storySrc.rus1, storySrc.rus2] };

export function openStoryPanel() {
    const im = state.subject === SUBJECTS.MATH;
    $('#storyPanelSubtitle').textContent = im ? 'Математические расследования' : 'Расследования по русскому';
    const list = storyList[state.subject];
    $('#storyList').innerHTML = list.map(s => {
        const done = state.storiesCompleted[s.id];
        const totalTasks = s.scenes.filter(x=>x.type!=='dialogue').length;
        const badgeClass = done ? 'badge-done' : 'badge-new';
        const badgeText = done ? '✅ Пройдено' : '🔄 Новая';
        return `<div class="story-card" data-story="${s.id}">
            <div class="story-card-icon">${im ? '🧮' : '📝'}</div>
            <div class="story-card-info">
                <div class="story-card-name">${s.title}</div>
                <div class="story-card-desc">${totalTasks} заданий · ${s.scenes.length} сцен</div>
            </div>
            <span class="story-card-badge ${badgeClass}">${badgeText}</span>
        </div>`;
    }).join('');
    $$('#storyList .story-card').forEach(c => c.addEventListener('click', () => startStory(c.dataset.story)));
    $('#storyPanel').classList.add('active');
}

function startStory(id) {
    const scr = storySrc[Object.keys(storySrc).find(k => storySrc[k].id === id)];
    state.currentStory = id; state.storyStep = 0; state.storyAnswered = false;
    const im = scr.subj === SUBJECTS.MATH;
    $('#storyContainer').className = 'story-container ' + (im ? 'math-story' : 'rus-story');
    $('#storyHeaderBar').className = 'story-header-bar ' + (im ? 'math-bar' : 'rus-bar');
    $('#storyTitleHeader').textContent = scr.title;
    $('#storySteps').innerHTML = Array.from({length: scr.scenes.length}, (_, i) => `<span class="step-dot ${i===0?'current':''}"></span>`).join('');
    $('#storyNextBtn').className = 'story-next-btn ' + (im ? 'math-next' : 'rus-next');
    $('#btnFinishStory').className = 'btn-finish-story ' + (im ? 'math-finish' : 'rus-finish');
    $('#storyOverlay').classList.add('active');
    $('#storyNextBtn').classList.remove('show');
    $('#storyFinishBlock2').classList.remove('show');
    $('#storyScene').style.display = 'flex';
    $('#storyPanel').classList.remove('active');
    renderStoryStep();
}

export function closeStory() {
    $('#storyOverlay').classList.remove('active');
    state.currentStory = null;
    checkAchievements((n, d) => showAchievementToast(n, d));
    updateTrapsBadge();
}

async function renderStoryStep() {
    const scr = storySrc[Object.keys(storySrc).find(k => storySrc[k].id === state.currentStory)];
    const step = scr.scenes[state.storyStep];
    if (!step) { finishStory(); return; }

    $('#storyNextBtn').classList.remove('show');
    $('#storyFinishBlock2').classList.remove('show');
    $('#storyScene').style.display = 'flex';
    state.storyAnswered = false;

    let html = `<div class="scene-emoji">${step.emoji}</div><div class="scene-speaker">${step.speaker}</div><div class="scene-text">${step.text}</div>`;
    if (step.type === 'dialogue') {
        $('#storyScene').innerHTML = html;
        setTimeout(() => $('#storyNextBtn').classList.add('show'), 500);
    } else {
        $('#storyScene').innerHTML = html;
        const taskBox = document.createElement('div');
        taskBox.className = 'story-task-box';
        const taskLabel = document.createElement('div');
        taskLabel.className = 'task-label';
        taskLabel.textContent = step.question || 'Твоё решение:';
        taskBox.appendChild(taskLabel);
        $('#storyScene').appendChild(taskBox);

        // Создаём задание с correctAns вместо correctIdx
        const task = {
            type: step.type,
            question: step.question,
            options: step.options,
            correctAns: step.correctAns,
            explanation: step.explanation
        };
        if (step.type === 'input') {
            task.correctAns = step.correctAns;
        }

        const result = await renderTask(taskBox, task, { compact: true });
        state.storyAnswered = true;

        if (result.isCorrect) {
            state.gems += GEMS.CORRECT_ANSWER;
            updateStats();
            setTimeout(() => $('#storyNextBtn').classList.add('show'), 1000);
        } else {
            if (step.trapId) addStoryTrap(step, scr.title);
            showToast('🤔', 'Ошибка → Ловушки!', $('#toast'));
            setTimeout(() => $('#storyNextBtn').classList.add('show'), 1800);
        }
    }
    updateStorySteps();
    $('#storyScene').scrollTop = 0;
}

function addStoryTrap(step, src) {
    if (!step.trapId || state.traps.find(t => t.id === step.trapId)) return;
    state.traps.push({
        id: step.trapId,
        question: step.question,
        options: step.options || null,
        correct: step.options ? step.options.indexOf(step.correctAns) : null,
        answer: step.correctAns || null,
        explanation: step.explanation,
        source: src,
        defuses: 0,
        nextDate: new Date().toISOString(),
        isInput: step.type === 'input',
        subject: state.currentStory.startsWith('rus') ? SUBJECTS.RUSSIAN : SUBJECTS.MATH
    });
    unlockAchievement('firstBlood', (n, d) => showAchievementToast(n, d));
    saveState();
}

function updateStorySteps() {
    const dots = $('#storySteps').querySelectorAll('.step-dot');
    dots.forEach((d, i) => {
        d.classList.remove('done', 'current');
        if (i < state.storyStep) d.classList.add('done');
        else if (i === state.storyStep) d.classList.add('current');
    });
}

export function nextStoryStep() {
    const scr = storySrc[Object.keys(storySrc).find(k => storySrc[k].id === state.currentStory)];
    state.storyStep++;
    if (state.storyStep >= scr.scenes.length) finishStory();
    else { renderStoryStep(); $('#storyScene').scrollTop = 0; }
}

function finishStory() {
    $('#storyScene').style.display = 'none';
    $('#storyNextBtn').classList.remove('show');
    $('#storyFinishBlock2').classList.add('show');
    state.storiesCompleted[state.currentStory] = true;
    const scr = storySrc[Object.keys(storySrc).find(k => storySrc[k].id === state.currentStory)];
    const im = scr.subj === SUBJECTS.MATH;
    $('#finishTitle').textContent = im ? 'Дело раскрыто!' : 'Язык спасён!';
    $('#finishXP').textContent = im ? `+${GEMS.STORY_MATH_REWARD} 💎` : `+${GEMS.STORY_RUS_REWARD} 💎`;
    $('#finishSubtitle').textContent = im ? 'Торт найден!' : 'Ты герой! 📚';
    state.gems += im ? GEMS.STORY_MATH_REWARD : GEMS.STORY_RUS_REWARD;
    updateStats();
    $$('#storySteps .step-dot').forEach(d => { d.classList.add('done'); d.classList.remove('current'); });
    const catSpeech = $('#catSpeech');
    if (catSpeech) catSpeech.textContent = CAT_SPEECH.storyDone;
    checkAchievements((n, d) => showAchievementToast(n, d));
    updateTrapsBadge();
    saveState();
}