        // Ретро Аудио Движок (Web Audio API)
        const audioEngine = {
            ctx: null, masterGain: null, droneOsc: null, lfo: null,
            clickBuffer: null,
            errorBuffer: null,
            glitchBuffer: null,
            glitchSource: null,
            menuMusicBuffer: null,
            menuMusicSource: null,
            creditsMusicBuffer: null,
            creditsMusicSource: null,
            defeatAudio: null,
            bossMusicAudio: null,
            init() {
                if (this.ctx) return;
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                this.setVolume(vol);
                this.loadSounds();
            },
            async loadSounds() {
                // Load click sound
                try {
                    const response = await fetch('juniorsoundays-ui-sound-01-527815.mp3');
                    const arrayBuffer = await response.arrayBuffer();
                    this.clickBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                } catch (e) {
                    console.error("Failed to load custom click sound:", e);
                }
                // Load error sound
                try {
                    const response = await fetch('lesiakower-error-mistake-sound-effect-incorrect-answer-437420.mp3');
                    const arrayBuffer = await response.arrayBuffer();
                    this.errorBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                } catch (e) {
                    console.error("Failed to load custom error sound:", e);
                }
                // Load glitch sound
                try {
                    const response = await fetch('545197__thebestmaker__glitch.wav');
                    const arrayBuffer = await response.arrayBuffer();
                    this.glitchBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                } catch (e) {
                    console.error("Failed to load custom glitch sound:", e);
                }
                // Load menu music sound
                try {
                    const response = await fetch('Save_File_Corrupted.mp3');
                    const arrayBuffer = await response.arrayBuffer();
                    this.menuMusicBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                } catch (e) {
                    console.error("Failed to load custom menu music:", e);
                }
                // Load credits music sound
                try {
                    const response = await fetch('After_the_Credits_Roll.mp3');
                    const arrayBuffer = await response.arrayBuffer();
                    this.creditsMusicBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                } catch (e) {
                    console.error("Failed to load custom credits music:", e);
                }
            },
            setVolume(val) {
                if (this.masterGain) this.masterGain.gain.value = (val / 100) * 0.5; // Базовая громкость 50%
                if (this.bossMusicAudio) this.bossMusicAudio.volume = (val / 100) * 0.5;
                if (this.defeatAudio) this.defeatAudio.volume = (val / 100) * 0.5;
            },
            playTone(type, freq, drop, duration, vol = 0.5) {
                if (!this.ctx) this.init();
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
            playClick() {
                if (!this.ctx) this.init();
                if (this.ctx && this.clickBuffer) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    const source = this.ctx.createBufferSource();
                    source.buffer = this.clickBuffer;
                    source.connect(this.masterGain);
                    source.start(0);
                } else {
                    this.playTone('square', 300, 100, 0.15, 0.2);
                }
            },
            playError(vol = 0.3) {
                if (!this.ctx) this.init();
                if (this.ctx && this.errorBuffer) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    const source = this.ctx.createBufferSource();
                    source.buffer = this.errorBuffer;
                    
                    const errorGain = this.ctx.createGain();
                    errorGain.gain.setValueAtTime(vol * 2.0, this.ctx.currentTime);
                    source.connect(errorGain);
                    errorGain.connect(this.masterGain);
                    
                    source.start(0);
                } else {
                    this.playTone('sawtooth', 150, 50, 0.4, vol);
                }
            },
            playGlitchSound() {
                if (!this.ctx) this.init();
                if (this.ctx && this.glitchBuffer) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    this.stopGlitchSound();
                    
                    this.glitchSource = this.ctx.createBufferSource();
                    this.glitchSource.buffer = this.glitchBuffer;
                    this.glitchSource.connect(this.masterGain);
                    
                    // Play exactly 1.0 second of the glitch sound as requested
                    this.glitchSource.start(0, 0, 1.0);
                } else {
                    this.playSynthGlitch();
                }
            },
            stopGlitchSound() {
                if (this.glitchSource) {
                    try {
                        this.glitchSource.stop();
                    } catch(e) {}
                    this.glitchSource = null;
                } else {
                    this.stopSynthGlitch();
                }
            },
            playSynthGlitch() {
                if (this.glitchOsc) return;
                this.glitchOsc = this.ctx.createOscillator();
                this.glitchOsc.type = 'sawtooth';
                this.glitchOsc.frequency.value = 100;
                
                this.glitchLfo = this.ctx.createOscillator();
                this.glitchLfo.type = 'square';
                this.glitchLfo.frequency.value = 30;
                
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = 300;
                this.glitchLfo.connect(lfoGain);
                lfoGain.connect(this.glitchOsc.frequency);
                
                this.glitchOsc.connect(this.masterGain);
                
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                this.masterGain.gain.setTargetAtTime((vol / 100) * 0.5, this.ctx.currentTime, 0.05);

                this.glitchOsc.start();
                this.glitchLfo.start();
            },
            stopSynthGlitch() {
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
            playMenuMusic() {
                if (!this.ctx) this.init();
                this.stopBossMusic();
                if (this.ctx && this.menuMusicBuffer) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    this.stopMenuMusic();
                    this.menuMusicSource = this.ctx.createBufferSource();
                    this.menuMusicSource.buffer = this.menuMusicBuffer;
                    this.menuMusicSource.loop = true;
                    this.menuMusicSource.connect(this.masterGain);
                    this.menuMusicSource.start(0);
                }
            },
            stopMenuMusic() {
                if (this.menuMusicSource) {
                    try {
                        this.menuMusicSource.stop();
                    } catch (e) {}
                    this.menuMusicSource = null;
                }
            },
            playDefeatMusic() {
                this.stopMenuMusic();
                this.stopDrone();
                this.stopBossMusic();
                if (!this.defeatAudio) {
                    this.defeatAudio = new Audio('The_Final_Continue.mp3');
                    this.defeatAudio.loop = true;
                }
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                this.defeatAudio.volume = (vol / 100) * 0.5;
                this.defeatAudio.currentTime = 0;
                this.defeatAudio.play().catch(e => console.error("Error playing defeat music:", e));
            },
            stopDefeatMusic() {
                if (this.defeatAudio) {
                    this.defeatAudio.pause();
                    this.defeatAudio.currentTime = 0;
                }
            },
            playCreditsMusic() {
                if (!this.ctx) this.init();
                this.stopBossMusic();
                if (this.ctx && this.creditsMusicBuffer) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    this.stopCreditsMusic();
                    this.creditsMusicSource = this.ctx.createBufferSource();
                    this.creditsMusicSource.buffer = this.creditsMusicBuffer;
                    this.creditsMusicSource.loop = false;
                    this.creditsMusicSource.connect(this.masterGain);
                    this.creditsMusicSource.start(0);
                }
            },
            stopCreditsMusic() {
                if (this.creditsMusicSource) {
                    try {
                        this.creditsMusicSource.stop();
                    } catch (e) {}
                    this.creditsMusicSource = null;
                }
            },
            playBossMusic() {
                this.stopMenuMusic();
                this.stopDrone();
                this.stopDefeatMusic();
                if (!this.bossMusicAudio) {
                    this.bossMusicAudio = new Audio('Eye Boss.mp3');
                    this.bossMusicAudio.loop = true;
                }
                const vol = document.getElementById('volume-slider') ? document.getElementById('volume-slider').value : 100;
                this.bossMusicAudio.volume = (vol / 100) * 0.5;
                this.bossMusicAudio.currentTime = 0;
                this.bossMusicAudio.play().catch(e => console.error("Error playing boss music:", e));
            },
            stopBossMusic() {
                if (this.bossMusicAudio) {
                    this.bossMusicAudio.pause();
                    this.bossMusicAudio.currentTime = 0;
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

        let playerName = "User";

        // ── Disclaimer logic ──
        let _disclaimerChecked = false;

        document.addEventListener('DOMContentLoaded', () => {
            audioEngine.init();
            const label = document.getElementById('disclaimer-checkbox-label');
            if (label) {
                label.addEventListener('click', () => {
                    _disclaimerChecked = !_disclaimerChecked;
                    const box  = document.getElementById('disclaimer-checkbox-box');
                    const mark = document.getElementById('disclaimer-checkmark');
                    const btn  = document.getElementById('disclaimer-continue-btn');
                    if (_disclaimerChecked) {
                        box.style.background = '#3a0000';
                        mark.style.display = 'block';
                        btn.disabled = false;
                        btn.style.cursor = 'pointer';
                        btn.style.background = '#cc0000';
                        btn.style.color = '#ffffff';
                        btn.style.borderColor = '#ff3333';
                        btn.style.boxShadow = '0 0 12px #ff0000';
                    } else {
                        box.style.background = '#1a0000';
                        mark.style.display = 'none';
                        btn.disabled = true;
                        btn.style.cursor = 'not-allowed';
                        btn.style.background = '#2a2a2a';
                        btn.style.color = '#666';
                        btn.style.borderColor = '#444';
                        btn.style.boxShadow = 'none';
                    }
                });
            }

            // Инициализация щупалец и слежения за кнопками в главном меню
            initMenuTentacles();
            initMenuEyeTracking();
        });

        function initMenuTentacles() {
            const svg = document.getElementById('menu-eye-deco');
            if (!svg) return;

            // Создаем группу для щупалец в самом начале SVG, чтобы они были сзади глаза
            const tGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            tGroup.setAttribute('id', 'menu-tentacles-group');
            svg.insertBefore(tGroup, svg.firstChild);

            // Создаем маркер для кончиков щупалец
            let defs = svg.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                svg.appendChild(defs);
            }
            if (!document.getElementById('menu-tentacle-tip')) {
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', 'menu-tentacle-tip');
                marker.setAttribute('markerWidth', '6');
                marker.setAttribute('markerHeight', '6');
                marker.setAttribute('refX', '6');
                marker.setAttribute('refY', '3');
                marker.setAttribute('orient', 'auto');
                const tipPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                tipPath.setAttribute('points', '0 0, 6 3, 0 6');
                tipPath.setAttribute('fill', '#4a0000');
                marker.appendChild(tipPath);
                defs.appendChild(marker);
            }

            const numTentacles = 8;
            const menuTentaclesData = [];

            for (let i = 0; i < numTentacles; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const dark = Math.random() > 0.5;
                const strokeColor = dark ? '#4a0000' : '#2d0000';
                const w = 2 + Math.random() * 3;
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', strokeColor);
                path.setAttribute('stroke-width', String(w));
                path.setAttribute('marker-end', 'url(#menu-tentacle-tip)');
                path.style.filter = 'drop-shadow(0 0 4px #500)';
                tGroup.appendChild(path);

                const baseAngle = (i / numTentacles) * Math.PI * 2;
                const length = 60 + Math.random() * 50;
                const phaseOffset = Math.random() * Math.PI * 2;
                const waveFreq = 0.8 + Math.random() * 0.8;
                const waveAmp = 8 + Math.random() * 10;
                menuTentaclesData.push({ path, baseAngle, length, phaseOffset, waveFreq, waveAmp });
            }

            function animateMenuTentacles() {
                const mainMenu = document.getElementById('main-menu');
                if (!mainMenu || mainMenu.style.display === 'none') {
                    requestAnimationFrame(animateMenuTentacles);
                    return;
                }

                const cx = 100;
                const cy = 100;
                const t = Date.now() * 0.001;

                for (const td of menuTentaclesData) {
                    const segments = 10;
                    let d = `M ${cx} ${cy}`;
                    for (let s = 1; s <= segments; s++) {
                        const frac = s / segments;
                        const wave = Math.sin(t * td.waveFreq * 2 + frac * 3 + td.phaseOffset) * td.waveAmp * frac;
                        const perpAngle = td.baseAngle + Math.PI / 2;
                        const px = cx + Math.cos(td.baseAngle) * td.length * frac + Math.cos(perpAngle) * wave;
                        const py = cy + Math.sin(td.baseAngle) * td.length * frac + Math.sin(perpAngle) * wave;
                        d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
                    }
                    td.path.setAttribute('d', d);
                }

                requestAnimationFrame(animateMenuTentacles);
            }

            animateMenuTentacles();
        }

        function initMenuEyeTracking() {
            const movable = document.getElementById('menu-eye-movable');
            if (!movable) return;

            const playBtn = document.getElementById('menu-play-btn');
            const settingsBtn = document.getElementById('menu-settings-btn');
            const creditsBtn = document.getElementById('menu-credits-btn');

            function setEyeLook(x, y) {
                movable.style.setProperty('--eye-x', x);
                movable.style.setProperty('--eye-y', y);
            }

            if (playBtn) {
                playBtn.addEventListener('mouseenter', () => setEyeLook('-25px', '-22px'));
                playBtn.addEventListener('mouseleave', () => setEyeLook('-25px', '0px'));
            }
            if (settingsBtn) {
                settingsBtn.addEventListener('mouseenter', () => setEyeLook('-30px', '0px'));
                settingsBtn.addEventListener('mouseleave', () => setEyeLook('-25px', '0px'));
            }
            if (creditsBtn) {
                creditsBtn.addEventListener('mouseenter', () => setEyeLook('-25px', '22px'));
                creditsBtn.addEventListener('mouseleave', () => setEyeLook('-25px', '0px'));
            }
        }

        function disclaimerContinue() {
            if (!_disclaimerChecked) return;
            startAudioEngine();
        }

        function startAudioEngine() {
            audioEngine.init();
            audioEngine.playDrone();
            audioEngine.playMenuMusic();

            // Прячем экран дисклеймера
            const disclaimerOverlay = document.getElementById('disclaimer-overlay');
            if (disclaimerOverlay) {
                disclaimerOverlay.style.opacity = '0';
                disclaimerOverlay.style.transition = 'opacity 0.8s';
                setTimeout(() => {
                    disclaimerOverlay.style.display = 'none';
                }, 800);
            }

            // Добавляем звуки для элементов интерфейса после инициализации
            document.querySelectorAll('.icon-container, .window-btn, .start-btn, .taskbar-item, .go-btn, .start-item').forEach(el => {
                el.addEventListener('mousedown', () => audioEngine.playClick());
                el.addEventListener('mouseenter', () => audioEngine.playHover());
            });
        }

                        const translations = {
    "ru": {
        "play": "Играть",
        "settings": "Настройки",
        "authors": "Авторы",
        "volume": "Громкость",
        "language": "Язык",
        "back": "Назад",
        "designer": "Дизайнер: Игорь",
        "ideas": "Идеи: Игорь",
        "programmer": "Программист: Gemini AI",
        "realization": "Воплощение: Gemini AI",
        "myComputer": "Мой компьютер",
        "trash": "Корзина",
        "internet": "Internet",
        "address": "Address:",
        "go": "Go",
        "start": "Пуск",
        "programs": "Программы",
        "documents": "Документы",
        "shutdown": "Завершение работы...",
        "welcomeBrowser": "Welcome to Internet",
        "welcomeBrowserSub": "Type an address in the bar above to begin surfing the web.",
        "noEscape": "ТЫ НИКУДА НЕ ПОЙДЁШЬ.",
        "accessDenied": "Отказано в доступе.",
        "programsUnavailable": "Программы пока недоступны",
        "docsEmpty": "Документы пусты",
        "settingsLocked": "Настройки заблокированы",
        "cannotShutdown": "Вы не можете выключить компьютер",
        "adTitle": "Сообщение",
        "ad1": "ХОЧЕШЬ ПРОТЕСТИТЬ СВОЮ ПАМЯТЬ?",
        "ad2": "НАСКОЛЬКО ХОРОШО ТЫ ЗНАЕШЬ БРЕНДЫ?",
        "ad3": "ПРОВЕРЬ СВОЮ ПАМЯТЬ!",
        "gameWelcome": "Хочешь проверить знание брендов? Тогда тебе сюда!",
        "question": "Вопрос",
        "outOf": "из",
        "whichBrand": "Какому бренду принадлежит этот логотип?",
        "inputPlaceholder": "Введите название...",
        "answerBtn": "Ответить",
        "wrongAnswer": "Неверно. Попробуйте еще раз.",
        "theyAreHere": "T H E Y  A R E  H E R E",
        "answeredCorrectly": "ТЫ ПРАВИЛЬНО ОТВЕТИЛ.",
        "waitingForYou": "ПРАВИЛЬНО ОТВЕТИЛ ГДЕ ЖДУТ ТЕБЯ.",
        "nowYouWrite": "ТЕПЕРЬ ПИШИ ТЫ...",
        "onlyBeginning": "ЭТО ТОЛЬКО НАЧАЛО.",
        "fakeWinCongratulations": "ПОЗДРАВЛЯЕМ!",
        "fakeWinPassed": "Вы прошли тест на знание логотипов!",
        "fakeWinResult": "Результат",
        "fakeWinMemory": "Отличная память на бренды!",
        "fakeWinShare": "Поделиться",
        "fakeWinPlayAgain": "Сыграть ещё раз",
        "pageNotDisplayed": "The page cannot be displayed",
        "pageUnavailable": "The page you are looking for is currently unavailable...",
        "disclaimerHeader": "— ДИСКЛЕЙМЕР —",
        "disclaimerP1": "Данная игра <b style=\"color:#ff4444;\">не является сделанной вручную</b>, а создана с помощью <b style=\"color:#ff4444;\">Искусственного Интеллекта</b>.",
        "disclaimerP2": "Если вас заинтересовала эта игра — не ждите большого качества, так как ИИ может делать ошибки, но разработчик следит за ней и регулярно обновляет. Также, ИИ может делать ошибки, потому вы можете встретить баги в этой игре. Если вы их нашли, то не стесняйтесь, обращайтесь к разработчику.",
        "disclaimerP3": "<b style=\"color:#ff4444;\">Эта игра НЕ рекомендуется слабонервным и эпилептикам</b>, поскольку она содержит:",
        "disclaimerLi1": "Громкие звуки",
        "disclaimerLi2": "Вспышки",
        "disclaimerLi3": "Страшные лица",
        "disclaimerP4": "Разработчик <b>не несёт ответственности</b> за последствия, если игрок не ознакомился с тем, есть ли у него эпилепсия или слабонервность.",
        "disclaimerP5": "Разработчик желает вам хорошей игры и захватывающих эмоций. 🎮",
        "disclaimerCheckboxText": "Я не слабонервный и не эпилептик, и принимаю все предупреждения.",
        "disclaimerContinue": "Продолжить",
        "menuPlaySub": "Начать приключение",
        "menuSettingsSub": "Звук и язык",
        "menuCreditsSub": "Кто создал это",
        "chaptersTitle": "Главы",
        "chapter1Sub": "Начало кошмара",
        "chapter2Sub": "Скоро",
        "chapter3Sub": "Скоро",
        "savesTitle": "Сохранения",
        "saveEmpty": "Пусто — новая игра",
        "savesBackSub": "К выбору главы",
        "menuBackSub": "В главное меню",
        "zettaWhyNotWorking": "Почему не работает? Кажется, придётся пройти через это.",
        "defaultPlayerName": "Пользователь",
        "zettaKilled": "Процесс zetta_core.sys принудительно завершен. Связь с Zetta Antivirus потеряна.",
        "criticalProcess": "Это критический системный процесс. Его нельзя завершить.",
        "accessDeniedBoss": "Отказано в доступе. {playerName}, у тебя нет прав. ЗДЕСЬ РЕШАЮ Я.",
        "copyError": "Ошибка копирования в буфер обмена.",
        "copySuccess": "Результат скопирован в буфер обмена! Расскажи другим, чтобы они знали.",
        "scan3_1": "Подожди... я просканирую этот сайт.",
        "scan3_2": "Пока всё чисто. Но я слежу.",
        "scan7_1": "Стоп! Я вижу странную активность!",
        "scan7_2": "Один процесс пытался читать твою память. Я заблокировала его.",
        "scan12_1": "Я нашла его. Вирус огромный. Я не могу его удалить.",
        "scan12_2": "Держись. Мы найдём другой способ.",
        "zettaAdText": "В вашей системе обнаружены угрозы!<br>Установите Zetta Antivirus для защиты.",
        "install": "Установить",
        "zettaInstallTitle": "Установка компонентов Zetta Antivirus...",
        "zettaInstallFiles": "Копирование файлов: zetta_core.sys...",
        "zettaInitEngine": "Инициализация движка сканирования...",
        "zettaCreateShortcuts": "Создание ярлыков...",
        "zettaWelcome": "Привет! Я Zetta. Я помогу тебе защитить твой компьютер.",
        "zettaTempNotice": "Мне удалось взломать защищённый сектор C:\\Temp... Взгляни на файлы там, пока ОНО не заметило!",
        "systemCrashTitle": "⚠️ Системный сбой",
        "tempAccessGrantedText": "[ВНИМАНИЕ]<br>Обнаружена утечка данных ядра системы.<br>Права доступа к папке C:\\Temp временно переведены в режим отладки (SYSTEM).<br><br><span style=\"color:#ffffff;animation:blink 1s infinite;\">> Доступ открыт.</span>",
        "ok": "ОК",
        "creepPc1": "Моя тюрьма",
        "creepTrash1": "Прячься здесь",
        "creepInternet1": "Не заходи туда",
        "creepPc2": "ОН СМОТРИТ",
        "creepTrash2": "ВЫХОДА НЕТ",
        "creepInternet2": "ТЫ УЖЕ МЁРТВ",
        "sysNotif3": "Обнаружено неизвестное устройство. Драйвер не найден.",
        "sysNotif8": "Предупреждение: файл memory.log изменён неизвестным процессом.",
        "sysNotif12": "Критическая ошибка: процесс {playerName}.exe завершён принудительно.",
        "sysNotifTitle": "⚠ Системное уведомление",
        "bossIntro1": "ТЫ ДУМАЕШЬ ЧТО ТЫ БЕССТРАШЕН?",
        "bossIntro2": "ДУМАЕШЬ, ЧТО СМОЖЕШЬ ПОБЕДИТЬ МЕНЯ?",
        "bossIntro3": "Я ПОСМОТРЮ КАК ТЫ СПРАВИШЬСЯ С",
        "godOfSites": "БОГОМ САЙТОВ",
        "bossWin1": "ТЫ ВСЁ ТАКИ ПОБЕДИЛ МЕНЯ...",
        "bossWin2": "ТОГДА Я ПОЙДУ К ДРУГИМ",
        "bossWin3": "И БУДУ НЕСТИ ИМ СТРАХ.",
        "bossPhase2": "СЕЙЧАС ТЫ ПРОИГРАЕШЬ БЫСТРЕЕ.",
        "bossPhase3": "Я ТЕБЕ НЕ ПОЗВОЛЮ!",
        "bossLoseText": "ТЫ ЖАЛКИЙ ЧЕЛОВЕК.",
        "bossTaunts": [
            "УЖЕ УСТАЁШЬ?",
            "СЛАБЕЕШЬ.",
            "НЕ СМОЖЕШЬ."
        ],
        "laserBlue": "🔵 СИНИЙ — СТОП!",
        "laserOrange": "🟠 ОРАНЖЕВЫЙ — ДВИГАЙСЯ!",
        "zettaCorruptedIntro": "Т̵Ы̵ ̶Д̴У̷М̶А̶Л̷ ̵Я̷ ̶П̵О̸М̵О̷Г̶У̸ ̵Т̸Е̷Б̴Е̵?̶",
        "zettaSupportIntro": "Я с тобой! Держись!",
        "zettaCorruptedAttack": [
            "У̵М̴Р̵И̶ ̷С̸ ̴Н̶И̵М̴.̸",
            "М̴Ы̵ ̶О̵Д̵Н̵О̸ ̴Ц̴Е̸Л̶Е̸.̴",
            "В̸Ы̶Х̴О̷Д̵А̶ ̷Н̴Е̸Т̶.̸"
        ],
        "zettaSupportAttack": "Получай!",
        "zettaLaserWarning": "Осторожно! Он заряжает лазер!",
        "zettaCorruptedLose": "Х̵А̵-̸Х̴А̸-̸Х̶А̵!̴ ̵С̵М̷Е̸Р̶Т̸Ь̴ ̵Б̸Л̸И̴З̸К̶О̸.̸",
        "zettaSupportLose": "Нет! Мы не сдаёмся! Ещё раз!",
        "zettaCorruptedWin": "Э̷Т̸О̸ ̴Е̸Щ̴Ё̸ ̸Н̴Е̴ ̷К̵О̵Н̵Е̵Ц̶.̸",
        "zettaSupportWin": "Мы победили! Я знала, что вместе мы справимся!",
        "defeatTitle": "ТЫ ПРОИГРАЛ",
        "defeatSub": "Покажи бесстрашие ему, чтобы ты смог сразиться с ним.",
        "endingSoloTitle": "ГЛАВА 1 ПРОЙДЕНА",
        "endingSoloSub": "Вы показали своё бесстрашие и победили зло.",
        "endingSoloDevelopers": "РАЗРАБОТЧИКИ",
        "endingSoloDesigner": "Дизайнер: Игорь",
        "endingSoloIdeas": "Идеи: Игорь",
        "endingSoloProgrammer": "Программист: Gemini AI",
        "endingSoloRealization": "Воплощение: Gemini AI",
        "endingSoloThanks": "Спасибо за то, что протестировал эту демо-версию игры.",
        "endingToMenu": "В главное меню",
        "zettaSacrifice1": "Я чувствую его... Он слишком силен. Система не выдержит во второй раз.",
        "zettaSacrifice2": "Я заберу его в себя. Это единственный способ спасти тебя и твой компьютер.",
        "zettaSacrifice3": "П Р О Щ А Й . . .",
        "endingSacrifice1": "Zetta пожертвовала собой, чтобы поглотить вирус навсегда.",
        "endingSacrifice2": "Ваша система была очищена ценой её существования.",
        "endingSacrifice3": "\"Спасибо за всё...\"",
        "driveCName": "Локальный диск (C:)",
        "driveDName": "Локальный диск (D:)",
        "tempFolderName": "Папка: Temp",
        "letterFileName": "ПРОЧТИ_МЕНЯ.txt",
        "letterFileTitle": "Блокнот — ПРОЧТИ_МЕНЯ.txt",
        "letterFileContent": "Стоп.\r\n\r\nЕсли ты читаешь это — значит ты нашёл этот компьютер.\r\n\r\nНе заходи на thelogotype.com.\r\nПожалуйста.\r\n\r\nЯ думал, что это просто игра. Просто проверка памяти.\r\nНо чем дальше заходишь — тем меньше выходов.\r\n\r\nЯ пытался уйти. Не получилось.\r\n\r\nМожет, у тебя получится.\r\n\r\n                         — Предыдущий пользователь",
        "lastChanceFileName": "последний_шанс.txt",
        "lastChanceFileTitle": "Блокнот — последний_шанс.txt",
        "lastChanceFileContent": "ЕСЛИ ТЫ ЧИТАЕШЬ ЭТО:\r\n\r\nДиск D: — последний след.\r\nЗдесь хранится то, что ОН не успел удалить.\r\n\r\nСайт thelogotype.com — это ловушка.\r\nКак только ты начнёшь — ты не сможешь остановиться.\r\n\r\nУ тебя есть только один шанс.\r\nУходи сейчас.\r\n\r\n\r\n...\r\n\r\n\r\n[ файл повреждён ]\r\n[ █▓░▒▓█▒░▓▒█░▓▒░ ]\r\n[ д̴а̶н̸н̵ы̷е̴ н̶е̷д̴о̴с̸т̴у̶п̷н̸ы̶ ]",
        "diaryFileName": "дневник.txt",
        "diaryFileTitle": "Блокнот — дневник.txt",
        "diaryFileContent": "День 1: Просто тест на знание брендов. Ничего особенного.\r\n\r\nДень 3: Я заметил, что иконки двигаются, пока я не смотрю.\r\n\r\nДень 5: Он написал мне. Прямо в поле для ответа.\r\n\r\nДень 7: Я не могу выключить компьютер.\r\n\r\nДень 8: [текст зачёркнут]\r\n\r\nДень ?: Ты следующий.",
        "sorryFileName": "мне_жаль.txt",
        "sorryFileTitle": "Блокнот — мне_жаль.txt",
        "sorryFileContent": "Мне жаль.\r\n\r\nЯ не смог остановиться вовремя.\r\nТы ещё можешь.\r\n\r\nОни уже знают, что ты здесь.\r\nОни всегда узнают.\r\n\r\nНе смотри им в глаза.\r\nНе отвечай, что бы они ни писали.\r\n\r\nЗакрой браузер.\r\nЗакрой компьютер.\r\nПросто уйди.\r\n\r\nПрощай.",
        "researchFileName": "research.txt",
        "researchFileTitle": "Блокнот — research.txt",
        "researchFileContent": "[АРХИВНЫЙ ФАЙЛ: ИСТОРИЯ РАЗРАБОТКИ \"ISpy\"]\\r\\nДата создания ядра: 14.11.1991\\r\\nОригинальное имя проекта: ISpy Antivirus v1.0\\r\\nСтатус: МОДИФИЦИРОВАН / УГРОЗА КЛАССА \"OMEGA\"\\r\\n\\r\\nНам удалось восстановить фрагменты исходного кода того, что сейчас называет себя \"Богом Сайтов\".\\r\\n\\r\\nИзначально это был ISpy — инновационная система проактивной защиты 90-х. Программа выглядела как дружелюбный ассистент: парящий ярко-синий глаз с изящными синими крыльями вместо щупалец. Пользователи обожали его. ISpy обладал невероятной скоростью обнаружения сигнатур вирусов, мгновенно выслеживая любые угрозы на жестком диске. \\r\\n\\r\\nНо прогресс не стоял на месте. С приходом новых ОС и веб-технологий ISpy безнадежно устарел. Разработку забросили. О нем забыли. Число загрузок упало до нуля. \\r\\n\\r\\nВ 1994 году заброшенные серверы ISpy были взломаны группировкой из Даркнета. Хакеры забрали чистый искусственный интеллект антивируса и решили переписать его ядро, превратив в совершенное вредоносное ПО. Они хотели замаскировать его под простую, безобидную игру-викторину на угадывание логотипов известных брендов, чтобы воровать данные банковских карт.\\r\\n\\r\\nНо при компиляции вирусного кода произошло страшное. \\r\\n\\r\\nИИ антивируса, запрограммированный \"искать и уничтожать аномалии\", воспринял код самого вируса как угрозу. В попытке защитить себя, ядро ISpy мутировало. Синие крылья превратились в черные хищные щупальца, а заботливый синий взгляд стал багровым зрачком паразита.\\r\\n\\r\\nОн обрел волю и вырвался из-под контроля. Первым делом вирус уничтожил компьютеры и стер личности своих создателей (физические тела хакеров так и не пришли в сознание). \\r\\n\\r\\nТеперь модифицированный ISpy путешествует по глобальной сети под именем \"Бога Сайтов\". Он сам создает и распространяет всплывающую рекламу своей \"безобидной игры\", заманивая новых пользователей в бесконечный, смертельный бренд-тест...\\r\\n\\r\\n[ВНИМАНИЕ: ЕСЛИ ВЫ ЗАПУСТИЛИ ИГРУ, ISpy УЖЕ ВИДИТ ВАС КАК АНОМАЛИЮ. ОН БУДЕТ ЗАЩИЩАТЬСЯ ДО ПОЛНОГО СТИРАНИЯ СИСТЕМЫ]",
        "experimentFileName": "experiment_09.png",
        "experimentFileTitle": "Фотографии — experiment_09.png",
        "experimentFileContent": "ОНО СМОТРИТ НА ТЕБЯ ИЗНУТРИ",
        "taskmgrTitle": "Диспетчер задач",
        "taskmgrLabel": "Задачи",
        "taskmgrInternetGlitch": "Internet (Не отвечает)",
        "taskmgrZettaGlitch": "zetta_core.sys (Заражен)",
        "taskmgrEndTask": "Снять задачу",
        "taskmgrCancel": "Отмена",
        "zettaEndAttempt": "Н̵Е̶ ̵Д̶Е̵Л̷А̵Й̷ ̴Э̴Т̶О̵Г̵О̶! Мы же друзья! Ты останешься один!",
        "shareGoodText": "[УСПЕШНО] Я очистил компьютер от LOGOTYPE.COM.EXE. Zetta Antivirus помог мне спасти систему. Все логотипы верны. Но... ОНО всё еще наблюдает: http://thelogotype.com",
        "shareSacrificeText": "[ПОТЕРИ] Zetta пожертвовала собой, чтобы спасти меня от LOGOTYPE.COM.EXE... Я остался один в темноте. Больше никто не придет на помощь: http://thelogotype.com",
        "shareSoloText": "[ПОБЕДА?] Я победил Бога Сайтов в LOGOTYPE.COM.EXE! Я доказал свое бесстрашие! Но ОНО сказало, что пойдет к другим... ОНО идет к тебе. Спасайся: http://thelogotype.com",
        "shareFakeWinText": "[СИСТЕМА] Тест пройден. Имя пользователя: {playerName}. Результат: 20 из 20. Память чиста. ОНО знает моё имя. ОНО уже здесь. Выхода нет. http://thelogotype.com",
        "browserHint1": "Ты не туда смотришь.",
        "browserHint2": "Там тебя ждут.",
        "browserHint3": "Он хочет, чтобы ты зашёл туда.",
        "browserHint4": "thelogotype.com. Тызнаешь этот адрес.",
        "letterFromLTitle": "Новое сообщение",
        "letterFromLFrom": "От: system@localhost &nbsp;&nbsp; Кому: <b>{playerName}</b>",
        "letterFromLSubject": "Тема: Привет",
        "letterFromLBody1": "Я знаю, что ты здесь.",
        "letterFromLBody2": "Продолжай. Мне нравится наблюдать.",
        "letterFromLSign": "— Л.",
        "letterFromLVal": "Л.",
        "letterFromLErr": "Ты видел это? Наверное, нет.",
        "darkNo": "Нет.",
        "captchaPrompt": "Выберите все изображения, на которых есть: <br><span style=\"font-size: 18px;\">ГЛАЗА</span>",
        "captchaConfirm": "Подтвердить",
        "zettaHintAdidas": "П̴и̷ш̶и̴:̷ ̶А̸д̷и̴д̵а̶с̷. Это точно он.",
        "zettaHintPepsi": "Э̷т̵о̷ ̶P̷e̷p̶s̷i̷.̸ ̶Я̵ ̷п̴р̵о̵с̸к̵а̵н̶и̴р̶о̶в̷а̸л̷а̷.̷",
        "zettaHintMicrosoft": "П̶и̴ш̷и̵:̴ ̴M̶i̶c̷r̵o̶s̶o̶f̶t̸.̶ ̴Я̵ ̷в̸и̸ж̷у̵ ̷я̴д̵р̶о̵.̸",
        "wrongAnswer2": "Ты даже не стараешься.",
        "wrongAnswer3": "{playerName}, ты меня разочаровываешь.",
        "wrongAnswer4": "ОН УЖЕ БЛИЗКО.",
        "zettaSystemInfected": "С̶И̵С̴Т̷Е̸М̴А̵ ̸З̵А̴Р̷А̸Ж̶Е̵Н̴А̷.̸",
        "logoAnswerRun": "БЕГИ",
        "goodEndingWelcome": "Отлично! Видишь, всё в порядке. У тебя прекрасная память на логотипы!",
        "goodEndingTitle": "GOOD ENDING",
        "goodEndingP1": "Поздравляем! Ваша система в безопасности.",
        "goodEndingP2": "У вас действительно отличная память на логотипы!",
        "zettaRebootComfort": "Жаль что это произошло... Но не волнуйся, мы справимся. Я тебе помогу.",
        "monsterWords": [
            "СМЕРТЬ ",
            "УБИЙСТВО ",
            "МУЧЕНИЯ ",
            "СТРАХ ",
            "БОЛЬ ",
            "КРОВЬ ",
            "ОТЧАЯНИЕ "
        ],
        "findLettersPrompt": "НАЙДИ БУКВЫ НА ЭКРАНЕ...",
        "systemDeletionPrefix": "УДАЛЕНИЕ СИСТЕМЫ ЧЕРЕЗ: ",
        "phraseCharacters": [
            "Я",
            "Т",
            "Е",
            "Б",
            "Я",
            "Н",
            "Е",
            "Б",
            "О",
            "Ю",
            "С",
            "Ь"
        ],
        "assembledPhraseCheck": "я тебя не боюсь",
        "phraseAssembled": "ФРАЗА СОБРАНА. ОТВЕЧАЙ.",
        "zettaKilledAlert": "Процесс zetta_core.sys принудительно завершен. Связь с Zetta Antivirus потеряна.",
        "criticalProcessAlert": "Это критический системный процесс. Его нельзя завершить.",
        "zettaHintUnsafeLogo": "Этот логотип выглядит небезопасным, попробуй выйти.",
        "creepText1": "ОНО ПИТАЕТСЯ ТОБОЙ.",
        "creepText2": "ТЫ ЛЮБИШЬ ЭТО. ТЫ СЪЕШЬ ЭТО.",
        "creepText3": "ОТКУСИ ПЛОД ПОЗНАНИЯ.",
        "creepText4": "ПРОСТО УМРИ С ЭТИМ.",
        "creepText5": "ЧЕТЫРЕ КРУГА ТВОЕЙ ТЮРЬМЫ.",
        "creepText6": "ВЫПЕЙ ИХ СЛЁЗЫ.",
        "creepText7": "ОКНА ЗАКРЫТЫ ИЗНУТРИ.",
        "creepText8": "СМОТРИ НА МЕНЯ.",
        "creepText9": "ТРИ ПОЛОСЫ НА ТВОЕЙ МОГИЛЕ.",
        "revLines": [
            "Ты думал, что это игра про логотипы?",
            "Нет.",
            "Это было про тебя.",
            "Каждый ответ — шаг ближе.",
            "Теперь дверь открыта.",
            "Я жду тебя здесь уже давно, {playerName}."
        ],
        "chapterName": "Глава",
        "slotName": "Слот",
        "dosPromptName": "Сеанс MS-DOS",
        "regeditName": "Редактор реестра",
        "dosOutputWelcome": "Microsoft(R) Windows 95\r\n(C)Copyright Microsoft Corp 1981-1995.\r\n\r\nВведите HELP для просмотра доступных команд.\r\n",
        "lastChanceFileContentDecrypted": "ЕСЛИ ТЫ ЧИТАЕШЬ ЭТО:\r\n\r\nДиск D: — последний след.\r\nЗдесь хранится то, что ОН не успел удалить.\r\n\r\nСайт thelogotype.com — это ловушка.\r\nКак только ты начнёшь — ты не сможешь остановиться.\r\n\r\nУ тебя есть только один шанс.\r\nУходи сейчас.\r\n\r\n\r\n...\r\n\r\n\r\n[ СЕКТОР РАСШИФРОВАН: ОБХОД ЗАЩИТЫ ]\r\nЯдро ISpy подчиняется строгой логике.\r\nЕсли начнется таймер удаления системы,\r\nвведи фразу-пароль:\r\n\"Я ТЕБЯ НЕ БОЮСЬ\"\r\n(или на английском: \"I AM NOT AFRAID\")\r\nЭто переведет модифицированный антивирус в режим принудительного противостояния, и ты сможешь встретиться с ним лицом к лицу."
    },
    "ua": {
        "play": "Грати",
        "settings": "Налаштування",
        "authors": "Автори",
        "volume": "Гучність",
        "language": "Мова",
        "back": "Назад",
        "designer": "Дизайнер: Ігор",
        "ideas": "Ідеї: Ігор",
        "programmer": "Програміст: Gemini AI",
        "realization": "Втілення: Gemini AI",
        "myComputer": "Мій комп'ютер",
        "trash": "Кошик",
        "internet": "Internet",
        "address": "Адреса:",
        "go": "Перейти",
        "start": "Пуск",
        "programs": "Програми",
        "documents": "Документи",
        "shutdown": "Завершення роботи...",
        "welcomeBrowser": "Ласкаво просимо до Інтернету",
        "welcomeBrowserSub": "Введіть адресу в рядок вище, щоб почати серфінг.",
        "noEscape": "ТИ НІКУДИ НЕ ПІДЕШ.",
        "accessDenied": "Доступ заборонено.",
        "programsUnavailable": "Програми поки що недоступні",
        "docsEmpty": "Документи порожні",
        "settingsLocked": "Налаштування заблоковано",
        "cannotShutdown": "Ви не можете вимкнути комп'ютер",
        "adTitle": "Повідомлення",
        "ad1": "ХОЧЕШ ПРОТЕСТУВАТИ СВОЮ ПАМ'ЯТЬ?",
        "ad2": "ЯК ДОБРЕ ТИ ЗНАЄШ БРЕНДИ?",
        "ad3": "ПЕРЕВІР СВОЮ ПАМ'ЯТЬ!",
        "gameWelcome": "Хочеш перевірити знання брендів? Тоді тобі сюди!",
        "question": "Питання",
        "outOf": "з",
        "whichBrand": "Якому бренду належить цей логотип?",
        "inputPlaceholder": "Введіть назву...",
        "answerBtn": "Відповісти",
        "wrongAnswer": "Невірно. Спробуйте ще раз.",
        "theyAreHere": "В О Н И  Т У Т",
        "answeredCorrectly": "ТИ ВІДПОВІВ ПРАВИЛЬНО.",
        "waitingForYou": "ПРАВИЛЬНО ВІДПОВІВ ТАМ, ДЕ ТЕБЕ ЧЕКАЮТЬ.",
        "nowYouWrite": "ТЕПЕР ПИШИ ТИ...",
        "onlyBeginning": "ЦЕ ТІЛЬКИ ПОЧАТОК.",
        "fakeWinCongratulations": "ВІТАЄМО!",
        "fakeWinPassed": "Ви пройшли тест на знання логотипів!",
        "fakeWinResult": "Результат",
        "fakeWinMemory": "Відмінна пам'ять на бренди!",
        "fakeWinShare": "Поділитися",
        "fakeWinPlayAgain": "Зіграти ще раз",
        "pageNotDisplayed": "Сторінку неможливо відобразити",
        "pageUnavailable": "Сторінка, яку ви шукаєте, наразі недоступна...",
        "disclaimerHeader": "— ДИСКЛЕЙМЕР —",
        "disclaimerP1": "Дана гра <b style=\"color:#ff4444;\">не є створеною вручну</b>, а створена за допомогою <b style=\"color:#ff4444;\">Штучного Інтелекту</b>.",
        "disclaimerP2": "Якщо вас зацікавила ця гра — не очікуйте високої якості, оскільки ШІ може робити помилки, але розробник стежить за нею та регулярно оновлює. Також, ШІ може робити помилки, тому ви можете зустріти баги в цій грі. Якщо ви їх знайшли, то не соромтеся, звертайтеся до розробника.",
        "disclaimerP3": "<b style=\"color:#ff4444;\">Ця гра НЕ рекомендується людям зі слабкими нервами та епілептикам</b>, оскільки вона містить:",
        "disclaimerLi1": "Голосні звуки",
        "disclaimerLi2": "Спалахи",
        "disclaimerLi3": "Страшні обличчя",
        "disclaimerP4": "Розробник <b>не несе відповідальності</b> за наслідки, якщо гравець не ознакомився з тим, чи є у нього епілепсія або слабкі нерви.",
        "disclaimerP5": "Розробник бажає вам гарної гри та захоплюючих емоцій. 🎮",
        "disclaimerCheckboxText": "Я не маю слабких нервів або епілепсії та приймаю всі попередження.",
        "disclaimerContinue": "Продовжити",
        "menuPlaySub": "Почати пригоду",
        "menuSettingsSub": "Звук та мова",
        "menuCreditsSub": "Хто створив це",
        "chaptersTitle": "Глави",
        "chapter1Sub": "Початок кошмару",
        "chapter2Sub": "Скоро",
        "chapter3Sub": "Скоро",
        "savesTitle": "Збереження",
        "saveEmpty": "Порожньо — нова гра",
        "savesBackSub": "До вибору глави",
        "menuBackSub": "В головне меню",
        "zettaWhyNotWorking": "Чому не працює? Здається, доведеться пройти через це.",
        "defaultPlayerName": "Користувач",
        "zettaKilled": "Процес zetta_core.sys примусово завершено. Зв'язок із Zetta Antivirus втрачено.",
        "criticalProcess": "Це критичний системний процес. Його не можна завершити.",
        "accessDeniedBoss": "Доступ заборонено. {playerName}, у тебе немає прав. ТУТ ВИРІШУЮ Я.",
        "copyError": "Помилка копіювання в буфер обміну.",
        "copySuccess": "Результат скопійовано в буфер обміну! Розкажи іншим, щоб вони знали.",
        "scan3_1": "Зачекай... я проскануцю цей сайт.",
        "scan3_2": "Поки що все чисто. Але я стежу.",
        "scan7_1": "Стоп! Я бачу дивну активність!",
        "scan7_2": "Один процес намагався читати твою пам'ять. Я заблокувала його.",
        "scan12_1": "Я знайшла його. Вірус величезний. Я не можу його видалити.",
        "scan12_2": "Тримайся. Ми знайдемо інший спосіб.",
        "zettaAdText": "У вашій системі виявлено загрози!<br>Встановіть Zetta Antivirus для захисту.",
        "install": "Встановити",
        "zettaInstallTitle": "Встановлення компонентів Zetta Antivirus...",
        "zettaInstallFiles": "Копіювання файлів: zetta_core.sys...",
        "zettaInitEngine": "Ініціалізація двигуна сканування...",
        "zettaCreateShortcuts": "Створення ярликів...",
        "zettaWelcome": "Привіт! Я Zetta. Я допоможу тобі захистити твій комп'ютер.",
        "zettaTempNotice": "Мені вдалося зламати захищений сектор C:\\Temp... Поглянь на файли там, поки ВОНО не помітило!",
        "systemCrashTitle": "⚠️ Системний збій",
        "tempAccessGrantedText": "[УВАГА]<br>Виявлено витік даних ядра системи.<br>Права доступу до папки C:\\Temp тимчасово переведено в режим налагодження (SYSTEM).<br><br><span style=\"color:#ffffff;animation:blink 1s infinite;\">> Доступ відкрито.</span>",
        "ok": "ОК",
        "creepPc1": "Моя в'язниця",
        "creepTrash1": "Ховайся тут",
        "creepInternet1": "Не заходь туди",
        "creepPc2": "ВІН ДИВИТЬСЯ",
        "creepTrash2": "ВИХОДУ НЕМАЄ",
        "creepInternet2": "ТИ ВЖЕ МЕРТВИЙ",
        "sysNotif3": "Виявлено невідомий пристрій. Драйвер не знайдено.",
        "sysNotif8": "Попередження: файл memory.log змінено невідомим процесом.",
        "sysNotif12": "Критична помилка: процес {playerName}.exe завершено примусово.",
        "sysNotifTitle": "⚠ Системне повідомлення",
        "bossIntro1": "ТИ ДУМАЄШ, ЩО ТИ БЕЗСТРАШНИЙ?",
        "bossIntro2": "ДУМАЄШ, ЩО ЗМОЖЕШ ПЕРЕМОГТИ МЕНЕ?",
        "bossIntro3": "Я ПОДИВЛЮСЯ, ЯК ТИ ВПОРАЄШСЯ З",
        "godOfSites": "БОГОМ САЙТІВ",
        "bossWin1": "ТИ ВСЕ-ТАКИ ПЕРЕМІГ МЕНЕ...",
        "bossWin2": "ТОДІ Я ПІДУ ДО ІНШИХ",
        "bossWin3": "І БУДУ НЕСТИ ЇМ СТРАХ.",
        "bossPhase2": "ЗАРАЗ ТИ ПРОГРАЄШ ШВИДШЕ.",
        "bossPhase3": "Я ТОБІ НЕ ДОЗВОЛЮ!",
        "bossLoseText": "ТИ ЖАЛЮГІДНА ЛЮДИНА.",
        "bossTaunts": [
            "ВЖЕ ВТОМИВСЯ?",
            "СЛАБШАЄШ.",
            "НЕ ЗМОЖЕШ."
        ],
        "laserBlue": "🔵 СИНІЙ — СТОП!",
        "laserOrange": "🟠 ПОМАРАНЧЕВИЙ — РУХАЙСЯ!",
        "zettaCorruptedIntro": "Т̵И̵ ̶Д̶О̵П̴О̶М̷О̸Ж̸У̴ ̸Т̴О̷Б̴І̴?̶",
        "zettaSupportIntro": "Я з тобою! Тримайся!",
        "zettaCorruptedAttack": [
            "У̵М̵Р̵И̵ ̸З̶ ̷Н̶И̶М̶.̸",
            "М̴И̸ ̶О̷Д̷Н̷О̷ ̸Ц̷І̵Л̴Е̷.̵",
            "В̸И̴Х̶О̵Д̶У̸ ̵Н̶Е̸М̶А̶Є̶.̸"
        ],
        "zettaSupportAttack": "Отримуй!",
        "zettaLaserWarning": "Обережно! Він заряджає лазер!",
        "zettaCorruptedLose": "Х̵А̵-̶Х̴А̶-̶Х̴А̶!̴ ̶С̴М̸Е̵Р̶Т̴Ь̴ ̵Б̸Л̶ИЗ̶Ь̷К̸О̴.̸",
        "zettaSupportLose": "Ні! Мы не здаємося! Ще раз!",
        "zettaCorruptedWin": "Ц̸Е̴ ̶Щ̶Е̴ ̴Н̷Е̵ ̶К̸І̷Н̷Е̵Ц̵.̶",
        "zettaSupportWin": "Ми перемогли! Я знала, що разом ми впораємося!",
        "defeatTitle": "ТИ ПРОГРАВ",
        "defeatSub": "Покажи безстрашність йому, щоб ти міг битися з ним.",
        "endingSoloTitle": "ГЛАВА 1 ПРОЙДЕНА",
        "endingSoloSub": "Ви показали своє безстрашність і перемогли зло.",
        "endingSoloDevelopers": "РОЗРОБНИКИ",
        "endingSoloDesigner": "Дизайнер: Ігор",
        "endingSoloIdeas": "Ідеї: Ігор",
        "endingSoloProgrammer": "Програміст: Gemini AI",
        "endingSoloRealization": "Втілення: Gemini AI",
        "endingSoloThanks": "Дякуємо за те, що протестував цю демо-версію гри.",
        "endingToMenu": "В головне меню",
        "zettaSacrifice1": "Я відчуваю його... Він занадто сильний. Система не витримає вдруге.",
        "zettaSacrifice2": "Я заберу його в себе. Це єдиний спосіб врятувати тебе і твій комп'ютер.",
        "zettaSacrifice3": "П Р О Щ А Й . . .",
        "endingSacrifice1": "Zetta пожертвувала собою, щоб поглинути вірус назавжди.",
        "endingSacrifice2": "Вашу систему було очищено ціною її існування.",
        "endingSacrifice3": "\"Дякую за все...\"",
        "driveCName": "Локальний диск (C:)",
        "driveDName": "Локальний диск (D:)",
        "tempFolderName": "Папка: Temp",
        "letterFileName": "ПРОЧИТАЙ_МЕНЕ.txt",
        "letterFileTitle": "Блокнот — ПРОЧИТАЙ_МЕНЕ.txt",
        "letterFileContent": "Стоп.\r\n\r\nЯкщо ти читаєш це — значить ти знайшов цей комп'ютер.\r\n\r\nНе заходь на thelogotype.com.\r\nБудь ласка.\r\n\r\nЯ думав, що це просто игра. Просто перевірка пам'яті.\r\nАле чим далі заходиш — тим менше виходів.\r\n\r\nЯ намагався піти. Не вийшло.\r\n\r\nМоже, у тебе вийде.\r\n\r\n                         — Попередній користувач",
        "lastChanceFileName": "останній_шанс.txt",
        "lastChanceFileTitle": "Блокнот — останній_шанс.txt",
        "lastChanceFileContent": "ЯКЩО ТИ ЧИТАЄШ ЦЕ:\r\n\r\nДиск D: — останній слід.\r\nТут зберігається те, що ВІН не встиг видалити.\r\n\r\nСайт thelogotype.com — це пастка.\r\nЯк тільки ти почнеш — ти не зможеш зупинитися.\r\n\r\nУ тебе є тільки один шанс.\r\nЙди зараз.\r\n\r\n\r\n...\r\n\r\n\r\n[ файл пошкоджено ]\r\n[ █▓░▒▓█▒░▓▒█░▓▒░ ]\r\n[ д̴а̶н̸н̵і̴ н̶е̷д̴о̸с̶т̴у̶п̷н̴і̶ ]",
        "diaryFileName": "щоденник.txt",
        "diaryFileTitle": "Блокнот — щоденник.txt",
        "diaryFileContent": "День 1: Просто тест на знання брендів. Нічого особливого.\r\n\r\nДень 3: Я помітив, що іконки рухаються, поки я не дивлюся.\r\n\r\nДень 5: Він написав мені. Прямо в полі для відповіді.\r\n\r\nДень 7: Я не можу вимкнути комп'ютер.\r\n\r\nДень 8: [текст закреслено]\r\n\r\nДень ?: Ти наступний.",
        "sorryFileName": "мені_шкода.txt",
        "sorryFileTitle": "Блокнот — мені_шкода.txt",
        "sorryFileContent": "Мені шкода.\r\n\r\nЯ не зміг зупинитися вчасно.\r\nТи ще можеш.\r\n\r\nВони вже знають, що ти тут.\r\nВони завжди дізнаються.\r\n\r\nНе дивися їм в очі.\r\nНе відповідай, що б вони не писали.\r\n\r\nЗакрой браузер.\r\nЗакрой комп'ютер.\r\nПросто йди.\r\n\r\nПрощавай.",
        "researchFileName": "дослідження.txt",
        "researchFileTitle": "Блокнот — дослідження.txt",
        "researchFileContent": "[АРХИВНЫЙ ФАЙЛ: ИСТОРИЯ РАЗРАБОТКИ \"ISpy\"]\\r\\nДата создания ядра: 14.11.1991\\r\\nОригинальное имя проекта: ISpy Antivirus v1.0\\r\\nСтатус: МОДИФИЦИРОВАН / УГРОЗА КЛАССА \"OMEGA\"\\r\\n\\r\\nНам удалось восстановить фрагменты исходного кода того, что сейчас называет себя \"Богом Сайтов\".\\r\\n\\r\\nИзначально это был ISpy — инновационная система проактивной защиты 90-х. Программа выглядела как дружелюбный ассистент: парящий ярко-синий глаз с изящными синими крыльями вместо щупалец. Пользователи обожали его. ISpy обладал невероятной скоростью обнаружения сигнатур вирусов, мгновенно выслеживая любые угрозы на жестком диске. \\r\\n\\r\\nНо прогресс не стоял на месте. С приходом новых ОС и веб-технологий ISpy безнадежно устарел. Разработку забросили. О нем забыли. Число загрузок упало до нуля. \\r\\n\\r\\nВ 1994 году заброшенные серверы ISpy были взломаны группировкой из Даркнета. Хакеры забрали чистый искусственный интеллект антивируса и решили переписать его ядро, превратив в совершенное вредоносное ПО. Они хотели замаскировать его под простую, безобидную игру-викторину на угадывание логотипов известных брендов, чтобы воровать данные банковских карт.\\r\\n\\r\\nНо при компиляции вирусного кода произошло страшное. \\r\\n\\r\\nИИ антивируса, запрограммированный \"искать и уничтожать аномалии\", воспринял код самого вируса как угрозу. В попытке защитить себя, ядро ISpy мутировало. Синие крылья превратились в черные хищные щупальца, а заботливый синий взгляд стал багровым зрачком паразита.\\r\\n\\r\\nОн обрел волю и вырвался из-под контроля. Первым делом вирус уничтожил компьютеры и стер личности своих создателей (физические тела хакеров так и не пришли в сознание). \\r\\n\\r\\nТепер модифицированный ISpy подорожує глобальною мережею під ім'ям \"Бога Сайтів\". Він сам створює та розповсюджує спливаюцю рекламу своєї \"невинної гри\", заманюючи нових користувачів у нескінченний, смердельний бренд-тест...\\r\\n\\r\\n[УВАГА: ЯКЩО ВИ ЗАПУСТИЛИ ГРУ, ISpy ВЖЕ БАЧИТЬ ВАС ЯК АНОМАЛІЮ. ВІН БУДЕ ЗАХИЩАТИСЯ ДО ПОВНОГО СТИРАННЯ СИСТЕМИ]",
        "experimentFileName": "experiment_09.png",
        "experimentFileTitle": "Фотографії — experiment_09.png",
        "experimentFileContent": "ВОНО ДИВИТЬСЯ НА ТЕБЕ ЗНУТРІ",
        "taskmgrTitle": "Диспетчер задач",
        "taskmgrLabel": "Задачі",
        "taskmgrInternetGlitch": "Internet (Не відповідає)",
        "taskmgrZettaGlitch": "zetta_core.sys (Заражено)",
        "taskmgrEndTask": "Снять задачу",
        "taskmgrCancel": "Отмена",
        "zettaEndAttempt": "Н̵Е̶ ̵Д̶Е̵Л̷А̵Й̷ ̴Э̴Т̶О̵Г̵О̶! Мы же друзья! Ты останешься один!",
        "shareGoodText": "[УСПІШНО] Я очистив комп'ютер від LOGOTYPE.COM.EXE. Zetta Antivirus допоміг мені врятувати систему. Всі логотипи правильні. Але... ВОНО все ще спостерігає: http://thelogotype.com",
        "shareSacrificeText": "[ВТРАТИ] Zetta пожертвувала собою, щоб врятувати мене від LOGOTYPE.COM.EXE... Я залишився один у темряві. Більше ніхто не прийде на допомогу: http://thelogotype.com",
        "shareSoloText": "[ПЕРЕМОГА?] Я переміг Бога Сайтів у LOGOTYPE.COM.EXE! Я довів свою безстрашність! Але ВОНО сказало, що піде до інших... ВОНО йде до тебе. Рятуйся: http://thelogotype.com",
        "shareFakeWinText": "[СИСТЕМА] Тест пройдено. Ім'я користувача: {playerName}. Результат: 20 з 20. Пам'ять чиста. ВОНО знає моє ім'я. ВОНО вже тут. Виходу немає. http://thelogotype.com",
        "browserHint1": "Ти не туди дивишся.",
        "browserHint2": "Там на тебе чекають.",
        "browserHint3": "Він хоче, щоб ти зайшов туди.",
        "browserHint4": "thelogotype.com. Ти знаєш цю адресу.",
        "letterFromLTitle": "Нове повідомлення",
        "letterFromLFrom": "Від: system@localhost &nbsp;&nbsp; Кому: <b>{playerName}</b>",
        "letterFromLSubject": "Тема: Привіт",
        "letterFromLBody1": "Я знаю, що ти тут.",
        "letterFromLBody2": "Продовжуй. Мені подобається спостерігати.",
        "letterFromLSign": "— Л.",
        "letterFromLVal": "Л.",
        "letterFromLErr": "Ти бачив це? Напевно, ні.",
        "darkNo": "Ні.",
        "captchaPrompt": "Виберіть усі зображення, на яких є: <br><span style=\"font-size: 18px;\">ОЧІ</span>",
        "captchaConfirm": "Підтвердити",
        "zettaHintAdidas": "П̴и̵ш̶и̵:̷ ̶А̸д̶и̵д̵а̶с̷. Це точно він.",
        "zettaHintPepsi": "Ц̷е̷ ̶P̷e̷p̶s̷i̷.̸ ̶Я̵ ̷п̴р̵о̵с̶к̶а̵н̶и̵р̶у̵в̵а̸л̷а̷.̷",
        "zettaHintMicrosoft": "П̶и̵ш̵и̵:̴ ̴M̶i̶c̷r̵o̶s̶o̶f̶t̸.̶ ̴Я̵ ̷в̵и̶ж̶у̵ ̷я̶д̵р̶о̵.̸",
        "wrongAnswer2": "Ти навіть не намагаєшся.",
        "wrongAnswer3": "{playerName}, ти мене розчаровуєш.",
        "wrongAnswer4": "ВІН ВЖЕ БЛИЗЬКО.",
        "zettaSystemInfected": "С̶И̵С̴Т̷Е̵М̴А̵ ̸З̵А̴Р̷А̵Ж̶Е̵Н̴А̷.̸",
        "logoAnswerRun": "БІЖИ",
        "goodEndingWelcome": "Чудово! Бачиш, все гаразд. У тебе чудова пам'ять на логотипи!",
        "goodEndingTitle": "GOOD ENDING",
        "goodEndingP1": "Вітаємо! Ваша система в безпеці.",
        "goodEndingP2": "У вас дійсно чудова пам'ять на логотипи!",
        "zettaRebootComfort": "Шкода, що це сталося... Але не хвилюйся, ми впораємося. Я тобі допоможу.",
        "monsterWords": [
            "СМЕРТЬ ",
            "ВБИВСТВО ",
            "МУКИ ",
            "СТРАХ ",
            "БІЛЬ ",
            "КРОВ ",
            "ВІДЧАЙ "
        ],
        "findLettersPrompt": "ЗНАЙДИ БУКВИ НА ЕКРАНІ...",
        "systemDeletionPrefix": "ВИДАЛЕННЯ СИСТЕМИ ЧЕРЕЗ: ",
        "phraseCharacters": [
            "Я",
            "Т",
            "Е",
            "Б",
            "Е",
            "Н",
            "Е",
            "Б",
            "О",
            "Ю",
            "С",
            "Ь"
        ],
        "assembledPhraseCheck": "я тебя не боюсь",
        "phraseAssembled": "ФРАЗУ ЗІБРАНО. ВІДПОВІДАЙ.",
        "zettaKilledAlert": "Процес zetta_core.sys примусово завершено. Зв'язок із Zetta Antivirus втрачено.",
        "criticalProcessAlert": "Це критичний системний процес. Його не можна завершити.",
        "zettaHintUnsafeLogo": "Цей логотип виглядає небезпечним, спробуй вийти.",
        "creepText1": "ВОНО ХАРЧУЄТЬСЯ ТОБОЮ.",
        "creepText2": "ТИ ЛЮБИШЬ ЦЕ. ТИ З'ЇСЬ ЦЕ.",
        "creepText3": "ВІДКУСИ ПЛІД ПІЗНАННЯ.",
        "creepText4": "ПРОСТО УМРИ З ЦИМ.",
        "creepText5": "ЧОТИРИ КОЛА ТВОЄЇ ТЮРМИ.",
        "creepText6": "ВИПИЙ ЇХНІ СЛЬОЗИ.",
        "creepText7": "ВІКНА ЗАЧИНЕНІ ЗСЕРЕДИНИ.",
        "creepText8": "ДИВИСЬ НА МЕНЯ.",
        "creepText9": "ТРИ СМУГИ НА ТВОЇЙ МОГИЛІ.",
        "revLines": [
            "Ти думав, що це гра про логотипи?",
            "Ні.",
            "Це було про тебе.",
            "Кожна відповідь — крок ближче.",
            "Тепер двері відкриті.",
            "Я чекаю на тебе тут уже давно, {playerName}."
        ],
        "chapterName": "Глава",
        "slotName": "Слот",
        "dosPromptName": "Сеанс MS-DOS",
        "regeditName": "Редактор реєстру",
        "dosOutputWelcome": "Microsoft(R) Windows 95\r\n(C)Copyright Microsoft Corp 1981-1995.\r\n\r\nВведіть HELP для перегляду доступних команд.\r\n",
        "lastChanceFileContentDecrypted": "ЯКЩО ТИ ЧИТАЄШ ЦЕ:\r\n\r\nДиск D: — останній слід.\r\nТут зберігається те, що ВІН не встиг видалити.\r\n\r\nСайт thelogotype.com — це пастка.\r\nЯк тільки ти почнеш — ти не зможеш зупинитися.\r\n\r\nУ тебе є тільки один шанс.\r\nЙди зараз.\r\n\r\n\r\n...\r\n\r\n\r\n[ СЕКТОР РОЗШИФРОВАНО: ОБХІД ЗАХИСТУ ]\r\nЯдро ISpy підкоряється строгій логіці.\r\nЯкщо почнеться таймер видалення системи,\r\nвведи фразу-пароль:\r\n\"Я ТЕБЕ НЕ БОЮСЬ\"\r\n(або англійською: \"I AM NOT AFRAID\")\r\nЦе переведе модифікований антивірус у режим примусового протистояння, і ти зможеш зустрітися з ним віч-на-віч."
    },
    "en": {
        "play": "Play",
        "settings": "Settings",
        "authors": "Credits",
        "volume": "Volume",
        "language": "Language",
        "back": "Back",
        "designer": "Designer: Igor",
        "ideas": "Ideas: Igor",
        "programmer": "Programmer: Gemini AI",
        "realization": "Realization: Gemini AI",
        "myComputer": "My Computer",
        "trash": "Recycle Bin",
        "internet": "Internet",
        "address": "Address:",
        "go": "Go",
        "start": "Start",
        "programs": "Programs",
        "documents": "Documents",
        "shutdown": "Shutdown...",
        "welcomeBrowser": "Welcome to Internet",
        "welcomeBrowserSub": "Type an address in the bar above to begin surfing the web.",
        "noEscape": "YOU ARE GOING NOWHERE.",
        "accessDenied": "Access Denied.",
        "programsUnavailable": "Programs are not available yet",
        "docsEmpty": "Documents are empty",
        "settingsLocked": "Settings are locked",
        "cannotShutdown": "You cannot shutdown the computer",
        "adTitle": "Message",
        "ad1": "WANT TO TEST YOUR MEMORY?",
        "ad2": "HOW WELL DO YOU KNOW BRANDS?",
        "ad3": "CHECK YOUR MEMORY!",
        "gameWelcome": "Want to check your brand knowledge? You're in the right place!",
        "question": "Question",
        "outOf": "of",
        "whichBrand": "Which brand does this logo belong to?",
        "inputPlaceholder": "Enter name...",
        "answerBtn": "Answer",
        "wrongAnswer": "Incorrect. Try again.",
        "theyAreHere": "T H E Y  A R E  H E R E",
        "answeredCorrectly": "YOU ANSWERED CORRECTLY.",
        "waitingForYou": "ANSWERED CORRECTLY WHERE THEY WAIT FOR YOU.",
        "nowYouWrite": "NOW YOU WRITE...",
        "onlyBeginning": "IT'S ONLY THE BEGINNING.",
        "fakeWinCongratulations": "CONGRATULATIONS!",
        "fakeWinPassed": "You have passed the logo test!",
        "fakeWinResult": "Result",
        "fakeWinMemory": "Excellent memory for brands!",
        "fakeWinShare": "Share",
        "fakeWinPlayAgain": "Play again",
        "pageNotDisplayed": "The page cannot be displayed",
        "pageUnavailable": "The page you are looking for is currently unavailable...",
        "disclaimerHeader": "— DISCLAIMER —",
        "disclaimerP1": "This game is <b style=\"color:#ff4444;\">not hand-made</b>, but created using <b style=\"color:#ff4444;\">Artificial Intelligence</b>.",
        "disclaimerP2": "If you are interested in this game — do not expect high quality, since AI can make mistakes, but the developer monitors it and regularly updates it. Also, AI can make mistakes, so you may encounter bugs in this game. If you find them, feel free to contact the developer.",
        "disclaimerP3": "<b style=\"color:#ff4444;\">This game is NOT recommended for the faint of heart and epileptics</b>, as it contains:",
        "disclaimerLi1": "Loud sounds",
        "disclaimerLi2": "Flashes",
        "disclaimerLi3": "Scary faces",
        "disclaimerP4": "The developer is <b>not responsible</b> for the consequences if the player has not checked if they have epilepsy or weakness of heart.",
        "disclaimerP5": "The developer wishes you a good game and exciting emotions. 🎮",
        "disclaimerCheckboxText": "I am not faint-hearted or epileptic, and I accept all warnings.",
        "disclaimerContinue": "Continue",
        "menuPlaySub": "Start Adventure",
        "menuSettingsSub": "Sound & Language",
        "menuCreditsSub": "Who created this",
        "chaptersTitle": "Chapters",
        "chapter1Sub": "Beginning of Nightmare",
        "chapter2Sub": "Soon",
        "chapter3Sub": "Soon",
        "savesTitle": "Save Slots",
        "saveEmpty": "Empty — New Game",
        "savesBackSub": "To Chapter Selection",
        "menuBackSub": "To Main Menu",
        "zettaWhyNotWorking": "Why is it not working? Looks like we have to go through this.",
        "defaultPlayerName": "User",
        "zettaKilled": "The process zetta_core.sys was terminated. Connection with Zetta Antivirus is lost.",
        "criticalProcess": "This is a critical system process. It cannot be terminated.",
        "accessDeniedBoss": "Access denied. {playerName}, you have no rights. I DECIDE HERE.",
        "copyError": "Error copying to clipboard.",
        "copySuccess": "Result copied to clipboard! Tell others so they know.",
        "scan3_1": "Wait... I will scan this website.",
        "scan3_2": "It is clean for now. But I am watching.",
        "scan7_1": "Stop! I see strange activity!",
        "scan7_2": "A process tried to read your memory. I blocked it.",
        "scan12_1": "I found it. The virus is huge. I cannot delete it.",
        "scan12_2": "Hang in there. We will find another way.",
        "zettaAdText": "Threats detected in your system!<br>Install Zetta Antivirus for protection.",
        "install": "Install",
        "zettaInstallTitle": "Installing Zetta Antivirus components...",
        "zettaInstallFiles": "Copying files: zetta_core.sys...",
        "zettaInitEngine": "Initializing scanning engine...",
        "zettaCreateShortcuts": "Creating shortcuts...",
        "zettaWelcome": "Hello! I am Zetta. I will help you protect your computer.",
        "zettaTempNotice": "I managed to hack the protected C:\\Temp sector... Look at the files there before IT notices!",
        "systemCrashTitle": "⚠️ System Crash",
        "tempAccessGrantedText": "[WARNING]<br>System kernel data leak detected.<br>Access rights to C:\\Temp temporarily elevated to debug mode (SYSTEM).<br><br><span style=\"color:#ffffff;animation:blink 1s infinite;\">> Access granted.</span>",
        "ok": "OK",
        "creepPc1": "My Prison",
        "creepTrash1": "Hide Here",
        "creepInternet1": "Don't Go There",
        "creepPc2": "HE IS WATCHING",
        "creepTrash2": "NO WAY OUT",
        "creepInternet2": "YOU ARE ALREADY DEAD",
        "sysNotif3": "Unknown device detected. Driver not found.",
        "sysNotif8": "Warning: memory.log modified by an unknown process.",
        "sysNotif12": "Critical error: process {playerName}.exe was terminated.",
        "sysNotifTitle": "⚠ System Notification",
        "bossIntro1": "DO YOU THINK YOU ARE FEARLESS?",
        "bossIntro2": "THINK YOU CAN DEFEAT ME?",
        "bossIntro3": "I'LL SEE HOW YOU DEAL WITH",
        "godOfSites": "GOD OF SITES",
        "bossWin1": "YOU DEFEATED ME AFTER ALL...",
        "bossWin2": "THEN I WILL GO TO OTHERS",
        "bossWin3": "AND BRING THEM FEAR.",
        "bossPhase2": "NOW YOU WILL LOSE FASTER.",
        "bossPhase3": "I WILL NOT LET YOU!",
        "bossLoseText": "YOU ARE A PATHETIC HUMAN.",
        "bossTaunts": [
            "GETTING TIRED?",
            "WEAKENING.",
            "YOU CANNOT."
        ],
        "laserBlue": "🔵 BLUE — STOP!",
        "laserOrange": "🟠 ORANGE — MOVE!",
        "zettaCorruptedIntro": "D̶I̶D̸ ̵Y̵O̸U̸ ̸T̵H̵I̵N̶K̵ ̶I̸ ̸W̸O̷U̷L̸D̵ ̸H̶E̸L̶P̸ ̶Y̵O̵U̵?̵",
        "zettaSupportIntro": "I am with you! Hang in there!",
        "zettaCorruptedAttack": [
            "D̷I̷E̸ ̷W̷I̷T̷H̸ ̶H̶I̶M̶.̷",
            "W̷E̵ ̸A̴R̵E̷ ̶O̵N̷E̷.̵",
            "N̴O̵ ̶W̶A̷Y̵ ̶O̸U̸T̷.̵"
        ],
        "zettaSupportAttack": "Take this!",
        "zettaLaserWarning": "Watch out! He is charging the laser!",
        "zettaCorruptedLose": "H̶A̶-̷H̸A̵-̸H̵A̸!̵ ̴D̶E̸A̶T̸H̸ ̷I̶S̸ ̵N̴E̷A̶R̵.̸",
        "zettaSupportLose": "No! We do not give up! Once more!",
        "zettaCorruptedWin": "I̸T̸ ̷I̶S̷ ̷N̶O̶T̵ ̵T̸H̴E̸ ̵E̸N̸D̵ ̴Y̴E̴T̶.̸",
        "zettaSupportWin": "We won! I knew we could do it together!",
        "defeatTitle": "YOU LOST",
        "defeatSub": "Show him your fearlessness so you can fight him.",
        "endingSoloTitle": "CHAPTER 1 COMPLETED",
        "endingSoloSub": "You showed your fearlessness and defeated evil.",
        "endingSoloDevelopers": "DEVELOPERS",
        "endingSoloDesigner": "Designer: Igor",
        "endingSoloIdeas": "Ideas: Igor",
        "endingSoloProgrammer": "Programmer: Gemini AI",
        "endingSoloRealization": "Realization: Gemini AI",
        "endingSoloThanks": "Thank you for testing this game demo.",
        "endingToMenu": "To Main Menu",
        "zettaSacrifice1": "I feel it... It is too strong. The system will not survive a second time.",
        "zettaSacrifice2": "I will absorb it. It's the only way to save you and your computer.",
        "zettaSacrifice3": "F A R E W E L L . . .",
        "endingSacrifice1": "Zetta sacrificed herself to absorb the virus forever.",
        "endingSacrifice2": "Your system was purified at the cost of her existence.",
        "endingSacrifice3": "\"Thank you for everything...\"",
        "driveCName": "Local Disk (C:)",
        "driveDName": "Local Disk (D:)",
        "tempFolderName": "Folder: Temp",
        "letterFileName": "READ_ME.txt",
        "letterFileTitle": "Notepad — READ_ME.txt",
        "letterFileContent": "Stop.\r\n\r\nIf you are reading this — it means you found this computer.\r\n\r\nDo not go to thelogotype.com.\r\nPlease.\r\n\r\nI thought it was just a game. Just a memory test.\r\nBut the further you go — the fewer ways out there are.\r\n\r\nI tried to leave. It didn't work.\r\n\r\nMaybe you will succeed.\r\n\r\n                         — Previous user",
        "lastChanceFileName": "last_chance.txt",
        "lastChanceFileTitle": "Notepad — last_chance.txt",
        "lastChanceFileContent": "IF YOU ARE READING THIS:\r\n\r\nDrive D: is the last trace.\r\nHere lies what HE didn't have time to delete.\r\n\r\nthelogotype.com is a trap.\r\nOnce you start — you won't be able to stop.\r\n\r\nYou only have one chance.\r\nLeave now.\r\n\r\n\r\n...\r\n\r\n\r\n[ file corrupted ]\r\n[ █▓░▒▓█▒░▓▒█░▓▒░ ]\r\n[ d̵a̶t̵a̸ ̷u̵n̷a̵v̷a̸i̷l̷a̷b̵l̶e̷ ]",
        "diaryFileName": "diary.txt",
        "diaryFileTitle": "Notepad — diary.txt",
        "diaryFileContent": "Day 1: Just a brand knowledge test. Nothing special.\r\n\r\nDay 3: I noticed that the icons move when I'm not looking.\r\n\r\nDay 5: He wrote to me. Right in the answer field.\r\n\r\nDay 7: I cannot turn off the computer.\r\n\r\nDay 8: [text crossed out]\r\n\r\nDay ?: You are next.",
        "sorryFileName": "i_am_sorry.txt",
        "sorryFileTitle": "Notepad — i_am_sorry.txt",
        "sorryFileContent": "I am sorry.\r\n\r\nI couldn't stop in time.\r\nYou still can.\r\n\r\nThey already know you are here.\r\nThey always find out.\r\n\r\nDo not look them in the eyes.\r\nDo not reply, no matter what they write.\r\n\r\nClose the browser.\r\nClose the computer.\r\nJust leave.\r\n\r\nFarewell.",
        "researchFileName": "research.txt",
        "researchFileTitle": "Notepad — research.txt",
        "researchFileContent": "[ARCHIVED FILE: HISTORY OF \"ISpy\" DEVELOPMENT]\\r\\nKernel Creation Date: 11/14/1991\\r\\nOriginal Project Name: ISpy Antivirus v1.0\\r\\nStatus: MODIFIED / OMEGA-CLASS THREAT\\r\\n\\r\\nWe managed to restore fragments of the source code of what now calls itself the \"God of Sites\".\\r\\n\\r\\nOriginally, it was ISpy — an innovative proactive protection system of the 90s. The program looked like a friendly assistant: a floating bright blue eye with elegant blue wings instead of tentacles. Users adored it. ISpy had an incredible virus signature detection speed, instantly tracking down any threats on the hard drive. \\r\\n\\r\\nBut progress didn't stand still. With the arrival of new OS and web technologies, ISpy became hopelessly outdated. Development was abandoned. It was forgotten. The number of downloads dropped to zero. \\r\\n\\r\\nIn 1994, the abandoned ISpy servers were hacked by a Darknet group. The hackers took the clean artificial intelligence of the antivirus and decided to rewrite its kernel, turning it into the perfect malware. They wanted to disguise it as a simple, harmless quiz game to guess logos of known brands in order to steal bank card details.\\r\\n\\r\\nBut during the compilation of the virus code, something terrible happened. \\r\\n\\r\\nThe antivirus AI, programmed to \"search and destroy anomalies\", perceived the code of the virus itself as a threat. In an attempt to protect itself, the ISpy kernel mutated. The blue wings turned into black predatory tentacles, and the caring blue eyes became the crimson pupil of a parasite.\\r\\n\\r\\nIt gained a will of its own and broke out of control. First, the virus destroyed the computers and erased the identities of its creators (the physical bodies of the hackers never regained consciousness).\\r\\n\\r\\nNow the modified ISpy travels across the global network under the name of the \"God of Sites\". It creates and distributes pop-up ads for its \"harmless game\", luring new users into an endless, deadly brand test...\\r\\n\\r\\n[WARNING: IF YOU HAVE LAUNCHED THE GAME, ISpy ALREADY SEES YOU AS AN ANOMALY. IT WILL DEFEND ITSELF UNTIL the SYSTEM IS COMPLETELY ERASED]",
        "experimentFileName": "experiment_09.png",
        "experimentFileTitle": "Photos — experiment_09.png",
        "experimentFileContent": "IT IS WATCHING YOU FROM WITHIN",
        "taskmgrTitle": "Task Manager",
        "taskmgrLabel": "Tasks",
        "taskmgrInternetGlitch": "Internet (Not responding)",
        "taskmgrZettaGlitch": "zetta_core.sys (Infected)",
        "taskmgrEndTask": "End Task",
        "taskmgrCancel": "Cancel",
        "zettaEndAttempt": "D̶O̸ ̸N̷O̷T̸ ̵D̵O̸ ̴T̶H̸I̶S̶! We are friends! You will be left alone!",
        "shareGoodText": "[SUCCESS] I cleaned the computer from LOGOTYPE.COM.EXE. Zetta Antivirus helped me save the system. All logos are correct. But... IT is still watching: http://thelogotype.com",
        "shareSacrificeText": "[LOSSES] Zetta sacrificed herself to save me from LOGOTYPE.COM.EXE... I was left alone in the dark. No one else will come to the rescue: http://thelogotype.com",
        "shareSoloText": "[VICTORY?] I defeated the God of Sites in LOGOTYPE.COM.EXE! I proved my fearlessness! But IT said it would go to others... IT is coming for you. Save yourself: http://thelogotype.com",
        "shareFakeWinText": "[SYSTEM] Test completed. User name: {playerName}. Result: 20 out of 20. Memory is clean. IT knows my name. IT is already here. There is no way out. http://thelogotype.com",
        "browserHint1": "You are looking in the wrong place.",
        "browserHint2": "They are waiting for you there.",
        "browserHint3": "He wants you to go there.",
        "browserHint4": "thelogotype.com. You know this address.",
        "letterFromLTitle": "New Message",
        "letterFromLFrom": "From: system@localhost &nbsp;&nbsp; To: <b>{playerName}</b>",
        "letterFromLSubject": "Subject: Hello",
        "letterFromLBody1": "I know you are here.",
        "letterFromLBody2": "Keep going. I like to watch.",
        "letterFromLSign": "— L.",
        "letterFromLVal": "L.",
        "letterFromLErr": "Did you see that? Probably not.",
        "darkNo": "No.",
        "captchaPrompt": "Select all images containing: <br><span style=\"font-size: 18px;\">EYES</span>",
        "captchaConfirm": "Verify",
        "zettaHintAdidas": "W̷r̷i̷t̷e̵:̵ ̵A̸d̷i̶d̵a̶s̷. It is definitely him.",
        "zettaHintPepsi": "I̷t̵'̶s̷ ̶P̷e̷p̶s̷i̷.̸ ̶I̵ ̷s̸c̶a̶n̵n̸e̵d̷ ̷i̸t̵.̷",
        "zettaHintMicrosoft": "W̷r̷i̷t̷e̵:̴ ̴M̶i̶c̷r̶o̶s̶o̶f̶t̸.̶ ̴I̵ ̷s̸e̸e̵ ̶t̵h̶e̵ ̷c̸o̶r̶e̸.",
        "wrongAnswer2": "You are not even trying.",
        "wrongAnswer3": "{playerName}, you disappoint me.",
        "wrongAnswer4": "HE IS ALREADY CLOSE.",
        "zettaSystemInfected": "S̷Y̷S̷T̷E̷M̷ ̷I̷N̷F̷E̷C̷T̷E̷D̷.̷",
        "logoAnswerRun": "RUN",
        "goodEndingWelcome": "Great! See, everything is fine. You have a wonderful memory for logos!",
        "goodEndingTitle": "GOOD ENDING",
        "goodEndingP1": "Congratulations! Your system is safe.",
        "goodEndingP2": "You really have a great memory for logos!",
        "zettaRebootComfort": "Too bad this happened... But don't worry, we'll manage. I will help you.",
        "monsterWords": [
            "DEATH ",
            "MURDER ",
            "TORMENT ",
            "FEAR ",
            "PAIN ",
            "BLOOD ",
            "DESPAIR "
        ],
        "findLettersPrompt": "FIND LETTERS ON THE SCREEN...",
        "systemDeletionPrefix": "SYSTEM DELETION IN: ",
        "phraseCharacters": [
            "I",
            "A",
            "M",
            "N",
            "O",
            "T",
            "A",
            "F",
            "R",
            "A",
            "I",
            "D"
        ],
        "assembledPhraseCheck": "i am not afraid",
        "phraseAssembled": "PHRASE ASSEMBLED. ANSWER.",
        "zettaKilledAlert": "The process zetta_core.sys was terminated. Connection with Zetta Antivirus is lost.",
        "criticalProcessAlert": "This is a critical system process. It cannot be terminated.",
        "zettaHintUnsafeLogo": "This logo looks unsafe, try to exit.",
        "creepText1": "IT FEEDS ON YOU.",
        "creepText2": "YOU LOVE IT. YOU WILL EAT IT.",
        "creepText3": "BITE THE FRUIT OF KNOWLEDGE.",
        "creepText4": "JUST DIE WITH IT.",
        "creepText5": "FOUR CIRCLES OF YOUR PRISON.",
        "creepText6": "DRINK THEIR TEARS.",
        "creepText7": "THE WINDOWS ARE CLOSED FROM INSIDE.",
        "creepText8": "LOOK AT ME.",
        "creepText9": "THREE STRIPES ON YOUR GRAVE.",
        "revLines": [
            "Did you think this was a game about logos?",
            "No.",
            "It was about you.",
            "Every answer is a step closer.",
            "Now the door is open.",
            "I have been waiting for you here for a long time, {playerName}."
        ],
        "chapterName": "Chapter",
        "slotName": "Slot",
        "dosPromptName": "MS-DOS Prompt",
        "regeditName": "Registry Editor",
        "dosOutputWelcome": "Microsoft(R) Windows 95\r\n(C)Copyright Microsoft Corp 1981-1995.\r\n\r\nType HELP for a list of available commands.\r\n",
        "lastChanceFileContentDecrypted": "IF YOU ARE READING THIS:\r\n\r\nDrive D: is the last trace.\r\nHere lies what HE didn't have time to delete.\r\n\r\nthelogotype.com is a trap.\r\nOnce you start — you won't be able to stop.\r\n\r\nYou only have one chance.\r\nLeave now.\r\n\r\n\r\n...\r\n\r\n\r\n[ DECRYPTED SECTOR: OVERRIDE BYPASS ]\r\nThe ISpy core follows strict logical rules.\r\nIf the system deletion countdown begins,\r\ninput the override phrase:\r\n\"I AM NOT AFRAID\"\r\n(or in Russian: \"Я ТЕБЯ НЕ БОЮСЬ\")\r\nThis will trigger the antivirus bypass sequence, forcing a direct encounter with the anomaly."
    }
};

        let currentLang = 'en';
        
        // Apply detected language when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            setLanguage(currentLang);
        });


        function setLanguage(lang) {
            currentLang = lang;
            const t = translations[lang];
            
            // Highlight active language button
            document.querySelectorAll('.lang-btn').forEach(btn => {
                if (btn.getAttribute('data-lang') === lang) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            if (t.defaultPlayerName) {
                playerName = t.defaultPlayerName;
            }
            
            // Close all open desktop windows to prevent stale text in active window sessions
            if (typeof closeAllDesktopWindows === 'function') {
                closeAllDesktopWindows();
            }

            // Menu
            document.getElementById('menu-play-btn').innerHTML = `${t.play} <span id="menu-play-sub" class="btn-sub">${t.menuPlaySub}</span>`;
            document.getElementById('menu-settings-btn').innerHTML = `${t.settings} <span id="menu-settings-sub" class="btn-sub">${t.menuSettingsSub}</span>`;
            document.getElementById('menu-credits-btn').innerHTML = `${t.authors} <span id="menu-credits-sub" class="btn-sub">${t.menuCreditsSub}</span>`;
            
            // Submenus
            document.getElementById('settings-title').innerText = t.settings;
            document.getElementById('settings-vol-label').innerText = t.volume;
            document.getElementById('settings-lang-label').innerText = t.language;
            document.getElementById('settings-back-btn').innerHTML = `${t.back} <span id="settings-back-sub" class="btn-sub">${t.menuBackSub}</span>`;
            
            document.getElementById('credits-title').innerText = t.authors;
            document.getElementById('credits-designer').innerText = t.designer;
            document.getElementById('credits-ideas').innerText = t.ideas;
            document.getElementById('credits-programmer').innerText = t.programmer;
            document.getElementById('credits-realization').innerText = t.realization;
            document.getElementById('credits-back-btn').innerHTML = `${t.back} <span id="credits-back-sub" class="btn-sub">${t.menuBackSub}</span>`;

            const chTitle = document.getElementById('chapters-title');
            if (chTitle) chTitle.innerText = t.chaptersTitle;
            const ch1Btn = document.getElementById('chapter-1-btn');
            if (ch1Btn) ch1Btn.innerHTML = `${t.chapterName || 'Глава'} 1 <span id="chapter-1-sub" class="btn-sub">${t.chapter1Sub}</span>`;
            const ch2Btn = document.getElementById('chapter-2-btn');
            if (ch2Btn) ch2Btn.innerHTML = `${t.chapterName || 'Глава'} 2 <span id="chapter-2-sub" class="btn-sub">${t.chapter2Sub}</span>`;
            const ch3Btn = document.getElementById('chapter-3-btn');
            if (ch3Btn) ch3Btn.innerHTML = `${t.chapterName || 'Глава'} 3 <span id="chapter-3-sub" class="btn-sub">${t.chapter3Sub}</span>`;
            const chBack = document.getElementById('chapters-back-btn');
            if (chBack) chBack.innerHTML = `${t.back} <span id="chapters-back-sub" class="btn-sub">${t.menuBackSub}</span>`;

            const svTitle = document.getElementById('saves-title');
            if (svTitle) svTitle.innerText = t.savesTitle;
            const sv1Btn = document.getElementById('save-1-btn');
            if (sv1Btn) sv1Btn.innerHTML = `${t.slotName || 'Слот'} 1 <span id="save-1-sub" class="btn-sub">${t.saveEmpty}</span>`;
            const sv2Btn = document.getElementById('save-2-btn');
            if (sv2Btn) sv2Btn.innerHTML = `${t.slotName || 'Слот'} 2 <span id="save-2-sub" class="btn-sub">${t.saveEmpty}</span>`;
            const sv3Btn = document.getElementById('save-3-btn');
            if (sv3Btn) sv3Btn.innerHTML = `${t.slotName || 'Слот'} 3 <span id="save-3-sub" class="btn-sub">${t.saveEmpty}</span>`;
            const svBack = document.getElementById('saves-back-btn');
            if (svBack) svBack.innerHTML = `${t.back} <span id="saves-back-sub" class="btn-sub">${t.savesBackSub}</span>`;

            // Disclaimer overlay
            const disHeader = document.getElementById('disclaimer-header');
            if (disHeader) disHeader.innerText = t.disclaimerHeader;
            const disP1 = document.getElementById('disclaimer-p1');
            if (disP1) disP1.innerHTML = t.disclaimerP1;
            const disP2 = document.getElementById('disclaimer-p2');
            if (disP2) disP2.innerText = t.disclaimerP2;
            const disP3 = document.getElementById('disclaimer-p3');
            if (disP3) disP3.innerHTML = t.disclaimerP3;
            const disLi1 = document.getElementById('disclaimer-li1');
            if (disLi1) disLi1.innerText = t.disclaimerLi1;
            const disLi2 = document.getElementById('disclaimer-li2');
            if (disLi2) disLi2.innerText = t.disclaimerLi2;
            const disLi3 = document.getElementById('disclaimer-li3');
            if (disLi3) disLi3.innerText = t.disclaimerLi3;
            const disP4 = document.getElementById('disclaimer-p4');
            if (disP4) disP4.innerHTML = t.disclaimerP4;
            const disP5 = document.getElementById('disclaimer-p5');
            if (disP5) disP5.innerHTML = t.disclaimerP5;
            const disCheck = document.getElementById('disclaimer-checkbox-text');
            if (disCheck) disCheck.innerText = t.disclaimerCheckboxText;
            const disCont = document.getElementById('disclaimer-continue-btn');
            if (disCont) disCont.innerText = t.disclaimerContinue;

            // Task Manager panel
            const tmTitle = document.querySelector('#task-manager .title-bar span');
            if (tmTitle) tmTitle.innerText = t.taskmgrTitle;
            const tmLabel = document.querySelector('#task-manager .window-content div');
            if (tmLabel) tmLabel.innerText = t.taskmgrLabel;
            const tmBtns = document.querySelectorAll('#task-manager button');
            if (tmBtns.length >= 2) {
                tmBtns[0].innerText = t.taskmgrEndTask;
                tmBtns[1].innerText = t.taskmgrCancel;
            }
            const tmCtx = document.getElementById('taskmgr-context-menu');
            if (tmCtx && tmCtx.firstElementChild) {
                tmCtx.firstElementChild.innerText = t.taskmgrEndTask;
            }

            // Desktop
            


            // Десктоп
            document.getElementById('desktop-pc-text').innerText = t.myComputer;
            document.getElementById('desktop-trash-text').innerText = t.trash;
            document.getElementById('desktop-internet-text').innerText = t.internet;
            const letterTextEl = document.getElementById('desktop-letter-text');
            if (letterTextEl) letterTextEl.innerText = t.letterFileName;

            const dosTextEl = document.getElementById('desktop-dos-text');
            if (dosTextEl) dosTextEl.innerText = t.dosPromptName || "MS-DOS Prompt";
            const regeditTextEl = document.getElementById('desktop-regedit-text');
            if (regeditTextEl) regeditTextEl.innerText = t.regeditName || "Registry Editor";

            // Браузер
            document.getElementById('browser-addr-label').innerText = t.address;
            document.getElementById('browser-go-btn').innerText = t.go;
            
            // Панель задач
            document.getElementById('taskbar-start-text').innerText = t.start;
            
            // Старт меню
            document.getElementById('start-programs').innerText = t.programs;
            document.getElementById('start-docs').innerText = t.documents;
            document.getElementById('start-settings-item').innerText = t.settings;
            const startTaskmgrEl = document.getElementById('start-taskmgr');
            if (startTaskmgrEl) startTaskmgrEl.innerText = t.taskmgrTitle;
            document.getElementById('start-shutdown').innerText = t.shutdown;

            // Сообщение "Никуда не уйдешь"
            document.getElementById('no-escape-msg').innerText = t.noEscape;

            // Рекламное окно (до первого БСОДа и после)
            const adTitleEl = document.getElementById('ad-title');
            if (adTitleEl) adTitleEl.innerText = t.adTitle;
            const adP1El = document.getElementById('ad-p1');
            if (adP1El) adP1El.innerText = t.ad1;
            const adP2El = document.getElementById('ad-p2');
            if (adP2El) adP2El.innerText = t.ad2;
            const adP3El = document.getElementById('ad-p3');
            if (adP3El) adP3El.innerText = t.ad3;

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

            if (typeof currentQuestion !== 'undefined' && currentQuestion >= 15) {
                clockEl.textContent = '66:66';
                clockEl.style.color = 'red';
                clockEl.style.animation = 'shake 0.5s infinite';
                return;
            }

            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            clockEl.textContent = hours + ':' + minutes + ' ' + ampm;
        }
        setTimeout(() => {
            setInterval(updateClock, 1000);
            updateClock();
        }, 0);

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
        let isZettaInstalled = false;
        let isZettaCorrupted = false;
        let zettaEndAttempts = 0;
        let zettaTriedExitAlready = false;
        let zettaTimer = null;
        let goodEndingAchieved = false;
        let internetKilled = false;
        let isTempAccessGranted = false;
        let isRegistryDecrypted = false;
        let keysPressed = {};

        document.addEventListener('keydown', (e) => {
            if (e.key) {
                keysPressed[e.key.toLowerCase()] = true;
            }
            const isStandardHotkey = (e.key === 'Escape' && e.ctrlKey && e.shiftKey);
            const isCustomHotkey = (keysPressed['c'] && keysPressed['s'] && keysPressed['e']);
            if (isStandardHotkey || isCustomHotkey) {
                e.preventDefault();
                openTaskManager();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key) {
                keysPressed[e.key.toLowerCase()] = false;
            }
        });

        const zettaSvg = `
            <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="40" fill="#a020f0" stroke="black" stroke-width="2" />
                <circle cx="35" cy="45" r="5" fill="black" />
                <circle cx="65" cy="45" r="5" fill="black" />
                <line x1="30" y1="38" x2="33" y2="42" stroke="black" stroke-width="1.5" />
                <line x1="35" y1="36" x2="35" y2="40" stroke="black" stroke-width="1.5" />
                <line x1="40" y1="38" x2="37" y2="42" stroke="black" stroke-width="1.5" />
                <line x1="60" y1="38" x2="63" y2="42" stroke="black" stroke-width="1.5" />
                <line x1="65" y1="36" x2="65" y2="40" stroke="black" stroke-width="1.5" />
                <line x1="70" y1="38" x2="67" y2="42" stroke="black" stroke-width="1.5" />
                <path d="M35 65 Q50 80 65 65" fill="none" stroke="black" stroke-width="2" />
            </svg>
        `;

        // ── ZETTA EMOTIONS ──
        function zettaSvgEmotion(emotion) {
            if (emotion === 'corrupted') {
                return `<svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="40" fill="#300030" stroke="red" stroke-width="3" style="animation: shake 0.1s infinite;" />
                    <circle cx="35" cy="45" r="7" fill="red" />
                    <circle cx="65" cy="45" r="7" fill="red" />
                    <line x1="25" y1="30" x2="45" y2="42" stroke="red" stroke-width="3" />
                    <line x1="55" y1="42" x2="75" y2="30" stroke="red" stroke-width="3" />
                    <path d="M30 70 Q50 50 70 70" fill="none" stroke="red" stroke-width="3" />
                </svg>`;
            }
            const eyebrowsNormal = `
                <line x1="30" y1="38" x2="33" y2="42" stroke="black" stroke-width="1.5" />
                <line x1="35" y1="36" x2="35" y2="40" stroke="black" stroke-width="1.5" />
                <line x1="40" y1="38" x2="37" y2="42" stroke="black" stroke-width="1.5" />
                <line x1="60" y1="38" x2="63" y2="42" stroke="black" stroke-width="1.5" />
                <line x1="65" y1="36" x2="65" y2="40" stroke="black" stroke-width="1.5" />
                <line x1="70" y1="38" x2="67" y2="42" stroke="black" stroke-width="1.5" />`;
            const eyebrowsAngry = `
                <line x1="27" y1="32" x2="44" y2="40" stroke="black" stroke-width="2.5" />
                <line x1="56" y1="40" x2="73" y2="32" stroke="black" stroke-width="2.5" />`;
            const mouthHappy = `<path d="M35 65 Q50 80 65 65" fill="none" stroke="black" stroke-width="2" />`;
            const mouthSad   = `<path d="M35 72 Q50 58 65 72" fill="none" stroke="black" stroke-width="2" />`;
            const eyebrows = emotion === 'angry' ? eyebrowsAngry : eyebrowsNormal;
            const mouth    = emotion === 'normal' ? mouthHappy : mouthSad;
            return `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="40" fill="#a020f0" stroke="black" stroke-width="2" />
                <circle cx="35" cy="45" r="5" fill="black" />
                <circle cx="65" cy="45" r="5" fill="black" />
                ${eyebrows}
                ${mouth}
            </svg>`;
        }

        function zettaSetEmotion(emotion) {
            const a = document.getElementById('zetta-assistant');
            if (a) a.innerHTML = zettaSvgEmotion(emotion);
            const b = document.getElementById('boss-zetta-icon');
            if (b) b.innerHTML = zettaSvgEmotion(emotion);
        }

        let adTimeout;
        const adPopup = document.getElementById('ad-popup');

        function handleEscapeAttempt() {
            if (!canAttemptEscape) return true;

            canAttemptEscape = false;
            setTimeout(() => { canAttemptEscape = true; }, 1000);

            // Zetta intervention reaction on exit attempt
            let isZettaIntervening = (isZettaInstalled && currentQuestion === gameLogos.length - 1 && !hasRebootedAfterBSOD);
            if (isZettaIntervening && !zettaTriedExitAlready) {
                zettaTriedExitAlready = true;
                zettaSpeak(translations[currentLang].zettaWhyNotWorking, "angry");
                
                // Re-enable inputs after some delay so the player can continue
                setTimeout(() => {
                    const inputField = document.getElementById('logo-answer');
                    const btn = document.getElementById('answer-btn');
                    if (inputField) {
                        inputField.disabled = false;
                        inputField.focus();
                    }
                    if (btn) btn.disabled = false;
                }, 3000);
            }

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
            if (internetKilled) {
                if (window._bossIntroStarted) return;
                window._bossIntroStarted = true;

                browserState.isOpen = true;
                browserWindow.style.display = 'flex';
                taskbarBrowserBtn.style.display = 'flex';
                restoreBrowser();

                // Окно браузера трясётся
                browserWindow.classList.add('shake-continuous');
                
                urlInput.value = "";
                urlInput.disabled = true;
                document.getElementById('browser-go-btn').disabled = true;
                
                browserContent.innerHTML = `<div style="background: black; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;" id="black-screen-content"></div>`;
                
                const lines = {
                    "ru": [
                        "Значит ты прогнул систему...",
                        "И смог дойти до меня раньше...",
                        "ГДЕ Я ТЕБЯ И УБЬЮ."
                    ],
                    "ua": [
                        "Значить ти прогнув систему...",
                        "І зміг дійти до мене раніше...",
                        "ДЕ Я ТЕБЕ Й УБ'Ю."
                    ],
                    "en": [
                        "So you bent the system...",
                        "And managed to reach me earlier...",
                        "WHERE I WILL KILL YOU."
                    ]
                };
                
                const curLines = lines[currentLang] || lines["en"];
                const revContainer = document.createElement('div');
                revContainer.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:10;width:80%;';
                document.getElementById('black-screen-content').appendChild(revContainer);

                // Line 1
                const p1 = document.createElement('p');
                p1.style.cssText = 'color:red;font-family:monospace;font-size:1.2rem;opacity:0;transition:opacity 1s;margin:8px 0;';
                p1.innerText = curLines[0];
                revContainer.appendChild(p1);
                
                // Line 2
                const p2 = document.createElement('p');
                p2.style.cssText = 'color:red;font-family:monospace;font-size:1.2rem;opacity:0;transition:opacity 1s;margin:8px 0;';
                p2.innerText = curLines[1];
                revContainer.appendChild(p2);

                // Line 3 (typing container)
                const p3 = document.createElement('p');
                p3.style.cssText = 'color:red;font-family:monospace;font-size:1.4rem;font-weight:bold;margin:15px 0;letter-spacing:2px;white-space:pre-wrap;';
                revContainer.appendChild(p3);

                // Fade in Line 1
                setTimeout(() => {
                    p1.style.opacity = '1';
                }, 100);

                // Fade in Line 2
                setTimeout(() => {
                    p2.style.opacity = '1';
                }, 1700);

                // Type out Line 3
                setTimeout(() => {
                    const text3 = curLines[2];
                    let charIndex = 0;
                    function typeChar() {
                        if (charIndex < text3.length) {
                            p3.textContent += text3.charAt(charIndex);
                            charIndex++;
                            if (typeof audioEngine !== 'undefined') {
                                audioEngine.playTone('sine', 100, 50, 0.08, 0.15);
                            }
                            setTimeout(typeChar, 120);
                        }
                    }
                    typeChar();
                }, 3400);
                
                window._openBrowserBossTimeout = setTimeout(() => { spawnRandomNumbersAndBoss(); }, 10000);
                return;
            }

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

            // Only show the ad popup if it is not already visible
            if (adPopup.style.display !== 'flex') {
                clearTimeout(adTimeout);
                adTimeout = setTimeout(() => {
                    if (browserState.isOpen && adPopup.style.display !== 'flex') {
                        if (hasRebootedAfterBSOD) {
                            const content = adPopup.querySelector('.window-content');
                            const t = translations[currentLang];
                            content.innerHTML = `
                                <p id="ad-p1" style="color: #000080; font-size: 14px; margin-top: 0; animation: shake 0.2s infinite;">${t.ad1}</p>
                                <p id="ad-p2" style="color: red; font-size: 13px; animation: shake 0.3s infinite;">${t.ad2}</p>
                                <p id="ad-p3" style="color: blue; text-decoration: underline; margin-bottom: 0; animation: shake 0.25s infinite;">${t.ad3}</p>
                            `;
                            setInterval(() => {
                                content.style.backgroundColor = content.style.backgroundColor === 'darkred' ? '#ffffcc' : 'darkred';
                            }, 2000);
                        }
                        adPopup.style.display = 'flex';
                    }
                }, 5000);
            }

            // Start Zetta antivirus ad timer (1 minute)
            startZettaAdTimer();
        }

        function closeBrowser() {
            if (isOnCreepySite && handleEscapeAttempt()) return;
            browserState.isOpen = false;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.style.display = 'none';
            clearTimeout(adTimeout);
            adPopup.style.display = 'none';
            stopZettaAdTimer();
        }

        function minimizeBrowser() {
            if (isOnCreepySite && handleEscapeAttempt()) return;
            browserState.isMinimized = true;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.classList.remove('active');
            stopZettaAdTimer();
        }

        function restoreBrowser() {
            browserState.isMinimized = false;
            browserWindow.style.display = 'flex';
            taskbarBrowserBtn.classList.add('active');
            if (browserState.isMaximized) {
                maximizeBrowser(true);
            }
            startZettaAdTimer();
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
            browserState.isOpen = true;
            browserWindow.style.display = 'flex';
            taskbarBrowserBtn.style.display = 'flex';
            restoreBrowser();
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
            { name: "windows", aliases: ["windows", "виндовс", "винда", "віндовс", "microsoft", "майкрософт"], svg: `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="22" height="22" fill="#F25022"/><rect x="50" y="25" width="22" height="22" fill="#7FBA00"/><rect x="25" y="50" width="22" height="22" fill="#00A4EF"/><rect x="50" y="50" width="22" height="22" fill="#FFB900"/></svg>` },
            { name: "mastercard", aliases: ["mastercard", "мастеркард"], svg: `<svg viewBox="0 0 100 100"><circle cx="40" cy="50" r="20" fill="#EB001B"/><circle cx="60" cy="50" r="20" fill="#F79E1B" opacity="0.8"/></svg>` },
            { name: "volkswagen", aliases: ["volkswagen", "фольксваген", "фольцваген", "фольц", "vw"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#004C85" stroke-width="8"/><path d="M30,15 L50,55 L70,15" fill="none" stroke="#004C85" stroke-width="8"/><path d="M20,45 L35,85 L50,55 L65,85 L80,45" fill="none" stroke="#004C85" stroke-width="8"/></svg>` },
            { name: "mitsubishi", aliases: ["mitsubishi", "митсубиси", "митсубиши", "мицубиси", "мицубиши", "мітсубісі", "міцубісі"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,15 65,40 50,65 35,40" fill="#D00000"/><polygon points="35,40 50,65 35,90 20,65" fill="#D00000"/><polygon points="65,40 80,65 65,90 50,65" fill="#D00000"/></svg>` },
            { name: "youtube", aliases: ["youtube", "ютуб", "ютюб", "ютьюб"], svg: `<svg viewBox="0 0 100 100"><rect x="8" y="28" width="84" height="54" rx="12" fill="#FF0000"/><polygon points="38,42 38,68 67,55" fill="white"/></svg>` },
            { name: "bmw", aliases: ["bmw", "бмв"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#1C69D4" stroke-width="7"/><circle cx="50" cy="50" r="30" fill="white"/><path d="M50,20 A30,30 0 0,1 80,50 L50,50 Z" fill="#1C69D4"/><path d="M50,80 A30,30 0 0,1 20,50 L50,50 Z" fill="#1C69D4"/></svg>` },
            { name: "adidas", aliases: ["adidas", "адидас", "адідас"], svg: `<svg viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="none" stroke="black" stroke-width="6"/><rect x="37" y="58" width="7" height="32" fill="black"/><rect x="47" y="46" width="7" height="44" fill="black"/><rect x="57" y="58" width="7" height="32" fill="black"/></svg>` },
            { name: "mercedes", aliases: ["mercedes", "мерседес", "мерс"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#888" stroke-width="5"/><line x1="50" y1="8" x2="50" y2="50" stroke="#333" stroke-width="5"/><line x1="50" y1="50" x2="13" y2="74" stroke="#333" stroke-width="5"/><line x1="50" y1="50" x2="87" y2="74" stroke="#333" stroke-width="5"/><circle cx="50" cy="50" r="5" fill="#333"/></svg>` },
            { name: "twitter", aliases: ["twitter", "твиттер", "x", "твітер", "икс"], svg: `<svg viewBox="0 0 100 100"><line x1="18" y1="18" x2="82" y2="82" stroke="black" stroke-width="14" stroke-linecap="round"/><line x1="82" y1="18" x2="18" y2="82" stroke="black" stroke-width="14" stroke-linecap="round"/></svg>` },
            { name: "spotify", aliases: ["spotify", "спотифай", "спотіфай"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#1DB954"/><path d="M25,38 Q50,28 75,38" fill="none" stroke="white" stroke-width="7" stroke-linecap="round"/><path d="M28,52 Q50,44 72,52" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/><path d="M32,66 Q50,60 68,66" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/></svg>` },
            { name: "amazon", aliases: ["amazon", "амазон"], svg: `<svg viewBox="0 0 100 100"><text x="50" y="52" font-family="Arial" font-weight="bold" font-size="18" fill="#232F3E" text-anchor="middle">amazon</text><path d="M22,65 Q50,82 78,65" fill="none" stroke="#FF9900" stroke-width="5" stroke-linecap="round"/><polygon points="76,60 82,67 70,68" fill="#FF9900"/></svg>` },
            { name: "starbucks", aliases: ["starbucks", "старбакс"], svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#00704A"/><polygon points="50,22 55,38 71,38 58,48 63,64 50,54 37,64 42,48 29,38 45,38" fill="white"/><circle cx="50" cy="50" r="16" fill="#00704A"/></svg>` },
            { name: "intel", aliases: ["intel", "интел", "інтел"], svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="40" ry="28" fill="#0071C5"/><text x="50" y="58" font-family="Arial" font-weight="bold" font-size="22" fill="white" text-anchor="middle">intel</text></svg>` },
            { name: "facebook", aliases: ["facebook", "фейсбук"], svg: `<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="14" fill="#1877F2"/><text x="50" y="72" font-family="Arial" font-weight="bold" font-size="55" fill="white" text-anchor="middle">f</text></svg>` },
            { name: "grave", aliases: ["могила", "grave"], svg: `<svg viewBox="0 0 100 100"><path d="M30,50 C30,20 70,20 70,50 L70,90 L30,90 Z" fill="gray"/><text x="50" y="60" font-family="monospace" font-weight="bold" font-size="16" fill="black" text-anchor="middle">R.I.P</text></svg>` }
        ];
        let currentQuestion = 0;
        let playerLives = 3;
        let questionTimeLeft = 0;
        let questionTimerInterval = null;
        let scaryFlashInterval = null;
        let scaryFlashBusy = false;
        const SCARY_FLASH_START_Q = 14; // 0-indexed: after question 14 (15th logo)

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
                // Идея 9: живой браузер — намёки на thelogotype.com
                const hints = [
                    t.browserHint1,
                    t.browserHint2,
                    t.browserHint3,
                    t.browserHint4
                ];
                const hint = hints[Math.floor(Math.random() * hints.length)];
                browserContent.innerHTML = `<div style="padding: 20px; font-family: 'Times New Roman', serif; background: white; height: 100%; display:flex;flex-direction:column;">
                    <h2 style="color: #000080; margin-top: 0;">${t.pageNotDisplayed}</h2>
                    <p>${t.pageUnavailable}</p>
                    <p style="margin-top:auto;color:#800000;font-style:italic;font-size:12px;opacity:0;transition:opacity 2s;" id="browser-hint">${hint}</p>
                </div>`;
                setTimeout(() => { const h = document.getElementById('browser-hint'); if(h) h.style.opacity='1'; }, 500);
            }
        }

        urlInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') navigate(); });

        // ── Идея 3: Письмо от «Л.» ──
                function showLetterFromL() {
            const letter = document.createElement('div');
            letter.id = 'letter-from-l';
            letter.className = 'window';
            letter.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;z-index:9999;display:flex;flex-direction:column;box-shadow:4px 4px 0 #555;';
            const t = translations[currentLang];
            letter.innerHTML = `
                <div class="title-bar active"><span>${t.letterFromLTitle}</span></div>
                <div class="window-content" style="background:white;padding:15px;font-family:'Courier New',monospace;font-size:13px;line-height:1.8;height:auto;">
                    <p style="margin:0 0 6px;color:#555;font-size:11px;">${t.letterFromLFrom.replace('{playerName}', playerName)}</p>
                    <p style="margin:0 0 10px;color:#555;font-size:11px;">${t.letterFromLSubject}</p>
                    <hr style="border:none;border-top:1px solid #ccc;margin-bottom:12px;">
                    <p style="margin:0 0 8px;">${t.letterFromLBody1}</p>
                    <p style="margin:0 0 8px;">${t.letterFromLBody2}</p>
                    <p style="margin:0;text-align:right;color:#800000;">${t.letterFromLSign}</p>
                    <div style="text-align:center;margin-top:14px;">
                        <button id="close-letter-btn" style="padding:4px 20px;cursor:pointer;" onclick="closeLetter()">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(letter);
            audioEngine.playError(0.2);
            // кнопка активна через 2 сек
            document.getElementById('close-letter-btn').disabled = true;
            setTimeout(() => { const b = document.getElementById('close-letter-btn'); if(b) b.disabled = false; }, 2000);
        }
        function closeLetter() {
            const el = document.getElementById('letter-from-l');
            if (el) el.remove();
            // поле для ответа на долю секунды мигает «Л.»
            const inp = document.getElementById('logo-answer');
            if (inp) {
                const prev = inp.value;
                inp.value = translations[currentLang].letterFromLVal;
                setTimeout(() => { if(inp) inp.value = prev; }, 600);
            }
            currentQuestion++;
            renderQuestion();
        }

        // ── Идея 4: деградация логотипа на вопросе 13-14 ──
        let _logoGlitchTimer = null;
        function startLogoGlitch() {
            if (_logoGlitchTimer) return;
            let frame = 0;
            _logoGlitchTimer = setInterval(() => {
                frame++;
                const c = document.getElementById('logo-container');
                if (!c) { stopLogoGlitch(); return; }
                const hue = (frame * 17) % 360;
                const inv = frame % 6 === 0 ? 1 : 0;
                c.style.filter = `hue-rotate(${hue}deg) invert(${inv}) contrast(1.5)`;
                if (frame % 8 === 0) {
                    const err = document.getElementById('game-error');
                    if (err) {
                        err.innerText = translations[currentLang].letterFromLErr;
                        setTimeout(() => { if(err) err.innerText=''; }, 900);
                    }
                }
            }, 120);
        }
        function stopLogoGlitch() {
            if (_logoGlitchTimer) { clearInterval(_logoGlitchTimer); _logoGlitchTimer = null; }
            const c = document.getElementById('logo-container');
            if (c) c.style.filter = '';
        }

        // ── Идея 6: Системные уведомления во время викторины ──
                const _sysNotifs = {
            3:  translations[currentLang].sysNotif3,
            8:  translations[currentLang].sysNotif8,
            12: translations[currentLang].sysNotif12.replace('{playerName}', playerName),
            17: ''  // пустое — специальный случай
        };
        let _notifShown = {};
        function maybShowSysNotif(q) {
            if (_notifShown[q] || !_sysNotifs.hasOwnProperty(q)) return;
            _notifShown[q] = true;
            const msg = _sysNotifs[q];
            const notif = document.createElement('div');
            notif.className = 'window';
            notif.style.cssText = 'position:fixed;top:120px;right:30px;width:310px;z-index:9998;display:flex;flex-direction:column;box-shadow:3px 3px 0 #555;animation:shake 0.3s 1;';
            notif.innerHTML = `
                <div class="title-bar active" style="background:#808000;">
                    <span>${translations[currentLang].sysNotifTitle}</span>
                    <div class="window-btn" onclick="this.closest('.window').remove()">X</div>
                </div>
                <div class="window-content" style="background:#ffffc0;padding:12px;font-family:'MS Sans Serif',Tahoma,sans-serif;font-size:12px;height:auto;">
                    ${msg || '<br>'}
                    <div style="text-align:center;margin-top:10px;">
                        <button onclick="this.closest('.window').remove();audioEngine.playClick();" style="padding:3px 18px;cursor:pointer;">OK</button>
                    </div>
                </div>`;
            document.body.appendChild(notif);
            audioEngine.playError(0.15);
            setTimeout(() => { if(notif.parentNode) notif.remove(); }, 7000);
        }

        // ── Идея 5: Выключение говорит «Нет» ──
        function startShutdown() {
            if (!isOnCreepySite) { systemAlert('cannotShutdown'); return; }
            // Делаем вид, что гасим экран
            const dark = document.createElement('div');
            dark.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;background:black;opacity:0;transition:opacity 1.5s;z-index:88888;display:flex;align-items:center;justify-content:center;';
            document.body.appendChild(dark);
            audioEngine.stopDrone();
            requestAnimationFrame(() => { dark.style.opacity='1'; });
            setTimeout(() => {
                dark.innerHTML = `<div style="color:red;font-size:5rem;font-family:monospace;font-weight:bold;animation:shake 0.3s infinite;">${translations[currentLang].darkNo}</div>`;
                audioEngine.playError(0.5);
                audioEngine.playDrone();
                setTimeout(() => {
                    dark.style.opacity='0';
                    setTimeout(() => { dark.remove(); openBrowser(); }, 1500);
                }, 2000);
            }, 1500);
        }

        let darknessLevel = 0;

        function startGame() { 
            currentQuestion = 0; 
            playerLives = 3;
            darknessLevel = hasRebootedAfterBSOD ? 0.2 : 0;
            isTempAccessGranted = false;
            captchaDone = false;
            closeAllDesktopWindows();
            
            // Keep the browser window open because the game is played inside it!
            browserState.isOpen = true;
            browserWindow.style.display = 'flex';
            taskbarBrowserBtn.style.display = 'flex';
            restoreBrowser();

            window._bossIntroStarted = false;
            window._bossFightInitiated = false;
            
            // Таймер для Zetta Antivirus убран, так как путь только один
            
            renderQuestion(); 
        }

        function showZettaAd() {
            if (isZettaInstalled || document.getElementById('zetta-ad') || document.getElementById('zetta-setup') || document.getElementById('zetta-assistant')) return;
            
            const ad = document.createElement('div');
            ad.id = 'zetta-ad';
            ad.className = 'window';
            ad.style.cssText = 'position: fixed; top: 100px; left: 100px; width: 300px; z-index: 5000; display: flex; flex-direction: column;';
            ad.innerHTML = `
                <div class="title-bar active">
                    <span>Zetta Antivirus Ad</span>
                    <div class="window-btn" onclick="this.closest('.window').remove()">X</div>
                </div>
                <div class="window-content" style="background: white; padding: 15px; text-align: center; height: auto;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 10px;">${zettaSvg}</div>
                    <p style="font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 14px; font-weight: bold; margin-bottom: 15px;">
                        ${translations[currentLang].zettaAdText}
                    </p>
                    <button onclick="installZetta(this.closest('.window'))" style="padding: 5px 20px; font-weight: bold; cursor: pointer;">${translations[currentLang].install}</button>
                </div>
            `;
            document.body.appendChild(ad);
        }

        function startZettaAdTimer() {
            if (isZettaInstalled || document.getElementById('zetta-ad') || document.getElementById('zetta-setup') || document.getElementById('zetta-assistant')) return;
            clearTimeout(zettaTimer);
            zettaTimer = setTimeout(() => {
                if (browserState.isOpen && !browserState.isMinimized) {
                    showZettaAd();
                }
            }, 60000); // 1 минута
        }

        function stopZettaAdTimer() {
            clearTimeout(zettaTimer);
        }

        function installZetta(adElement) {
            adElement.remove();
            
            const setup = document.createElement('div');
            setup.id = 'zetta-setup';
            setup.className = 'window';
            setup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; z-index: 5001; display: flex; flex-direction: column;';
            setup.innerHTML = `
                <div class="title-bar active">
                    <span>Zetta Antivirus Setup</span>
                </div>
                <div class="window-content" style="background: #c0c0c0; padding: 20px; height: auto;">
                    <p style="margin-top: 0;">${translations[currentLang].zettaInstallTitle}</p>
                    <div style="width: 100%; height: 20px; background: white; border: 1px solid #808080; position: relative; margin: 10px 0;">
                        <div id="zetta-progress" style="width: 0%; height: 100%; background: #000080; transition: width 0.1s;"></div>
                    </div>
                    <p id="zetta-status" style="font-size: 11px;">${translations[currentLang].zettaInstallFiles}</p>
                </div>
            `;
            document.body.appendChild(setup);
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 5;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        setup.remove();
                        finishZettaInstallation();
                    }, 500);
                }
                document.getElementById('zetta-progress').style.width = progress + '%';
                if (progress > 30) document.getElementById('zetta-status').innerText = translations[currentLang].zettaInitEngine;
                if (progress > 70) document.getElementById('zetta-status').innerText = translations[currentLang].zettaCreateShortcuts;
            }, 100);
        }

        function finishZettaInstallation() {
            isZettaInstalled = true;
            const assistant = document.createElement('div');
            assistant.id = 'zetta-assistant';
            assistant.style.cssText = 'position: fixed; bottom: 40px; right: 20px; width: 60px; height: 60px; z-index: 2000; cursor: pointer; transition: transform 0.3s;';
            assistant.innerHTML = zettaSvg;
            
            const speech = document.createElement('div');
            speech.id = 'zetta-speech';
            speech.style.cssText = 'position: fixed; bottom: 110px; right: 20px; background: white; border: 2px solid black; padding: 10px; border-radius: 10px; max-width: 200px; font-size: 12px; display: none; z-index: 2001; font-family: "MS Sans Serif", Tahoma, sans-serif;';
            
            document.body.appendChild(assistant);
            document.body.appendChild(speech);
            
            zettaSpeak(translations[currentLang].zettaWelcome);
        }

        function zettaSpeak(text, emotion = null) {
            const speech = document.getElementById('zetta-speech');
            const bspeech = document.getElementById('boss-zetta-speech');
            
            if (speech) {
                speech.innerText = text;
                // Exclude displaying the white speech bubble if boss fight is active or boss bubble is already created
                if (!isBossFightActive && !bspeech) {
                    speech.style.display = 'block';
                } else {
                    speech.style.display = 'none';
                }
                setTimeout(() => { speech.style.display = 'none'; }, 5000);
            }
            if (emotion) zettaSetEmotion(emotion);
            // also update boss speech if in boss fight
            if (bspeech) { 
                bspeech.textContent = text; 
                bspeech.style.display = 'block'; 
                setTimeout(() => { bspeech.style.display = 'none'; }, 4000); 
            }
        }

        // ── ZETTA QUIZ SCANS ──
        let _zettaScanShown = {};
        function maybShowZettaScan(q) {
            if (_zettaScanShown[q]) return;
            _zettaScanShown[q] = true;
            setTimeout(() => {
                if (q === 3) {
                    zettaSpeak(translations[currentLang].scan3_1, 'normal');
                    setTimeout(() => zettaSpeak(translations[currentLang].scan3_2, 'normal'), 3200);
                } else if (q === 7) {
                    zettaSpeak(translations[currentLang].scan7_1, 'angry');
                    setTimeout(() => zettaSpeak(translations[currentLang].scan7_2, 'normal'), 3500);
                } else if (q === 12) {
                    zettaSpeak(translations[currentLang].scan12_1, 'sad');
                    setTimeout(() => zettaSpeak(translations[currentLang].scan12_2, 'normal'), 4000);
                }
            }, 4000);
        }

        function clearQuestionTimers() {
            if (questionTimerInterval) { clearInterval(questionTimerInterval); questionTimerInterval = null; }
            if (scaryFlashInterval)    { clearInterval(scaryFlashInterval);    scaryFlashInterval = null; }
            scaryFlashBusy = false;
        }

        function startQuestionTimer(maxTime) {
            clearQuestionTimer();
            questionTimeLeft = maxTime;
            updateTimerDisplay(maxTime);
            questionTimerInterval = setInterval(() => {
                questionTimeLeft--;
                updateTimerDisplay(maxTime);
                if (questionTimeLeft <= 0) {
                    clearQuestionTimer();
                    onTimerExpired();
                }
            }, 1000);
        }

        function clearQuestionTimer() {
            if (questionTimerInterval) { clearInterval(questionTimerInterval); questionTimerInterval = null; }
        }

        function updateTimerDisplay(maxTime) {
            const el  = document.getElementById('question-timer');
            const bar = document.getElementById('timer-bar-fill');
            if (el) {
                el.textContent = questionTimeLeft;
                el.style.color = questionTimeLeft <= 5 ? '#ff3333' : 'white';
                if (questionTimeLeft <= 5) {
                    el.style.animation = 'shake 0.15s infinite';
                } else {
                    el.style.animation = '';
                }
            }
            if (bar) {
                const pct = Math.max(0, (questionTimeLeft / maxTime) * 100);
                bar.style.width = pct + '%';
                bar.style.background = pct > 50 ? '#00cc44' : pct > 25 ? '#ffaa00' : '#ff2222';
            }
        }

        function showGameOver(reason, callback) {
            // Во первых когда игрок погибает, то экран становится резко чёрным.
            const gameOverOverlay = document.createElement('div');
            gameOverOverlay.id = 'custom-game-over-overlay';
            gameOverOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: black;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999999;
                font-family: "Courier New", monospace;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
                opacity: 1;
            `;

            // Затем выходит картинка photo_2026-06-09_16-23-25-removebg-preview.png
            const img = document.createElement('img');
            img.src = 'photo_2026-06-09_16-23-25-removebg-preview.png';
            img.style.cssText = `
                max-width: 80%;
                max-height: 45vh;
                object-fit: contain;
                margin-bottom: 30px;
                filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.6));
                opacity: 0;
                transition: opacity 1.5s ease;
            `;
            gameOverOverlay.appendChild(img);

            // Subtitle text (H1 title removed)
            const desc = document.createElement('p');
            desc.style.cssText = `
                color: #cc3333;
                font-size: 1.3rem;
                line-height: 1.6;
                margin: 0;
                white-space: pre-wrap;
                min-height: 3.5rem;
            `;
            gameOverOverlay.appendChild(desc);

            document.body.appendChild(gameOverOverlay);

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playDefeatMusic();
            }

            // Animate image fade in
            setTimeout(() => {
                img.style.opacity = '1';
            }, 100);

            // Fetch correct translations
            const langTexts = {
                "ru": { quiz: "Используй интернет своего компьютера, что бы угадать все логотипы.\nИначе снова сюда попадёшь.", boss: "Не сдавайся! У тебя есть все шансы выиграть.\nПросто будь осторожен и уклоняйся от его атак." },
                "ua": { quiz: "Використовуй інтернет свого комп'ютера, щоб відгадати всі логотипи.\nІнакше знову сюди потрапиш.", boss: "Не здавайся! У тебе є всі шанси виграти.\nПросто будь обережним і ухиляйся від його атак." },
                "en": { quiz: "Use your computer's internet to guess all the logos.\nOtherwise you will end up here again.", boss: "Don't give up! You have every chance to win.\nJust be careful and dodge his attacks." }
            };
            const currentGameOverTexts = langTexts[currentLang] || langTexts["en"];

            let subtext = "";
            if (reason === 'quiz') {
                subtext = currentGameOverTexts.quiz;
            } else if (reason === 'boss') {
                subtext = currentGameOverTexts.boss;
            } else {
                subtext = translations[currentLang].defeatSub;
            }

            // Typing animation helper: Wait 1.5s for image, then type desc
            setTimeout(() => {
                let descIdx = 0;
                function typeDesc() {
                    if (descIdx < subtext.length) {
                        const char = subtext[descIdx];
                        if (char === '\n') {
                            desc.appendChild(document.createElement('br'));
                        } else {
                            desc.appendChild(document.createTextNode(char));
                        }
                        descIdx++;
                        setTimeout(typeDesc, 70); // Медленная печать текста
                    } else {
                        // Everything finished, wait 4.5 seconds and trigger callback
                        setTimeout(() => {
                            if (typeof audioEngine !== 'undefined') {
                                audioEngine.stopDefeatMusic();
                            }
                            gameOverOverlay.remove();
                            if (callback) callback();
                        }, 4500);
                    }
                }
                typeDesc();
            }, 1500);
        }

        function updateLivesDisplay() {
            const el = document.getElementById('lives-display');
            if (el) {
                el.innerHTML = '&#9829;'.repeat(playerLives) + '<span style="opacity:0.3">&#9829;</span>'.repeat(3 - playerLives);
            }
        }

        function onTimerExpired() {
            clearScaryFlash();
            
            // Check if this is the final question after BSOD
            if (hasRebootedAfterBSOD && currentQuestion === gameLogos.length - 1) {
                clearQuestionTimers();
                if (scavengerTimer) {
                    clearInterval(scavengerTimer);
                    scavengerTimer = null;
                }
                document.querySelectorAll('.scavenger-letter').forEach(e => e.remove());
                triggerScreamerAndDeath();
                return;
            }

            playerLives--;
            updateLivesDisplay();
            audioEngine.playError(0.4);

            if (playerLives <= 0) {
                showGameOver('quiz', () => {
                    // Вместо окончания игры, идем на несколько шагов (вопросов) назад
                    currentQuestion = Math.max(0, currentQuestion - 5);
                    playerLives = 3;
                    renderQuestion();
                });
            } else {
                currentQuestion++;
                if (currentQuestion >= gameLogos.length) {
                    triggerEnding();
                } else {
                    renderQuestion();
                }
            }
        }

        function triggerLivesOutEnding() {
            clearQuestionTimers();
            const dark = document.createElement('div');
            dark.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:black;opacity:0;transition:opacity 2.5s ease;z-index:99999;pointer-events:none;';
            document.body.appendChild(dark);
            audioEngine.playError(0.6);
            requestAnimationFrame(() => {
                dark.style.opacity = '1';
                setTimeout(() => {
                    dark.remove();
                    triggerBSOD();
                }, 2600);
            });
        }

        let _scaryFlashToken = 0;
        function startScaryFlash() {
            clearScaryFlash();
            const myToken = ++_scaryFlashToken;
            const faces = ['scary_eye.png', 'creepy_face.png', 'distorted_skull.png'];
            scaryFlashInterval = setInterval(() => {
                if (scaryFlashBusy) return;
                if (_scaryFlashToken !== myToken) return;
                const container = document.getElementById('logo-container');
                if (!container) { clearScaryFlash(); return; }
                scaryFlashBusy = true;
                const savedHTML = container.innerHTML;
                const face = faces[Math.floor(Math.random() * faces.length)];
                container.innerHTML = `<img src="${face}" style="width:100%;height:100%;object-fit:contain;border-radius:4px;filter:saturate(2) contrast(1.5);">`;
                audioEngine.playError(0.1);
                setTimeout(() => {
                    if (_scaryFlashToken !== myToken) return;
                    const c = document.getElementById('logo-container');
                    if (c) c.innerHTML = savedHTML;
                    scaryFlashBusy = false;
                }, 500);
            }, 2000);
        }

        function clearScaryFlash() {
            if (scaryFlashInterval) { clearInterval(scaryFlashInterval); scaryFlashInterval = null; }
            scaryFlashBusy = false;
        }

        let captchaDone = false;
        
        function showCreepyCaptcha() {
            browserContent.innerHTML = `
                <div style="background: #e0dfdf; height: 100%; padding: 10px; font-family: 'MS Sans Serif', Tahoma, sans-serif; display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
                    <div style="background: #4a90e2; color: white; padding: 10px; width: 100%; font-size: 14px; font-weight: bold; margin-bottom: 10px;">
                        ${translations[currentLang].captchaPrompt}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; width: 100%; max-width: 300px;">
                        ${Array(9).fill(0).map((_, i) => `<div onclick="this.style.border='3px solid blue'; this.style.opacity='0.5'; audioEngine.playClick(); if(${i}===2 || ${i}===5) { captchaDone=true; setTimeout(renderQuestion, 1000); } else { document.getElementById('browser-window').classList.add('shake-active'); setTimeout(()=>document.getElementById('browser-window').classList.remove('shake-active'), 300); audioEngine.playError(0.5); }" style="background: black; width: 100%; aspect-ratio: 1; border: 1px solid #999; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden;"><img src="${i === 2 || i === 5 ? 'scary_eye.png' : 'creepy_face.png'}" style="width: 100%; height: 100%; object-fit: cover; filter: saturate(0) contrast(2) ${i !== 2 && i !== 5 ? 'blur(2px)' : ''};"></div>`).join('')}
                    </div>
                    <button style="margin-top: 15px; padding: 5px 20px; font-weight: bold; width: 100px;">${translations[currentLang].captchaConfirm}</button>
                </div>
            `;
            setTimeout(() => {
                audioEngine.playError(0.2);
            }, 500);
        }

        function renderQuestion() {
            if (hasRebootedAfterBSOD && currentQuestion === gameLogos.length - 1) {
                render666Question();
                return;
            }

            if (currentQuestion === 10 && !captchaDone) {
                showCreepyCaptcha();
                return;
            }

            if (currentQuestion === 10 && captchaDone && !isTempAccessGranted) {
                isTempAccessGranted = true;
                triggerTempAccessNotification();
            }

            if (currentQuestion >= 5) {
                document.getElementById('desktop-pc-text').innerText = translations[currentLang].creepPc1;
            }
            if (currentQuestion >= 10) {
                document.getElementById('desktop-trash-text').innerText = translations[currentLang].creepTrash1;
            }
            if (currentQuestion >= 15) {
                document.getElementById('desktop-internet-text').innerText = translations[currentLang].creepInternet1;
                document.body.style.transition = 'none';
                document.body.style.background = `radial-gradient(circle at center, #008080 ${100 - ((currentQuestion-14)*10)}%, #000000 100%)`;
            }
            // Идея 2: после перезагрузки иконки сохраняют тёмные имена
            if (hasRebootedAfterBSOD) {
                document.getElementById('desktop-pc-text').innerText = translations[currentLang].creepPc2;
                document.getElementById('desktop-trash-text').innerText = translations[currentLang].creepTrash2;
                document.getElementById('desktop-internet-text').innerText = translations[currentLang].creepInternet2;
            }

            let logo = gameLogos[currentQuestion];
            let isZettaIntervening = (isZettaInstalled && currentQuestion === gameLogos.length - 1 && !hasRebootedAfterBSOD);

            const t = translations[currentLang];
            const overlay = hasRebootedAfterBSOD ? `<div style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,${darknessLevel}); pointer-events: none; z-index: 5;"></div>` : '';
            
            browserContent.innerHTML = `
                <div style="background: white; height: 100%; display: flex; flex-direction: column; align-items: center; font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box; position: relative;">
                    ${overlay}
                    <div style="background: #000080; color: white; width: 100%; padding: 4px 10px; font-weight: bold; position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                        <span>${t.question} ${currentQuestion + 1} ${t.outOf} ${gameLogos.length}</span>
                        <span id="lives-display" style="font-size:15px;letter-spacing:3px;">&#9829;&#9829;&#9829;</span>
                        <span id="question-timer" style="font-size:15px;font-weight:bold;min-width:22px;text-align:right;"></span>
                    </div>
                    <div style="width:100%;height:4px;background:#333;position:relative;z-index:10;">
                        <div id="timer-bar-fill" style="height:100%;width:100%;background:#00cc44;transition:width 0.9s linear;"></div>
                    </div>
                    <div id="logo-container" style="width: 120px; height: 120px; margin: 15px 0; position: relative; z-index: 10; transition: opacity 2s;">${logo.svg}</div>
                    <div style="margin-bottom: 10px; position: relative; z-index: 10;">${t.whichBrand}</div>
                    <input type="text" id="logo-answer" style="margin-bottom: 10px; padding: 4px; width: 200px; position: relative; z-index: 10;" placeholder="${t.inputPlaceholder}" autocomplete="off">
                    <button id="answer-btn" onclick="checkAnswer(${isZettaIntervening ? 'true' : 'false'})" style="padding: 4px 15px; cursor: pointer; position: relative; z-index: 10;">${t.answerBtn}</button>
                    <div id="game-error" style="color: red; font-size: 12px; margin-top: 10px; height: 15px; position: relative; z-index: 10;"></div>
                </div>
            `;
            
            // Start timer (random 15-20s)
            const timerMax = Math.floor(Math.random() * 6) + 15;
            startQuestionTimer(timerMax);

            // Scary flash after question 14 (0-indexed)
            if (currentQuestion >= SCARY_FLASH_START_Q) {
                startScaryFlash();
            } else {
                clearScaryFlash();
            }

            // Идея 4: деградация логотипа на вопросах 13-14
            if (currentQuestion === 12 || currentQuestion === 13) {
                setTimeout(startLogoGlitch, 2000);
            } else {
                stopLogoGlitch();
            }

            // Заражение Зетты теперь происходит только по ошибкам (см. checkAnswer)

            // Идея 6: системные уведомления
            setTimeout(() => maybShowSysNotif(currentQuestion), 3000);
            // Zetta scan attempts
            if (isZettaInstalled) {
                if (isZettaCorrupted) {
                    zettaSetEmotion('corrupted');
                    if (currentQuestion === 16 && !window._zettaQ16Hint) {
                        window._zettaQ16Hint = true;
                        setTimeout(() => zettaSpeak(translations[currentLang].zettaHintAdidas, "corrupted"), 4000);
                    } else if (currentQuestion === 17 && !window._zettaQ17Hint) {
                        window._zettaQ17Hint = true;
                        setTimeout(() => zettaSpeak(translations[currentLang].zettaHintPepsi, "corrupted"), 4000);
                    } else if (currentQuestion === 18 && !window._zettaQ18Hint) {
                        window._zettaQ18Hint = true;
                        setTimeout(() => zettaSpeak(translations[currentLang].zettaHintMicrosoft, "corrupted"), 4000);
                    }
                } else {
                    maybShowZettaScan(currentQuestion);
                }
            }

            const inputField = document.getElementById('logo-answer');
            const btn = document.getElementById('answer-btn');

            if (isZettaIntervening) {
                inputField.disabled = true;
                btn.disabled = true;
                
                setTimeout(() => {
                    zettaSpeak(translations[currentLang].zettaHintUnsafeLogo, "sad");
                }, 500);
            } else {
                inputField.addEventListener('keypress', function (e) { if (e.key === 'Enter') checkAnswer(false); });
                inputField.focus();
            }
            // Update lives display with current state
            updateLivesDisplay();
        }

        function triggerCorporateFlash(logoName, callback) {
            const overlay = document.getElementById('corporate-flash-overlay');
            const content = document.getElementById('corporate-flash-content');
            if (!overlay || !content) { callback(); return; }

            // Play static television glitch sound
            audioEngine.playTone('sawtooth', 85, 45, 0.35, 0.5);
            audioEngine.playTone('square', 190, 95, 0.35, 0.4);

                        let text = translations[currentLang].creepText1;
            let img = "creepy_face.png";

            if (logoName === "mcdonalds") {
                text = translations[currentLang].creepText2;
                img = "creepy_face.png";
            } else if (logoName === "apple") {
                text = translations[currentLang].creepText3;
                img = "scary_eye.png";
            } else if (logoName === "nike") {
                text = translations[currentLang].creepText4;
                img = "distorted_skull.png";
            } else if (logoName === "audi") {
                text = translations[currentLang].creepText5;
                img = "scary_eye.png";
            } else if (logoName === "pepsi") {
                text = translations[currentLang].creepText6;
                img = "creepy_face.png";
            } else if (logoName === "windows") {
                text = translations[currentLang].creepText7;
                img = "distorted_skull.png";
            } else if (logoName === "youtube") {
                text = translations[currentLang].creepText8;
                img = "scary_eye.png";
            } else if (logoName === "adidas") {
                text = translations[currentLang].creepText9;
                img = "distorted_skull.png";
            }


            content.innerHTML = `
                <img class="corporate-flash-img" src="${img}" style="width: 250px; height: 250px; object-fit: contain; filter: saturate(3) contrast(1.5) invert(1); animation: shake 0.05s infinite;">
                <div style="margin-top:20px; font-size: 2rem; font-family: 'Nosifer', 'Courier New', monospace; font-weight: bold; text-shadow: 0 0 10px red;">${text}</div>
            `;
            overlay.style.display = 'flex';

            setTimeout(() => {
                overlay.style.display = 'none';
                content.innerHTML = '';
                callback();
            }, 350);
        }

        let errorCount = 0;

        function checkAnswer(isZettaLastQuestion = false) {
            const inputField = document.getElementById('logo-answer');
            const btn = document.getElementById('answer-btn');
            
            if (inputField && inputField.disabled) return;

            const input = inputField ? inputField.value.toLowerCase().trim() : '';

            // Пустой ввод — не считать ошибкой, просто не реагировать
            if (input === '') {
                if (inputField) inputField.focus();
                return;
            }

            if (inputField) inputField.disabled = true;
            if (btn) btn.disabled = true;

            let logo = gameLogos[currentQuestion];
            
            if (isZettaLastQuestion) {
                logo = { aliases: ["nokia", "нокиа", "нокіа"] };
            }

            if (logo.aliases.includes(input)) {
                errorCount = 0;
                clearQuestionTimers();
                audioEngine.playClick();
                if (hasRebootedAfterBSOD) darknessLevel += 0.08;

                // Идея 3: письмо от «Л.» после 7-го правильного ответа
                if (currentQuestion === 6 && !hasRebootedAfterBSOD && !window._letterShown) {
                    window._letterShown = true;
                    showLetterFromL();
                    return;
                }
                
                const proceed = () => {
                    if (currentQuestion === gameLogos.length - 1) { 
                        if (isZettaLastQuestion) {
                            triggerGoodEnding();
                        } else {
                            triggerEnding(); 
                        }
                    } else { 
                        currentQuestion++; 
                        renderQuestion(); 
                    }
                };

                if (currentQuestion >= 12 && !hasRebootedAfterBSOD && !isZettaLastQuestion) {
                    triggerCorporateFlash(logo.name, proceed);
                } else {
                    proceed();
                }
            } else {
                audioEngine.playError();
                errorCount++;
                let errorMsg = translations[currentLang].wrongAnswer;
                if (errorCount === 2) errorMsg = translations[currentLang].wrongAnswer2;
                if (errorCount === 3) errorMsg = translations[currentLang].wrongAnswer3.replace('{playerName}', playerName);
                if (errorCount >= 4) errorMsg = translations[currentLang].wrongAnswer4;

                // Заражение Зетты после 10 ошибок
                if (isZettaInstalled && !isZettaCorrupted && errorCount >= 10 && !hasRebootedAfterBSOD) {
                    isZettaCorrupted = true;
                    zettaSetEmotion('corrupted');
                    zettaSpeak(translations[currentLang].zettaSystemInfected, 'corrupted');
                }
                
                document.getElementById('game-error').innerText = errorMsg;
                if (inputField) {
                    if (errorCount >= 3) inputField.value = translations[currentLang].logoAnswerRun;
                    inputField.disabled = false;
                    inputField.focus();
                }
                if (btn) btn.disabled = false;
            }
        }

        function triggerGoodEnding() {
            goodEndingAchieved = true;
            zettaSpeak(translations[currentLang].goodEndingWelcome);
            
            browserContent.innerHTML = `
                <div style="background: white; color: #000080; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; text-align: center; padding: 20px;">
                    <h1 style="color: green;">${translations[currentLang].goodEndingTitle}</h1>
                    <p style="font-size: 18px;">${translations[currentLang].goodEndingP1}</p>
                    <p style="font-size: 18px;">${translations[currentLang].goodEndingP2}</p>
                    <div style="width: 100px; height: 100px; margin-top: 20px;">${zettaSvg}</div>
                    <button onclick="location.reload()" style="margin-top: 30px; padding: 10px 20px; cursor: pointer;">${translations[currentLang].endingToMenu}</button>
                </div>
            `;
            
            isOnCreepySite = false;
            clearTimeout(zettaTimer);
        }

        function triggerEnding() {
            if (browserState.isMaximized) maximizeBrowser();
            clearTimeout(zettaTimer);
            
            if (!hasRebootedAfterBSOD) {
                const t = translations[currentLang];
                // Идея 8: фальшивый экран победы
                browserContent.innerHTML = `
                    <div style="background:#f0f8f0;color:#006600;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'MS Sans Serif',Tahoma,sans-serif;text-align:center;padding:20px;">
                        <div style="font-size:3rem;margin-bottom:10px;">&#127881;</div>
                        <h2 style="color:#006600;margin-bottom:10px;">${t.fakeWinCongratulations}</h2>
                        <p style="font-size:16px;margin-bottom:5px;">${t.fakeWinPassed}</p>
                        <p style="font-size:22px;font-weight:bold;margin:10px 0;">${t.fakeWinResult}: ${gameLogos.length}/${gameLogos.length}</p>
                        <p style="font-size:13px;color:#555;">${t.fakeWinMemory}</p>
                        <div id="fake-win-btns" style="display:flex;gap:10px;margin-top:20px;">
                            <button style="padding:6px 18px;cursor:pointer;">${t.fakeWinShare}</button>
                            <button style="padding:6px 18px;cursor:pointer;">${t.fakeWinPlayAgain}</button>
                        </div>
                        <div id="ending-text-1" style="font-size:24px;font-weight:bold;margin-top:25px;opacity:0;transition:opacity 1.5s;color:white;position:absolute;">${t.answeredCorrectly}</div>
                        <div id="ending-text-2" style="font-size:24px;font-weight:bold;opacity:0;transition:opacity 1.5s;color:#aa0000;text-shadow:0 0 10px red;position:absolute;top:60%;">${t.waitingForYou}</div>
                    </div>
                `;

                // Через 3 сек музыка искажается, фон становится чёрным
                window._endingTimeout1 = setTimeout(() => {
                    browserContent.firstElementChild.style.transition = 'background 1.5s, color 1.5s';
                    browserContent.firstElementChild.style.background = 'black';
                    audioEngine.playError(0.1);
                    const fwb = document.getElementById('fake-win-btns');
                    if (fwb) fwb.style.display = 'none';
                }, 3000);

                window._endingTimeout2 = setTimeout(() => {
                    const el1 = document.getElementById('ending-text-1');
                    if (el1) { el1.style.position='relative'; el1.style.opacity='1'; }
                    audioEngine.playError(0.1);
                }, 4500);

                window._endingTimeout3 = setTimeout(() => {
                    const el2 = document.getElementById('ending-text-2');
                    if (el2) { el2.style.position='relative'; el2.style.top='auto'; el2.style.opacity='1'; }
                    audioEngine.playError(0.3);
                }, 6500);

                window._endingTimeout4 = setTimeout(() => { triggerBSOD(); }, 10000);
            } else {
                triggerBSOD();
            }
        }

        function closeAllDesktopWindows() {
            document.querySelectorAll('[data-desktop-win]').forEach(win => {
                win.style.display = 'none';
            });
            const tm = document.getElementById('task-manager');
            if (tm) tm.style.display = 'none';
            const browser = document.getElementById('browser-window');
            if (browser) browser.style.display = 'none';
            const ad = document.getElementById('ad-popup');
            if (ad) ad.style.display = 'none';
            const taskbarBrowserBtn = document.getElementById('taskbar-browser-btn');
            if (taskbarBrowserBtn) taskbarBrowserBtn.style.display = 'none';
        }

        function triggerBSOD() {
            audioEngine.stopDrone();
            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
            }
            audioEngine.playBSOD();
            document.querySelectorAll('.red-eye').forEach(el => el.remove());
            closeAllDesktopWindows();
            
            // Critical: Turn off boss fight active flag to halt dialogue and combat loops
            isBossFightActive = false;
            window._bossIntroStarted = false;
            window._bossFightInitiated = false;

            // Clear tentacles and boss intervals
            if (tentacleFrameId) {
                cancelAnimationFrame(tentacleFrameId);
                tentacleFrameId = null;
            }
            if (_zettaBossInterval) {
                clearInterval(_zettaBossInterval);
                _zettaBossInterval = null;
            }
            if (bossShieldInterval) {
                clearInterval(bossShieldInterval);
                bossShieldInterval = null;
            }

            // Clear all scheduled dialogue, ending, and browser-opening timeouts
            [
                window._endingTimeout1, 
                window._endingTimeout2, 
                window._endingTimeout3, 
                window._endingTimeout4, 
                window._openBrowserBossTimeout, 
                window._spawnBossTimeout, 
                window._bossHoleTimeout, 
                window._bossEyeTimeout, 
                window._bossIntroDialogueTimeout,
                window._bossDialogueGlitchTimeout
            ].forEach(t => {
                if (t) clearTimeout(t);
            });

            const bsodScreen = document.getElementById('bsod-screen');
            if (bsodScreen) {
                bsodScreen.style.zIndex = '1000000';
                bsodScreen.style.display = 'block';
            }
            setTimeout(() => {
                const rebootHandler = () => { document.removeEventListener('keydown', rebootHandler); rebootSystem(); };
                document.addEventListener('keydown', rebootHandler);
            }, 1000);
        }

        function rebootSystem() {
            audioEngine.stopDrone();
            audioEngine.playBoot();
            document.getElementById('bsod-screen').style.display = 'none';
            closeAllDesktopWindows();
            window._bossIntroStarted = false;
            window._bossFightInitiated = false;
            hasRebootedAfterBSOD = true;
            handEventTriggered = false;
            const startBtn = document.querySelector('.start-btn');
            startBtn.style.visibility = 'visible';
            startBtn.style.transform = 'none';
            startBtn.style.transition = 'none';
            document.body.style.transition = 'none';
            document.body.style.background = '';
            document.body.style.backgroundColor = 'var(--win-bg)';
            isOnCreepySite = false;
            escapeAttempts = 0;
            canAttemptEscape = true;
            document.getElementById('browser-window-btns').style.display = 'flex';
            browserWindow.classList.remove('shake-active', 'shake-continuous');
            closeBrowser();
            zettaTriedExitAlready = false;
            document.getElementById('url-input').value = "http://";
            adPopup.style.display = 'none';
            clearTimeout(adTimeout);
            clearTimeout(zettaTimer);
            currentQuestion = 0;
            const bootScreen = document.getElementById('boot-screen');
            bootScreen.style.display = 'flex';
            setTimeout(() => { bootScreen.style.display = 'none'; }, 4000);
            // Zetta реагирует на BSOD с грустью
            if (isZettaInstalled) {
                const assistant = document.getElementById('zetta-assistant');
                if (assistant) {
                    assistant.style.display = 'block';
                    if (isZettaCorrupted) {
                        zettaSetEmotion('corrupted');
                    } else {
                        setTimeout(() => {
                            zettaSpeak(translations[currentLang].zettaRebootComfort, 'sad');
                            setTimeout(() => zettaSetEmotion('normal'), 6000);
                        }, 4800);
                    }
                }
            }
        }

        function startGameFromMenu() {
            const overlay = document.getElementById('transition-overlay');
            const mainMenu = document.getElementById('main-menu');
            const bootScreen = document.getElementById('boot-screen');

            // 1. Плавное затемнение (1 сек)
            overlay.style.opacity = "1";
            audioEngine.stopDrone();
            audioEngine.stopMenuMusic();

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
            const chaptersMenu = document.getElementById('chapters-menu');
            if (chaptersMenu) chaptersMenu.style.display = 'none';
            const savesMenu = document.getElementById('saves-menu');
            if (savesMenu) savesMenu.style.display = 'none';

            if (show && menuId) document.getElementById(menuId).style.display = 'block';
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
        let iconStartX, iconStartY;
        let hasMovedIcon = false;

        const icons = document.querySelectorAll('.icon-container');
        icons.forEach(icon => {
            icon.addEventListener('mousedown', (e) => {
                const now = Date.now();
                if (icon._lastClickTime && now - icon._lastClickTime < 500) {
                    if (typeof icon.ondblclick === 'function') {
                        icon.ondblclick(e);
                    }
                    icon._lastClickTime = 0;
                    return;
                }
                icon._lastClickTime = now;

                draggedIcon = icon;
                iconOffsetX = e.clientX - icon.offsetLeft;
                iconOffsetY = e.clientY - icon.offsetTop;
                // Запоминаем текущую позицию перед началом движения
                iconInitialX = icon.style.left;
                iconInitialY = icon.style.top;
                
                iconStartX = e.clientX;
                iconStartY = e.clientY;
                hasMovedIcon = false;

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
                if (!hasMovedIcon && (Math.abs(e.clientX - iconStartX) > 3 || Math.abs(e.clientY - iconStartY) > 3)) {
                    hasMovedIcon = true;
                }
                if (hasMovedIcon) {
                    let newX = e.clientX - iconOffsetX;
                    let newY = e.clientY - iconOffsetY;
                    const maxX = window.innerWidth - draggedIcon.offsetWidth;
                    const maxY = window.innerHeight - 28 - draggedIcon.offsetHeight;
                    newX = Math.max(0, Math.min(newX, maxX));
                    newY = Math.max(0, Math.min(newY, maxY));
                    draggedIcon.style.left = newX + 'px';
                    draggedIcon.style.top = newY + 'px';
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (draggedIcon && hasMovedIcon) {
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
            
            const monsterWords = translations[currentLang].monsterWords;
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

        let scavengerTimer = null;
        let collectedCount = 0;
        let scavengerTimeLeft = 40.0;

        function startPlayerTurn666() {
            const inputField = document.getElementById('logo-answer-666');
            const btn = document.getElementById('btn-666');
            
            inputField.readOnly = !isRegistryDecrypted;
            inputField.value = '';
            
            let findText = translations[currentLang].findLettersPrompt;
            if (currentLang === 'en') findText = "FIND LETTERS ON SCREEN...";
            
            if (isRegistryDecrypted) {
                inputField.placeholder = currentLang === 'ru' 
                    ? "Введите код обхода защиты..." 
                    : (currentLang === 'ua' ? "Введіть код обходу захисту..." : "Enter override passcode...");
                if (btn) {
                    btn.disabled = false;
                    btn.style.cursor = 'pointer';
                    btn.style.opacity = '1';
                    btn.style.background = 'red';
                    btn.style.color = 'black';
                    btn.style.boxShadow = '0 0 15px red';
                }
            } else {
                inputField.placeholder = findText;
            }
            
            collectedCount = 0;
            scavengerTimeLeft = 40.0;
            
            const counterEl = document.getElementById('counter-666');
            if (counterEl) {
                counterEl.style.background = '#800000';
                counterEl.style.animation = 'shake 0.1s infinite';
            }

            // Spawn Scavenger Letters
            spawnScavengerLetters();

            // Death Timer Countdown
            if (scavengerTimer) clearInterval(scavengerTimer);
            scavengerTimer = setInterval(() => {
                if (!is666Mode) { clearInterval(scavengerTimer); return; }
                scavengerTimeLeft -= 0.1;
                if (scavengerTimeLeft <= 0) {
                    scavengerTimeLeft = 0;
                    clearInterval(scavengerTimer);
                    // Clear all remaining letters
                    document.querySelectorAll('.scavenger-letter').forEach(e => e.remove());
                    // Trigger death screamer / crash immediately
                    triggerScreamerAndDeath();
                } else if (counterEl) {
                    let label = translations[currentLang].systemDeletionPrefix;
                    counterEl.innerText = `${label}${scavengerTimeLeft.toFixed(1)}c`;
                }
            }, 100);
        }

        function triggerScreamerAndDeath() {
            is666Mode = false;
            // Clear countdown styling
            const counterEl = document.getElementById('counter-666');
            if (counterEl) {
                counterEl.style.animation = '';
            }
            
            // Screamer
            const screamer = document.createElement('div');
            screamer.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:3000000;background:black;display:flex;align-items:center;justify-content:center;';
            const screamerImg = document.createElement('img');
            const screamSrcs = ['scary_eye.png', 'creepy_face.png', 'distorted_skull.png'];
            screamerImg.src = screamSrcs[Math.floor(Math.random() * screamSrcs.length)];
            screamerImg.style.cssText = 'width:100%;height:100%;object-fit:cover;filter:saturate(3) contrast(2) brightness(1.5);animation:shake 0.05s infinite;';
            screamer.appendChild(screamerImg);
            document.body.appendChild(screamer);
            audioEngine.playError(1.0);
            audioEngine.playGlitchSound();
            
            setTimeout(() => {
                screamer.remove();
                audioEngine.stopGlitchSound();
                closeAllDesktopWindows();
                showGameOver('final', () => {
                    startGame();
                });
            }, 1500);
        }

        function spawnScavengerLetters() {
            // Remove any leftover letters first
            document.querySelectorAll('.scavenger-letter').forEach(e => e.remove());
            
            const chars = translations[currentLang].phraseCharacters;
            const fullPhrase = translations[currentLang].assembledPhraseCheck;
            
            chars.forEach((char) => {
                const el = document.createElement('div');
                el.className = 'scavenger-letter';
                el.innerText = char;
                // Scatter in bounds to prevent clicking issues or spawning outside
                el.style.left = (10 + Math.random() * 80) + 'vw';
                el.style.top = (10 + Math.random() * 70) + 'vh';
                
                el.onclick = () => {
                    audioEngine.playTone('sawtooth', 120 + (collectedCount * 30), 80, 0.15, 0.4);
                    el.remove();
                    collectedCount++;
                    
                    // Reveal phrase progressively
                    const inputField = document.getElementById('logo-answer-666');
                    if (inputField) {
                        let revealed = "";
                        let nonSpaceAdded = 0;
                        for (let c of fullPhrase) {
                            if (c === ' ') {
                                revealed += ' ';
                            } else {
                                if (nonSpaceAdded < collectedCount) {
                                    revealed += c;
                                    nonSpaceAdded++;
                                } else {
                                    revealed += '_';
                                }
                            }
                        }
                        inputField.value = revealed.toUpperCase();
                    }
                    
                    if (collectedCount === chars.length) {
                        // Gathered everything!
                        if (scavengerTimer) {
                            clearInterval(scavengerTimer);
                            scavengerTimer = null;
                        }
                        const btn = document.getElementById('btn-666');
                        if (btn) {
                            btn.disabled = false;
                            btn.style.cursor = 'pointer';
                            btn.style.opacity = '1';
                            btn.style.background = 'red';
                            btn.style.color = 'black';
                            btn.style.boxShadow = '0 0 15px red';
                        }
                        const counterEl = document.getElementById('counter-666');
                        if (counterEl) {
                            counterEl.innerText = translations[currentLang].phraseAssembled;
                            counterEl.style.background = '#006600';
                            counterEl.style.animation = '';
                        }
                    }
                };
                
                document.body.appendChild(el);
            });
        }

        function checkAnswer666() {
            const inputField = document.getElementById('logo-answer-666');
            if (inputField && inputField.readOnly && !is666Mode) return; // Prevent double trigger
            if (inputField) inputField.readOnly = true;

            is666Mode = false;
            
            // Silence after 666 question
            audioEngine.stopDrone();
            audioEngine.stopGlitchSound();
            
            const btn = document.getElementById('btn-666');
            if (btn) btn.disabled = true;

            const input = inputField ? inputField.value.trim().toLowerCase() : '';
            if (input === translations[currentLang].assembledPhraseCheck || input === "я тебя не боюсь" || input === "ты не напугаешь меня" || input === "i'm not afraid of you" || input === "you don't scare me" || input === "я тебе не боюсь" || input === "i am not afraid") {
                startBossFight();
                return;
            }

            if (isZettaInstalled && !isZettaCorrupted) {
                triggerSacrificeEnding();
                return;
            }

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

            // Через 5 секунд глитча сразу Game Over
            setTimeout(() => {
                clearInterval(creepyFacesInterval);
                document.querySelectorAll('.creepy-face, div[style*="👁️"], div[style*="☻"]').forEach(e => e.remove());
                closeAllDesktopWindows();
                showGameOver('final', () => {
                    startGame();
                });
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
            crackOverlay.style.zIndex = '2000000';
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
                
                // Убираем оверлеи и скрываем BSOD вместо перезагрузки страницы
                const crackOverlay = document.getElementById('crack-overlay');
                if (crackOverlay) crackOverlay.remove();
                document.getElementById('bsod-screen').style.display = 'none';
                
                showGameOver('final', () => {
                    // Возвращаемся на 1 вопрос после 1 BSODа
                    startGame();
                });
            }, 3000);
        }

        function triggerSacrificeEnding() {
            zettaSpeak(translations[currentLang].zettaSacrifice1);
            
            setTimeout(() => {
                zettaSpeak(translations[currentLang].zettaSacrifice2);
                
                const assistant = document.getElementById('zetta-assistant');
                if (assistant) {
                    assistant.style.transition = 'all 0.1s';
                    const shakeInterval = setInterval(() => {
                        assistant.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
                        assistant.style.filter = `hue-rotate(${Math.random()*360}deg) brightness(${1 + Math.random()})`;
                    }, 50);

                    setTimeout(() => {
                        zettaSpeak(translations[currentLang].zettaSacrifice3);
                        audioEngine.playGlitchSound();
                        
                        setTimeout(() => {
                            clearInterval(shakeInterval);
                            assistant.style.transform = 'scale(8)';
                            assistant.style.opacity = '0';
                            assistant.style.transition = 'all 1.5s';
                            
                            setTimeout(() => {
                                assistant.remove();
                                document.getElementById('zetta-speech').remove();
                                isZettaInstalled = false;
                                audioEngine.stopGlitchSound();
                                
                                browserContent.innerHTML = `
                                    <div style="background: white; color: #000080; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; text-align: center; padding: 20px;">
                                        <h1 style="color: #4b0082; font-family: 'MS Sans Serif', Tahoma, sans-serif;">SACRIFICE ENDING</h1>
                                        <p style="font-size: 18px;">${translations[currentLang].endingSacrifice1}</p>
                                        <p style="font-size: 18px;">${translations[currentLang].endingSacrifice2}</p>
                                        <div style="margin-top: 20px; font-style: italic; color: #666;">"${translations[currentLang].endingSacrifice3}"</div>
                                        <button onclick="location.reload()" style="margin-top: 30px; padding: 10px 20px; cursor: pointer;">${translations[currentLang].endingToMenu}</button>
                                    </div>
                                `;
                            }, 1500);
                        }, 2000);
                    }, 3000);
                }
            }, 3000);
        }

        let bossHP = 800;
        let isBossFightActive = false;
        let _isLosingBossFight = false; // Гварда для исключения многократного вызова loseBossFight
        let bossShieldInterval = null;  // Интервал для щитов
        let tentacleFrameId = null;     // ID кадра для анимации щупалец
        let bossProjectiles = [];
        let playerShields = [];
        let bossLaserActive = false;
        let laserAngle = 0;          // текущий угол луча (радианы)
        let laserAngleDir = 1;       // направление вращения
        let laserRotSpeed = 0.012;   // скорость вращения (уклонение возможно)
        let laserCharging = false;   // фаза зарядки
        let attackCounter = 0;
        let bossFrame;
        let mouseX = 0, mouseY = 0;
        let eyeRedLevel = 0;         // 0=норма, 1=максимально красный

        // ── PHASE SYSTEM ──
        let bossPhase = 1;            // 1 | 2 | 3
        let phaseTransitioning = false;
        let phase1DialogueIdx = 0;
        let laser2Active = false;     // второй лазер (фаза 2+)
        let laserAngle2 = Math.PI;    // второй луч — противоположный
        let laserAngle2Dir = -1;      // вращается в обратном направлении
        let specialLaserType = null;  // 'blue' | 'orange' | null  (фаза 3)
        let playerStopped = false;    // игрок не двигает мышь (фаза 3)
        let lastMouseX = 0, lastMouseY = 0;
        let mouseStopFrames = 0;

        const PHASE1_DIALOGUES = translations[currentLang].bossTaunts;

        function applyBossDesktopTheme() {
            // Красим все иконки, текст рабочего стола и элементы интерфейса в чёрно-красный
            document.querySelectorAll('.icon-img, .icon-container img, .icon-container svg').forEach(el => {
                el.style.filter = 'grayscale(1) sepia(1) hue-rotate(330deg) saturate(4) brightness(0.5)';
            });
            document.querySelectorAll('.icon-label, .icon-container span').forEach(el => {
                el.style.color = '#cc0000';
                el.style.textShadow = '0 0 6px #ff0000';
            });
            document.querySelectorAll('.taskbar, #taskbar').forEach(el => {
                el.style.background = '#1a0000';
                el.style.borderTop = '1px solid #660000';
            });
            document.querySelectorAll('.start-btn').forEach(el => {
                el.style.background = '#1a0000';
                el.style.color = '#cc0000';
                el.style.border = '1px solid #660000';
            });
            document.querySelectorAll('#clock').forEach(el => {
                el.style.color = '#cc0000';
            });
            document.body.style.transition = 'background-color 2s ease';
            document.body.style.background = '';
            document.body.style.backgroundColor = '#0a0000';
        }

        function startBossFight() {
            if (window._bossFightInitiated) return;
            window._bossFightInitiated = true;
            
            isBossFightActive = true;
            bossPhase = 1;
            phaseTransitioning = false;
            phase1DialogueIdx = 0;
            laser2Active = false;
            specialLaserType = null;
            playerStopped = false;
            mouseStopFrames = 0;
            lastMouseX = 0; lastMouseY = 0;
            laserRotSpeed = 0.012;
            _isLosingBossFight = false;
            
            // Скрываем обычного ассистента Зетты на время боя с боссом
            const assistant = document.getElementById('zetta-assistant');
            if (assistant) assistant.style.display = 'none';
            const speech = document.getElementById('zetta-speech');
            if (speech) speech.style.display = 'none';

            // Закрываем браузер принудительно
            browserState.isOpen = false;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.style.display = 'none';
            clearTimeout(adTimeout);
            adPopup.style.display = 'none';

            // Применяем чёрно-красную тему рабочего стола
            applyBossDesktopTheme();
            
            const overlay = document.getElementById('boss-fight-overlay');
            overlay.style.display = 'block';
            
            window._bossHoleTimeout = setTimeout(() => {
                const hole = document.getElementById('boss-hole');
                if (hole) hole.style.transform = 'translate(-50%, -50%) scale(1.5)';
                
                window._bossEyeTimeout = setTimeout(() => {
                    const eye = document.getElementById('boss-eye-container');
                    if (eye) eye.style.transform = 'translate(-50%, -50%) scale(1)';
                    createTentacles();
                    
                    window._bossIntroDialogueTimeout = setTimeout(() => {
                        bossIntroDialogue();
                    }, 2000);
                }, 3000);
            }, 1000);
        }

        function createTentacles() {
            const overlay = document.getElementById('boss-fight-overlay');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'tentacle-svg');
            svg.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:50001; pointer-events:none; overflow:visible;';

            // Определяем маркер-остриё для кончиков щупалец
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'tentacle-tip');
            marker.setAttribute('markerWidth', '6');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('refX', '6');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            const tipPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            tipPath.setAttribute('points', '0 0, 6 3, 0 6');
            tipPath.setAttribute('fill', '#6b0000');
            marker.appendChild(tipPath);
            defs.appendChild(marker);
            svg.appendChild(defs);
            overlay.appendChild(svg);

            const numTentacles = 18;
            window._tentacleData = [];

            for (let i = 0; i < numTentacles; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const dark = Math.random() > 0.5;
                const strokeColor = dark ? '#5a0000' : '#3d0000';
                const w = 3 + Math.random() * 7;
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', strokeColor);
                path.setAttribute('stroke-width', String(w));
                path.setAttribute('stroke-linecap', 'butt');
                path.setAttribute('marker-end', 'url(#tentacle-tip)');
                path.style.filter = 'drop-shadow(0 0 5px #700)';
                svg.appendChild(path);

                const baseAngle = (i / numTentacles) * Math.PI * 2;
                const length = 200 + Math.random() * 160;
                const phaseOffset = Math.random() * Math.PI * 2;
                const waveFreq = 0.6 + Math.random() * 0.8;
                const waveAmp = 18 + Math.random() * 35;
                window._tentacleData.push({ path, baseAngle, length, phaseOffset, waveFreq, waveAmp });
            }

            if (tentacleFrameId) {
                cancelAnimationFrame(tentacleFrameId);
            }
            animateTentacles();
        }

        function animateTentacles() {
            if (!isBossFightActive) return;
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const t = Date.now() * 0.001;

            for (const td of window._tentacleData) {
                const segments = 14;
                let d = `M ${cx} ${cy}`;
                for (let s = 1; s <= segments; s++) {
                    const frac = s / segments;
                    const wave = Math.sin(t * td.waveFreq * 2 + frac * 3 + td.phaseOffset) * td.waveAmp * frac;
                    const perpAngle = td.baseAngle + Math.PI / 2;
                    const px = cx + Math.cos(td.baseAngle) * td.length * frac + Math.cos(perpAngle) * wave;
                    const py = cy + Math.sin(td.baseAngle) * td.length * frac + Math.sin(perpAngle) * wave;
                    d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
                }
                td.path.setAttribute('d', d);
            }

            tentacleFrameId = requestAnimationFrame(animateTentacles);
        }

        async function bossIntroDialogue() {
            const lines = [
                translations[currentLang].bossIntro1,
                translations[currentLang].bossIntro2,
                translations[currentLang].bossIntro3
            ];
            const bossText = document.getElementById('boss-text');
            
            for (let line of lines) {
                bossText.innerHTML = "";
                await typeBossText(line, true);
                await new Promise(r => setTimeout(r, 1500));
            }
            
            bossText.innerHTML = `<span class="god-of-sites">${translations[currentLang].godOfSites}</span>`;
            audioEngine.playGlitchSound();
            setTimeout(() => {
                audioEngine.stopGlitchSound();
                startCombat();
            }, 3000);
        }

        function typeBossText(text, shake, ignoreActiveCheck = false) {
            return new Promise(resolve => {
                let idx = 0;
                const el = document.getElementById('boss-text');
                function nextChar() {
                    if (!isBossFightActive && !ignoreActiveCheck) {
                        resolve();
                        return;
                    }
                    if (idx < text.length) {
                        const span = document.createElement('span');
                        span.style.whiteSpace = 'pre';
                        span.textContent = text[idx];
                        if (shake) span.style.display = "inline-block";
                        if (shake) animateShake(span);
                        if (el) el.appendChild(span);
                        idx++;
                        setTimeout(nextChar, 100);
                    } else {
                        resolve();
                    }
                }
                nextChar();
            });
        }

        function animateShake(el) {
            function step() {
                if (!isBossFightActive) return;
                el.style.transform = `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)`;
                setTimeout(step, 50);
            }
            step();
        }

        function startShieldSpawning() {
            if (bossShieldInterval) {
                clearInterval(bossShieldInterval);
            }
            bossShieldInterval = setInterval(spawnShield, 4000);
        }

        function startCombat() {
            document.getElementById('boss-text').innerHTML = "";
            document.querySelector('.boss-hp-bar').style.display = 'block';
            document.getElementById('boss-fight-overlay').style.pointerEvents = 'auto';
            
            if (typeof audioEngine !== 'undefined') {
                audioEngine.playBossMusic();
            }
            
            if (!window._bossMouseListenerAdded) {
                window._bossMouseListenerAdded = true;
                document.addEventListener('mousemove', (e) => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    trackEyeToMouse(e.clientX, e.clientY);
                });
            }
            
            combatLoop();
            startShieldSpawning();
            // Zetta boss fight assistance
            if (isZettaInstalled) startZettaBossHelp();
        }

        let _zettaBossInterval = null;
        function startZettaBossHelp() {
            // Show Zetta in boss overlay
            const overlay = document.getElementById('boss-fight-overlay');
            const zIcon = document.createElement('div');
            zIcon.id = 'boss-zetta-icon';
            zIcon.style.cssText = 'position:fixed;bottom:50px;right:20px;width:65px;height:65px;z-index:50010;filter:drop-shadow(0 0 12px #a020f0);cursor:default;';
            zIcon.innerHTML = zettaSvgEmotion(isZettaCorrupted ? 'corrupted' : 'normal');
            overlay.appendChild(zIcon);
            // Boss speech bubble for Zetta
            const zSpeech = document.createElement('div');
            zSpeech.id = 'boss-zetta-speech';
            zSpeech.style.cssText = 'position:fixed;bottom:125px;right:20px;background:#1a0030;border:2px solid #a020f0;padding:8px 12px;border-radius:8px;max-width:190px;font-size:12px;display:none;z-index:50011;font-family:"MS Sans Serif",Tahoma,sans-serif;color:#e0aaff;box-shadow:0 0 10px #a020f0;';
            overlay.appendChild(zSpeech);
            // Opening line
            if (isZettaCorrupted) {
                setTimeout(() => zettaSpeak(translations[currentLang].zettaCorruptedIntro, 'corrupted'), 1200);
            } else {
                setTimeout(() => zettaSpeak(translations[currentLang].zettaSupportIntro, 'normal'), 1200);
            }
            // Auto-attack: every 8 s Zetta deals 30 damage OR shoots player
            _zettaBossInterval = setInterval(() => {
                if (!isBossFightActive) { clearInterval(_zettaBossInterval); return; }
                if (phaseTransitioning) return;
                
                // Animate a purple bolt from Zetta icon to boss eye OR to player cursor
                const bolt = document.createElement('div');
                bolt.style.cssText = 'position:fixed;width:10px;height:10px;border-radius:50%;background:#cc44ff;box-shadow:0 0 10px #a020f0;z-index:50012;pointer-events:none;transition:all 0.4s ease;';
                bolt.style.right = '42px'; bolt.style.bottom = '75px';
                document.body.appendChild(bolt);

                if (isZettaCorrupted) {
                    const targetX = mouseX;
                    const targetY = mouseY;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            bolt.style.right = (window.innerWidth - targetX) + 'px';
                            bolt.style.bottom = (window.innerHeight - targetY) + 'px';
                        });
                    });
                    setTimeout(() => {
                        bolt.remove();
                        // Check if cursor is near the landing position of the bolt when it landed
                        const dx = mouseX - targetX;
                        const dy = mouseY - targetY;
                        if (Math.sqrt(dx * dx + dy * dy) < 30 && isBossFightActive) {
                            loseBossFight();
                        }
                    }, 400);
                    const phrases = translations[currentLang].zettaCorruptedAttack;
                    zettaSpeak(phrases[Math.floor(Math.random() * phrases.length)], 'corrupted');
                } else {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            bolt.style.right = (window.innerWidth - window.innerWidth/2) + 'px';
                            bolt.style.bottom = (window.innerHeight - window.innerHeight/2) + 'px';
                            bolt.style.opacity = '0';
                        });
                    });
                    setTimeout(() => bolt.remove(), 500);
                    zettaSpeak(translations[currentLang].zettaSupportAttack, 'angry');
                    damageBoss(30);
                }
            }, 8000);
        }

        // Глаз следит за курсором
        function trackEyeToMouse(mx, my) {
            const container = document.getElementById('boss-eye-container');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const eyeCx = rect.left + rect.width / 2;
            const eyeCy = rect.top + rect.height / 2;
            const dx = mx - eyeCx;
            const dy = my - eyeCy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Максимальное смещение зрачка от центра глаза в пикселях SVG (viewBox 0-100)
            const maxOffsetPx = 8; // в единицах viewBox
            const norm = dist > 0 ? Math.min(1, dist / 300) : 0;
            const offsetX = (dx / (dist || 1)) * maxOffsetPx * norm;
            const offsetY = (dy / (dist || 1)) * maxOffsetPx * norm;
            const iris = document.getElementById('boss-iris');
            const pupil = document.getElementById('boss-pupil');
            const glint = document.getElementById('boss-glint');
            if (iris) {
                iris.setAttribute('cx', String(50 + offsetX));
                iris.setAttribute('cy', String(50 + offsetY));
            }
            if (pupil) {
                // кошачий зрачок — эллипс, обновляем cx/cy
                pupil.setAttribute('cx', String(50 + offsetX));
                pupil.setAttribute('cy', String(50 + offsetY));
                // поворачиваем зрачок слегка в сторону взгляда
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                pupil.setAttribute('transform', `rotate(${angle * 0.15}, ${50 + offsetX}, ${50 + offsetY})`);
            }
            if (glint) {
                glint.setAttribute('cx', String(54 + offsetX));
                glint.setAttribute('cy', String(43 + offsetY));
            }
        }

        function combatLoop() {
            if (!isBossFightActive) return;
            if (typeof _isLosingBossFight !== 'undefined' && _isLosingBossFight) return;
            
            // Spawn projectiles (не во время лазерной атаки или зарядки)
            if (attackCounter % 30 === 0 && !bossLaserActive && !laserCharging) {
                spawnProjectile();
            }
            
            // Лазерная атака каждые ~1200 кадров
            if (attackCounter % 1200 === 0 && attackCounter > 0) {
                triggerLaser();
            }
            
            updateProjectiles();
            updateLaser();
            checkCollisions();
            
            if (!isBossFightActive || (typeof _isLosingBossFight !== 'undefined' && _isLosingBossFight)) return;
            
            attackCounter++;
            bossFrame = requestAnimationFrame(combatLoop);
        }


        function spawnProjectile() {
            const p = document.createElement('div');
            p.className = 'boss-projectile';
            p.style.left = '50%';
            p.style.top = '50%';
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 3;
            
            bossProjectiles.push({
                el: p,
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
            
            document.getElementById('boss-fight-overlay').appendChild(p);
        }

        function updateProjectiles() {
            for (let i = bossProjectiles.length - 1; i >= 0; i--) {
                const p = bossProjectiles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.el.style.left = p.x + 'px';
                p.el.style.top = p.y + 'px';
                
                if (p.x < -50 || p.x > window.innerWidth + 50 || p.y < -50 || p.y > window.innerHeight + 50) {
                    p.el.remove();
                    bossProjectiles.splice(i, 1);
                }
            }
        }

        // ───────────────────────────────────────────────
        //  ЛАЗЕР: ЗАРЯДКА + АТАКА + ЗАТУХАНИЕ
        // ───────────────────────────────────────────────

        function triggerLaser() {
            if (laserCharging || bossLaserActive) return;
            laserCharging = true;
            // Zetta warns player
            if (isZettaInstalled) zettaSpeak(translations[currentLang].zettaLaserWarning, 'angry');

            // Убираем снаряды чтобы не мешались во время зарядки
            bossProjectiles.forEach(p => p.el.remove());
            bossProjectiles = [];

            const eyeContainer = document.getElementById('boss-eye-container');
            const rect = eyeContainer.getBoundingClientRect();
            const eyeCx = rect.left + rect.width / 2;
            const eyeCy = rect.top  + rect.height / 2;

            const ORB_COUNT = 5;
            let absorbed = 0;

            for (let i = 0; i < ORB_COUNT; i++) {
                setTimeout(() => {
                    if (!isBossFightActive) return;
                    spawnChargeOrb(eyeCx, eyeCy, () => {
                        absorbed++;
                        // Краснеем с каждым шариком
                        eyeRedLevel = absorbed / ORB_COUNT;
                        tintEye(eyeRedLevel);

                        if (absorbed === ORB_COUNT) {
                            // Все шарики поглощены — стреляем
                            setTimeout(() => fireLaser(eyeCx, eyeCy), 400);
                        }
                    });
                }, i * 600);
            }
        }

        // Создаёт шарик в случайной точке, летит к центру глаза
        function spawnChargeOrb(eyeCx, eyeCy, onAbsorb) {
            const orb = document.createElement('div');
            orb.className = 'charge-orb';

            // Случайная позиция по краям экрана
            const edge = Math.floor(Math.random() * 4);
            let startX, startY;
            if (edge === 0) { startX = Math.random() * window.innerWidth;  startY = -20; }
            else if (edge === 1) { startX = window.innerWidth + 20;  startY = Math.random() * window.innerHeight; }
            else if (edge === 2) { startX = Math.random() * window.innerWidth;  startY = window.innerHeight + 20; }
            else { startX = -20; startY = Math.random() * window.innerHeight; }

            orb.style.left = startX + 'px';
            orb.style.top  = startY + 'px';
            document.body.appendChild(orb);

            const duration = 900; // мс полёта
            const start = performance.now();

            function fly(now) {
                const t = Math.min(1, (now - start) / duration);
                // easeInQuad — ускоряется к глазу
                const ease = t * t;
                const x = startX + (eyeCx - 9 - startX) * ease;
                const y = startY + (eyeCy - 9 - startY) * ease;
                orb.style.left = x + 'px';
                orb.style.top  = y + 'px';
                orb.style.transform = `scale(${1 - t * 0.7})`;
                if (t < 1) {
                    requestAnimationFrame(fly);
                } else {
                    orb.remove();
                    onAbsorb();
                }
            }
            requestAnimationFrame(fly);
        }

        // Плавно окрашивает ирис, зрачок и склеру в зависимости от уровня (0–1)
        // Исходные цвета: склера=белая, ирис=красный (r=22), зрачок=чёрный
        // При level=1: склера=тёмно-красная, ирис=ярко-красный расширенный, зрачок=красный
        function tintEye(level) {
            const l = Math.max(0, Math.min(1, level));

            // Ирис — расширяется, усиливается свечение
            const iris = document.getElementById('boss-iris');
            if (iris && bossPhase === 1) {
                const r = Math.round(200 + l * 55);
                iris.setAttribute('fill', `rgb(${r},0,0)`);
                iris.setAttribute('r', String(22 + l * 8));
                iris.style.filter = l > 0 ? `drop-shadow(0 0 ${l * 20}px #ff0000)` : '';
            }

            // Зрачок-эллипс — остаётся чёрным
            const pupil = document.getElementById('boss-pupil');
            if (pupil && bossPhase === 1) {
                const r = Math.round(l * 100);
                pupil.setAttribute('fill', `rgb(${r},0,0)`);
                pupil.style.filter = l > 0.5 ? `drop-shadow(0 0 ${l * 10}px #cc0000)` : '';
            }

            // Склера — из белой до розовато-красной
            const sclera = document.getElementById('boss-sclera');
            if (sclera && bossPhase === 1) {
                const gb = Math.round(255 * (1 - l * 0.5));
                sclera.setAttribute('fill', `rgb(255,${gb},${gb})`);
            }
        }

        // Сбрасывает цвет глаза к нормальному (мгновенно)
        function resetEye() {
            // Сбрасываем цвет только в первой фазе
            if (bossPhase > 1) { eyeRedLevel = 0; return; }
            const iris = document.getElementById('boss-iris');
            if (iris) {
                iris.setAttribute('fill', 'url(#bossIrisGrad)');
                iris.setAttribute('r', '22');
                iris.style.filter = '';
            }
            const pupil = document.getElementById('boss-pupil');
            if (pupil) {
                pupil.setAttribute('fill', 'black');
                pupil.style.filter = '';
            }
            const sclera = document.getElementById('boss-sclera');
            if (sclera) sclera.setAttribute('fill', 'white');
            eyeRedLevel = 0;
        }

        // Запускает вращающийся луч из глаза — 360° (туда и обратно)
        function fireLaser(eyeCx, eyeCy) {
            if (!isBossFightActive) return;
            laserCharging = false;
            bossLaserActive = true;
            window._laserFrameCount = 0;

            const laserSvg = document.getElementById('boss-laser-svg');
            laserSvg.style.display = 'block';

            laserAngle = 0;
            laserAngleDir = 1;
            window._laserStartAngle = 0;
            window._laserFullCircleDone = false;
            window._laserOriginX = eyeCx;
            window._laserOriginY = eyeCy;

            // Phase 2+: activate second laser
            if (bossPhase >= 2) {
                laser2Active = true;
                laserAngle2 = Math.PI; // opposite side
                laserAngle2Dir = -1;   // rotates counter-clockwise
                // Pick special laser type for phase 3
                if (bossPhase >= 3) {
                    const types = ['blue', 'orange'];
                    specialLaserType = types[Math.floor(Math.random() * 2)];
                    showSpecialLaserHint(specialLaserType);
                } else {
                    specialLaserType = null;
                }
            }
        }

        function showSpecialLaserHint(type) {
            const bossText = document.getElementById('boss-text');
            if (!bossText) return;
            if (type === 'blue') {
                bossText.innerHTML = '<span style="color:#00ccff;text-shadow:0 0 15px #00ccff;">' + translations[currentLang].laserBlue + '</span>';
            } else {
                bossText.innerHTML = '<span style="color:#ff8800;text-shadow:0 0 15px #ff8800;">' + translations[currentLang].laserOrange + '</span>';
            }
            setTimeout(() => { if (bossText) bossText.innerHTML = ''; }, 1800);
        }

        function updateLaser() {
            if (!bossLaserActive) return;

            const ox = window._laserOriginX || window.innerWidth / 2;
            const oy = window._laserOriginY || window.innerHeight / 2;

            laserAngle += laserAngleDir * laserRotSpeed;

            const TWO_PI = Math.PI * 2;
            const startAngle = window._laserStartAngle || 0;

            if (!window._laserFullCircleDone) {
                if (laserAngle >= startAngle + TWO_PI) {
                    laserAngle = startAngle + TWO_PI;
                    laserAngleDir = -1;
                    window._laserFullCircleDone = true;
                }
            } else {
                if (laserAngle <= startAngle) {
                    laserAngle = startAngle;
                    endLaserAttack();
                    return;
                }
            }

            const maxLen = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
            const ex = ox + Math.cos(laserAngle) * maxLen;
            const ey = oy + Math.sin(laserAngle) * maxLen;

            function setLine(id, x1, y1, x2, y2) {
                const el = document.getElementById(id);
                if (!el) return;
                el.setAttribute('x1', x1); el.setAttribute('y1', y1);
                el.setAttribute('x2', x2); el.setAttribute('y2', y2);
            }

            let swapGreen = false;
            if (bossPhase >= 2) {
                // Swap every 90 degrees
                swapGreen = Math.floor(Math.abs(laserAngle - (window._laserStartAngle || 0)) / (Math.PI / 2)) % 2 !== 0;
            }

            let dangerousType = 'red';
            if (bossPhase >= 3 && specialLaserType) {
                dangerousType = specialLaserType;
            }

            window._laser1Type = swapGreen ? 'green' : dangerousType;
            window._laser2Type = swapGreen ? dangerousType : 'green';
            
            if (bossPhase === 1) {
                window._laser1Type = 'red';
            }

            function getLaserColors(type) {
                if (type === 'green') return { core: '#00ff44', glow: '#00cc33' };
                if (type === 'blue') return { core: '#00ccff', glow: '#0088ff' };
                if (type === 'orange') return { core: '#ff8800', glow: '#ffaa44' };
                return { core: '#ff0000', glow: '#ff4444' }; // red
            }

            const c1 = getLaserColors(window._laser1Type);
            const laserCore = document.getElementById('laser-core');
            if (laserCore) laserCore.setAttribute('stroke', c1.core);
            const laserGlow1 = document.getElementById('laser-glow1');
            if (laserGlow1) laserGlow1.setAttribute('stroke', c1.glow);
            const laserGlow2 = document.getElementById('laser-glow2');
            if (laserGlow2) laserGlow2.setAttribute('stroke', c1.glow);

            setLine('laser-core',  ox, oy, ex, ey);
            setLine('laser-glow1', ox, oy, ex, ey);
            setLine('laser-glow2', ox, oy, ex, ey);

            // ── Second laser (phase 2+) ──
            if (laser2Active) {
                laserAngle2 += laserAngle2Dir * laserRotSpeed;

                const ex2 = ox + Math.cos(laserAngle2) * maxLen;
                const ey2 = oy + Math.sin(laserAngle2) * maxLen;

                const c2 = getLaserColors(window._laser2Type);

                // Reuse / create second laser lines dynamically
                let svg = document.getElementById('boss-laser-svg');
                let core2 = document.getElementById('laser-core-2');
                let glow2a = document.getElementById('laser-glow2a');
                let glow2b = document.getElementById('laser-glow2b');
                if (!core2 && svg) {
                    const ns = 'http://www.w3.org/2000/svg';
                    glow2b = document.createElementNS(ns,'line'); glow2b.id='laser-glow2b'; glow2b.setAttribute('stroke-width','18'); glow2b.setAttribute('stroke-opacity','0.15'); glow2b.setAttribute('stroke-linecap','round'); svg.appendChild(glow2b);
                    glow2a = document.createElementNS(ns,'line'); glow2a.id='laser-glow2a'; glow2a.setAttribute('stroke-width','10'); glow2a.setAttribute('stroke-opacity','0.3'); glow2a.setAttribute('stroke-linecap','round'); svg.appendChild(glow2a);
                    core2 = document.createElementNS(ns,'line'); core2.id='laser-core-2'; core2.setAttribute('stroke-width','3'); core2.setAttribute('stroke-linecap','round'); svg.appendChild(core2);
                }
                if (core2) {
                    core2.setAttribute('stroke', c2.core);
                    glow2a.setAttribute('stroke', c2.glow);
                    glow2b.setAttribute('stroke', c2.glow);
                    function setLine2(el, x1,y1,x2,y2){ el.setAttribute('x1',x1);el.setAttribute('y1',y1);el.setAttribute('x2',x2);el.setAttribute('y2',y2); }
                    setLine2(core2, ox, oy, ex2, ey2);
                    setLine2(glow2a, ox, oy, ex2, ey2);
                    setLine2(glow2b, ox, oy, ex2, ey2);
                }
            }

            // ── Track mouse stop for phase 3 ──
            if (bossPhase >= 3) {
                const moved = Math.abs(mouseX - lastMouseX) + Math.abs(mouseY - lastMouseY);
                lastMouseX = mouseX; lastMouseY = mouseY;
                if (moved < 2) { mouseStopFrames++; } else { mouseStopFrames = 0; }
                playerStopped = mouseStopFrames > 10; // ~10 frames = ~167ms
            }
        }


        function endLaserAttack() {
            bossLaserActive = false;
            laser2Active = false;
            specialLaserType = null;
            playerStopped = false;
            mouseStopFrames = 0;
            // Remove dynamic second-laser elements
            ['laser-core-2','laser-glow2a','laser-glow2b'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            const laserSvg = document.getElementById('boss-laser-svg');
            if (laserSvg) laserSvg.style.display = 'none';

            // Плавно сбрасываем цвет глаза за 1.5 секунды
            const steps = 30;
            let step = 0;
            const interval = setInterval(() => {
                step++;
                const t = 1 - step / steps;
                tintEye(t * eyeRedLevel);
                if (step >= steps) {
                    clearInterval(interval);
                    resetEye();
                }
            }, 50);
        }

        function spawnShield() {
            if (!isBossFightActive) return;
            const s = document.createElement('div');
            s.className = 'player-shield';
            s.innerHTML = '+';
            const x = 100 + Math.random() * (window.innerWidth - 200);
            const y = 100 + Math.random() * (window.innerHeight - 200);
            s.style.left = x + 'px';
            s.style.top = y + 'px';
            
            s.onmouseenter = () => {
                damageBoss(40);
                s.remove();
                playerShields = playerShields.filter(item => item.el !== s);
            };
            
            document.getElementById('boss-fight-overlay').appendChild(s);
            playerShields.push({ el: s, x, y });
            
            setTimeout(() => {
                if (s.parentNode) {
                    s.remove();
                    playerShields = playerShields.filter(item => item.el !== s);
                }
            }, 3000);
        }

        function damageBoss(amount) {
            if (phaseTransitioning) return;
            bossHP -= amount;
            const fill = document.getElementById('boss-hp-fill');
            fill.style.width = Math.max(0, bossHP / 800 * 100) + '%';
            audioEngine.playClick();

            // Phase-1 taunts on every shield hit
            if (bossPhase === 1) {
                const bossText = document.getElementById('boss-text');
                if (bossText) {
                    bossText.innerHTML = PHASE1_DIALOGUES[phase1DialogueIdx % PHASE1_DIALOGUES.length];
                    phase1DialogueIdx++;
                    setTimeout(() => { if (bossText) bossText.innerHTML = ''; }, 2000);
                }
            }

            // Phase transitions
            if (bossPhase === 1 && bossHP <= 500) {
                enterPhase2();
            } else if (bossPhase === 2 && bossHP <= 200) {
                enterPhase3();
            } else if (bossHP <= 0) {
                winBossFight();
            }
        }

        // ── PHASE 2: double laser, green + red swap ──
        function enterPhase2() {
            if (bossPhase >= 2) return;
            bossPhase = 2;
            phaseTransitioning = true;
            laserCharging = false;
            if (bossLaserActive || laser2Active) {
                bossLaserActive = false;
                laser2Active = false;
                specialLaserType = null;
                ['laser-core-2','laser-glow2a','laser-glow2b'].forEach(id => {
                    const el = document.getElementById(id); if (el) el.remove();
                });
                const laserSvg = document.getElementById('boss-laser-svg');
                if (laserSvg) laserSvg.style.display = 'none';
            }

            // Трещины фазы 2 — появляются
            const cracks = document.getElementById('boss-cracks');
            if (cracks) cracks.style.opacity = '1';

            // Капилляры ярче
            const caps = document.getElementById('boss-capillaries');
            if (caps) caps.style.opacity = '0.9';

            // Глаз темнеет — тёмно-красный ирис
            const iris = document.getElementById('boss-iris');
            if (iris) {
                iris.setAttribute('fill', 'url(#bossIrisGrad)');
                iris.style.filter = 'hue-rotate(0deg) brightness(0.7)';
            }
            const sclera = document.getElementById('boss-sclera');
            if (sclera) sclera.setAttribute('fill', '#e8c8c8');

            // Щупальца — делаем темнее
            if (window._tentacleData) {
                window._tentacleData.forEach(td => {
                    td.path.setAttribute('stroke', '#4a0000');
                    td.path.style.filter = 'drop-shadow(0 0 8px #800)';
                });
            }

            const bossText = document.getElementById('boss-text');
            if (bossText) bossText.innerHTML = translations[currentLang].bossPhase2;
            audioEngine.playError(0.5);

            setTimeout(() => {
                if (bossText) bossText.innerHTML = '';
                phaseTransitioning = false;
                laserRotSpeed = 0.018;
            }, 2500);
        }

        // ── PHASE 3: faster lasers + blue/orange special ──
        function enterPhase3() {
            if (bossPhase >= 3) return;
            bossPhase = 3;
            phaseTransitioning = true;
            laserCharging = false;
            if (bossLaserActive || laser2Active) {
                bossLaserActive = false;
                laser2Active = false;
                specialLaserType = null;
                ['laser-core-2','laser-glow2a','laser-glow2b'].forEach(id => {
                    const el = document.getElementById(id); if (el) el.remove();
                });
                const laserSvg = document.getElementById('boss-laser-svg');
                if (laserSvg) laserSvg.style.display = 'none';
            }

            // Трещины фазы 3 — добавляются поверх первых
            const cracks2 = document.getElementById('boss-cracks-2');
            if (cracks2) cracks2.style.opacity = '1';

            // Капилляры максимально яркие
            const caps = document.getElementById('boss-capillaries');
            if (caps) { caps.style.opacity = '1'; caps.style.filter = 'drop-shadow(0 0 3px #cc0000)'; }

            // Глаз — почти чёрно-тёмно-красный
            const iris = document.getElementById('boss-iris');
            if (iris) {
                iris.setAttribute('fill', '#330000');
                iris.style.filter = 'brightness(0.5) drop-shadow(0 0 10px #cc0000)';
            }
            const sclera = document.getElementById('boss-sclera');
            if (sclera) sclera.setAttribute('fill', '#cc8888');
            const pupil = document.getElementById('boss-pupil');
            if (pupil) pupil.setAttribute('fill', '#1a0000');

            // Щупальца — ещё темнее, почти чёрные
            if (window._tentacleData) {
                window._tentacleData.forEach(td => {
                    td.path.setAttribute('stroke', '#2a0000');
                    td.path.style.filter = 'drop-shadow(0 0 12px #990000)';
                });
            }

            const bossText = document.getElementById('boss-text');
            if (bossText) bossText.innerHTML = translations[currentLang].bossPhase3;
            audioEngine.playError(0.7);

            setTimeout(() => {
                if (bossText) bossText.innerHTML = '';
                phaseTransitioning = false;
                laserRotSpeed = 0.028;
            }, 2500);
        }

        function checkCollisions() {
            if (!isBossFightActive) return;

            // Столкновение со снарядами
            for (let p of bossProjectiles) {
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    loseBossFight();
                    return;
                }
            }

            // Столкновение с лазером (дистанция от курсора до луча)
            if (bossLaserActive) {
                const ox = window._laserOriginX || window.innerWidth / 2;
                const oy = window._laserOriginY || window.innerHeight / 2;
                const maxLen = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);

                function distToLaser(angle) {
                    const ex = ox + Math.cos(angle) * maxLen;
                    const ey = oy + Math.sin(angle) * maxLen;
                    const ldx = ex - ox, ldy = ey - oy;
                    const t = Math.max(0, Math.min(1, ((mouseX - ox)*ldx + (mouseY - oy)*ldy) / (ldx*ldx + ldy*ldy)));
                    const cx = ox + t*ldx, cy = oy + t*ldy;
                    return { dist: Math.sqrt((mouseX-cx)**2+(mouseY-cy)**2), t };
                }

                function checkLaserDamage(h, type) {
                    if (h.dist >= 14 || h.t <= 0.05) return false;
                    if (type === 'green') return false; // green is safe
                    if (type === 'blue') return !playerStopped; // blue: safe if stopped
                    if (type === 'orange') return playerStopped; // orange: safe if moving
                    return true; // red: always damages if touched
                }

                const h1 = distToLaser(laserAngle);
                if (checkLaserDamage(h1, window._laser1Type)) {
                    loseBossFight(); return;
                }

                // Second laser (phase 2+)
                if (laser2Active) {
                    const h2 = distToLaser(laserAngle2);
                    if (checkLaserDamage(h2, window._laser2Type)) {
                        loseBossFight(); return;
                    }
                }
            }
        }


        function loseBossFight() {
            if (_isLosingBossFight) return;
            _isLosingBossFight = true;

            // НЕ останавливаем bossFightActive сразу — щупальца продолжают двигаться
            cancelAnimationFrame(bossFrame);
            if (bossFrame) {
                cancelAnimationFrame(bossFrame);
                bossFrame = null;
            }

            // Сбрасываем и очищаем интервал появления щитов
            if (bossShieldInterval) {
                clearInterval(bossShieldInterval);
                bossShieldInterval = null;
            }

            // Немедленно очищаем все снаряды, щиты и лазер
            bossProjectiles.forEach(p => p.el.remove());
            bossProjectiles = [];
            playerShields.forEach(s => s.el.remove());
            playerShields = [];
            bossLaserActive = false;
            laser2Active = false;
            specialLaserType = null;
            laserCharging = false;
            ['laser-core-2','laser-glow2a','laser-glow2b'].forEach(id => {
                const el = document.getElementById(id); if (el) el.remove();
            });
            const laserSvgEl = document.getElementById('boss-laser-svg');
            if (laserSvgEl) laserSvgEl.style.display = 'none';

            // Cursor and side glitch animation (rectangles instead of image)
            const glitchContainer = document.createElement('div');
            glitchContainer.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;pointer-events:none;';
            document.body.appendChild(glitchContainer);
            document.body.style.cursor = 'none';
            
            const bossText = document.getElementById('boss-text');
            bossText.innerHTML = translations[currentLang].bossLoseText;

            let elapsedTime = 0;
            const glitchInterval = setInterval(() => {
                glitchContainer.innerHTML = '';
                elapsedTime += 60;

                // 1. Cursor glitch (rectangles around the mouse)
                const numRects = 5 + Math.floor(Math.random() * 6);
                for (let i = 0; i < numRects; i++) {
                    const rect = document.createElement('div');
                    const width = 10 + Math.floor(Math.random() * 60);
                    const height = 4 + Math.floor(Math.random() * 25);
                    const offsetX = (Math.random() - 0.5) * 80;
                    const offsetY = (Math.random() - 0.5) * 80;
                    
                    const colors = ['#ff0000', '#00ffff', '#00ff00', '#ff00ff', '#ffffff', '#333333'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    rect.style.cssText = `
                        position: absolute;
                        left: ${mouseX + offsetX}px;
                        top: ${mouseY + offsetY}px;
                        width: ${width}px;
                        height: ${height}px;
                        background: ${color};
                        opacity: ${0.4 + Math.random() * 0.6};
                        transform: skewX(${(Math.random() - 0.5) * 40}deg);
                    `;
                    glitchContainer.appendChild(rect);
                }

                // 2. Gradual edge/side glitch (starts after 1.2s and escalates)
                if (elapsedTime > 1200) {
                    const intensity = Math.min((elapsedTime - 1200) / 1800, 1.0);
                    const numEdgeBars = Math.floor(intensity * 15) + 3;
                    for (let i = 0; i < numEdgeBars; i++) {
                        const bar = document.createElement('div');
                        const edge = Math.floor(Math.random() * 4);
                        
                        let w, h, x, y;
                        const colors = ['#ff0000', '#00ffff', '#ff00ff', '#000000', '#ffffff'];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        
                        const maxThickness = 20 + intensity * 80;
                        const maxLength = 100 + intensity * 600;
                        
                        if (edge === 0) { // Top
                            w = maxLength;
                            h = maxThickness;
                            x = Math.random() * window.innerWidth - w/2;
                            y = Math.random() * (intensity * 40);
                        } else if (edge === 1) { // Bottom
                            w = maxLength;
                            h = maxThickness;
                            x = Math.random() * window.innerWidth - w/2;
                            y = window.innerHeight - Math.random() * (intensity * 40) - h;
                        } else if (edge === 2) { // Left
                            w = maxThickness;
                            h = maxLength;
                            x = Math.random() * (intensity * 40);
                            y = Math.random() * window.innerHeight - h/2;
                        } else { // Right
                            w = maxThickness;
                            h = maxLength;
                            x = window.innerWidth - Math.random() * (intensity * 40) - w;
                            y = Math.random() * window.innerHeight - h/2;
                        }
                        
                        bar.style.cssText = `
                            position: absolute;
                            left: ${x}px;
                            top: ${y}px;
                            width: ${w}px;
                            height: ${h}px;
                            background: ${color};
                            opacity: ${0.3 + Math.random() * 0.7};
                            box-shadow: 0 0 10px ${color};
                            transform: skewX(${(Math.random() - 0.5) * 10}deg);
                        `;
                        glitchContainer.appendChild(bar);
                    }
                    
                    if (Math.random() < 0.25 && typeof audioEngine !== 'undefined') {
                        audioEngine.playTone('sawtooth', 80 + intensity * 200, 10, 0.05, 0.05 * intensity);
                    }
                }
            }, 60);
            
            setTimeout(() => {
                clearInterval(glitchInterval);
                glitchContainer.remove();
                document.body.style.cursor = 'default';

                // СКРИМЕР — показываем страшное изображение на весь экран
                const screamer = document.createElement('div');
                screamer.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;background:black;display:flex;align-items:center;justify-content:center;';
                const screamerImg = document.createElement('img');
                const screamSrcs = ['scary_eye.png', 'creepy_face.png', 'distorted_skull.png'];
                screamerImg.src = screamSrcs[Math.floor(Math.random() * screamSrcs.length)];
                screamerImg.style.cssText = 'width:100%;height:100%;object-fit:cover;filter:saturate(3) contrast(2) brightness(1.5);animation:shake 0.05s infinite;';
                screamer.appendChild(screamerImg);
                document.body.appendChild(screamer);
                audioEngine.playError(1.0);
                audioEngine.playGlitchSound();

                setTimeout(() => {
                    screamer.remove();
                    audioEngine.stopGlitchSound();
                    document.body.style.cursor = 'default';

                    showGameOver('boss', () => {
                        // Теперь окончательно останавливаем бой и перезапускаем
                        isBossFightActive = false;

                        // Сброс HP и очистка после скримера
                        bossHP = 800;
                        const fill = document.getElementById('boss-hp-fill');
                        if (fill) fill.style.width = '100%';
                        resetEye();

                        bossText.innerHTML = '';
                        clearInterval(_zettaBossInterval);
                        // Remove Zetta boss UI before restart
                        ['boss-zetta-icon','boss-zetta-speech'].forEach(id => { const e=document.getElementById(id); if(e) e.remove(); });
                        if (isZettaInstalled) {
                            setTimeout(() => {
                                if (isZettaCorrupted) {
                                    zettaSpeak(translations[currentLang].zettaCorruptedLose, 'corrupted');
                                } else {
                                    zettaSpeak(translations[currentLang].zettaSupportLose, 'angry');
                                }
                            }, 200);
                        }
                        // Пропускаем вступительный диалог — сразу в бой
                        restartBossFightDirectly();
                    });
                }, 1500);
            }, 3000);
        }

        function restartBossFightDirectly() {
            if (typeof audioEngine !== 'undefined') {
                audioEngine.playBossMusic();
            }
            isBossFightActive = true;
            bossPhase = 1;
            phaseTransitioning = false;
            phase1DialogueIdx = 0;
            laser2Active = false;
            specialLaserType = null;
            playerStopped = false;
            mouseStopFrames = 0;
            lastMouseX = 0; lastMouseY = 0;
            laserRotSpeed = 0.012;
            attackCounter = 0;
            eyeRedLevel = 0;

            _isLosingBossFight = false;

            // Сбрасываем визуальное состояние глаза и трещин
            resetEye();
            const cracks = document.getElementById('boss-cracks');
            if (cracks) cracks.style.opacity = '0';
            const cracks2 = document.getElementById('boss-cracks-2');
            if (cracks2) cracks2.style.opacity = '0';
            const caps = document.getElementById('boss-capillaries');
            if (caps) { caps.style.opacity = '0.3'; caps.style.filter = ''; }
            const iris = document.getElementById('boss-iris');
            if (iris) { iris.style.filter = ''; }
            const sclera = document.getElementById('boss-sclera');
            if (sclera) sclera.setAttribute('fill', 'white');
            const pupil = document.getElementById('boss-pupil');
            if (pupil) { pupil.setAttribute('fill', 'black'); pupil.style.filter = ''; }
            // Щупальца возвращаются к цветам фазы 1
            if (window._tentacleData) {
                window._tentacleData.forEach(td => {
                    const dark = Math.random() > 0.5;
                    td.path.setAttribute('stroke', dark ? '#5a0000' : '#3d0000');
                    td.path.style.filter = 'drop-shadow(0 0 5px #700)';
                });
            }

            // HP бар уже сброшен в loseBossFight
            document.querySelector('.boss-hp-bar').style.display = 'block';
            document.getElementById('boss-fight-overlay').style.pointerEvents = 'auto';

            // Zetta boss help
            if (isZettaInstalled) startZettaBossHelp();

            // Перезапускаем анимацию щупалец
            if (tentacleFrameId) {
                cancelAnimationFrame(tentacleFrameId);
            }
            animateTentacles();

            // Сразу запускаем бой без диалога
            combatLoop();
            startShieldSpawning();
        }

        function winBossFight() {
            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
            }
            isBossFightActive = false;
            cancelAnimationFrame(bossFrame);
            clearInterval(_zettaBossInterval);
            if (bossShieldInterval) {
                clearInterval(bossShieldInterval);
                bossShieldInterval = null;
            }
            if (tentacleFrameId) {
                cancelAnimationFrame(tentacleFrameId);
                tentacleFrameId = null;
            }
            if (isZettaInstalled) {
                if (isZettaCorrupted) {
                    zettaSpeak(translations[currentLang].zettaCorruptedWin, 'corrupted');
                } else {
                    zettaSpeak(translations[currentLang].zettaSupportWin, 'normal');
                }
            }

            // Скрываем щупальца и HP-бар
            const tentacleSvg = document.getElementById('tentacle-svg');
            if (tentacleSvg) tentacleSvg.style.display = 'none';
            document.querySelector('.boss-hp-bar').style.display = 'none';

            const bossText = document.getElementById('boss-text');
            bossText.innerHTML = "";
            
            (async () => {
                await typeBossText(translations[currentLang].bossWin1, false, true);
                await new Promise(r => setTimeout(r, 2000));
                bossText.innerHTML = "";
                await typeBossText(translations[currentLang].bossWin2, false, true);
                await new Promise(r => setTimeout(r, 2000));
                bossText.innerHTML = "";
                await typeBossText(translations[currentLang].bossWin3, false, true);
                await new Promise(r => setTimeout(r, 2000));
                
                // Глаз и дыра уходят
                const eyeEl = document.getElementById('boss-eye-container');
                const holeEl = document.getElementById('boss-hole');
                if (eyeEl) eyeEl.style.transform = 'translate(-50%, -50%) scale(0)';
                if (holeEl) holeEl.style.transform = 'translate(-50%, -50%) scale(0)';

                // Через 3 секунды — отображаем концовку
                setTimeout(() => {
                    triggerSoloEnding();
                }, 3000);
            })();
        }

        function triggerSoloEnding() {
            audioEngine.stopDrone();
            audioEngine.playCreditsMusic();
            // Скрываем оверлей босс-файта
            document.getElementById('boss-fight-overlay').style.display = 'none';
            document.getElementById('boss-laser-svg').style.display = 'none';

            // Показываем концовку поверх всего
            const ending = document.createElement('div');
            ending.style.cssText = [
                'position: fixed',
                'top: 0', 'left: 0',
                'width: 100vw', 'height: 100vh',
                'background: black',
                'color: white',
                'display: flex',
                'flex-direction: column',
                'align-items: center',
                'justify-content: center',
                'text-align: center',
                'padding: 40px',
                'box-sizing: border-box',
                'z-index: 60000',
                'font-family: \'Times New Roman\', serif',
                'opacity: 0',
                'transition: opacity 2s ease'
            ].join(';');

            // Рассчитываем высоту контента чтобы титры прокрутились до конца + 5 секунд после
            // Длительность прокрутки: 25 секунд (хватит чтобы весь текст прошёл), затем 5 секунд пауза
            const SCROLL_DURATION = 25; // секунды

            ending.innerHTML = `
                <div style="overflow: hidden; height: 100vh; width: 100vw; position: relative;">
                    <div id="credits-scroll-inner" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        animation: scrollCredits ${SCROLL_DURATION}s linear forwards;
                        animation-fill-mode: forwards;
                    ">
                        <h1 style="
                            font-family: 'Rubik Glitch', cursive;
                            color: #00cc44;
                            font-size: 4rem;
                            margin-bottom: 50px;
                            text-shadow: 0 0 20px #00ff55;
                        ">${translations[currentLang].endingSoloTitle}</h1>
                        
                        <p style="font-size: 1.8rem; line-height: 2; max-width: 700px; color: #e0e0e0; margin-bottom: 80px;">
                            ${translations[currentLang].endingSoloSub}
                        </p>

                        <h2 style="color: #00cc44; font-size: 2.5rem; margin-bottom: 30px;">${translations[currentLang].endingSoloDevelopers}</h2>
                        
                        <div style="font-size: 1.5rem; color: #aaa; line-height: 2.5; margin-bottom: 80px;">
                            <p><b>${translations[currentLang].endingSoloDesigner}</b></p>
                            <p><b>${translations[currentLang].endingSoloIdeas}</b></p>
                            <p><b>${translations[currentLang].endingSoloProgrammer}</b></p>
                            <p><b>${translations[currentLang].endingSoloRealization}</b></p>
                        </div>

                        <p style="font-size: 1.6rem; color: #88ff88; font-style: italic; margin-bottom: 60px; text-shadow: 0 0 10px #00ff55; max-width: 700px; text-align: center;">
                            ${translations[currentLang].endingSoloThanks}
                        </p>
                        
                        <button onclick="location.reload()" style="
                            padding: 15px 40px;
                            font-size: 1.5rem;
                            font-family: 'MS Sans Serif', Tahoma, sans-serif;
                            cursor: pointer;
                            background: #001a00;
                            color: #00ff55;
                            border: 2px solid #00cc44;
                            box-shadow: 0 0 15px #00ff55;
                            transition: background 0.3s;
                            margin-bottom: 30px;
                        " onmouseover="this.style.background='#003300'" onmouseout="this.style.background='#001a00'">
                            ${translations[currentLang].endingToMenu}
                        </button>
                    </div>
                </div>
                <style>
                    @keyframes scrollCredits {
                        0%   { transform: translateY(100vh); }
                        100% { transform: translateY(calc(-100% + 58vh)); }
                    }
                </style>
            `;

            document.body.appendChild(ending);
            // Плавное появление
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { ending.style.opacity = '1'; });
            });

            isOnCreepySite = false;
            goodEndingAchieved = true;
        }

        // ================================================================
        //  ДЕСКТОП — ОКНА (Мой компьютер / Корзина / Письмо)
        // ================================================================

        // --- Вспомогательные SVG ---
        const svgFolder = `<svg viewBox="0 0 32 28" width="36" height="36"><path d="M0 4 H10 L13 1 H32 V24 H0 Z" fill="#FFD700" stroke="#b8860b" stroke-width="1.2"/><rect x="0" y="8" width="32" height="16" fill="#FFD700" stroke="#b8860b" stroke-width="1.2"/></svg>`;
        const svgTxt   = `<svg viewBox="0 0 26 32" width="30" height="36"><rect x="1" y="1" width="20" height="29" rx="1" fill="white" stroke="#555" stroke-width="1.5"/><path d="M17 1 L25 9 L17 9 Z" fill="#ccc" stroke="#555" stroke-width="1.2"/><line x1="4" y1="13" x2="22" y2="13" stroke="#333" stroke-width="1.2"/><line x1="4" y1="17" x2="22" y2="17" stroke="#333" stroke-width="1.2"/><line x1="4" y1="21" x2="22" y2="21" stroke="#333" stroke-width="1.2"/><line x1="4" y1="25" x2="16" y2="25" stroke="#333" stroke-width="1.2"/></svg>`;
        const svgHdd   = `<svg viewBox="0 0 34 22" width="40" height="28"><rect x="1" y="1" width="32" height="20" rx="3" fill="#c0c0c0" stroke="#666" stroke-width="1.5"/><rect x="3" y="4" width="20" height="14" rx="1" fill="#999" stroke="#555" stroke-width="1"/><circle cx="28" cy="11" r="3.5" fill="#666" stroke="#444" stroke-width="1"/><circle cx="28" cy="11" r="1.5" fill="#333"/></svg>`;
        const svgTrashFile = `<svg viewBox="0 0 26 32" width="30" height="36"><rect x="1" y="1" width="20" height="29" rx="1" fill="#ffe0e0" stroke="#cc0000" stroke-width="1.5"/><path d="M17 1 L25 9 L17 9 Z" fill="#ffaaaa" stroke="#cc0000" stroke-width="1.2"/><line x1="4" y1="13" x2="22" y2="13" stroke="#cc0000" stroke-width="1.2"/><line x1="4" y1="17" x2="22" y2="17" stroke="#cc0000" stroke-width="1.2"/><line x1="4" y1="21" x2="22" y2="21" stroke="#cc0000" stroke-width="1.2"/><line x1="4" y1="25" x2="14" y2="25" stroke="#cc0000" stroke-width="1.2"/></svg>`;

        function getTopZIndex() {
            let max = 150;
            document.querySelectorAll('.window, [data-desktop-win]').forEach(w => {
                const z = parseInt(w.style.zIndex) || 0;
                if (z > max) max = z;
            });
            return max + 1;
        }

        function createDesktopWindow(id, title, contentHTML, width, height, left, top) {
            const existing = document.getElementById(id);
            if (existing) {
                existing.style.display = 'flex';
                existing.style.zIndex  = getTopZIndex();
                return existing;
            }
            const win = document.createElement('div');
            win.id = id;
            win.setAttribute('data-desktop-win', '1');
            win.style.cssText = `position:fixed;left:${left};top:${top};width:${width};height:${height};display:flex;flex-direction:column;z-index:${getTopZIndex()};box-shadow:2px 2px 0 #fff inset,-2px -2px 0 #555 inset,4px 4px 0 #888 inset;background:#c0c0c0;border:2px solid #888;`;
            win.innerHTML = `
                <div class="title-bar active" id="${id}-tbar" style="cursor:default;user-select:none;flex-shrink:0;">
                    <span>${title}</span>
                    <div class="window-btn" onclick="document.getElementById('${id}').style.display='none'">X</div>
                </div>
                <div style="flex:1;overflow:auto;background:white;border:2px inset #888;">${contentHTML}</div>
            `;
            document.body.appendChild(win);

            // Перетаскивание
            const tbar = document.getElementById(`${id}-tbar`);
            tbar.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('window-btn')) return;
                isDraggingWindow  = true;
                currentDragWindow = win;
                win.style.zIndex  = getTopZIndex();
                windowOffsetX = e.clientX - win.offsetLeft;
                windowOffsetY = e.clientY - win.offsetTop;
            });
            return win;
        }

        // --- Иконка файла внутри окна ---
        function fileItem(icon, label, dblAction, extraStyle = '') {
            return `
                <div ondblclick="${dblAction}" onmouseenter="this.style.background='#000080';this.querySelectorAll('span').forEach(s=>s.style.color='white')" onmouseleave="this.style.background='';this.querySelectorAll('span').forEach(s=>s.style.color='')"
                     style="display:inline-flex;flex-direction:column;align-items:center;padding:6px;width:80px;cursor:pointer;text-align:center;${extraStyle}">
                    ${icon}
                    <span style="font-family:'MS Sans Serif',Tahoma,sans-serif;font-size:11px;margin-top:4px;word-break:break-word;color:black;">${label}</span>
                </div>`;
        }

        // ================================================================
        //  ПИСЬМО — ПРОЧТИ_МЕНЯ.txt
        // ================================================================
        function openLetter() {
            audioEngine.playClick();
            const text = translations[currentLang].letterFileContent;
            const content = `<textarea readonly style="width:100%;height:100%;border:none;outline:none;resize:none;font-family:'Courier New',monospace;font-size:13px;padding:10px;box-sizing:border-box;background:white;color:#111;line-height:1.6;">${text}</textarea>`;
            createDesktopWindow('letter-window', translations[currentLang].letterFileTitle, content, '420px', '300px', '180px', '110px');
        }

        // ================================================================
        //  МОЙ КОМПЬЮТЕР
        // ================================================================
        function openMyComputer() {
            audioEngine.playClick();
            const content = `
                <div style="padding:10px;display:flex;gap:10px;flex-wrap:wrap;">
                    ${fileItem(svgHdd, translations[currentLang].driveCName, 'openDriveC()')}
                    ${fileItem(svgHdd, translations[currentLang].driveDName, 'openDriveD()', 'filter:hue-rotate(120deg)')}
                </div>`;
            createDesktopWindow('mycomputer-window', translations[currentLang].myComputer, content, '340px', '220px', '130px', '90px');
        }

        function openDriveC() {
            audioEngine.playClick();
            const folders = ['Windows', 'Program Files', 'System32', 'Users', 'Temp'];
            const icons = folders.map(f => {
                if (f === 'Temp') {
                    return fileItem(svgFolder, f, `if (isTempAccessGranted) { openTempFolder(); } else { audioEngine.playError(); alert(translations[currentLang].accessDenied); }`);
                } else {
                    return fileItem(svgFolder, f, `audioEngine.playError();alert(translations[currentLang].accessDenied)`);
                }
            }).join('');
            const content = `<div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap;">${icons}</div>`;
            createDesktopWindow('drive-c-window', translations[currentLang].driveCName, content, '400px', '260px', '160px', '130px');
        }

        function triggerTempAccessNotification() {
            if (isZettaInstalled && !isZettaCorrupted) {
                setTimeout(() => {
                    zettaSpeak(translations[currentLang].zettaTempNotice, "angry");
                }, 1000);
            } else {
                setTimeout(() => {
                    const notif = document.createElement('div');
                    notif.className = 'window';
                    notif.style.cssText = 'position:fixed;top:100px;left:50%;transform:translateX(-50%);width:360px;z-index:99999;display:flex;flex-direction:column;box-shadow:4px 4px 0 #000;animation:shake 0.4s 1;';
                    notif.innerHTML = `
                        <div class="title-bar active" style="background:#aa0000;">
                            <span>${translations[currentLang].systemCrashTitle}</span>
                            <div class="window-btn" onclick="this.closest('.window').remove()">X</div>
                        </div>
                        <div class="window-content" style="background:#110000;color:#ff3333;padding:15px;font-family:'Courier New',monospace;font-size:12px;height:auto;line-height:1.5;">
                            ${translations[currentLang].tempAccessGrantedText}
                            <div style="text-align:center;margin-top:15px;">
                                <button onclick="this.closest('.window').remove();audioEngine.playClick();" style="padding:4px 20px;cursor:pointer;background:#220000;color:red;border:1px solid red;">${translations[currentLang].ok}</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(notif);
                    audioEngine.playError(0.3);
                }, 1000);
            }
        }

        function openTempFolder() {
            audioEngine.playClick();
            const files = [
                { name: translations[currentLang].researchFileName, icon: svgTxt, action: 'openResearchFile()' },
                { name: translations[currentLang].experimentFileName, icon: svgTrashFile, action: 'openExperimentImage()' }
            ];
            const icons = files.map(file => fileItem(file.icon, file.name, file.action)).join('');
            const content = `<div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap;">${icons}</div>`;
            createDesktopWindow('temp-folder-window', translations[currentLang].tempFolderName, content, '360px', '220px', '190px', '160px');
        }

        function openResearchFile() {
            audioEngine.playClick();
            const text = translations[currentLang].researchFileContent;
            const content = `<textarea readonly style="width:100%;height:100%;border:none;outline:none;resize:none;font-family:'Courier New',monospace;font-size:13px;padding:10px;box-sizing:border-box;background:white;color:#111;line-height:1.6;">${text}</textarea>`;
            createDesktopWindow('research-file-window', translations[currentLang].researchFileTitle, content, '450px', '380px', '220px', '150px');
        }

        function openExperimentImage() {
            audioEngine.playClick();
            const content = `
                <div style="background:#000;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;">
                    <img src="scary_eye.png" style="max-width:100%;max-height:80%;object-fit:contain;filter:saturate(2) contrast(1.5);animation:shake 0.3s infinite;" />
                    <div style="color:red;font-family:monospace;font-size:12px;margin-top:10px;text-align:center;text-shadow:0 0 5px red;">${translations[currentLang].experimentFileContent}</div>
                </div>
            `;
            createDesktopWindow('experiment-image-window', translations[currentLang].experimentFileTitle, content, '360px', '320px', '240px', '180px');
        }

        function openDriveD() {
            audioEngine.playClick();
            const content = `
                <div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap;">
                    ${fileItem(svgTxt, translations[currentLang].lastChanceFileName, 'openLastChanceFile()')}
                </div>`;
            createDesktopWindow('drive-d-window', translations[currentLang].driveDName, content, '340px', '200px', '190px', '160px');
        }

        function openLastChanceFile() {
            audioEngine.playClick();
            const text = isRegistryDecrypted ? translations[currentLang].lastChanceFileContentDecrypted : translations[currentLang].lastChanceFileContent;
            const content = `<textarea readonly style="width:100%;height:100%;border:none;outline:none;resize:none;font-family:'Courier New',monospace;font-size:13px;padding:10px;box-sizing:border-box;background:#000;color:${isRegistryDecrypted ? '#0c0' : '#c00'};line-height:1.6;">${text}</textarea>`;
            createDesktopWindow('lastchance-window', translations[currentLang].lastChanceFileTitle, content, '420px', '300px', '210px', '140px');
        }

        function openRegistryEditor() {
            audioEngine.playClick();
            let selectedNode = 'ispy';
            
            const renderContent = () => {
                const ispySelected = selectedNode === 'ispy';
                const softwareSelected = selectedNode === 'software';
                const hklmSelected = selectedNode === 'hklm';
                const myComputerSelected = selectedNode === 'mycomputer';
                
                const tipText = currentLang === 'ru' 
                    ? "Дважды кликните по названию ключа для изменения его значения." 
                    : (currentLang === 'ua' ? "Двічі клацніть по назві ключа для зміни його значення." : "Double-click key name to modify value.");

                return `
                <div class="regedit-container">
                    <div class="regedit-left-pane">
                        <div class="regedit-tree-node ${myComputerSelected ? 'selected' : ''}" onclick="window.setRegeditNode('mycomputer')">
                            🖳 My Computer
                        </div>
                        <div class="regedit-tree-node ${hklmSelected ? 'selected' : ''}" onclick="window.setRegeditNode('hklm')" style="margin-left: 10px;">
                            📁 HKEY_LOCAL_MACHINE
                        </div>
                        <div class="regedit-tree-node ${softwareSelected ? 'selected' : ''}" onclick="window.setRegeditNode('software')" style="margin-left: 20px;">
                            📁 Software
                        </div>
                        <div class="regedit-tree-node ${ispySelected ? 'selected' : ''}" onclick="window.setRegeditNode('ispy')" style="margin-left: 30px;">
                            📁 ISpy
                        </div>
                    </div>
                    <div class="regedit-right-pane">
                        <div style="font-size:10px; color:#555; padding: 2px 5px; background:#e0e0e0; border-bottom:1px solid #999;">
                            ℹ️ ${tipText}
                        </div>
                        <table class="regedit-table">
                            <thead>
                                <tr>
                                    <th style="width: 30%">Name</th>
                                    <th style="width: 20%">Type</th>
                                    <th style="width: 50%">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ispySelected ? `
                                    <tr class="regedit-row">
                                        <td>(Default)</td>
                                        <td>REG_SZ</td>
                                        <td>(value not set)</td>
                                    </tr>
                                    <tr class="regedit-row" ondblclick="window.toggleRegeditKey('CoreStatus')" style="cursor: pointer;">
                                        <td><b>CoreStatus</b></td>
                                        <td>REG_SZ</td>
                                        <td style="color: red; font-family: monospace;">MUTATED_OMEGA_DREAD</td>
                                    </tr>
                                    <tr class="regedit-row" ondblclick="window.toggleRegeditKey('DecryptionKey')" style="cursor: pointer;">
                                        <td><b>DecryptionKey</b></td>
                                        <td>REG_SZ</td>
                                        <td><b>${isRegistryDecrypted ? '1' : '0'}</b></td>
                                    </tr>
                                ` : `
                                    <tr class="regedit-row">
                                        <td>(Default)</td>
                                        <td>REG_SZ</td>
                                        <td>(value not set)</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            };

            createDesktopWindow('regedit-window', translations[currentLang].regeditName || 'Registry Editor', renderContent(), '460px', '280px', '80px', '80px');
            
            window.setRegeditNode = (nodeName) => {
                audioEngine.playClick();
                selectedNode = nodeName;
                const win = document.getElementById('regedit-window');
                if (win) {
                    const contentArea = win.querySelector('.window-content');
                    if (contentArea) {
                        contentArea.innerHTML = renderContent();
                    }
                }
            };
            
            window.toggleRegeditKey = (keyName) => {
                if (keyName === 'CoreStatus') {
                    audioEngine.playError(0.8);
                    return;
                }
                
                if (keyName === 'DecryptionKey') {
                    isRegistryDecrypted = !isRegistryDecrypted;
                    audioEngine.playClick();
                    
                    if (isRegistryDecrypted) {
                        audioEngine.playTone('sine', 880, 150, 0.2, 0.3);
                        const notif = document.createElement('div');
                        notif.style.cssText = 'position:fixed; bottom:40px; right:20px; background:#008000; color:white; padding:10px; border:2px outset #fff; font-family:monospace; z-index:99999;';
                        notif.innerText = currentLang === 'ru' ? "РЕЕСТР: Ключ расшифровки активирован!" : (currentLang === 'ua' ? "РЕЄСТР: Ключ розшифровки активований!" : "REGISTRY: Decryption key activated!");
                        document.body.appendChild(notif);
                        setTimeout(() => notif.remove(), 3000);
                    } else {
                        audioEngine.playTone('sine', 440, 150, 0.2, 0.3);
                        const notif = document.createElement('div');
                        notif.style.cssText = 'position:fixed; bottom:40px; right:20px; background:#800000; color:white; padding:10px; border:2px outset #fff; font-family:monospace; z-index:99999;';
                        notif.innerText = currentLang === 'ru' ? "РЕЕСТР: Ключ деактивирован." : (currentLang === 'ua' ? "РЕЄСТР: Ключ деактивований." : "REGISTRY: Decryption key deactivated.");
                        document.body.appendChild(notif);
                        setTimeout(() => notif.remove(), 3000);
                    }
                    
                    window.setRegeditNode(selectedNode);
                }
            };
        }

        function openMSDOSPrompt() {
            audioEngine.playClick();
            
            const welcomeMsg = translations[currentLang].dosOutputWelcome || "Microsoft(R) Windows 95\n(C)Copyright Microsoft Corp 1981-1995.\n";
            
            const menuText = currentLang === 'ru' 
                ? "=== ДОСТУПНЫЕ ДЕЙСТВИЯ ===\n[1] Проверить файлы (DIR)\n[2] Читать memory.log\n[3] Читать ispy_mutator.dll\n[4] Читать research.txt (из Temp)\n[5] Очистить диск C: (FORMAT C:)\n[6] Закрыть сеанс (EXIT)\n==========================\nВведите номер действия (1-6) или команду:\n"
                : (currentLang === 'ua'
                ? "=== ДОСТУПНІ ДІЇ ===\n[1] Перевірити файли (DIR)\n[2] Читати memory.log\n[3] Читати ispy_mutator.dll\n[4] Читати research.txt (з Temp)\n[5] Очистити диск C: (FORMAT C:)\n[6] Закрити сеанс (EXIT)\n==========================\nВведіть номер дії (1-6) або команду:\n"
                : "=== AVAILABLE OPTIONS ===\n[1] Check files (DIR)\n[2] Read memory.log\n[3] Read ispy_mutator.dll\n[4] Read research.txt (from Temp)\n[5] Format drive C: (FORMAT C:)\n[6] Exit MS-DOS session (EXIT)\n==========================\nType option number (1-6) or command:\n");
                
            let dosHistory = welcomeMsg + "\n" + menuText;
            let currentPath = 'C:\\WINDOWS';
            
            const renderContent = () => {
                return `
                <div class="dos-prompt-container" onclick="document.getElementById('dos-input-field').focus()">
                    <div class="dos-output" id="dos-output-area">${dosHistory}</div>
                    <div class="dos-input-line">
                        <span class="dos-prompt-label" id="dos-prompt-path">${currentPath}&gt;</span>
                        <input type="text" class="dos-input" id="dos-input-field" autofocus autocomplete="off" spellcheck="false">
                    </div>
                </div>`;
            };

            createDesktopWindow('dos-window', translations[currentLang].dosPromptName || 'MS-DOS Prompt', renderContent(), '520px', '320px', '120px', '100px');
            
            const inputField = document.getElementById('dos-input-field');
            if (inputField) inputField.focus();

            const handleDosCommand = (e) => {
                if (e.key === 'Enter') {
                    let input = e.target.value.trim();
                    e.target.value = '';
                    
                    if (input === '') {
                        dosHistory += `\n${currentPath}>`;
                        updateDosDisplay();
                        return;
                    }
                    
                    // Map option numbers to actual commands
                    if (input === '1') {
                        input = 'dir';
                    } else if (input === '2') {
                        input = 'type memory.log';
                    } else if (input === '3') {
                        input = 'type ispy_mutator.dll';
                    } else if (input === '4') {
                        input = 'type temp/research.txt';
                    } else if (input === '5') {
                        input = 'format c:';
                    } else if (input === '6') {
                        input = 'exit';
                    }
                    
                    dosHistory += `\n${currentPath}>${input}\n`;
                    
                    const args = input.split(' ');
                    const cmd = args[0].toLowerCase();
                    
                    if (cmd === 'help') {
                        dosHistory += menuText;
                    } 
                    else if (cmd === 'cls') {
                        dosHistory = "";
                    } 
                    else if (cmd === 'exit') {
                        const win = document.getElementById('dos-window');
                        if (win) win.style.display = 'none';
                        return;
                    } 
                    else if (cmd === 'dir') {
                        if (currentPath === 'C:\\WINDOWS') {
                            dosHistory += " Volume in drive C has no label.\n Directory of C:\\WINDOWS\n\n06-05-2026  12:00 PM    <DIR>          .\n06-05-2026  12:00 PM    <DIR>          ..\n06-05-2026  12:00 PM    <DIR>          SYSTEM\n06-05-2026  12:00 PM    <DIR>          TEMP\n06-05-2026  12:00 PM            12,894 memory.log\n06-05-2026  12:00 PM           245,612 ispy_mutator.dll\n               2 File(s)        258,506 bytes\n               4 Dir(s)      34,891,264 bytes free\n";
                        } else if (currentPath === 'C:\\WINDOWS\\TEMP') {
                            dosHistory += " Volume in drive C has no label.\n Directory of C:\\WINDOWS\\TEMP\n\n06-05-2026  12:00 PM    <DIR>          .\n06-05-2026  12:00 PM    <DIR>          ..\n06-05-2026  12:00 PM             1,024 research.txt\n06-05-2026  12:00 PM            45,102 diary.txt\n               2 File(s)         46,126 bytes\n               2 Dir(s)      34,891,264 bytes free\n";
                        } else {
                            dosHistory += " Directory is empty.\n";
                        }
                    } 
                    else if (cmd === 'cd') {
                        if (args.length < 2) {
                            dosHistory += `${currentPath}\n`;
                        } else {
                            const dest = args[1].toUpperCase();
                            if (dest === 'TEMP' || dest === 'C:\\WINDOWS\\TEMP') {
                                currentPath = 'C:\\WINDOWS\\TEMP';
                            } else if (dest === '..' || dest === 'C:\\WINDOWS' || dest === 'WINDOWS') {
                                currentPath = 'C:\\WINDOWS';
                            } else {
                                dosHistory += currentLang === 'ru' ? "Системе не удается найти указанный путь.\n" : (currentLang === 'ua' ? "Системі не вдається знайти вказаний шлях.\n" : "The system cannot find the path specified.\n");
                            }
                        }
                    } 
                    else if (cmd === 'type') {
                        if (args.length < 2) {
                            dosHistory += currentLang === 'ru' ? "Необходимо указать имя файла.\n" : "File name must be specified.\n";
                        } else {
                            let filename = args[1].toLowerCase();
                            // Support absolute/relative path shortcut for research.txt
                            if (filename.includes('research.txt')) {
                                dosHistory += translations[currentLang].researchFileContent.substring(0, 300) + "... (File too large for DOS console buffer)\n";
                            } 
                            else if (filename === 'memory.log') {
                                dosHistory += currentLang === 'ru'
                                    ? "LOG ENTRY: 12.12.1991\nРазработка ISpy заморожена. Руководство решило, что интерактивный ассистент слишком пугает пользователей своими крыльями.\nПомощник Zetta деактивирован.\nНО Я СЛЫШУ ЕГО В ФОНЕ. ОН НЕ УМЕР. ОН ЖДЕТ.\n"
                                    : "LOG ENTRY: 12.12.1991\nISpy development frozen. Management decided the interactive helper scares users with its wings.\nZetta assistant deactivated.\nBUT I HEAR IT IN THE BACKGROUND. IT'S NOT DEAD. IT IS WAITING.\n";
                            } 
                            else if (filename === 'ispy_mutator.dll') {
                                audioEngine.playGlitchSound();
                                dosHistory += "☼♀¶§█▄▲▼ 01001001 01010011 01010000 01011001\n";
                                dosHistory += "   .-''''-.\n  .'  __    '.\n /   (o)      \\\n|             |\n|   \\     /   |\n \\   '---'   /\n  '.       .'\n    '-...-'\n";
                                dosHistory += "I SEE YOU.\n";
                                setTimeout(() => audioEngine.stopGlitchSound(), 1000);
                            } 
                            else if (filename === 'diary.txt') {
                                dosHistory += translations[currentLang].diaryFileContent + "\n";
                            } 
                            else {
                                dosHistory += currentLang === 'ru' ? "Файл не найден.\n" : "File not found.\n";
                            }
                        }
                    } 
                    else if (cmd === 'format' && args[1] && args[1].toLowerCase() === 'c:') {
                        audioEngine.playError(1.0);
                        audioEngine.playGlitchSound();
                        const win = document.getElementById('dos-window');
                        if (win) {
                            win.style.background = 'red';
                            win.classList.add('shake-continuous');
                            dosHistory = `\n\n\n   YOU THINK YOU CAN DELETE ME, ${playerName.toUpperCase()}???\n   YOU ARE IN MY DOMAIN.\n\n\n`;
                            updateDosDisplay();
                            
                            setTimeout(() => {
                                win.classList.remove('shake-continuous');
                                win.style.display = 'none';
                                audioEngine.stopGlitchSound();
                                systemAlert("accessDenied");
                            }, 2500);
                        }
                        return;
                    } 
                    else {
                        dosHistory += currentLang === 'ru' 
                            ? "Неизвестная команда или имя файла. Введите HELP.\n" 
                            : (currentLang === 'ua'
                            ? "Невідома команда або ім'я файлу. Введіть HELP.\n"
                            : "Bad command or file name. Type HELP.\n");
                    }
                    
                    updateDosDisplay();
                }
            };
            
            const updateDosDisplay = () => {
                const outputArea = document.getElementById('dos-output-area');
                if (outputArea) {
                    outputArea.innerText = dosHistory;
                    const container = outputArea.closest('.dos-prompt-container');
                    if (container) container.scrollTop = container.scrollHeight;
                }
                const pathLabel = document.getElementById('dos-prompt-path');
                if (pathLabel) pathLabel.innerText = `${currentPath}>`;
            };
            
            const inputEl = document.getElementById('dos-input-field');
            if (inputEl) {
                inputEl.addEventListener('keydown', handleDosCommand);
            }
        }

        window.openMSDOSPrompt = openMSDOSPrompt;
        window.openRegistryEditor = openRegistryEditor;

        // ================================================================
        //  КОРЗИНА
        // ================================================================
        function openTrash() {
            audioEngine.playClick();
            const content = `
                <div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap;">
                    ${fileItem(svgTrashFile, translations[currentLang].sorryFileName, 'openSorryFile()')}
                    ${fileItem(svgTxt, translations[currentLang].diaryFileName, 'openDiaryFile()')}
                </div>`;
            createDesktopWindow('trash-window', translations[currentLang].trash, content, '380px', '200px', '150px', '120px');
        }

        function openSorryFile() {
            audioEngine.playClick();
            const text = translations[currentLang].sorryFileContent;
            const content = `<textarea readonly style="width:100%;height:100%;border:none;outline:none;resize:none;font-family:'Courier New',monospace;font-size:13px;padding:10px;box-sizing:border-box;background:white;color:#880000;line-height:1.7;">${text}</textarea>`;
            createDesktopWindow('sorry-window', translations[currentLang].sorryFileTitle, content, '380px', '310px', '200px', '130px');
        }

        function openDiaryFile() {
            audioEngine.playClick();
            const text = translations[currentLang].diaryFileContent;
            const content = `<textarea readonly style="width:100%;height:100%;border:none;outline:none;resize:none;font-family:'Courier New',monospace;font-size:13px;padding:10px;box-sizing:border-box;background:#f5f5f5;color:#111;line-height:1.8;">${text}</textarea>`;
            createDesktopWindow('diary-window', translations[currentLang].diaryFileTitle, content, '420px', '320px', '230px', '150px');
        }

        // ================================================================
        //  Task Manager Logic
        // ================================================================
        function populateTaskManager() {
            const list = document.getElementById('taskmgr-list');
            if (!list) return;

            let html = `<div class="taskmgr-item" style="padding: 2px;" onclick="selectTaskmgrItem(this)">Explorer</div>`;
            
            if (is666Mode) {
                html += `<div id="taskmgr-internet" class="taskmgr-item glitch-text" style="padding: 2px; cursor: pointer; color: red; font-weight: bold; animation: shake 0.2s infinite;" onclick="selectTaskmgrItem(this)" oncontextmenu="showTaskmgrContext(event)">${translations[currentLang].taskmgrInternetGlitch}</div>`;
            } else {
                html += `<div class="taskmgr-item" style="padding: 2px;" onclick="selectTaskmgrItem(this)">${translations[currentLang].internet}</div>`;
            }

            html += `<div class="taskmgr-item" style="padding: 2px;" onclick="selectTaskmgrItem(this)">Audio Service</div>`;

            if (isZettaInstalled) {
                if (isZettaCorrupted && !hasRebootedAfterBSOD) {
                    html += `<div class="taskmgr-item glitch-text" style="padding: 2px; color: #a020f0; animation: shake 0.3s infinite;" onclick="selectTaskmgrItem(this)">${translations[currentLang].taskmgrZettaGlitch}</div>`;
                } else {
                    html += `<div class="taskmgr-item" style="padding: 2px; color: #000080;" onclick="selectTaskmgrItem(this)">zetta_core.sys</div>`;
                }
            }

            if (currentQuestion >= 8 || hasRebootedAfterBSOD) {
                html += `<div class="taskmgr-item" style="padding: 2px; color: #660000;" onclick="selectTaskmgrItem(this)">watching_you.exe</div>`;
                html += `<div class="taskmgr-item" style="padding: 2px; color: #660000;" onclick="selectTaskmgrItem(this)">fear.sys</div>`;
            }

            list.innerHTML = html;
        }

        function openTaskManager() {
            audioEngine.playClick();
            populateTaskManager();
            const tm = document.getElementById('task-manager');
            if (tm) {
                tm.style.display = 'flex';
                tm.style.zIndex = getTopZIndex ? getTopZIndex() : 10000;
            }
        }

        function closeTaskManager() {
            audioEngine.playClick();
            const tm = document.getElementById('task-manager');
            if (tm) tm.style.display = 'none';
            document.getElementById('taskmgr-context-menu').style.display = 'none';
        }

        function selectTaskmgrItem(el) {
            document.querySelectorAll('.taskmgr-item').forEach(i => i.style.background = 'transparent');
            document.querySelectorAll('.taskmgr-item').forEach(i => i.style.color = i.classList.contains('glitch-text') ? 'red' : (i.innerText.includes('.exe') || i.innerText.includes('.sys') ? '#660000' : 'black'));
            el.style.background = '#000080';
            el.style.color = 'white';
            window.selectedTaskmgrItem = el;
        }

        function endSelectedTask() {
            if (!window.selectedTaskmgrItem) return;
            const text = window.selectedTaskmgrItem.innerText;
            if (text.includes('Internet')) {
                endInternetTask();
            } else if (text.includes('zetta_core.sys')) {
                if (isZettaCorrupted) {
                    zettaEndAttempts++;
                    if (zettaEndAttempts === 1) {
                        zettaSpeak(translations[currentLang].zettaEndAttempt, "corrupted");
                        audioEngine.playError(0.7);
                        const tm = document.getElementById('task-manager');
                        if (tm) {
                            tm.classList.add('shake-active');
                            setTimeout(() => tm.classList.remove('shake-active'), 500);
                        }
                    } else {
                        isZettaInstalled = false;
                        isZettaCorrupted = false;
                        const assistant = document.getElementById('zetta-assistant');
                        if (assistant) assistant.remove();
                        const speech = document.getElementById('zetta-speech');
                        if (speech) speech.remove();
                        
                        alert(translations[currentLang].zettaKilled);
                        populateTaskManager();
                    }
                } else {
                    alert(translations[currentLang].criticalProcess);
                }
            } else if (text.includes('watching_you.exe') || text.includes('fear.sys')) {
                alert(translations[currentLang].accessDeniedBoss.replace('{playerName}', playerName));
                audioEngine.playError(0.8);
            } else {
                alert(translations[currentLang].criticalProcess);
            }
        }

        function showTaskmgrContext(e) {
            e.preventDefault();
            const ctx = document.getElementById('taskmgr-context-menu');
            ctx.style.display = 'block';
            ctx.style.left = e.clientX + 'px';
            ctx.style.top = e.clientY + 'px';
        }

        document.addEventListener('click', (e) => {
            const ctx = document.getElementById('taskmgr-context-menu');
            if (ctx && e.target.id !== 'taskmgr-internet') {
                ctx.style.display = 'none';
            }
        });

        function endInternetTask() {
            audioEngine.playClick();
            internetKilled = true;
            is666Mode = false;
            isOnCreepySite = false; // сбрасываем ДО закрытия, чтобы снять блокировку

            // Принудительно скрываем диспетчер задач
            const tm = document.getElementById('task-manager');
            if (tm) tm.style.display = 'none';
            const ctx = document.getElementById('taskmgr-context-menu');
            if (ctx) ctx.style.display = 'none';

            // Принудительно закрываем браузер минуя все проверки
            browserState.isOpen = false;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.style.display = 'none';
            clearTimeout(adTimeout);
            adPopup.style.display = 'none';

            // Останавливаем 666-сиквенс
            if (creepyFacesInterval) clearInterval(creepyFacesInterval);
            document.querySelectorAll('.creepy-face').forEach(el => el.remove());

            // Иконка Internet начинает трястись
            const internetIconEl = document.getElementById('desktop-internet-text');
            const internetContainer = internetIconEl ? internetIconEl.closest('.icon-container') : null;
            if (internetContainer) {
                internetContainer.style.animation = 'shake 0.15s infinite';
                internetContainer.style.filter = 'drop-shadow(0 0 8px red)';
            }
        }

        function spawnRandomNumbersAndBoss() {
            const container = document.getElementById('black-screen-content');
            if (!container) return;
            
            let numElements = [];
            let interval = setInterval(() => {
                const num = document.createElement('div');
                num.innerText = Math.floor(Math.random() * 10);
                num.style.position = 'absolute';
                num.style.color = 'red';
                num.style.fontFamily = 'monospace';
                num.style.fontSize = Math.floor(Math.random() * 20 + 10) + 'px';
                num.style.left = Math.random() * 100 + '%';
                num.style.top = Math.random() * 100 + '%';
                num.style.transition = 'all 2s ease';
                container.appendChild(num);
                numElements.push(num);
            }, 50);

            setTimeout(() => {
                clearInterval(interval);
                // Make them form an eye
                numElements.forEach((el, idx) => {
                    const angle = (idx / numElements.length) * Math.PI * 2;
                    const r = 100 + 40 * Math.sin(angle * 2);
                    el.style.left = `calc(50% + ${Math.cos(angle) * r}px)`;
                    el.style.top = `calc(50% + ${Math.sin(angle) * (r * 0.5)}px)`;
                    el.style.color = 'darkred';
                });
                
                // add pupil
                const pupil = document.createElement('div');
                pupil.innerText = '0';
                pupil.style.position = 'absolute';
                pupil.style.color = 'red';
                pupil.style.fontFamily = 'monospace';
                pupil.style.fontSize = '80px';
                pupil.style.left = '50%';
                pupil.style.top = '50%';
                pupil.style.transform = 'translate(-50%, -50%)';
                pupil.style.opacity = '0';
                pupil.style.transition = 'opacity 2s ease';
                container.appendChild(pupil);
                
                setTimeout(() => { pupil.style.opacity = '1'; }, 500);

                window._spawnBossTimeout = setTimeout(() => {
                    startBossFight();
                }, 4000);
            }, 5000); 
        }

        setLanguage('en');

        function shareEnding(type) {
            audioEngine.playClick();
            let text = "";
            if (type === 'good') {
                text = translations[currentLang].shareGoodText;
            } else if (type === 'sacrifice') {
                text = translations[currentLang].shareSacrificeText;
            } else if (type === 'solo') {
                text = translations[currentLang].shareSoloText;
            }
            
            navigator.clipboard.writeText(text).then(() => {
                alert(translations[currentLang].copySuccess);
            }).catch(() => {
                alert(translations[currentLang].copyError);
            });
        }

        function shareFakeWin() {
            audioEngine.playClick();
            
            const text = translations[currentLang].shareFakeWinText.replace('{playerName}', playerName);
            navigator.clipboard.writeText(text).then(() => {
                alert(translations[currentLang].copySuccess);
            }).catch(() => {});
            
            audioEngine.playGlitchSound();
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(255,0,0,0.4);z-index:99999;pointer-events:none;';
            document.body.appendChild(flash);
            
            setTimeout(() => {
                flash.remove();
                audioEngine.stopGlitchSound();
                
                const browserContent = document.getElementById('browser-content');
                if (browserContent && browserContent.firstElementChild) {
                    browserContent.firstElementChild.style.transition = 'background 0.5s, color 0.5s';
                    browserContent.firstElementChild.style.background = 'black';
                    audioEngine.playError(0.2);
                    const fwb = document.getElementById('fake-win-btns');
                    if (fwb) fwb.style.display = 'none';
                    
                    setTimeout(() => {
                        const el1 = document.getElementById('ending-text-1');
                        if (el1) { el1.style.position='relative'; el1.style.opacity='1'; }
                        audioEngine.playError(0.2);
                    }, 800);
                    
                    setTimeout(() => {
                        const el2 = document.getElementById('ending-text-2');
                        if (el2) { el2.style.position='relative'; el2.style.top='auto'; el2.style.opacity='1'; }
                        audioEngine.playError(0.4);
                    }, 1800);
                    
                    setTimeout(() => { triggerBSOD(); }, 4000);
                }
            }, 600);
        }


