import { $ } from '../utils.js';
import { TUTORIAL_KEY } from '../config.js';

const steps = [
    { emoji: '🐱', title: 'Добро пожаловать!', text: 'Я Кот Учёный. Нажимай на доступный навык, чтобы начать урок.' },
    { emoji: '🧮', title: 'Два предмета', text: 'Переключайся между математикой и русским в шапке.' },
    { emoji: '🪤', title: 'Ловушки', text: 'Ошибки создают ловушки. Обезвреживай их и получай бонусы!' },
    { emoji: '🐱', title: 'Погладь меня!', text: 'Нажми на кота — я мурчу и даю достижения!' }
];

export function startTutorial() {
    if (localStorage.getItem(TUTORIAL_KEY)) return;
    
    const overlay = $('#tutorialOverlay');
    let step = 0;
    
    const render = () => {
        const s = steps[step];
        $('#tutEmoji').textContent = s.emoji;
        $('#tutTitle').textContent = s.title;
        $('#tutText').textContent = s.text;
        $('#tutDots').innerHTML = steps.map((_, i) => `<span class="tutorial-dot ${i === step ? 'active' : ''}"></span>`).join('');
        $('#tutNext').textContent = step === steps.length - 1 ? 'Понял!' : 'Далее';
        overlay.classList.add('active');
    };
    
    const close = () => { overlay.classList.remove('active'); localStorage.setItem(TUTORIAL_KEY, '1'); };
    
    $('#tutNext').addEventListener('click', () => { step++; if (step >= steps.length) close(); else render(); });
    $('#tutSkip').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    
    render();
}