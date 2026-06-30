export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

export const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export const showToast = (emoji, message, toastEl) => {
    if (!toastEl) return;
    toastEl.innerHTML = `<span>${emoji}</span> ${message}`;
    toastEl.classList.add('show');
    clearTimeout(toastEl._tid);
    toastEl._tid = setTimeout(() => toastEl.classList.remove('show'), 2000);
};

export const makeWrongs = (correct, count = 3) => {
    const wrongs = new Set();
    while (wrongs.size < count) {
        let delta;
        if (correct <= 10) delta = rnd(-3, 3);
        else if (correct <= 50) delta = rnd(-Math.floor(correct * 0.3), Math.floor(correct * 0.3));
        else delta = rnd(-Math.floor(correct * 0.2), Math.floor(correct * 0.2));
        const candidate = correct + delta;
        if (candidate !== correct && candidate >= 0 && !wrongs.has(candidate)) wrongs.add(candidate);
    }
    return [...wrongs];
};

/** Создать неправильные варианты из пула (для русского) */
export const makeStringWrongs = (correct, pool, count = 3) => {
    const others = [...new Set(pool.filter(x => x !== correct))];
    const shuf = shuffle(others);
    return shuf.slice(0, Math.min(count, shuf.length));
};

export const choiceT = (emoji, badge, badgeClass, question, correct, explanation) => {
    const allOptions = [correct, ...makeWrongs(correct)];
    const options = shuffle(allOptions);
    const correctIdx = options.findIndex(opt => opt === correct);
    return { type: 'choice', emoji, badge, badgeClass, question, options, correctIdx, correctAns: correct, explanation };
};

/** choice с заранее заданными вариантами (для строк) */
export const choiceStrT = (emoji, badge, badgeClass, question, correct, wrongPool, count, explanation) => {
    const wrongs = makeStringWrongs(correct, wrongPool, count);
    const allOptions = shuffle([correct, ...wrongs]);
    const correctIdx = allOptions.findIndex(opt => opt === correct);
    return { type: 'choice', emoji, badge, badgeClass, question, options: allOptions, correctIdx, correctAns: correct, explanation };
};

export const inputT = (emoji, badge, badgeClass, question, correct, explanation) => {
    return { type: 'input', emoji, badge, badgeClass, question, correctAns: correct, explanation };
};

export const pairT = (emoji, badge, badgeClass, question, pairs, explanation) => {
    return { type: 'pair', emoji, badge, badgeClass, question, pairs, explanation };
};

/** Визуальное задание: SVG + выбор ответа */
export const visualT = (emoji, badge, badgeClass, svg, question, correct, options, explanation) => {
    // Гарантируем, что правильный ответ есть среди вариантов
    const allOpts = options.includes(correct) ? options : [correct, ...options];
    const uniqueOpts = [...new Set(allOpts)];
    const correctIdx = uniqueOpts.findIndex(opt => opt === correct);
    return { type: 'visual', emoji, badge, badgeClass, svg, question, options: uniqueOpts, correctIdx, correctAns: correct, explanation };
};