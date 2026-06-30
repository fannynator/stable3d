// js/components/taskRenderer.js

import { $, $$ } from '../utils.js';
import { state } from '../state.js';
import { playSound } from '../sounds.js';

export function renderTask(container, task, options = {}) {
    const { isBonus = false, compact = false } = options;
    
    return new Promise((resolve) => {
        container.innerHTML = '';
        
        if (task.emoji) {
            const emojiEl = document.createElement('div');
            emojiEl.className = compact ? 'scene-emoji' : 'lesson-emoji';
            emojiEl.textContent = task.emoji;
            container.appendChild(emojiEl);
        }
        
        if (task.badge && !compact) {
            const badgeEl = document.createElement('div');
            badgeEl.className = `lesson-type-badge ${task.badgeClass || ''}`;
            badgeEl.textContent = task.badge;
            container.appendChild(badgeEl);
        }
        
        const questionEl = document.createElement('div');
        questionEl.className = compact ? 'scene-text' : 'lesson-question';
        if (task.question) questionEl.textContent = task.question;
        container.appendChild(questionEl);
        
        const explanationEl = document.createElement('div');
        explanationEl.className = compact ? 'explanation-box' : 'lesson-explanation';
        container.appendChild(explanationEl);
        
    if (task.type === 'visual') {
        renderVisual(container, task, explanationEl, resolve, isBonus, compact);
    } else if (task.type === 'choice') {
        renderChoice(container, task, explanationEl, resolve, isBonus, compact);
    } else if (task.type === 'input') {
        renderInput(container, task, explanationEl, resolve, isBonus, compact);
    } else if (task.type === 'pair') {
        renderPair(container, task, explanationEl, resolve, isBonus, compact);
    } else if (task.type && task.type.startsWith('boss')) {
        renderBoss(container, task, explanationEl, resolve, isBonus);
    }
    });
}

function renderVisual(container, task, explEl, resolve, isBonus, compact) {
    // SVG-иллюстрация
    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'visual-svg-wrapper';
    svgWrapper.innerHTML = task.svg;
    svgWrapper.style.cssText = 'width:100%;max-width:280px;margin:0 auto 8px;text-align:center;';
    container.appendChild(svgWrapper);

    const optsClass = compact ? 'task-options' : 'lesson-options';
    const optClass = compact ? 'task-option' : 'lesson-option';
    
    const optsDiv = document.createElement('div');
    optsDiv.className = optsClass;
    
    const correctAnswer = task.correctAns;
    
    task.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = optClass;
        btn.textContent = optText;
        btn.dataset.idx = idx;
        btn.dataset.value = String(optText);
        
        btn.addEventListener('click', () => {
            optsDiv.querySelectorAll('button').forEach(b => b.style.pointerEvents = 'none');
            
            const isCorrect = String(btn.dataset.value) === String(correctAnswer);
            
            if (isCorrect) {
                playSound('correct', state.theme);
                btn.classList.add('correct-pick');
                btn.textContent = '✅ ' + optText;
                explEl.innerHTML = '<span style="font-size:16px;">✅</span> ' + task.explanation;
                explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show good';
                setTimeout(() => resolve({ isCorrect: true, isBonus }), 400);
            } else {
                playSound('wrong', state.theme);
                btn.classList.add('wrong-pick');
                btn.textContent = '❌ ' + optText;
                optsDiv.querySelectorAll('button').forEach(b => {
                    if (String(b.dataset.value) === String(correctAnswer)) {
                        b.classList.add('correct-pick');
                        b.textContent = '✅ ' + b.dataset.value;
                    }
                });
                explEl.innerHTML = '<span style="font-size:16px;">🤔</span> ' + task.explanation;
                explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show bad';
                setTimeout(() => resolve({ isCorrect: false, isBonus }), 600);
            }
        });
        
        optsDiv.appendChild(btn);
    });
    
    container.appendChild(optsDiv);
}

