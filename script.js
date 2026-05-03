        // Ретро Аудио Движок (Web Audio API)
        const audioEngine = {
            ctx: null, masterGain: null, droneOsc: null, lfo: null,
            init() {
                if (this.ctx) return;
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                this.setVolume(vol);
            },
            setVolume(val) {
                if (this.masterGain) this.masterGain.gain.value = (val / 100) * 0.5; // Базовая громкость 50%
            },
            playTone(type, freq, drop, duration, vol = 0.5) {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                if (drop) osc.frequency.exponentialRampToValueAtTime(drop, this.ctx.currentTime + duration);
                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
                osc.connect(gain); gain.connect(this.masterGain);
                osc.start(); osc.stop(this.ctx.currentTime + duration);
            },
            playHover() { this.playTone('sine', 800, 1200, 0.05, 0.1); },
            playClick() { this.playTone('square', 300, 100, 0.15, 0.2); },
            playError(vol = 0.3) { this.playTone('sawtooth', 150, 50, 0.4, vol); },
            playGlitchSound() {
                if (!this.ctx) this.init();
                if (this.glitchOsc) return;
                this.glitchOsc = this.ctx.createOscillator();
                this.glitchOsc.type = 'sawtooth';
                this.glitchOsc.frequency.value = 100;
                
                this.glitchLfo = this.ctx.createOscillator();
                this.glitchLfo.type = 'square';
                this.glitchLfo.frequency.value = 30; // Slightly slower modulation
                
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = 300; // Keep it within a more standard range
                this.glitchLfo.connect(lfoGain);
                lfoGain.connect(this.glitchOsc.frequency);
                
                this.glitchOsc.connect(this.masterGain);
                
                // Ensure master volume is restored in case it was ramped down
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                this.masterGain.gain.setTargetAtTime((vol / 100) * 0.5, this.ctx.currentTime, 0.05);

                this.glitchOsc.start();
                this.glitchLfo.start();
            },
            stopGlitchSound() {
                if (this.glitchOsc) {
                    try {
                        this.glitchOsc.stop();
                        this.glitchLfo.stop();
                    } catch(e) {}
                    this.glitchOsc = null;
                    this.glitchLfo = null;
                }
            },
            playBoot() {
                this.playTone('sine', 261.63, null, 2.5, 0.3); // C4
                setTimeout(() => this.playTone('sine', 329.63, null, 2.3, 0.3), 300); // E4
                setTimeout(() => this.playTone('sine', 392.00, null, 2.0, 0.3), 600); // G4
            },
            playDrone() {
                if (!this.ctx) this.init();
                if (this.droneOsc) return;
                this.droneOsc = this.ctx.createOscillator();
                this.droneOsc.type = 'triangle';
                this.droneOsc.frequency.value = 55;
                this.lfo = this.ctx.createOscillator();
                this.lfo.type = 'sine';
                this.lfo.frequency.value = 0.2;
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = 10;
                this.lfo.connect(lfoGain); lfoGain.connect(this.droneOsc.frequency);
                this.droneOsc.connect(this.masterGain);
                this.droneOsc.start(); this.lfo.start();
            },
            stopDrone() {
                if (this.droneOsc) {
                    this.droneOsc.stop(); this.lfo.stop();
                    this.droneOsc = null; this.lfo = null;
                }
            },
            playBSOD() {
                if (!this.ctx) return;
                const bufferSize = this.ctx.sampleRate * 2;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
                noise.connect(noiseGain); noiseGain.connect(this.masterGain);
                noise.start();
                this.playTone('square', 80, 40, 2, 0.6);
            }
        };

        function startAudioEngine() {
            audioEngine.init();
            audioEngine.playDrone();

            // Прячем экран инициализации
            const initOverlay = document.getElementById('init-overlay');
            initOverlay.style.opacity = '0';
            setTimeout(() => {
                initOverlay.style.display = 'none';
            }, 1000);

            // Добавляем звуки для элементов интерфейса после инициализации
            document.querySelectorAll('.icon-container, .window-btn, .start-btn, .taskbar-item, .go-btn, .start-item').forEach(el => {
                el.addEventListener('mousedown', () => audioEngine.playClick());
                el.addEventListener('mouseenter', () => audioEngine.playHover());
            });
        }

        const translations = {
            ru: {
                play: "Играть", settings: "Настройки", authors: "Авторы", volume: "Громкость", language: "Язык", back: "Назад",
                designer: "Дизайнер: Игорь", ideas: "Идеи: Игорь", programmer: "Программист: Gemini AI", realization: "Воплощение: Gemini AI",
                myComputer: "Мой компьютер", trash: "Корзина", internet: "Internet", address: "Address:", go: "Go", start: "Пуск",
                programs: "Программы", documents: "Документы", shutdown: "Завершение работы...", welcomeBrowser: "Welcome to Internet",
                welcomeBrowserSub: "Type an address in the bar above to begin surfing the web.", noEscape: "ТЫ НИКУДА НЕ ПОЙДЁШЬ.",
                accessDenied: "Отказано в доступе.", programsUnavailable: "Программы пока недоступны", docsEmpty: "Документы пусты",
                settingsLocked: "Настройки заблокированы", cannotShutdown: "Вы не можете выключить компьютер",
                ad1: "ХОЧЕШЬ ПРОТЕСТИТЬ СВОЮ ПАМЯТЬ?", ad2: "НАСКОЛЬКО ХОРОШО ТЫ ЗНАЕШЬ БРЕНДЫ?", ad3: "ПРОВЕРЬ СВОЮ ПАМЯТЬ!",
                gameWelcome: "Хочешь проверить знание брендов? Тогда тебе сюда!", question: "Вопрос", outOf: "из",
                whichBrand: "Какому бренду принадлежит этот логотип?", inputPlaceholder: "Введите название...", answerBtn: "Ответить",
                wrongAnswer: "Неверно. Попробуйте еще раз.", theyAreHere: "T H E Y  A R E  H E R E",
                answeredCorrectly: "ТЫ ПРАВИЛЬНО ОТВЕТИЛ.", waitingForYou: "ПРАВИЛЬНО ОТВЕТИЛ ГДЕ ЖДУТ ТЕБЯ.",
                nowYouWrite: "ТЕПЕРЬ ПИШИ ТЫ...", onlyBeginning: "ЭТО ТОЛЬКО НАЧАЛО.",
                pageNotDisplayed: "The page cannot be displayed", pageUnavailable: "The page you are looking for is currently unavailable..."
            },
            ua: {
                play: "Грати", settings: "Налаштування", authors: "Автори", volume: "Гучність", language: "Мова", back: "Назад",
                designer: "Дизайнер: Ігор", ideas: "Ідеї: Ігор", programmer: "Програміст: Gemini AI", realization: "Втілення: Gemini AI",
                myComputer: "Мій комп'ютер", trash: "Кошик", internet: "Internet", address: "Адреса:", go: "Перейти", start: "Пуск",
                programs: "Програми", documents: "Документи", shutdown: "Завершення роботи...", welcomeBrowser: "Ласкаво просимо до Інтернету",
                welcomeBrowserSub: "Введіть адресу в рядок вище, щоб почати серфінг.", noEscape: "ТИ НІКУДИ НЕ ПІДЕШ.",
                accessDenied: "Доступ заборонено.", programsUnavailable: "Програми поки що недоступні", docsEmpty: "Документи порожні",
                settingsLocked: "Налаштування заблоковано", cannotShutdown: "Ви не можете вимкнути комп'ютер",
                ad1: "ХОЧЕШ ПРОТЕСТУВАТИ СВОЮ ПАМ'ЯТЬ?", ad2: "ЯК ДОБРЕ ТИ ЗНАЄШ БРЕНДИ?", ad3: "ПЕРЕВІР СВОЮ ПАМ'ЯТЬ!",
                gameWelcome: "Хочеш перевірити знання брендів? Тоді тобі сюди!", question: "Питання", outOf: "з",
                whichBrand: "Якому бренду належить цей логотип?", inputPlaceholder: "Введіть назву...", answerBtn: "Відповісти",
                wrongAnswer: "Невірно. Спробуйте ще раз.", theyAreHere: "В О Н И  Т У Т",
                answeredCorrectly: "ТИ ВІДПОВІВ ПРАВИЛЬНО.", waitingForYou: "ПРАВИЛЬНО ВІДПОВІВ ТАМ, ДЕ ТЕБЕ ЧЕКАЮТЬ.",
                nowYouWrite: "ТЕПЕР ПИШИ ТИ...", onlyBeginning: "ЦЕ ТІЛЬКИ ПОЧАТОК.",
                pageNotDisplayed: "Сторінку неможливо відобразити", pageUnavailable: "Сторінка, яку ви шукаєте, наразі недоступна..."
            },
            en: {
                play: "Play", settings: "Settings", authors: "Credits", volume: "Volume", language: "Language", back: "Back",
                designer: "Designer: Igor", ideas: "Ideas: Igor", programmer: "Programmer: Gemini AI", realization: "Realization: Gemini AI",
                myComputer: "My Computer", trash: "Recycle Bin", internet: "Internet", address: "Address:", go: "Go", start: "Start",
                programs: "Programs", documents: "Documents", shutdown: "Shutdown...", welcomeBrowser: "Welcome to Internet",
                welcomeBrowserSub: "Type an address in the bar above to begin surfing the web.", noEscape: "YOU ARE GOING NOWHERE.",
                accessDenied: "Access Denied.", programsUnavailable: "Programs are not available yet", docsEmpty: "Documents are empty",
                settingsLocked: "Settings are locked", cannotShutdown: "You cannot shutdown the computer",
                ad1: "WANT TO TEST YOUR MEMORY?", ad2: "HOW WELL DO YOU KNOW BRANDS?", ad3: "CHECK YOUR MEMORY!",
                gameWelcome: "Want to check your brand knowledge? You're in the right place!", question: "Question", outOf: "of",
                whichBrand: "Which brand does this logo belong to?", inputPlaceholder: "Enter name...", answerBtn: "Answer",
                wrongAnswer: "Incorrect. Try again.", theyAreHere: "T H E Y  A R E  H E R E",
                answeredCorrectly: "YOU ANSWERED CORRECTLY.", waitingForYou: "ANSWERED CORRECTLY WHERE THEY WAIT FOR YOU.",
                nowYouWrite: "NOW YOU WRITE...", onlyBeginning: "IT'S ONLY THE BEGINNING.",
                pageNotDisplayed: "The page cannot be displayed", pageUnavailable: "The page you are looking for is currently unavailable..."
            }
        };

        let currentLang = 'ru';

        function setLanguage(lang) {
            currentLang = lang;
            const t = translations[lang];
            
            // Меню
            document.getElementById('menu-play-btn').innerText = t.play;
            document.getElementById('menu-settings-btn').innerText = t.settings;
            document.getElementById('menu-credits-btn').innerText = t.authors;
            document.getElementById('settings-title').innerText = t.settings;
            document.getElementById('settings-vol-label').innerText = t.volume;
            document.getElementById('settings-lang-label').innerText = t.language;
            document.getElementById('settings-back-btn').innerText = t.back;
            document.getElementById('credits-title').innerText = t.authors;
            document.getElementById('credits-designer').innerText = t.designer;
            document.getElementById('credits-ideas').innerText = t.ideas;
            document.getElementById('credits-programmer').innerText = t.programmer;
            document.getElementById('credits-realization').innerText = t.realization;
            document.getElementById('credits-back-btn').innerText = t.back;

            // Десктоп
            document.getElementById('desktop-pc-text').innerText = t.myComputer;
            document.getElementById('desktop-trash-text').innerText = t.trash;
            document.getElementById('desktop-internet-text').innerText = t.internet;

            // Браузер
            document.getElementById('browser-addr-label').innerText = t.address;
            document.getElementById('browser-go-btn').innerText = t.go;
            
            // Панель задач
            document.getElementById('taskbar-start-text').innerText = t.start;
            
            // Старт меню
            document.getElementById('start-programs').innerText = t.programs;
            document.getElementById('start-docs').innerText = t.documents;
            document.getElementById('start-settings-item').innerText = t.settings;
            document.getElementById('start-shutdown').innerText = t.shutdown;

            // Сообщение "Никуда не уйдешь"
            document.getElementById('no-escape-msg').innerText = t.noEscape;

            // Обновляем контент браузера если он открыт и не на игровом сайте
            if (browserState.isOpen && !isOnCreepySite) {
                const url = urlInput.value.toLowerCase();
                if (url === "http://" || url === "") {
                    browserContent.innerHTML = `<div style="padding: 20px; font-family: 'Times New Roman', serif;"><h2>${t.welcomeBrowser}</h2><p>${t.welcomeBrowserSub}</p></div>`;
                }
            }
        }

        // Обертка для алертов
        function systemAlert(key) {
            alert(translations[currentLang][key]);
        }

        // Часы
        function updateClock() {
            const clockEl = document.getElementById('clock');
            if (!clockEl) return;

            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            clockEl.textContent = hours + ':' + minutes + ' ' + ampm;
        }
        setInterval(updateClock, 1000);
        updateClock();

        const browserWindow = document.getElementById('browser-window');
        const titleBar = document.getElementById('browser-title-bar');
        const browserContent = document.getElementById('browser-content');
        const urlInput = document.getElementById('url-input');
        const taskbarBrowserBtn = document.getElementById('taskbar-browser');

        let browserState = {
            isOpen: false,
            isMaximized: false,
            isMinimized: false,
            prevRect: { left: '50px', top: '50px', width: '500px', height: '350px' }
        };

        let isOnCreepySite = false;
        let escapeAttempts = 0;
        let canAttemptEscape = true;
        let hasRebootedAfterBSOD = false;
        let handEventTriggered = false;

        let adTimeout;
        const adPopup = document.getElementById('ad-popup');

        function handleEscapeAttempt() {
            if (!canAttemptEscape) return true;

            canAttemptEscape = false;
            setTimeout(() => { canAttemptEscape = true; }, 1000);

            escapeAttempts++;
            browserWindow.classList.remove('shake-active');
            void browserWindow.offsetWidth;
            browserWindow.classList.add('shake-active');

            if (escapeAttempts >= 5) {
                document.getElementById('browser-window-btns').style.display = 'none';
            }
            return true;
        }

        function openBrowser() {
            if (!browserState.isOpen) {
                urlInput.value = "http://";
                browserContent.innerHTML = `
                    <div style="padding: 20px; font-family: 'Times New Roman', serif;">
                        <h2>Welcome to Internet</h2>
                        <p>Type an address in the bar above to begin surfing the web.</p>
                    </div>
                `;
            }
            browserState.isOpen = true;
            browserWindow.style.display = 'flex';
            taskbarBrowserBtn.style.display = 'flex';
            restoreBrowser();

            clearTimeout(adTimeout);
            adTimeout = setTimeout(() => {
                if (browserState.isOpen) {
                    if (hasRebootedAfterBSOD) {
                        const content = adPopup.querySelector('.window-content');
                        const t = translations[currentLang];
                        content.innerHTML = `
                            <p style="color: #000080; font-size: 14px; margin-top: 0; animation: shake 0.2s infinite;">${t.ad1}</p>
                            <p style="color: red; font-size: 13px; animation: shake 0.3s infinite;">${t.ad2}</p>
                            <p style="color: blue; text-decoration: underline; margin-bottom: 0; animation: shake 0.25s infinite;">${t.ad3}</p>
                        `;
                        setInterval(() => {
                            content.style.backgroundColor = content.style.backgroundColor === 'darkred' ? '#ffffcc' : 'darkred';
                        }, 2000);
                    }
                    adPopup.style.display = 'flex';
                }
            }, 5000);
        }

        function closeBrowser() {
            if (isOnCreepySite && handleEscapeAttempt()) return;
            browserState.isOpen = false;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.style.display = 'none';
            clearTimeout(adTimeout);
            adPopup.style.display = 'none';
        }

        function minimizeBrowser() {
            if (isOnCreepySite && handleEscapeAttempt()) return;
            browserState.isMinimized = true;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.classList.remove('active');
        }

        function restoreBrowser() {
            browserState.isMinimized = false;
            browserWindow.style.display = 'flex';
            taskbarBrowserBtn.classList.add('active');
            if (browserState.isMaximized) {
                maximizeBrowser(true);
            }
        }

        function toggleBrowserTaskbar() {
            if (browserState.isMinimized) {
                restoreBrowser();
            } else {
                minimizeBrowser();
            }
        }

        function maximizeBrowser(forceApply = false) {
            if (browserState.isMaximized && !forceApply) {
                browserWindow.style.left = browserState.prevRect.left;
                browserWindow.style.top = browserState.prevRect.top;
                browserWindow.style.width = browserState.prevRect.width;
                browserWindow.style.height = browserState.prevRect.height;
                browserState.isMaximized = false;
            } else {
                if (!forceApply) {
                    browserState.prevRect = {
                        left: browserWindow.style.left || browserWindow.offsetLeft + 'px',
                        top: browserWindow.style.top || browserWindow.offsetTop + 'px',
                        width: browserWindow.style.width || browserWindow.offsetWidth + 'px',
                        height: browserWindow.style.height || browserWindow.offsetHeight + 'px'
                    };
                }
                browserWindow.style.left = '0px';
                browserWindow.style.top = '0px';
                browserWindow.style.width = 'calc(100vw - 4px)';
                browserWindow.style.height = 'calc(100vh - 32px)';
                browserState.isMaximized = true;
            }
        }

        function closeAdPopup(e) {
            e.stopPropagation();
            adPopup.style.display = 'none';
        }

        function clickAd() {
            adPopup.style.display = 'none';
            if (browserState.isMinimized) {
                restoreBrowser();
            }
            urlInput.value = "http://thelogotype.com";
            navigate();
        }

        const gameLogos = [
            { name: "apple", aliases: ["apple", "яблоко", "яблуко"], svg: `<svg viewBox="0 0 100 100"><path d="M50,80 C30,80 20,60 20,40 C20,20 40,20 50,30 C60,20 80,20 80,40 C80,60 70,80 50,80 Z" fill="black"/><path d="M50,25 C45,25 45,15 55,10 C60,15 55,25 50,25 Z" fill="black"/></svg>` },
            { name: "mcdonalds", aliases: ["mcdonalds", "макдоналдс", "макдональдс", "мак"], svg: `<svg viewBox="0 0 100 100"><path d="M20,80 C20,30 45,30 50,80 C55,30 80,30 80,80" fill="none" stroke="#FFC72C" stroke-width="15"/></svg>` },
            { name: "nike", aliases: ["nike", "найк"], svg: `<svg viewBox="0 0 100 100"><path d="M10,60 C30,80 80,40 90,30 C70,50 40,65 10,60 Z" fill="black"/></svg>` },
            { name: "audi", aliases: ["audi", "ауди", "ауді"], svg: `<svg viewBox="0 0 100 100"><circle cx="30" cy="50" r="12" fill="none" stroke="black" stroke-width="4"/><circle cx="45" cy="50" r="12" fill="none" stroke="black" stroke-width="4"/><circle cx="60" cy="50" r="12" fill="none" stroke="black" stroke-width="4"/><circle cx="75" cy="50" r="12" fill="none" stroke="black" stroke-width="4"/></svg>` },
            { name: "pepsi", aliases: ["pepsi", "пепси", "пепсі"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#004B93"/><path d="M20,50 C40,70 60,30 80,50 A30,30 0 0,0 20,50 Z" fill="#C9002B"/><path d="M20,50 C40,60 60,40 80,50 A30,30 0 0,0 20,50 Z" fill="white"/></svg>` },
            { name: "target", aliases: ["target", "таргет"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#CC0000"/><circle cx="50" cy="50" r="20" fill="white"/><circle cx="50" cy="50" r="10" fill="#CC0000"/></svg>` },
            { name: "windows", aliases: ["windows", "виндовс", "винда", "віндовс"], svg: `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="22" height="22" fill="#F25022"/><rect x="50" y="25" width="22" height="22" fill="#7FBA00"/><rect x="25" y="50" width="22" height="22" fill="#00A4EF"/><rect x="50" y="50" width="22" height="22" fill="#FFB900"/></svg>` },
            { name: "mastercard", aliases: ["mastercard", "мастеркард"], svg: `<svg viewBox="0 0 100 100"><circle cx="40" cy="50" r="20" fill="#EB001B"/><circle cx="60" cy="50" r="20" fill="#F79E1B" opacity="0.8"/></svg>` },
            { name: "volkswagen", aliases: ["volkswagen", "фольксваген", "фольцваген", "фольц", "vw"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#004C85" stroke-width="8"/><path d="M30,15 L50,55 L70,15" fill="none" stroke="#004C85" stroke-width="8"/><path d="M20,45 L35,85 L50,55 L65,85 L80,45" fill="none" stroke="#004C85" stroke-width="8"/></svg>` },
            { name: "mitsubishi", aliases: ["mitsubishi", "митсубиси", "митсубиши", "мицубиси", "мицубиши", "мітсубісі", "міцубісі"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,15 65,40 50,65 35,40" fill="#D00000"/><polygon points="35,40 50,65 35,90 20,65" fill="#D00000"/><polygon points="65,40 80,65 65,90 50,65" fill="#D00000"/></svg>` },
            { name: "grave", aliases: ["могила", "grave"], svg: `<svg viewBox="0 0 100 100"><path d="M30,50 C30,20 70,20 70,50 L70,90 L30,90 Z" fill="gray"/><text x="50" y="60" font-family="monospace" font-weight="bold" font-size="16" fill="black" text-anchor="middle">R.I.P</text></svg>` }
        ];
        let currentQuestion = 0;

        function navigate() {
            const url = urlInput.value.toLowerCase();
            if (isOnCreepySite && !url.includes('thelogotype.com')) {
                handleEscapeAttempt();
                urlInput.value = "http://thelogotype.com";
                return;
            }
            const t = translations[currentLang];
            if (url.includes('thelogotype.com')) {
                isOnCreepySite = true;
                browserContent.innerHTML = `
                    <div style="background: white; color: black; height: 100%; padding: 20px; font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                        <h2 style="color: #000080; margin-bottom: 20px;">${t.gameWelcome}</h2>
                        <button onclick="audioEngine.playClick(); startGame()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">${t.play}</button>
                    </div>
                `;
            } else if (url === "http://" || url === "") {
                browserContent.innerHTML = `<div style="padding: 20px; font-family: 'Times New Roman', serif;"><h2>${t.welcomeBrowser}</h2><p>${t.welcomeBrowserSub}</p></div>`;
            } else {
                browserContent.innerHTML = `<div style="padding: 20px; font-family: 'Times New Roman', serif; background: white; height: 100%;"><h2 style="color: #000080; margin-top: 0;">${t.pageNotDisplayed}</h2><p>${t.pageUnavailable}</p></div>`;
            }
        }

        urlInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') navigate(); });

        let darknessLevel = 0;

        function startGame() { 
            currentQuestion = 0; 
            darknessLevel = hasRebootedAfterBSOD ? 0.2 : 0;
            renderQuestion(); 
        }

        function renderQuestion() {
            if (hasRebootedAfterBSOD && currentQuestion === gameLogos.length - 1) {
                render666Question();
                return;
            }

            const logo = gameLogos[currentQuestion];
            const t = translations[currentLang];
            const overlay = hasRebootedAfterBSOD ? `<div style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,${darknessLevel}); pointer-events: none; z-index: 5;"></div>` : '';
            
            browserContent.innerHTML = `
                <div style="background: white; height: 100%; display: flex; flex-direction: column; align-items: center; font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box; position: relative;">
                    ${overlay}
                    <div style="background: #000080; color: white; width: 100%; padding: 5px; text-align: center; font-weight: bold; position: relative; z-index: 10;">${t.question} ${currentQuestion + 1} ${t.outOf} ${gameLogos.length}</div>
                    <div style="width: 120px; height: 120px; margin: 15px 0; position: relative; z-index: 10;">${logo.svg}</div>
                    <div style="margin-bottom: 10px; position: relative; z-index: 10;">${t.whichBrand}</div>
                    <input type="text" id="logo-answer" style="margin-bottom: 10px; padding: 4px; width: 200px; position: relative; z-index: 10;" placeholder="${t.inputPlaceholder}" autocomplete="off">
                    <button onclick="checkAnswer()" style="padding: 4px 15px; cursor: pointer; position: relative; z-index: 10;">${t.answerBtn}</button>
                    <div id="game-error" style="color: red; font-size: 12px; margin-top: 10px; height: 15px; position: relative; z-index: 10;"></div>
                </div>
            `;
            const inputField = document.getElementById('logo-answer');
            inputField.addEventListener('keypress', function (e) { if (e.key === 'Enter') checkAnswer(); });
            inputField.focus();
        }

        function checkAnswer() {
            const input = document.getElementById('logo-answer').value.toLowerCase().trim();
            const logo = gameLogos[currentQuestion];
            if (logo.aliases.includes(input)) {
                audioEngine.playClick();
                if (hasRebootedAfterBSOD) darknessLevel += 0.08;
                if (currentQuestion === gameLogos.length - 1) { triggerEnding(); } else { currentQuestion++; renderQuestion(); }
            } else {
                audioEngine.playError();
                document.getElementById('game-error').innerText = translations[currentLang].wrongAnswer;
            }
        }

        function triggerEnding() {
            if (browserState.isMaximized) maximizeBrowser();
            triggerBSOD();
        }

        function triggerBSOD() {
            audioEngine.stopDrone();
            audioEngine.playBSOD();
            document.querySelectorAll('.red-eye').forEach(el => el.remove());
            const bsodScreen = document.getElementById('bsod-screen');
            bsodScreen.style.display = 'block';
            setTimeout(() => {
                const rebootHandler = () => { document.removeEventListener('keydown', rebootHandler); rebootSystem(); };
                document.addEventListener('keydown', rebootHandler);
            }, 1000);
        }

        function rebootSystem() {
            audioEngine.stopDrone();
            audioEngine.playBoot();
            document.getElementById('bsod-screen').style.display = 'none';
            hasRebootedAfterBSOD = true;
            handEventTriggered = false;
            const startBtn = document.querySelector('.start-btn');
            startBtn.style.visibility = 'visible';
            startBtn.style.transform = 'none';
            startBtn.style.transition = 'none';
            document.body.style.backgroundColor = 'var(--win-bg)';
            isOnCreepySite = false;
            escapeAttempts = 0;
            canAttemptEscape = true;
            document.getElementById('browser-window-btns').style.display = 'flex';
            browserWindow.classList.remove('shake-active', 'shake-continuous');
            closeBrowser();
            document.getElementById('url-input').value = "http://";
            adPopup.style.display = 'none';
            clearTimeout(adTimeout);
            currentQuestion = 0;
            const bootScreen = document.getElementById('boot-screen');
            bootScreen.style.display = 'flex';
            setTimeout(() => { bootScreen.style.display = 'none'; }, 4000);
        }

        function startGameFromMenu() {
            const overlay = document.getElementById('transition-overlay');
            const mainMenu = document.getElementById('main-menu');
            const bootScreen = document.getElementById('boot-screen');

            // 1. Плавное затемнение (1 сек)
            overlay.style.opacity = "1";
            audioEngine.stopDrone();

            setTimeout(() => {
                audioEngine.playBoot(); // Звук загрузки системы

                // 2. Когда всё черное, переключаем экраны
                mainMenu.style.display = 'none';
                bootScreen.style.display = 'flex';

                // 3. Плавное осветление (1 сек)
                overlay.style.opacity = "0";

                // Через 4 секунды (стандартная загрузка) убираем загрузку и открываем рабочий стол
                setTimeout(() => {
                    bootScreen.style.display = 'none';
                }, 4000);
            }, 1000); // Ожидание окончания анимации затемнения
        }

        function toggleSubmenu(menuId, show) {
            document.getElementById('settings-menu').style.display = 'none';
            document.getElementById('credits-menu').style.display = 'none';
            if (show) document.getElementById(menuId).style.display = 'block';
        }

        function toggleStartMenu() {
            const startMenu = document.getElementById('start-menu');
            if (hasRebootedAfterBSOD && !handEventTriggered) {
                handEventTriggered = true;
                startMenu.style.display = 'none';
                const hand = document.getElementById('creepy-hand');
                const startBtn = document.querySelector('.start-btn');
                
                // Очищаем старые стили перед новой анимацией
                startBtn.style.transition = '';
                startBtn.style.transform = '';
                startBtn.style.visibility = 'visible';
                
                requestAnimationFrame(() => {
                    startBtn.style.transition = 'transform 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)';
                    hand.style.bottom = '-5px';
                    
                    setTimeout(() => {
                        startBtn.style.transform = 'translateY(150px)';
                        hand.style.bottom = '-150px';
                        const msg = document.getElementById('no-escape-msg');
                        msg.style.display = 'block';
                        setTimeout(() => { 
                            msg.style.display = 'none'; 
                            startBtn.style.visibility = 'hidden'; 
                            // Сбрасываем после скрытия, чтобы при ребуте всё было чисто
                            startBtn.style.transform = '';
                            startBtn.style.transition = '';
                        }, 1000);
                    }, 300);
                });
                return;
            }
            if (handEventTriggered) return;
            startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
        }

        document.addEventListener('mousedown', (e) => {
            const startMenu = document.getElementById('start-menu');
            const startBtn = document.querySelector('.start-btn');
            if (startMenu && startMenu.style.display === 'block' && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
                startMenu.style.display = 'none';
            }
        });

        let isDraggingWindow = false;
        let windowOffsetX, windowOffsetY;
        let currentDragWindow = null;

        titleBar.addEventListener('mousedown', (e) => {
            if (browserState.isMaximized) return;
            isDraggingWindow = true;
            currentDragWindow = browserWindow;
            windowOffsetX = e.clientX - browserWindow.offsetLeft;
            windowOffsetY = e.clientY - browserWindow.offsetTop;
        });

        document.getElementById('ad-title-bar').addEventListener('mousedown', (e) => {
            isDraggingWindow = true;
            currentDragWindow = adPopup;
            windowOffsetX = e.clientX - adPopup.offsetLeft;
            windowOffsetY = e.clientY - adPopup.offsetTop;
            adPopup.style.zIndex = parseInt(browserWindow.style.zIndex || 100) + 1;
        });

        titleBar.addEventListener('dblclick', () => { maximizeBrowser(); });

        let draggedIcon = null;
        let iconOffsetX, iconOffsetY;
        let iconInitialX, iconInitialY; // Добавили хранение начальной позиции

        const icons = document.querySelectorAll('.icon-container');
        icons.forEach(icon => {
            icon.addEventListener('mousedown', (e) => {
                draggedIcon = icon;
                iconOffsetX = e.clientX - icon.offsetLeft;
                iconOffsetY = e.clientY - icon.offsetTop;
                // Запоминаем текущую позицию перед началом движения
                iconInitialX = icon.style.left;
                iconInitialY = icon.style.top;

                icons.forEach(i => i.style.zIndex = 1);
                icon.style.zIndex = 10;
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingWindow && currentDragWindow) {
                let newX = e.clientX - windowOffsetX;
                let newY = e.clientY - windowOffsetY;
                newY = Math.max(0, newY);
                currentDragWindow.style.left = newX + 'px';
                currentDragWindow.style.top = newY + 'px';
            }
            if (draggedIcon) {
                let newX = e.clientX - iconOffsetX;
                let newY = e.clientY - iconOffsetY;
                const maxX = window.innerWidth - draggedIcon.offsetWidth;
                const maxY = window.innerHeight - 28 - draggedIcon.offsetHeight;
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));
                draggedIcon.style.left = newX + 'px';
                draggedIcon.style.top = newY + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (draggedIcon) {
                const gridX = 75;
                const gridY = 80;
                const padding = 10;
                let currentX = parseInt(draggedIcon.style.left, 10) || padding;
                let currentY = parseInt(draggedIcon.style.top, 10) || padding;
                let snappedX = Math.round((currentX - padding) / gridX) * gridX + padding;
                let snappedY = Math.round((currentY - padding) / gridY) * gridY + padding;

                const maxX = window.innerWidth - draggedIcon.offsetWidth;
                const maxY = window.innerHeight - 28 - draggedIcon.offsetHeight;
                snappedX = Math.max(padding, Math.min(snappedX, maxX));
                snappedY = Math.max(padding, Math.min(snappedY, maxY));

                // Проверка: занято ли это место другой иконкой?
                let isOccupied = false;
                icons.forEach(otherIcon => {
                    if (otherIcon !== draggedIcon) {
                        const ox = parseInt(otherIcon.style.left, 10);
                        const oy = parseInt(otherIcon.style.top, 10);
                        if (ox === snappedX && oy === snappedY) {
                            isOccupied = true;
                        }
                    }
                });

                if (isOccupied) {
                    // Если место занято, возвращаем на исходную позицию
                    draggedIcon.style.left = iconInitialX;
                    draggedIcon.style.top = iconInitialY;
                } else {
                    // Если свободно, примагничиваем к сетке
                    draggedIcon.style.left = snappedX + 'px';
                    draggedIcon.style.top = snappedY + 'px';
                }
            }
            isDraggingWindow = false;
            currentDragWindow = null;
            draggedIcon = null;
        });

        let is666Mode = false;
        let creepyFacesInterval = null;

        function render666Question() {
            is666Mode = true;
            const t = translations[currentLang];
            const cubeSvg = `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" fill="black" stroke="darkred" stroke-width="2"/></svg>`;
            
            browserContent.innerHTML = `
                <div style="background: black; color: red; height: 100%; display: flex; flex-direction: column; align-items: center; font-family: 'Courier New', monospace; box-sizing: border-box; position: relative; overflow: hidden;">
                    <div id="counter-666" style="background: #300; color: red; width: 100%; padding: 5px; text-align: center; font-weight: bold;">${t.question} ${gameLogos.length} ${t.outOf} ${gameLogos.length}</div>
                    <div style="width: 120px; height: 120px; margin: 15px 0; animation: shake 0.1s infinite;">${cubeSvg}</div>
                    <div id="text-666" style="margin-bottom: 10px; z-index: 10; font-weight: bold; text-align: center; max-width: 90%; word-wrap: break-word; min-height: 20px;"></div>
                    <textarea id="logo-answer-666" readonly style="margin-bottom: 10px; padding: 4px; width: 250px; height: 80px; z-index: 10; background: black; color: red; border: 1px solid red; animation: shake 0.2s infinite; resize: none;" placeholder="..."></textarea>
                    <button id="btn-666" disabled onclick="checkAnswer666()" style="padding: 4px 15px; cursor: not-allowed; z-index: 10; background: darkred; color: black; font-weight: bold; border: 1px solid black; opacity: 0.5;">${t.answerBtn}</button>
                </div>
            `;
            
            const inputField = document.getElementById('logo-answer-666');
            inputField.addEventListener('keypress', function (e) { if (e.key === 'Enter' && !inputField.readOnly) checkAnswer666(); });

            let counter = gameLogos.length;
            const counterEl = document.getElementById('counter-666');
            let speed = 20;
            
            const monsterWords = ["СМЕРТЬ ", "УБИЙСТВО ", "МУЧЕНИЯ ", "СТРАХ ", "БОЛЬ ", "КРОВЬ ", "ОТЧАЯНИЕ "];
            let wordIdx = 0;

            function updateCounter() {
                if (!is666Mode) return;
                counter++;
                counterEl.innerText = `${t.question} ${counter} ${t.outOf} 666`;
                
                if (counter % 5 === 0) {
                    inputField.value += monsterWords[wordIdx % monsterWords.length];
                    wordIdx++;
                    inputField.scrollTop = inputField.scrollHeight;
                    audioEngine.playError(10.0);
                }

                if (counter < 660) {
                    setTimeout(updateCounter, speed);
                } else if (counter < 666) {
                    speed += 150; 
                    setTimeout(updateCounter, speed);
                } else {
                    startPlayerTurn666();
                }
            }
            updateCounter();
        }

        function startPlayerTurn666() {
            const inputField = document.getElementById('logo-answer-666');
            const btn = document.getElementById('btn-666');
            
            inputField.readOnly = false;
            inputField.value = '';
            inputField.placeholder = translations[currentLang].nowYouWrite;
            inputField.focus();
            
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        }

        function checkAnswer666() {
            is666Mode = false;
            
            // Тишина после 666 вопроса
            audioEngine.stopDrone();
            audioEngine.stopGlitchSound();
            
            document.getElementById('logo-answer-666').readOnly = true;
            document.getElementById('btn-666').disabled = true;

            // Сразу глитч изображениями (без BSOD в начале)
            creepyFacesInterval = setInterval(() => {
                const el = document.createElement('img');
                el.className = 'creepy-face';
                el.style.position = 'fixed';
                el.style.left = Math.random() * 100 + 'vw';
                el.style.top = Math.random() * 100 + 'vh';
                
                const size = Math.random() * 250 + 50;
                el.style.width = size + 'px';
                el.style.height = 'auto';
                
                el.style.zIndex = '99999';
                el.style.pointerEvents = 'none';
                el.style.opacity = Math.random() * 0.5 + 0.5;
                el.style.filter = `hue-rotate(${Math.random()*360}deg) saturate(2)`;
                el.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
                
                const faces = ['scary_eye.png', 'creepy_face.png', 'distorted_skull.png'];
                el.src = faces[Math.floor(Math.random() * faces.length)];
                
                document.body.appendChild(el);

                setTimeout(() => {
                    if (el.parentNode) el.remove();
                }, 500);
            }, 50);

            // Через 5 секунд глитча вылетает BSOD
            setTimeout(() => {
                clearInterval(creepyFacesInterval);
                document.querySelectorAll('.creepy-face, div[style*="👁️"], div[style*="☻"]').forEach(e => e.remove());
                
                const bsodScreen = document.getElementById('bsod-screen');
                bsodScreen.style.display = 'block';

                // На фоне BSOD через 2 секунды начинаются трещины
                setTimeout(startCrackSequence, 2000);
            }, 5000);
        }

        
        function startCrackSequence() {
            // Восстанавливаем громкость, так как она была приглушена в обработчике BSOD
            if (audioEngine.ctx) {
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                audioEngine.masterGain.gain.cancelScheduledValues(audioEngine.ctx.currentTime);
                audioEngine.masterGain.gain.setTargetAtTime((vol / 100) * 0.5, audioEngine.ctx.currentTime, 0.1);
            }

            const crackOverlay = document.createElement('div');
            crackOverlay.id = 'crack-overlay';
            crackOverlay.style.position = 'fixed';
            crackOverlay.style.top = '0';
            crackOverlay.style.left = '0';
            crackOverlay.style.width = '100vw';
            crackOverlay.style.height = '100vh';
            crackOverlay.style.zIndex = '100000';
            crackOverlay.style.pointerEvents = 'none';
            document.body.appendChild(crackOverlay);
            
            let stage = 0;
            const crackPaths = [
                "M50,50 L45,40 L55,30 L50,10",
                "M50,50 L45,40 L55,30 L50,10 M50,50 L60,60 L50,80 L60,90",
                "M50,50 L45,40 L55,30 L50,10 M50,50 L60,60 L50,80 L60,90 M50,50 L30,55 L20,40 M50,50 L70,45 L85,55",
            ];
            
            const crackInterval = setInterval(() => {
                // Только звук глитча (убираем playError)
                if (stage < crackPaths.length) {
                    crackOverlay.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none"><path d="${crackPaths[stage]}" fill="none" stroke="black" stroke-width="2" /></svg>`;
                    stage++;
                } else {
                    clearInterval(crackInterval);
                    audioEngine.stopGlitchSound();
                    const inkblotSvg = `
                        <svg viewBox="0 0 200 200" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100vw; height: 100vh; pointer-events: none;" preserveAspectRatio="none">
                            <path fill="black" d="M100,20 C130,-10 160,20 180,50 C210,80 180,120 160,160 C130,210 80,190 50,160 C10,120 20,80 40,50 C60,10 80,30 100,20 Z" />
                            <circle cx="30" cy="40" r="15" fill="black"/>
                            <circle cx="170" cy="140" r="20" fill="black"/>
                            <circle cx="40" cy="160" r="10" fill="black"/>
                            <circle cx="160" cy="40" r="12" fill="black"/>
                            <circle cx="90" cy="180" r="18" fill="black"/>
                            <circle cx="110" cy="10" r="25" fill="black"/>
                            <circle cx="10" cy="100" r="15" fill="black"/>
                        </svg>
                    `;
                    crackOverlay.innerHTML = inkblotSvg;
                    setTimeout(showGiantEye, 3000);
                }
            }, 2000);
        }

        function showGiantEye() {
            const crackOverlay = document.getElementById('crack-overlay');
            crackOverlay.innerHTML += `
                <svg viewBox="0 0 100 100" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width: 50vw; height: 50vh; opacity: 0; transition: opacity 3s;" id="giant-eye">
                    <path d="M10,50 C30,10 70,10 90,50 C70,90 30,90 10,50 Z" fill="black" stroke="red" stroke-width="2"/>
                    <circle cx="50" cy="50" r="20" fill="red"/>
                    <circle cx="50" cy="50" r="8" fill="black"/>
                </svg>
                <div id="final-text" style="position: absolute; top: 80%; width: 100%; text-align: center; color: red; font-family: 'Nosifer', 'Rubik Glitch', cursive; font-size: 3.5rem; font-weight: bold; text-shadow: 2px 2px 15px #000, 0 0 30px red; white-space: pre-wrap;"></div>
            `;
            setTimeout(() => {
                document.getElementById('giant-eye').style.opacity = '1';
                setTimeout(() => {
                    typeFinalText();
                }, 3000);
            }, 100);
        }

        function typeFinalText() {
            const text = translations[currentLang].onlyBeginning;
            const el = document.getElementById('final-text');
            let idx = 0;
            function typeChar() {
                if (idx < text.length) {
                    el.textContent += text[idx];
                    // Без звука кликов (тишина до глитча)
                    idx++;
                    setTimeout(typeChar, 300);
                } else {
                    // Пауза 2 секунды в тишине после текста
                    setTimeout(finalCrash, 2000);
                }
            }
            typeChar();
        }

        function finalCrash() {
            // Звук глитча начинается одновременно с визуалом
            audioEngine.playGlitchSound();
            const glitchInterval = setInterval(() => {
                document.body.style.transform = `translate(${Math.random()*20-10}px, ${Math.random()*20-10}px) scale(${1 + Math.random()*0.1})`;
                document.body.style.filter = `hue-rotate(${Math.random()*360}deg) invert(${Math.random() > 0.5 ? 1 : 0})`;
                // Только основной звук глитча (убираем случайные тоны)
            }, 50);
            
            setTimeout(() => {
                clearInterval(glitchInterval);
                audioEngine.stopGlitchSound();
                document.body.style.transform = 'none';
                document.body.style.filter = 'none';
                document.body.style.backgroundColor = 'black';
                document.body.innerHTML = '';
                
                setTimeout(() => {
                    location.reload();
                }, 10000);
            }, 3000);
        }

        setLanguage('ru');
