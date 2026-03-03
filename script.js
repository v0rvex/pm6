document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.querySelector('.quiz-container');
    const questionCard = document.getElementById('question-card');
    const optionsGrid = document.getElementById('options-grid');
    const progressBar = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultScreen = document.getElementById('result-screen');
    const finalScore = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');
    const particlesContainer = document.querySelector('.particles-container');

    let questions = [];
    let shuffledQuestions = []; // Новый массив для перемешанных вопросов
    let currentQuestionIndex = 0;
    let score = 0;
    let isAnimating = false;
    
    // Новая статистика
    let startTime = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    // Генерация частиц (СНИЗУ ЭКРАНА)
    function createParticles() {
        for(let i = 0; i < 100; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            
            const size = Math.random() * 3 + 1;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${100 + Math.random() * 20}%`;
            p.style.animationDuration = `${Math.random() * 10 + 10}s`;
            p.style.animationDelay = `${Math.random() * 5}s`;
            
            particlesContainer.appendChild(p);
        }
    }
    createParticles();

    // Взрыв частиц
    function burstParticles() {
        const rect = questionCard.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');            p.style.position = 'fixed';
            p.style.left = centerX + 'px';
            p.style.top = centerY + 'px';
            p.style.width = '4px';
            p.style.height = '4px';
            p.style.background = '#00f2ff';
            p.style.pointerEvents = 'none';
            p.style.zIndex = '100';
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0, .9, .57, 1)',
            }).onfinish = () => p.remove();

            document.body.appendChild(p);
        }
    }

    // Загрузка JSON
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети');
            return response.json();
        })
        .then(data => {
            questions = data;
            startGame();
        })
        .catch(error => {
            console.error('Ошибка загрузки JSON:', error);
            questionCard.innerHTML = "Ошибка загрузки данных.<br>Проверьте консоль.";
        });

    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        currentStreak = 0;
        maxStreak = 0;
        startTime = Date.now();
        
        // ПЕРЕМЕШИВАЕМ ВОПРОСЫ при каждом новом запуске
        shuffledQuestions = shuffleArray([...questions]);        
        resultScreen.style.display = 'none';
        optionsGrid.style.display = 'grid';
        questionCard.style.display = 'flex';
        loadQuestion();
    }

    function loadQuestion() {
        if (currentQuestionIndex >= shuffledQuestions.length) {
            endGame();
            return;
        }

        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex) / shuffledQuestions.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${shuffledQuestions.length}`;

        if (currentQuestionIndex > 0) {
            questionCard.classList.remove('card-enter');
            questionCard.classList.add('card-exit');

            setTimeout(() => {
                questionCard.textContent = currentQuestion.question;
                questionCard.classList.remove('card-exit');
                void questionCard.offsetWidth; 
                questionCard.classList.add('card-enter');
                burstParticles();
                renderOptions(currentQuestion);
            }, 400);
        } else {
            questionCard.textContent = currentQuestion.question;
            questionCard.classList.add('card-enter');
            renderOptions(currentQuestion);
        }
    }

    function renderOptions(questionData) {
        optionsGrid.innerHTML = '';
        let allOptions = [questionData.answer, ...questionData.wrong_answers];
        allOptions = shuffleArray(allOptions);

        allOptions.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = option;
            btn.style.animation = `fadeIn 0.5s ${0.6 + (index * 0.1)}s forwards`;
            btn.style.opacity = '0';
            btn.onclick = (e) => handleAnswer(btn, option, questionData.answer, e);
            optionsGrid.appendChild(btn);        });
    }

    function handleAnswer(selectedBtn, selectedOption, correctOption, event) {
        if (isAnimating) return;
        isAnimating = true;

        const circle = document.createElement('span');
        const diameter = Math.max(selectedBtn.clientWidth, selectedBtn.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - selectedBtn.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - selectedBtn.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple');
        
        const ripple = selectedBtn.getElementsByClassName('ripple')[0];
        if (ripple) { ripple.remove(); }
        selectedBtn.appendChild(circle);

        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (selectedOption === correctOption) {
            selectedBtn.classList.add('correct');
            score++;
            currentStreak++;
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        } else {
            selectedBtn.classList.add('wrong');
            currentStreak = 0;
            buttons.forEach(btn => {
                if (btn.textContent === correctOption) {
                    btn.classList.add('correct');
                }
            });
        }

        setTimeout(() => {
            currentQuestionIndex++;
            isAnimating = false;
            loadQuestion();
        }, 1500);
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function endGame() {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        optionsGrid.style.display = 'none';
        questionCard.style.display = 'none';
        progressBar.style.width = '100%';
        resultScreen.style.display = 'block';
        
        let message = "";
        const percentage = (score / shuffledQuestions.length) * 100;
        
        if (percentage === 100) message = "Идеально! 🏆";
        else if (percentage >= 70) message = "Отличный результат! 🚀";
        else if (percentage >= 40) message = "Неплохо, но можно лучше ⚡";
        else message = "Нужно еще потренироваться 🔋";

        resultScreen.innerHTML = `
            <div class="result-icon">💎</div>
            <h2 class="result-title">Викторина завершена!</h2>
            <p class="result-score">${message}</p>
            
            <div class="result-stats">
                <div class="stat-box">
                    <div class="stat-label">Счёт</div>
                    <div class="stat-value">${score}/${shuffledQuestions.length}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Время</div>
                    <div class="stat-value time">${formatTime(totalTime)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Серия</div>
                    <div class="stat-value streak">${maxStreak} 🔥</div>
                </div>
            </div>
            
            <button class="restart-btn" id="restart-btn">Играть снова</button>
        `;
        
        document.getElementById('restart-btn').addEventListener('click', startGame);
        
        burstParticles();
        setTimeout(burstParticles, 300);
        setTimeout(burstParticles, 600);
    }
    // Функция перемешивания массива (Fisher-Yates)
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    restartBtn.addEventListener('click', startGame);
});