function renderChoice(container, task, explEl, resolve, isBonus, compact) {
    const optsClass = compact ? 'task-options' : 'lesson-options';
    const optClass = compact ? 'task-option' : 'lesson-option';
    
    const optsDiv = document.createElement('div');
    optsDiv.className = optsClass;
    
    const correctAnswer = task.correctAns;
    
    task.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = optClass;
        btn.textContent = optText;
        btn.dataset.idx = idx;
        btn.dataset.value = String(optText);
        
        btn.addEventListener('click', () => {
            optsDiv.querySelectorAll('button').forEach(b => b.style.pointerEvents = 'none');
            
            const isCorrect = String(btn.dataset.value) === String(correctAnswer);
            
            if (isCorrect) {
                playSound('correct', state.theme);
                btn.classList.add('correct-pick');
                btn.textContent = '✅ ' + optText;
                explEl.innerHTML = '<span style="font-size:16px;">✅</span> ' + task.explanation;
                explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show good';
                setTimeout(() => resolve({ isCorrect: true, isBonus }), 400);
            } else {
                playSound('wrong', state.theme);
                btn.classList.add('wrong-pick');
                btn.textContent = '❌ ' + optText;
                optsDiv.querySelectorAll('button').forEach(b => {
                    if (String(b.dataset.value) === String(correctAnswer)) {
                        b.classList.add('correct-pick');
                        b.textContent = '✅ ' + b.dataset.value;
                    }
                });
                explEl.innerHTML = '<span style="font-size:16px;">🤔</span> ' + task.explanation;
                explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show bad';
                setTimeout(() => resolve({ isCorrect: false, isBonus }), 600);
            }
        });
        
        optsDiv.appendChild(btn);
    });
    
    container.appendChild(optsDiv);
}

function renderInput(container, task, explEl, resolve, isBonus, compact) {
    const rowDiv = document.createElement('div');
    rowDiv.className = compact ? 'task-input-row' : 'lesson-input-row';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = compact ? 'task-input' : 'lesson-input';
    
    if (task.correctAns !== undefined && task.correctAns !== null) {
        const ansStr = String(task.correctAns).toLowerCase();
        if (ansStr === 'н' || ansStr === 'нн') input.placeholder = 'н/нн';
        else if (ansStr === 'ь' || ansStr === 'ъ') input.placeholder = 'ь/ъ';
        else if (ansStr === 'тся' || ansStr === 'ться') input.placeholder = 'тся/ться';
        else if (ansStr === 'и' || ansStr === 'е') input.placeholder = 'букву';
        else if (!isNaN(task.correctAns)) input.placeholder = 'Число';
        else input.placeholder = 'Ответ';
    } else {
        input.placeholder = 'Ответ';
    }
    input.autocomplete = 'off';
    
    const btn = document.createElement('button');
    btn.className = compact ? 'btn-submit' : 'btn-lesson-submit';
    btn.textContent = '✓';
    
    const submit = () => {
        const value = input.value.trim().toLowerCase();
        if (!value) {
            input.style.borderColor = 'var(--red)';
            input.style.animation = 'shake 0.5s ease';
            setTimeout(() => { input.style.animation = ''; input.style.borderColor = 'rgba(255,255,255,0.2)'; }, 500);
            return;
        }
        
        btn.disabled = true;
        input.disabled = true;
        
        const correctStr = String(task.correctAns).toLowerCase();
        let isCorrect = (value === correctStr);
        if (!isCorrect && correctStr.includes(',')) {
            isCorrect = value === correctStr.replace(/\s+/g, '');
        }
        
        if (isCorrect) {
            playSound('correct', state.theme);
            input.style.borderColor = 'var(--green)';
            input.style.background = 'rgba(16,185,129,0.2)';
            explEl.textContent = '✅ ' + task.explanation;
            explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show good';
            resolve({ isCorrect: true, isBonus });
        } else {
            playSound('wrong', state.theme);
            input.style.borderColor = 'var(--red)';
            input.style.background = 'rgba(239,68,68,0.15)';
            explEl.textContent = '🤔 ' + task.explanation + ' ✅ ' + task.correctAns;
            explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show bad';
            resolve({ isCorrect: false, isBonus });
        }
    };
    
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    
    rowDiv.appendChild(input);
    rowDiv.appendChild(btn);
    container.appendChild(rowDiv);
}

function renderPair(container, task, explEl, resolve, isBonus, compact) {
    const grid = document.createElement('div');
    grid.className = 'pair-grid';
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'pair-left';
    const rightDiv = document.createElement('div');
    rightDiv.className = 'pair-right';
    
    const leftItems = task.pairs.map((p, i) => ({ text: p.left, idx: i }));
    const rightItems = task.pairs.map((p, i) => ({ text: p.right, idx: i }));
    
    const shuf = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const shuffledLeft = shuf(leftItems);
    const shuffledRight = shuf(rightItems);
    
    let selectedLeft = null;
    let matchedCount = 0;
    const total = task.pairs.length;
    
    shuffledLeft.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'pair-item';
        btn.textContent = item.text;
        btn.dataset.pairIdx = item.idx;
        btn.dataset.side = 'left';
        leftDiv.appendChild(btn);
    });
    
    shuffledRight.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'pair-item';
        btn.textContent = item.text;
        btn.dataset.pairIdx = item.idx;
        btn.dataset.side = 'right';
        rightDiv.appendChild(btn);
    });
    
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;opacity:0.5;margin-top:6px;text-align:center;';
    hint.textContent = 'Нажимай: левый → правый';
    
    const allLeftBtns = leftDiv.querySelectorAll('.pair-item');
    const allRightBtns = rightDiv.querySelectorAll('.pair-item');
    
    allLeftBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('matched')) return;
            allLeftBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedLeft = { el: btn, idx: parseInt(btn.dataset.pairIdx) };
        });
    });
    
    allRightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('matched')) return;
            if (!selectedLeft) return;
            
            const rightIdx = parseInt(btn.dataset.pairIdx);
            
            if (selectedLeft.idx === rightIdx) {
                playSound('correct', state.theme);
                selectedLeft.el.classList.add('matched');
                btn.classList.add('matched');
                matchedCount++;
                selectedLeft = null;
                allLeftBtns.forEach(b => b.classList.remove('selected'));
                
                if (matchedCount >= total) {
                    explEl.textContent = '✅ ' + (task.explanation || 'Все пары верны!');
                    explEl.className = (compact ? 'explanation-box' : 'lesson-explanation') + ' show good';
                    resolve({ isCorrect: true, isBonus });
                }
            } else {
                playSound('wrong', state.theme);
                btn.classList.add('wrong-flash');
                setTimeout(() => btn.classList.remove('wrong-flash'), 500);
                selectedLeft.el.classList.remove('selected');
                selectedLeft = null;
            }
        });
    });
    
    grid.appendChild(leftDiv);
    grid.appendChild(rightDiv);
    container.appendChild(grid);
    container.appendChild(hint);
}

function renderBoss(container, task, explEl, resolve, isBonus) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:100%;';
    
    const inputs = [];
    task.words.forEach((w) => {
        const row = document.createElement('div');
        row.className = 'boss-row';
        
        const label = document.createElement('span');
        label.className = 'boss-label';
        label.textContent = w.text;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'boss-input';
        input.placeholder = 'буква';
        input.autocomplete = 'off';
        input.maxLength = 5;
        
        if (w.answer) {
            if (['н', 'нн'].includes(w.answer)) input.placeholder = 'н/нн';
            else if (['ь', 'ъ'].includes(w.answer)) input.placeholder = 'ь/ъ';
            else if (['тся', 'ться'].includes(w.answer)) input.placeholder = 'тся/ться';
            else if (['и', 'е'].includes(w.answer)) input.placeholder = 'и/е';
        }
        
        row.appendChild(label);
        row.appendChild(input);
        wrapper.appendChild(row);
        inputs.push({ input, answer: w.answer });
    });
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-lesson-submit';
    submitBtn.textContent = '✓ Проверить';
    submitBtn.style.marginTop = '6px';
    
    submitBtn.addEventListener('click', () => {
        let allOk = true;
        inputs.forEach(({ input, answer }) => {
            const val = input.value.trim().toLowerCase();
            if (val !== answer) {
                allOk = false;
                input.style.borderColor = 'var(--red)';
                input.style.background = 'rgba(239,68,68,0.15)';
            } else {
                input.style.borderColor = 'var(--green)';
                input.style.background = 'rgba(16,185,129,0.2)';
            }
        });
        
        submitBtn.disabled = true;
        inputs.forEach(({ input }) => input.disabled = true);
        
        if (allOk) {
            playSound('correct', state.theme);
            explEl.textContent = '✅ ' + task.explanation;
            explEl.className = 'lesson-explanation show good';
            resolve({ isCorrect: true, isBonus });
        } else {
            playSound('wrong', state.theme);
            explEl.textContent = '🤔 ' + task.explanation;
            explEl.className = 'lesson-explanation show bad';
            resolve({ isCorrect: false, isBonus });
        }
    });
    
    inputs.forEach(({ input }) => {
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
    });
    
    wrapper.appendChild(submitBtn);
    container.appendChild(wrapper);
}