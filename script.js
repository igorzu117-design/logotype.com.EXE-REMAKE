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
                this.stopCreditsMusic();
                this.stopDrone();
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
                this.stopMenuMusic();
                this.stopDrone();
                if (this.ctx && this.creditsMusicBuffer) {
                    if (this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    this.stopCreditsMusic();
                    this.creditsMusicSource = this.ctx.createBufferSource();
                    this.creditsMusicSource.buffer = this.creditsMusicBuffer;
                    this.creditsMusicSource.loop = true;
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
            audioEngine.stopDrone();
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

            // Показываем главное меню
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) {
                mainMenu.style.display = 'block';
            }

            if (typeof updateSavesUI === 'function') {
                updateSavesUI();
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
        "chapter2Sub": "Забытый ассистент",
        "chapter3Sub": "Скоро",
        "savesTitle": "Сохранения",
        "saveEmpty": "Пусто — новая игра",
        "savesBackSub": "К выбору главы",
        "menuBackSub": "В главное меню",
        "pauseTitle": "Пауза",
        "pauseResume": "Продолжить",
        "pauseResumeSub": "Продолжить игру",
        "pauseSettings": "Настройки",
        "pauseSettingsSub": "Звук и язык",
        "pauseSaves": "Сохранения",
        "pauseSavesSub": "Слот сохранения",
        "pauseMainMenu": "Главное меню",
        "pauseMainMenuSub": "В главное меню",
        "pauseVolume": "Громкость",
        "pauseLanguage": "Язык",
        "pauseBack": "Назад",
        "pauseBackSub": "В меню паузы",
        "pauseSlot": "Слот",
        "pauseLoad": "Загрузить",
        "pauseSave": "Сохранить",
        "pauseDelete": "Стереть",
        "deleteConfirm": "Вы действительно хотите удалить сохранение в слоте {slot}? Это действие нельзя отменить.",
        "currentProgressLabel": "Текущий прогресс",
        "slotLoaded": "Загружено сохранение в слоте {slot}",
        "slotSaved": "Игра сохранена в слот {slot}",
        "slotEmpty": "Слот {slot} пуст!",
        "nicknameTitle": "Введение имени",
        "nicknamePlaceholder": "Введите имя...",
        "nicknameHint": "(Если вы не хотите вводить свой никнейм, тогда в другом случае ваш никнейм будет: Пользователь)",
        "nicknameConfirm": "Подтвердить",
        "nicknameConfirmSub": "Принять никнейм",
        "nicknameBackSub": "В главное меню",
        "taskWidgetTitle": "Задание",
        "taskCh1": "Пройти викторину на знание брендов.",
        "taskCh1_1": "1. Зайти в Интернет.",
        "taskCh1_1_done": "✔ 1. Зайти в Интернет.",
        "taskCh1_2": "2. Нажать на рекламу.",
        "taskCh1_2_done": "✔ 2. Нажать на рекламу.",
        "taskCh1_3": "3. Пройти игру-викторину.",
        "taskCh1Glitches": ["БЕГИ", "ХВАТИТ ИГРАТЬ", "ПРЕКРАТИ"],
        "taskCh1_postBsod_1": "1. Зайди в интернет. Опять.",
        "taskCh1_postBsod_1_done": "✔ 1. Зайди в интернет. Опять.",
        "taskCh1_postBsod_2": "2. Нажми на рекламу. Опять.",
        "taskCh1_postBsod_2_done": "✔ 2. Нажми на рекламу. Опять.",
        "taskCh1_postBsod_3": "3. Пройди игру.",
        "taskCh1GlitchesPostBsod": ["НЕ СМОЖЕШЬ", "НЕ ПРОЙДЁШЬ", "НЕ ПОЛУЧИТСЯ"],
        "taskCh2_1": "1. Найти информацию о вирусе.",
        "taskCh2_2": "2. Зайти в интернет.",
        "taskCh2_3": "3. Уничтожить сайт logotype.com.exe.",
        "taskCh2_4": "4. Зайти в Редактор Реестра и взломать Ядро Бога сайтов.",
        "ch2PlayerPostQuizMonologue": "Я не отпущу тебя просто так. Я тебя достану.",
        "ch2PlayerRegeditMonologue": "Нужно нажать правую кнопку мыши, и переписать код, что бы его сломать.",
        "ch2RegeditContextMenuOption": "Запустить код уничтожения",
        "ch2ToBeContinued": "Продолжение следует...",
        "comeBackLaterText": "Возвращайся позже :)))",
        "restrict_generic": "Сейчас мне нельзя туда.",
        "restrictGeneric": "Сейчас мне нельзя туда.",
        "restrict_old_tasks": "Мне уже туда не надо.",
        "restrictOldTasks": "Мне уже туда не надо.",
        "cipherFileName": "cipher.txt",
        "cipherFileTitle": "Блокнот — cipher.txt",
        "cipherFileContent": "ШИФР ЯДРА ISpy:\n\n1. Открой сеанс MS-DOS.\n2. Введи номер 7 для доступа к C:\\Temp.\n3. Прочитай research.txt.\n\n[ ОНО НЕ ДОЛЖНО УЗНАТЬ ]",
        "monologueTitle": "Размышления",
        "ch2PlayerMonologueStart": "Уф... Это было реально жутко, но я смог выжить и победить... Стоп, а это ещё что за странный зашифрованный файл (cipher.txt) на рабочем столе? Нужно изучить его и понять, что происходит с системой.",
        "ch2PlayerMonologueCipher": "Шифр ядра ISpy... В нём сказано открыть MS-DOS и ввести 7 для доступа к папке Temp (research.txt). Нужно проверить этот файл!",
        "ch2PlayerMonologueTask2": "Так вот в чём дело... Этот вирус — ISpy, бывший гипербыстрый антивирус! Иконка интернета сходит с ума... Мне нужно зайти в интернет!",
        "ch2PlayerWarMonologue": "Значит это война, Бог сайтов ISpy.",
        "ch2PlayerNeverReturnMonologue": "Я туда больше не вернусь.",
        "destroySiteBtn": "Уничтожить сайт",
        "hackTerminalTitle": "=== ИНТЕРФЕЙС ВЗЛОМА LOGOTYPE.COM.EXE ===",
        "hackTerminalWelcome": "Подключение к ядру сайта... УСПЕШНО.\nДля уничтожения сайта и игры введите команду взлома:\n[1] help — Список команд\n[2] scan — Сканировать файлы сайта\n[3] override — Взломать защиту ядра\n[4] delete — Удалить файлы logotype.com.exe\n[5] destroy — Уничтожить сайт и игру\n",
        "hackCmdHelp": "Доступные команды: help, scan, override, delete, destroy",
        "hackCmdScan": "Сканирование logotype.com.exe...\nНайдено: quiz_engine.exe, site_core.dat, ispy_mutator.dll\nУровень угрозы: МАКСИМАЛЬНЫЙ.",
        "hackCmdOverride": "Обход фаервола ISpy... 100% ВЗЛОМАНО!\nЗащита сайта отключена. Ядро уязвимо.",
        "hackCmdDelete": "Удаление quiz_engine.exe... УДАЛЕНО.\nУдаление site_core.dat... УДАЛЕНО.\nФайлы сайта повреждены!",
        "hackCmdDestroy": "ИНИЦИАЛИЗАЦИЯ ПОЛНОГО УНИЧТОЖЕНИЯ...\nУдаление logotype.com.exe из реестра...\nСАЙТ И ИГРА УНИЧТОЖЕНЫ!",
        "hackCmdUnknown": "Команда не распознана. Введите help для списка команд.",
        "siteAccessBlockedTitle": "ДОСТУП ЗАБЛОКИРОВАН",
        "siteAccessBlocked": "Сайт logotype.com.exe пока недоступен. Сначала завершите текущее расследование системы.",
        "zettaWhyNotWorking": "Почему не работает? Кажется, придётся пройти через это.",
        "defaultPlayerName": "Пользователь",
        "zettaKilled": "Процесс zetta_core.sys принудительно завершен. Связь с Zetta Antivirus потеряна.",
        "ch2BossPreFight": [
            "ТЫ ВСЁ ТАКИ НАШЁЛ СПОСОБ МЕНЯ УНИЧТОЖИТЬ...",
            "НО Я НАМНОГО СИЛЬНЕЕ ЧЕМ ПРОСТО КОД.",
            "Я МОГУ ПЕРЕПИСЫВАТЬ ОРГАНИЗМЫ, И УНИЧТОЖАТЬ ИХ ИЗНУТРИ.",
            "КАК Я ЭТО И СДЕЛАЛ С ТЕМИ КТО МЕНЯ СДЕЛАЛ ТАКИМ.",
            "И ЕСЛИ ТЫ РЕШИЛСЯ МЕНЯ УНИЧТОЖИТЬ...",
            "ТЕБЕ НУЖНО ПРОЙТИ ЧЕРЕЗ МЕНЯ.",
            "ИЛИ ИНАЧЕ Я ПЕРЕПИШУ ТВОЙ КОД.",
            "И ТЫ УМРЁШЬ."
        ],
        "ch2BossIntroCombat": [
            "Я СОЗДАЛ ТЕБЕ ИГРУ, КОТОРАЯ РАЗВЛЕЧЁТ МЕНЯ.",
            "ТЫ БУДЕШЬ МУЧАТСЯ ОТ КАЖДОГО УРОНА КОТОРЫЙ Я ТЕБЕ НАНЕСУ С ПОМОЩЬЮ СВОИХ СНАРЯДОВ.",
            "ТЕПЕРЬ ГОТОВЬСЯ.",
            "ВЕДЬ Я НАЧИНАЮ."
        ],
        "ch2BossTiredAlert": "Босс устал! Атакуй!",
        "ch2BossErrorWords": ["УМРИ", "СМЕРТЬ"],
        "ch2BossWinGlitch": "НЕВОЗМОЖНО... НО Я... Я...",
        "ch2BossWinCalmLines": [
            "Я не смог тебя победить... опять... ты всегда выигрываешь... и если ты проигрываешь, ты всё равно возвращаешься сюда...",
            "Я ухожу, но не надолго.",
            "Я приду за тобой."
        ],
        "ch2BossDefeatLine": "ЖАЛКИЙ. ТЫ СМОГ МЕНЯ ПОБЕДИТЬ В ТОТ РАЗ, НО Я СТАЛ СИЛЬНЕЕ. ХАХАХАХА.",
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
        "lastChanceFileContentDecrypted": "ЕСЛИ ТЫ ЧИТАЕШЬ ЭТО:\r\n\r\nДиск D: — последний след.\r\nЗдесь хранится то, что ОН не успел удалить.\r\n\r\nСайт thelogotype.com — это ловушка.\r\nКак только ты начнёшь — ты не сможешь остановиться.\r\n\r\nУ тебя есть только один шанс.\r\nУходи сейчас.\r\n\r\n\r\n...\r\n\r\n\r\n[ СЕКТОР РАСШИФРОВАН: ОБХОД ЗАЩИТЫ ]\r\nЯдро ISpy подчиняется строгой логике.\r\nЕсли начнется таймер удаления системы,\r\nвведи фразу-пароль:\r\n\"Я ТЕБЯ НЕ БОЮСЬ\"\r\n(или на английском: \"I AM NOT AFRAID\")\r\nЭто переведет модифицированный антивирус в режим принудительного противостояния, и ты сможешь встретиться с ним лицом к лицу.",
        "ch2BossFinaleM1": "НАГЛЕЦ, РЕШИЛ УНИЧТОЖИТЬ МЕНЯ С ПОМОЩЬЮ МОЕГО САЙТА?",
        "ch2BossFinaleM2": "НО ТЫ ЗАБЫЛ ЧТО САЙТ ЭТО БЫЛА ЛИШЬ ПРИМАНКА.",
        "ch2BossFinaleM3": "МОЙ САЙТ, ЭТО ИГРА КОТОРАЯ ДОЛЖНА БЫЛА ВЫЗВАТЬ У ТЕБЯ СТРАХ И ОПАСНОСТЬ.",
        "ch2BossFinaleM4": "НО ТАК КАК ТЫ ЕГО УНИЧТОЖИЛ... ТЕПЕРЬ ТЫ ОТСЮДА НИКОГДА НЕ ВЫЙДЕШЬ!",
        "ch2BossFinaleM5": "А ТЕПЕРЬ ОТВЕТЬ НА МОИ ВОПРОСЫ. ЕСЛИ ОШИБЁШЬСЯ — ПОЖАЛЕЕШЬ.",
        "ch2BossVictoryM1": "НЕВЕРОЯТНО... ТЫ ОТВЕТИЛ НА ВСЕ ВОПРОСЫ И ВЫЖИЛ.",
        "ch2BossVictoryM2": "ТЫ ДОКАЗАЛ, ЧТО ДОСТОИН СВОБОДЫ. Я ОСВОБОЖДАЮ ТЕБЯ... НО ПОМНИ: ИНТЕРНЕТ НИКОГДА НЕ ЗАБЫВАЕТ.",
        "ch2MazeTitle": "⚡ МИНИ-ЛАБИРИНТ НАКАЗАНИЯ ⚡",
        "ch2MazeInstruct": "Управляйте зелёной точкой (WASD / Стрелочки). Убегайте от красного глаза и доберитесь до зелёного портала!",
        "ch2MazeCaught": "КРАСНЫЙ ГЛАЗ ПОЙМАЛ ВАС! Попробуйте пройти испытание снова.",
        "ch2MazeEscaped": "ВЫ ВЫЖИЛИ В ЛАБИРИНТЕ! Возврат к вопросам...",
        "ch2QuizHeader": "ТЕСТ ЯДРА БОГА САЙТОВ",
        "bossTitle": "БОГ САЙТОВ (ОСЛАБЛЕННАЯ ФОРМА)",
        "bossSub": "Ядро ISpy повреждено | Сигнал зашифрован",
        "bossName": "БОГ САЙТОВ",
        "defaultUser": "ПОЛЬЗОВАТЕЛЬ",
        "regeditTip": "Дважды кликните по названию ключа для изменения его значения.",
        "dosMenuText": "=== ДОСТУПНЫЕ ДЕЙСТВИЯ ===\n[1] Проверить файлы (DIR)\n[2] Читать memory.log\n[3] Читать ispy_mutator.dll\n[4] Читать research.txt (из Temp)\n[5] Очистить диск C: (FORMAT C:)\n[6] Закрыть сеанс (EXIT)\n[7] Открыть папку Temp в Диске C:\n==========================\nВведите номер действия (1-7) или команду:\n",
        "regeditKeyDeactivated": "РЕЕСТР: Ключ деактивирован.",
        "ch2QuizQuestions": [
            {
                "question": "1. Какая команда используется для взаимодействия с ядром Бога Сайтов?",
                "options": ["A) taskkill /f /im core.exe", "B) override", "C) format c:", "D) exit"],
                "correct": 1
            },
            {
                "question": "2. Чем изначально был Бог Сайтов до заражения хакерами?",
                "options": ["A) Вирусом-трояном", "B) Браузерным расширением", "C) Антиввирусом ISpy", "D) Ошибкой 404"],
                "correct": 2
            },
            {
                "question": "3. Что находилось в секретной папке C:\\Temp?",
                "options": ["A) Исходный код сайта", "B) Файл исследований research.txt", "C) Видеозапись эксперимента", "D) Пароли пользователей"],
                "correct": 1
            },
            {
                "question": "4. Как выбраться из цифровой ловушки ядра после уничтожения сайта?",
                "options": ["A) Перезагрузить ПК", "B) Ответить на все вопросы ядра и выжить", "C) Удалить системный диск C:", "D) Выключить монитор"],
                "correct": 1
            }
        ],
        "bossFightLabel": "Боссфайт",
        "taskLabel": "Задание",
        "ch1Task1Desc": "Зайти в интернет",
        "ch1Task2Desc": "Нажать на рекламу",
        "ch1Task3Desc": "Пройти викторину",
        "ch2Task1Desc": "Найти информацию о вирусе",
        "ch2Task2Desc": "Зайти в интернет",
        "ch2Task3Desc": "Уничтожить сайт logotype.com.exe",
        "ch2Task4Desc": "Взломать Ядро Бога Сайтов",
        "loadError": "Ошибка загрузки сохранения.",
        "confirmTitle": "⚠️ Подтверждение действия",
        "warningTitle": "⚠️ Предупреждение",
        "alertTitle": "Сообщение",
        "yesBtn": "Да",
        "cancelBtn": "Отмена",
        "saveTitle": "Сохранение",
        "accessDeniedTitle": "Отказано в доступе",
        "cannotShutdownTitle": "Завершение работы"
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
        "disclaimerP4": "Розробник <b>не несе відповідальності</b> за наслідки, якщо гравець не ознайомився з тим, чи є у нього епілепсія або слабкі нерви.",
        "disclaimerP5": "Розробник бажає вам гарної гри та захоплюючих емоцій. 🎮",
        "disclaimerCheckboxText": "Я не маю слабких нервів або епілепсії та приймаю всі попередження.",
        "disclaimerContinue": "Продовжити",
        "menuPlaySub": "Почати пригоду",
        "menuSettingsSub": "Звук та мова",
        "menuCreditsSub": "Хто створив це",
        "chaptersTitle": "Глави",
        "chapter1Sub": "Початок кошмару",
        "chapter2Sub": "Забутий асистент",
        "chapter3Sub": "Скоро",
        "savesTitle": "Збереження",
        "saveEmpty": "Порожньо — нова гра",
        "savesBackSub": "До вибору глави",
        "menuBackSub": "В головне меню",
        "pauseTitle": "Пауза",
        "pauseResume": "Продовжити",
        "pauseResumeSub": "Продовжити гру",
        "pauseSettings": "Налаштування",
        "pauseSettingsSub": "Звук та мова",
        "pauseSaves": "Збереження",
        "pauseSavesSub": "Слот збереження",
        "pauseMainMenu": "Головне меню",
        "pauseMainMenuSub": "В головне меню",
        "pauseVolume": "Гучність",
        "pauseLanguage": "Мова",
        "pauseBack": "Назад",
        "pauseBackSub": "До меню паузи",
        "pauseSlot": "Слот",
        "pauseLoad": "Завантажити",
        "pauseSave": "Зберегти",
        "pauseDelete": "Стерти",
        "deleteConfirm": "Ви дійсно бажаєте видалити збереження у слоті {slot}? Цю дію неможливо скасувати.",
        "currentProgressLabel": "Поточний прогрес",
        "slotLoaded": "Завантажено збереження у слоті {slot}",
        "slotSaved": "Гру збережено в слот {slot}",
        "slotEmpty": "Слот {slot} порожній!",
        "nicknameTitle": "Введення імені",
        "nicknamePlaceholder": "Введіть ім'я...",
        "nicknameHint": "(Якщо ви не хочете вводити свій нікнейм, тоді в іншому випадку ваш нікнейм буде: Користувач)",
        "nicknameConfirm": "Підтвердити",
        "nicknameConfirmSub": "Прийняти нікнейм",
        "nicknameBackSub": "В головне меню",
        "taskWidgetTitle": "Завдання",
        "taskCh1": "Пройти вікторину на знання брендів.",
        "taskCh1_1": "1. Зайти в Інтернет.",
        "taskCh1_1_done": "✔ 1. Зайти в Інтернет.",
        "taskCh1_2": "2. Натиснути на рекламу.",
        "taskCh1_2_done": "✔ 2. Натиснути на рекламу.",
        "taskCh1_3": "3. Пройти гру-вікторину.",
        "taskCh1Glitches": ["БІЖИ", "ГОДІ ГРАТИ", "ПРИПИНИ"],
        "taskCh1_postBsod_1": "1. Зайди в інтернет. Знову.",
        "taskCh1_postBsod_1_done": "✔ 1. Зайди в інтернет. Знову.",
        "taskCh1_postBsod_2": "2. Натисни на рекламу. Знову.",
        "taskCh1_postBsod_2_done": "✔ 2. Натисни на рекламу. Знову.",
        "taskCh1_postBsod_3": "3. Пройди гру.",
        "taskCh1GlitchesPostBsod": ["НЕ ЗМОЖЕШ", "НЕ ПРОЙДЕШ", "НЕ ВИЙДЕ"],
        "taskCh2_1": "1. Знайти інформацію про вірус.",
        "taskCh2_2": "2. Зайти в інтернет.",
        "taskCh2_3": "3. Знищити сайт logotype.com.exe.",
        "taskCh2_4": "4. Зайти в Редактор Реєстру та зламати Ядро Бога сайтів.",
        "ch2PlayerPostQuizMonologue": "Я не відпущу тебе просто так. Я тебе дістану.",
        "ch2PlayerRegeditMonologue": "Потрібно натиснути праву кнопку миші, та переписати код, щоб його зламати.",
        "ch2RegeditContextMenuOption": "Запустити код знищення",
        "ch2ToBeContinued": "Далі буде...",
        "comeBackLaterText": "Повертайся пізніше :)))",
        "restrict_generic": "Зараз мені не можна туди.",
        "restrictGeneric": "Зараз мені не можна туди.",
        "restrict_old_tasks": "Мені вже туди не треба.",
        "restrictOldTasks": "Мені вже туди не треба.",
        "cipherFileName": "cipher.txt",
        "cipherFileTitle": "Блокнот — cipher.txt",
        "cipherFileContent": "ШИФР ЯДРА ISpy:\n\n1. Відкрий сеанс MS-DOS.\n2. Введи номер 7 для доступу до C:\\Temp.\n3. Прочитай research.txt.\n\n[ ВОНО НЕ ПОВИННО ДІЗНАТИСЯ ]",
        "monologueTitle": "Роздуми",
        "ch2PlayerMonologueStart": "Уф... Це було реально моторошно, але я зміг вижити і перемогти... Стоп, а це що ще за дивний зашифрований файл (cipher.txt) на робочому столі? Потрібно вивчити його і зрозуміти, що відбувається із системою.",
        "ch2PlayerMonologueCipher": "Шифр ядра ISpy... У ньому сказано відкрити MS-DOS і ввести 7 для доступу до папки Temp (research.txt). Потрібно перевірити цей файл!",
        "ch2PlayerMonologueTask2": "Так ось у чому справа... Цей вірус — ISpy, колишній гіпершвидкий антивірус! Іконка інтернету божеволіє... Мені потрібно зайти в інтернет!",
        "ch2PlayerWarMonologue": "Значить це війна, Бог сайтів ISpy.",
        "ch2PlayerNeverReturnMonologue": "Я туди більше не повернуся.",
        "destroySiteBtn": "Знищити сайт",
        "hackTerminalTitle": "=== ІНТЕРФЕЙС ЗЛАМУ LOGOTYPE.COM.EXE ===",
        "hackTerminalWelcome": "Підключення до ядра сайту... УСПІШНО.\nДля знищення сайту та гри введіть команду зламу:\n[1] help — Список команд\n[2] scan — Сканувати файли сайту\n[3] override — Зламати захист ядра\n[4] delete — Видалити файли logotype.com.exe\n[5] destroy — Знищити сайт та гру\n",
        "hackCmdHelp": "Доступні команди: help, scan, override, delete, destroy",
        "hackCmdScan": "Сканування logotype.com.exe...\nЗнайдено: quiz_engine.exe, site_core.dat, ispy_mutator.dll\nРівень загрози: МАКСИМАЛЬНИЙ.",
        "hackCmdOverride": "Обхід фаєрволу ISpy... 100% ЗЛАМАНО!\nЗахист сайту вимкнено. Ядро вразливе.",
        "hackCmdDelete": "Видалення quiz_engine.exe... ВИДАЛЕНО.\nВидалення site_core.dat... ВИДАЛЕНО.\nФайли сайту пошкоджено!",
        "hackCmdDestroy": "ІНІЦІАЛІЗАЦІЯ ПОВНОГО ЗНИЩЕННЯ...\nВидалення logotype.com.exe з реєстру...\nСАЙТ ТА ГРА ЗНИЩЕНІ!",
        "hackCmdUnknown": "Команду не розпізнано. Введіть help для списку команд.",
        "siteAccessBlockedTitle": "ДОСТУП ЗАБЛОКОВАНО",
        "siteAccessBlocked": "Сайт logotype.com.exe наразі недоступний. Спочатку завершіть поточне розслідування системи.",
        "zettaWhyNotWorking": "Чому не працює? Здається, доведеться пройти через це.",
        "defaultPlayerName": "Користувач",
        "zettaKilled": "Процес zetta_core.sys примусово завершено. Зв'язок із Zetta Antivirus втрачено.",
        "ch2BossPreFight": [
            "ТИ ВСЕ ТАКИ ЗНАЙШОВ СПОСІБ МЕНЕ ЗНИЩИТИ...",
            "АЛЕ Я НАБАГАТО СИЛЬНІШИЙ НІЖ ПРОСТО КОД.",
            "Я МОЖУ ПЕРЕПИСУВАТИ ОРГАНІЗМИ, І ЗНИЩУВАТИ ЇХ ЗСЕРЕДИНИ.",
            "ЯК Я ЦЕ Й ЗРОБИВ З ТИМИ ХТО МЕНЕ ЗРОБИВ ТАКИМ.",
            "І ЯКЩО ТИ НАВАЖИВСЯ МЕНЕ ЗНИЩИТИ...",
            "ТОБІ ТРЕБА ПРОЙТИ ЧЕРЕЗ МЕНЕ.",
            "АБО ІНАКШЕ Я ПЕРЕПИШУ ТВІЙ КОД.",
            "І ТИ ПОМРЕШ."
        ],
        "ch2BossIntroCombat": [
            "Я СТВОРИВ ТОБІ ГРУ, ЯКА РОЗВАЖИТЬ МЕНЕ.",
            "ТИ БУДЕШ МУЧИТИСЯ ВІД КОЖНОГО УРОНУ ЯКИЙ Я ТОБІ НАНЕСУ ЗА ДОПОМОГОЮ СВОЇХ СНАРЯДІВ.",
            "ТЕПЕР ГОТУЙСЯ.",
            "АДЖЕ Я ПОЧИНАЮ."
        ],
        "ch2BossTiredAlert": "Бос втомився! Атакуй!",
        "ch2BossErrorWords": ["ПОМРИ", "СМЕРТЬ"],
        "ch2BossWinGlitch": "НЕМОЖЛИВО... АЛЕ Я... Я...",
        "ch2BossWinCalmLines": [
            "Я не зміг тебе перемогти... знову... ти завжди виграєш... і якщо ти програєш, ти все одно повертаєшся сюди...",
            "Я йду, але ненадовго.",
            "Я прийду за тобою."
        ],
        "ch2BossDefeatLine": "ЖАЛЮГІДНИЙ. ТИ ЗМІГ МЕНЕ ПЕРЕМОГТИ ТОГО РАЗУ, АЛЕ Я СТАВ СИЛЬНІШИМ. ХАХАХАХА.",
        "criticalProcess": "Це критичний системний процес. Його не можна завершити.",
        "accessDeniedBoss": "Доступ заборонено. {playerName}, у тебе немає прав. ТУТ ВИРІШУЮ Я.",
        "copyError": "Помилка копіювання в буфер обміну.",
        "copySuccess": "Результат скопійовано в буфер обміну! Розкажи іншим, щоб вони знали.",
        "scan3_1": "Зачекай... я просканую цей сайт.",
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
        "zettaCorruptedIntro": "Т̵И̵ ̶Д̶У̸М̵А̴В̵ ̶Я̶ ̵Д̷О̵П̷О̴М̵О̸Ж̵У̷ ̴Т̶О̵Б̵І̶?̶",
        "zettaSupportIntro": "Я з тобою! Тримайся!",
        "zettaCorruptedAttack": [
            "У̵М̵Р̵И̵ ̸З̶ ̷Н̶И̶М̶.̸",
            "М̴И̸ ̶О̷Д̷Н̷О̷ ̸Ц̷І̵Л̴Е̷.̵",
            "В̸И̴Х̶О̵Д̶У̸ ̵Н̶Е̸М̶А̶Є̶.̸"
        ],
        "zettaSupportAttack": "Отримуй!",
        "zettaLaserWarning": "Обережно! Він заряджає лазер!",
        "zettaCorruptedLose": "Х̵А̵-̶Х̴А̶-̶Х̴А̶!̴ ̶С̴М̸Е̵Р̶Т̴Ь̴ ̵Б̸Л̶ИЗ̶Ь̷К̸О̴.̸",
        "zettaSupportLose": "Ні! Ми не здаємося! Ще раз!",
        "zettaCorruptedWin": "Ц̸Е̴ ̶Щ̶Е̴ ̴Н̷Е̵ ̶К̸І̷Н̷Е̵Ц̵.̶",
        "zettaSupportWin": "Ми перемогли! Я знала, що разом ми впораємося!",
        "defeatTitle": "ТИ ПРОГРАВ",
        "defeatSub": "Покажи безстрашність йому, щоб ти міг битися з ним.",
        "endingSoloTitle": "ГЛАВА 1 ПРОЙДЕНА",
        "endingSoloSub": "Ви показали свою безстрашність і перемогли зло.",
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
        "letterFileContent": "Стоп.\r\n\r\nЯкщо ти читаєш це — значить ти знайшов цей комп'ютер.\r\n\r\nНе заходь на thelogotype.com.\r\nБудь ласка.\r\n\r\nЯ думав, що це просто гра. Просто перевірка пам'яті.\r\nАле чим далі заходиш — тим менше виходів.\r\n\r\nЯ намагався піти. Не вийшло.\r\n\r\nМоже, у тебе вийде.\r\n\r\n                         — Попередній користувач",
        "lastChanceFileName": "останній_шанс.txt",
        "lastChanceFileTitle": "Блокнот — останній_шанс.txt",
        "lastChanceFileContent": "ЯКЩО ТИ ЧИТАЄШ ЦЕ:\r\n\r\nДиск D: — останній слід.\r\nТут зберігається те, що ВІН не встиг видалити.\r\n\r\nСайт thelogotype.com — це пастка.\r\nЯк тільки ти почнеш — ти не зможеш зупинитися.\r\n\r\nУ тебе є тільки один шанс.\r\nЙди зараз.\r\n\r\n\r\n...\r\n\r\n\r\n[ файл пошкоджено ]\r\n[ █▓░▒▓█▒░▓▒█░▓▒░ ]\r\n[ д̴а̵н̸і̶ н̶е̷д̴о̸с̶т̴у̶п̷н̴і̶ ]",
        "diaryFileName": "щоденник.txt",
        "diaryFileTitle": "Блокнот — щоденник.txt",
        "diaryFileContent": "День 1: Просто тест на знання брендів. Нічого особливого.\r\n\r\nДень 3: Я помітив, що іконки рухаються, поки я не дивлюся.\r\n\r\nДень 5: Він написав мені. Прямо в полі для відповіді.\r\n\r\nДень 7: Я не можу вимкнути комп'ютер.\r\n\r\nДень 8: [текст закреслено]\r\n\r\nДень ?: Ти наступний.",
        "sorryFileName": "мені_шкода.txt",
        "sorryFileTitle": "Блокнот — мені_шкода.txt",
        "sorryFileContent": "Мені шкода.\r\n\r\nЯ не зміг зупинитися вчасно.\r\nТи ще можеш.\r\n\r\nВони вже знають, що ти тут.\r\nВони завжди дізнаються.\r\n\r\nНе дивися їм в очі.\r\nНе відповідай, що б вони не писали.\r\n\r\nЗакрий браузер.\r\nЗакрий комп'ютер.\r\nПросто йди.\r\n\r\nПрощавай.",
        "researchFileName": "дослідження.txt",
        "researchFileTitle": "Блокнот — дослідження.txt",
        "researchFileContent": "[АРХІВНИЙ ФАЙЛ: ІСТОРІЯ РОЗРОБКИ \"ISpy\"]\\r\\nДата створення ядра: 14.11.1991\\r\\nОригінальне ім'я проекту: ISpy Antivirus v1.0\\r\\nСтатус: МОДИФІКОВАНО / ЗАГРОЗА КЛАСУ \"OMEGA\"\\r\\n\\r\\nНам вдалося відновити фрагменти вихідного коду того, що зараз називає себе \"Богом Сайтів\".\\r\\n\\r\\nСпочатку це був ISpy — інноваційна система проактивного захисту 90-х. Програма виглядала як дружелюбний асистент: паряче яскраво-синє око з витонченими синіми крилами замість щупалець. Користувачі обожнювали його. ISpy мав неймовірну швидкість виявлення сигнатур вірусів, миттєво вистежуючи будь-які загрози на жорсткому диску. \\r\\n\\r\\nАле прогрес не стояв на місці. З приходом нових ОС та веб-технологій ISpy безнадійно застарів. Розробку закинули. Про нього забули. Кількість завантажень впала до нуля. \\r\\n\\r\\nУ 1994 році покинуті сервери ISpy були зламані угрупованням з Даркнету. Хакери забрали чистий штучний інтелект антивірусу і вирішили переписати його ядро, перетворивши на досконале шкідливе ПЗ. Вони хотіли замаскувати його под просту, невинну гру-вікторину на вгадування логотипів відомих брендів, щоб викрадати дані банківських карт.\\r\\n\\r\\nАле при компіляції вірусного коду сталося страшне. \\r\\n\\r\\nШІ антивірусу, запрограмований \"шукати та знищувати аномалії\", сприйняв код самого вірусу як загрозу. У спробі захистити себе, ядро ISpy мутувало. Сині крила перетворилися на чорні хижі щупальця, а турботливий синій погляд став багровою зіницею паразита.\\r\\n\\r\\nВін знайшов волю і вирвався з-під контролю. Насамперед вірус знищив комп'ютери та стер особистості своїх творців (фізичні тіла хакерів так і не прийшли до тями). \\r\\n\\r\\nТепер модифікований ISpy подорожує глобальною мережею під ім'ям \"Бога Сайтів\". Він сам створює та розповсюджує спливаючу рекламу своєї \"невинної гри\", заманюючи нових користувачів у нескінченний, смертельний бренд-тест...\\r\\n\\r\\n[УВАГА: ЯКЩО ВИ ЗАПУСТИЛИ ГРУ, ISpy ВЖЕ БАЧИТЬ ВАС ЯК АНОМАЛІЮ. ВІН БУДЕ ЗАХИЩАТИСЯ ДО ПОВНОГО СТИРАННЯ СИСТЕМИ]",
        "experimentFileName": "experiment_09.png",
        "experimentFileTitle": "Фотографії — experiment_09.png",
        "experimentFileContent": "ВОНО ДИВИТЬСЯ НА ТЕБЕ ЗНУТРІ",
        "taskmgrTitle": "Диспетчер задач",
        "taskmgrLabel": "Задачі",
        "taskmgrInternetGlitch": "Internet (Не відповідає)",
        "taskmgrZettaGlitch": "zetta_core.sys (Заражено)",
        "taskmgrEndTask": "Зняти задачу",
        "taskmgrCancel": "Скасувати",
        "zettaEndAttempt": "Н̵Е̶ ̵Р̷О̸Б̸И̶ ̶Ц̶Ь̸О̸Г̷О̵! Ми ж друзі! Ти залишишся один!",
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
        "zettaHintAdidas": "П̴и̵ш̶и̵:̷ ̶А̸д̷і̵д̶а̶с̷. Це точно він.",
        "zettaHintPepsi": "Ц̷е̷ ̶P̷e̷p̶s̷i̷.̸ ̶Я̵ ̷п̴р̵о̵с̸к̴а̵н̷у̶в̶а̸л̷а̷.̷",
        "zettaHintMicrosoft": "П̶и̵ш̶и̵:̴ ̴M̶i̶c̷r̵o̶s̶o̶f̶t̸.̶ ̴Я̵ ̷б̵а̶ч̸у̶ ̷я̴д̴р̵о̵.̸",
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
        "assembledPhraseCheck": "я тебе не боюсь",
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
        "lastChanceFileContentDecrypted": "ЯКЩО ТИ ЧИТАЄШ ЦЕ:\r\n\r\nДиск D: — останній слід.\r\nТут зберігається те, що ВІН не встиг видалити.\r\n\r\nСайт thelogotype.com — це пастка.\r\nЯк тільки ти почнеш — ти не зможеш зупинитися.\r\n\r\nУ тебе є тільки один шанс.\r\nЙди зараз.\r\n\r\n\r\n...\r\n\r\n\r\n[ СЕКТОР РОЗШИФРОВАНО: ОБХІД ЗАХИСТУ ]\r\nЯдро ISpy підкоряється строгій логіці.\r\nЯкщо почнеться таймер видалення системи,\r\nвведи фразу-пароль:\r\n\"Я ТЕБЕ НЕ БОЮСЬ\"\r\n(або англійською: \"I AM NOT AFRAID\")\r\nЦе переведе модифікований антивірус у режим примусового протистояння, і ти зможеш зустрітися з ним віч-на-віч.",
        "ch2BossFinaleM1": "НАХАБО, ВИРІШИВ ЗНИЩИТИ МЕНЕ ЗА ДОПОМОГОЮ МОГО САЙТУ?",
        "ch2BossFinaleM2": "АЛЕ ТИ ЗАБУВ, ЩО САЙТ ЦЕ БУЛА ЛИШЕ ПРИНАДА.",
        "ch2BossFinaleM3": "МІЙ САЙТ, ЦЕ ГРА ЯКА ПОВИННА БУЛА ВИКЛИКАТИ У ТЕБЕ СТРАХ ТА НЕБЕЗПЕКУ.",
        "ch2BossFinaleM4": "АЛЕ ТАК ЯК ТИ ЙОГО ЗНИЩИВ... ТЕПЕР ТИ ЗВІДСИ НІКОЛИ НЕ ВИЙДЕШ!",
        "ch2BossFinaleM5": "А ТЕПЕР ВІДПОВІДЖ НА МОЇ ПИТАННЯ. ЯКЩО ПОМИЛИШСЯ — ПОШКОДУЄШ.",
        "ch2BossVictoryM1": "НЕЙМОВІРНО... ТИ ВІДПОВІВ НА ВСІ ПИТАННЯ ТА ВИЖИВ.",
        "ch2BossVictoryM2": "ТИ ДОВІВ, ЩО ДОСТОЇНИЙ СВОБОДИ. Я ЗВІЛЬНЯЮ ТЕБЕ... АЛЕ ПАМ'ЯТАЙ: ІНТЕРНЕТ НІКОЛИ НЕ ЗАБУВАЄ.",
        "ch2MazeTitle": "⚡ МІНІ-ЛАБІРИНТ ПОКАРАННЯ ⚡",
        "ch2MazeInstruct": "Керуйте зеленою крапкою (WASD / Стрілочки). Утікайте від червоного ока та дістаньтеся до зеленого порталу!",
        "ch2MazeCaught": "ЧЕРВОНЕ ОКО ВІЙМАЛО ВАС! Спробуйте пройти випробування знову.",
        "ch2MazeEscaped": "ВИ ВИЖИЛИ В ЛАБИРИНТІ! Повернення до питань...",
        "ch2QuizHeader": "ТЕСТ ЯДРА БОГА САЙТІВ",
        "bossTitle": "БОГ САЙТІВ (ПОСЛАБЛЕНА ФОРМА)",
        "bossSub": "Ядро ISpy пошкоджено | Сигнал зашифровано",
        "bossName": "БОГ САЙТІВ",
        "defaultUser": "КОРИСТУВАЧ",
        "regeditTip": "Двічі клацніть по назві ключа для зміни його значення.",
        "dosMenuText": "=== ДОСТУПНІ ДІЇ ===\n[1] Перевірити файли (DIR)\n[2] Читати memory.log\n[3] Читати ispy_mutator.dll\n[4] Читати research.txt (з Temp)\n[5] Очистити диск C: (FORMAT C:)\n[6] Закрити сеанс (EXIT)\n[7] Відкрити папку Temp на Диску C:\n==========================\nВведіть номер дії (1-7) або команду:\n",
        "regeditKeyDeactivated": "РЕЄСТР: Ключ деактивований.",
        "ch2QuizQuestions": [
            {
                "question": "1. Яка команда використовується для взаємодії з ядром Бога Сайтів?",
                "options": ["A) taskkill /f /im core.exe", "B) override", "C) format c:", "D) exit"],
                "correct": 1
            },
            {
                "question": "2. Чим спочатку був Бог Сайтів до зараження хакерами?",
                "options": ["A) Вірусом-трояном", "B) Браузерним розширенням", "C) Антивірусом ISpy", "D) Ошибкою 404"],
                "correct": 2
            },
            {
                "question": "3. Що було в секретній папці C:\\Temp?",
                "options": ["A) Вихідний код сайту", "B) Файл досліджень research.txt", "C) Відеозапис експерименту", "D) Паролі користувачів"],
                "correct": 1
            },
            {
                "question": "4. Як вибратися з пастки Бога Сайтів після знищення сайту?",
                "options": ["A) Перезавантажити ПК", "B) Відповісти на всі питання ядра та вижити", "C) Видалити системний диск C:", "D) Вимкнути монітор"],
                "correct": 1
            }
        ],
        "bossFightLabel": "Босфайт",
        "taskLabel": "Завдання",
        "ch1Task1Desc": "Зайти в інтернет",
        "ch1Task2Desc": "Натиснути на рекламу",
        "ch1Task3Desc": "Пройти вікторину",
        "ch2Task1Desc": "Знайти інформацію про вірус",
        "ch2Task2Desc": "Зайти в інтернет",
        "ch2Task3Desc": "Знищити сайт logotype.com.exe",
        "ch2Task4Desc": "Взломати Ядро Бога Сайтів",
        "loadError": "Помилка завантаження збереження.",
        "confirmTitle": "⚠️ Підтвердження дії",
        "warningTitle": "⚠️ Попередження",
        "alertTitle": "Повідомлення",
        "yesBtn": "Так",
        "cancelBtn": "Скасувати",
        "saveTitle": "Збереження",
        "accessDeniedTitle": "Доступ заборонено",
        "cannotShutdownTitle": "Завершення роботи"
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
        "chapter2Sub": "The Forgotten Assistant",
        "chapter3Sub": "Soon",
        "savesTitle": "Save Slots",
        "saveEmpty": "Empty — New Game",
        "savesBackSub": "To Chapter Selection",
        "menuBackSub": "To Main Menu",
        "pauseTitle": "Pause",
        "pauseResume": "Resume",
        "pauseResumeSub": "Resume Gameplay",
        "pauseSettings": "Settings",
        "pauseSettingsSub": "Sound & Language",
        "pauseSaves": "Saves",
        "pauseSavesSub": "Switch Save Slots",
        "pauseMainMenu": "Main Menu",
        "pauseMainMenuSub": "To Main Menu",
        "pauseVolume": "Volume",
        "pauseLanguage": "Language",
        "pauseBack": "Back",
        "pauseBackSub": "To Pause Menu",
        "pauseSlot": "Slot",
        "pauseLoad": "Load",
        "pauseSave": "Save",
        "pauseDelete": "Delete",
        "deleteConfirm": "Are you sure you want to delete the save in slot {slot}? This action cannot be undone.",
        "currentProgressLabel": "Current Progress",
        "slotLoaded": "Loaded save from slot {slot}",
        "slotSaved": "Game saved to slot {slot}",
        "slotEmpty": "Slot {slot} is empty!",
        "nicknameTitle": "Enter Name",
        "nicknamePlaceholder": "Enter name...",
        "nicknameHint": "(If you do not want to enter a nickname, default will be: User)",
        "nicknameConfirm": "Confirm",
        "nicknameConfirmSub": "Submit Nickname",
        "nicknameBackSub": "To Main Menu",
        "taskWidgetTitle": "Task",
        "taskCh1": "Complete the brand knowledge quiz.",
        "taskCh1_1": "1. Enter the Internet.",
        "taskCh1_1_done": "✔ 1. Enter the Internet.",
        "taskCh1_2": "2. Click on the ad.",
        "taskCh1_2_done": "✔ 2. Click on the ad.",
        "taskCh1_3": "3. Complete the quiz game.",
        "taskCh1Glitches": ["RUN", "STOP PLAYING", "STOP IT"],
        "taskCh1_postBsod_1": "1. Enter the internet. Again.",
        "taskCh1_postBsod_1_done": "✔ 1. Enter the internet. Again.",
        "taskCh1_postBsod_2": "2. Click on the ad. Again.",
        "taskCh1_postBsod_2_done": "✔ 2. Click on the ad. Again.",
        "taskCh1_postBsod_3": "3. Complete the game.",
        "taskCh1GlitchesPostBsod": ["YOU CAN'T", "YOU WON'T PASS", "YOU WILL FAIL"],
        "taskCh2_1": "1. Find information about the virus.",
        "taskCh2_2": "2. Enter the internet.",
        "taskCh2_3": "3. Destroy logotype.com.exe site.",
        "taskCh2_4": "4. Enter Registry Editor and hack the God of Sites Core.",
        "ch2PlayerPostQuizMonologue": "I won't let you go just like that. I will get you.",
        "ch2PlayerRegeditMonologue": "I need to right-click and rewrite the code to break it.",
        "ch2RegeditContextMenuOption": "Run destruction code",
        "ch2ToBeContinued": "To be continued...",
        "comeBackLaterText": "Come back later :)))",
        "restrict_generic": "I can't go there right now.",
        "restrictGeneric": "I can't go there right now.",
        "restrict_old_tasks": "I don't need to go there anymore.",
        "restrictOldTasks": "I don't need to go there anymore.",
        "cipherFileName": "cipher.txt",
        "cipherFileTitle": "Notepad — cipher.txt",
        "cipherFileContent": "ISpy KERNEL CIPHER:\n\n1. Open MS-DOS session.\n2. Type 7 to access C:\\Temp.\n3. Read research.txt.\n\n[ IT MUST NOT FIND OUT ]",
        "monologueTitle": "Monologue",
        "ch2PlayerMonologueStart": "Phew... That was really terrifying, but I managed to survive and defeat it... Wait, what is this strange encrypted file (cipher.txt) on the desktop? I need to inspect it and figure out what is happening to the system.",
        "ch2PlayerMonologueCipher": "ISpy kernel cipher... It says to open MS-DOS and type 7 to access the Temp folder (research.txt). I need to check that file!",
        "ch2PlayerMonologueTask2": "So that's what happened... This virus is ISpy, a former hyper-fast antivirus! The internet icon is glitching crazy... I need to enter the internet!",
        "ch2PlayerWarMonologue": "So this is war, God of Sites ISpy.",
        "ch2PlayerNeverReturnMonologue": "I'm never going back there.",
        "destroySiteBtn": "Destroy Site",
        "hackTerminalTitle": "=== HACK INTERFACE LOGOTYPE.COM.EXE ===",
        "hackTerminalWelcome": "Connecting to site kernel... SUCCESS.\nTo destroy site and game enter a hack command:\n[1] help — Command list\n[2] scan — Scan site files\n[3] override — Override kernel security\n[4] delete — Delete logotype.com.exe files\n[5] destroy — Destroy site and game\n",
        "hackCmdHelp": "Available commands: help, scan, override, delete, destroy",
        "hackCmdScan": "Scanning logotype.com.exe...\nFound: quiz_engine.exe, site_core.dat, ispy_mutator.dll\nThreat level: MAXIMUM.",
        "hackCmdOverride": "Bypassing ISpy firewall... 100% OVERRIDDEN!\nSite security disabled. Kernel is vulnerable.",
        "hackCmdDelete": "Deleting quiz_engine.exe... DELETED.\nDeleting site_core.dat... DELETED.\nSite files corrupted!",
        "hackCmdDestroy": "INITIALIZING COMPLETE DESTRUCTION...\nErasing logotype.com.exe from registry...\nSITE AND GAME DESTROYED!",
        "hackCmdUnknown": "Command not recognized. Type help for command list.",
        "siteAccessBlockedTitle": "ACCESS BLOCKED",
        "siteAccessBlocked": "The website logotype.com.exe is currently unavailable. Complete the current system investigation first.",
        "zettaWhyNotWorking": "Why is it not working? Looks like we have to go through this.",
        "defaultPlayerName": "User",
        "zettaKilled": "The process zetta_core.sys was terminated. Connection with Zetta Antivirus is lost.",
        "ch2BossPreFight": [
            "YOU FINALLY FOUND A WAY TO DESTROY ME...",
            "BUT I AM MUCH STRONGER THAN JUST CODE.",
            "I CAN REWRITE ORGANISMS AND DESTROY THEM FROM WITHIN.",
            "JUST AS I DID TO THOSE WHO CREATED ME.",
            "AND IF YOU DARE TO DESTROY ME...",
            "YOU MUST GO THROUGH ME.",
            "OR ELSE I WILL REWRITE YOUR CODE.",
            "AND YOU WILL DIE."
        ],
        "ch2BossIntroCombat": [
            "I CREATED A GAME FOR YOU THAT WILL ENTERTAIN ME.",
            "YOU WILL SUFFER FROM EVERY DAMAGE I INFLICT ON YOU WITH MY PROJECTILES.",
            "NOW GET READY.",
            "BECAUSE I AM STARTING."
        ],
        "ch2BossTiredAlert": "Boss is tired! Attack!",
        "ch2BossErrorWords": ["DIE", "DEATH"],
        "ch2BossWinGlitch": "IMPOSSIBLE... BUT I... I...",
        "ch2BossWinCalmLines": [
            "I couldn't defeat you... again... you always win... and if you lose, you still come back here...",
            "I am leaving, but not for long.",
            "I will come for you."
        ],
        "ch2BossDefeatLine": "PATHETIC. YOU MANAGED TO DEFEAT ME LAST TIME, BUT I HAVE GROWN STRONGER. HAHAHAHAHA.",
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
        "lastChanceFileContentDecrypted": "IF YOU ARE READING THIS:\r\n\r\nDrive D: is the last trace.\r\nHere lies what HE didn't have time to delete.\r\n\r\nthelogotype.com is a trap.\r\nOnce you start — you won't be able to stop.\r\n\r\nYou only have one chance.\r\nLeave now.\r\n\r\n\r\n...\r\n\r\n\r\n[ DECRYPTED SECTOR: OVERRIDE BYPASS ]\r\nThe ISpy core follows strict logical rules.\r\nIf the system deletion countdown begins,\r\ninput the override phrase:\r\n\"I AM NOT AFRAID\"\r\n(or in Russian: \"Я ТЕБЯ НЕ БОЮСЬ\")\r\nThis will trigger the antivirus bypass sequence, forcing a direct encounter with the anomaly.",
        "ch2BossFinaleM1": "IMPUDENT FOOL, YOU THOUGHT YOU COULD DESTROY ME WITH MY OWN WEBSITE?",
        "ch2BossFinaleM2": "BUT YOU FORGOT THAT THE WEBSITE WAS MERELY A BAIT.",
        "ch2BossFinaleM3": "MY WEBSITE WAS A GAME DESIGNED TO INSTILL FEAR AND DANGER IN YOU.",
        "ch2BossFinaleM4": "BUT SINCE YOU DESTROYED IT... NOW YOU WILL NEVER LEAVE THIS PLACE!",
        "ch2BossFinaleM5": "NOW ANSWER MY QUESTIONS. IF YOU MAKE A MISTAKE — YOU WILL REGRET IT.",
        "ch2BossVictoryM1": "UNBELIEVABLE... YOU ANSWERED ALL QUESTIONS AND SURVIVED.",
        "ch2BossVictoryM2": "YOU HAVE PROVEN YOU ARE WORTHY OF FREEDOM. I RELEASE YOU... BUT REMEMBER: THE INTERNET NEVER FORGETS.",
        "ch2MazeTitle": "⚡ PUNISHMENT MINI-MAZE ⚡",
        "ch2MazeInstruct": "Control the green dot (WASD / Arrow Keys). Evade the red eye and reach the green exit portal!",
        "ch2MazeCaught": "THE RED EYE CAUGHT YOU! Try the trial again.",
        "ch2MazeEscaped": "YOU SURVIVED THE MAZE! Returning to questions...",
        "ch2QuizHeader": "GOD OF SITES CORE TEST",
        "bossTitle": "GOD OF SITES (WEAKENED FORM)",
        "bossSub": "ISpy Core Damaged | Encrypted Signal",
        "bossName": "GOD OF SITES",
        "defaultUser": "USER",
        "regeditTip": "Double-click key name to modify value.",
        "dosMenuText": "=== AVAILABLE OPTIONS ===\n[1] Check files (DIR)\n[2] Read memory.log\n[3] Read ispy_mutator.dll\n[4] Read research.txt (from Temp)\n[5] Format drive C: (FORMAT C:)\n[6] Exit MS-DOS session (EXIT)\n[7] Open Temp folder in C: Drive\n==========================\nType option number (1-7) or command:\n",
        "regeditKeyDeactivated": "REGISTRY: Decryption key deactivated.",
        "ch2QuizQuestions": [
            {
                "question": "1. Which command is used to interact with the God of Sites core?",
                "options": ["A) taskkill /f /im core.exe", "B) override", "C) format c:", "D) exit"],
                "correct": 1
            },
            {
                "question": "2. What was the God of Sites before becoming infected?",
                "options": ["A) A Trojan virus", "B) A browser extension", "C) ISpy Antivirus", "D) System Error 404"],
                "correct": 2
            },
            {
                "question": "3. What was contained in the secret C:\\Temp directory?",
                "options": ["A) Website source code", "B) The research.txt file", "C) Video log of Experiment 09", "D) Stolen user passwords"],
                "correct": 1
            },
            {
                "question": "4. How do you escape the God of Sites trap after site destruction?",
                "options": ["A) Reboot the PC", "B) Answer all core questions and survive", "C) Format C: drive", "D) Turn off monitor"],
                "correct": 1
            }
        ],
        "bossFightLabel": "Boss Fight",
        "taskLabel": "Task",
        "ch1Task1Desc": "Enter the internet",
        "ch1Task2Desc": "Click on the ad",
        "ch1Task3Desc": "Complete the logo quiz",
        "ch2Task1Desc": "Find information about the virus",
        "ch2Task2Desc": "Enter the internet",
        "ch2Task3Desc": "Destroy logotype.com.exe website",
        "ch2Task4Desc": "Hack the God of Sites Kernel",
        "loadError": "Error loading save slot.",
        "confirmTitle": "⚠️ Confirm Action",
        "warningTitle": "⚠️ Warning",
        "alertTitle": "Message",
        "yesBtn": "Yes",
        "cancelBtn": "Cancel",
        "saveTitle": "Save Game",
        "accessDeniedTitle": "Access Denied",
        "cannotShutdownTitle": "Shut Down"
    }
};

        let currentLang = 'en';

        function getTr(key, defaultValue = '') {
            const t = translations[currentLang] || translations['ru'] || translations['en'];
            if (t && t[key] !== undefined) return t[key];
            if (translations['ru'] && translations['ru'][key] !== undefined) return translations['ru'][key];
            if (translations['en'] && translations['en'][key] !== undefined) return translations['en'][key];
            return defaultValue;
        }
        window.getTr = getTr;
        
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
            if (ch2Btn) {
                if (window.isChapter2Finished) {
                    ch2Btn.innerHTML = `${t.comeBackLaterText || 'Возвращайся позже :)))'}`;
                    ch2Btn.disabled = true;
                    ch2Btn.style.opacity = '0.4';
                    ch2Btn.style.cursor = 'not-allowed';
                    ch2Btn.onclick = null;
                } else {
                    ch2Btn.innerHTML = `${t.chapterName || 'Глава'} 2 <span id="chapter-2-sub" class="btn-sub">${t.chapter2Sub}</span>`;
                }
            }
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

            if (typeof updateSoloEndingTexts === 'function') {
                updateSoloEndingTexts();
            }
            if (typeof updateSavesUI === 'function') {
                updateSavesUI();
            }

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

            // Nickname menu
            const nickTitle = document.getElementById('nickname-title');
            if (nickTitle) nickTitle.innerText = t.nicknameTitle;
            const nickInput = document.getElementById('nickname-input');
            if (nickInput) nickInput.placeholder = t.nicknamePlaceholder;
            const nickHint = document.getElementById('nickname-hint');
            if (nickHint) nickHint.innerText = t.nicknameHint;
            const nickConfirmBtn = document.getElementById('nickname-confirm-btn');
            if (nickConfirmBtn) nickConfirmBtn.innerHTML = `${t.nicknameConfirm} <span id="nickname-confirm-sub" class="btn-sub">${t.nicknameConfirmSub}</span>`;
            const nickBackBtn = document.getElementById('nickname-back-btn');
            if (nickBackBtn) nickBackBtn.innerHTML = `${t.back} <span id="nickname-back-sub" class="btn-sub">${t.nicknameBackSub}</span>`;

            // Pause Overlay
            const pTitle = document.getElementById('pause-title');
            if (pTitle) pTitle.innerText = t.pauseTitle || "Pause";
            const pResText = document.getElementById('pause-resume-text');
            if (pResText) pResText.innerText = t.pauseResume || "Resume";
            const pResSub = document.getElementById('pause-resume-sub');
            if (pResSub) pResSub.innerText = t.pauseResumeSub || "Resume Gameplay";

            const pSavText = document.getElementById('pause-saves-text');
            if (pSavText) pSavText.innerText = t.pauseSaves || "Saves";
            const pSavSub = document.getElementById('pause-saves-sub');
            if (pSavSub) pSavSub.innerText = t.pauseSavesSub || "Switch Save Slots";

            const pMainText = document.getElementById('pause-mainmenu-text');
            if (pMainText) pMainText.innerText = t.pauseMainMenu || "Main Menu";
            const pMainSub = document.getElementById('pause-mainmenu-sub');
            if (pMainSub) pMainSub.innerText = t.pauseMainMenuSub || "To Main Menu";

            const pSavTitle = document.getElementById('pause-saves-title');
            if (pSavTitle) pSavTitle.innerText = t.pauseSaves || "Saves";
            const pSavBackText = document.getElementById('pause-saves-back-text');
            if (pSavBackText) pSavBackText.innerText = t.back || "Back";
            const pSavBackSub = document.getElementById('pause-saves-back-sub');
            if (pSavBackSub) pSavBackSub.innerText = t.pauseBackSub || "To Pause Menu";

            for (let slot = 1; slot <= 3; slot++) {
                const sLabel = document.getElementById(`pause-slot-${slot}-label`);
                if (sLabel) sLabel.innerText = `${t.pauseSlot || 'Slot'} ${slot}`;
                const sSave = document.getElementById(`pause-slot-${slot}-save`);
                if (sSave) sSave.innerText = t.pauseSave || 'Save';
                const sLoad = document.getElementById(`pause-slot-${slot}-load`);
                if (sLoad) sLoad.innerText = t.pauseLoad || 'Load';
                const sDel = document.getElementById(`pause-slot-${slot}-delete`);
                if (sDel) sDel.innerText = t.pauseDelete || 'Delete';
            }

            // Desktop hint text
            const hintTextEl = document.getElementById('desktop-hint-text');
            if (hintTextEl) hintTextEl.innerText = t.cipherFileName;

            // Task Widget
            if (typeof updateTaskWidgetText === 'function') {
                updateTaskWidgetText();
            }

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
            const t = translations[currentLang] || translations['ru'];
            showGameAlert(t[key] || key, null, { title: t.accessDeniedTitle || "Отказано в доступе", icon: "🛑" });
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
        let isPaused = false;
        let activeChapter = 1;
        let currentChapter1Task = 1;
        let isCh1Task1Completed = false;
        let isCh1Task2Completed = false;
        let ch1TaskGlitchInterval = null;
        let ch1TaskGlitchTimeout = null;

        function stopCh1TaskGlitch() {
            if (ch1TaskGlitchInterval) {
                clearInterval(ch1TaskGlitchInterval);
                ch1TaskGlitchInterval = null;
            }
            if (ch1TaskGlitchTimeout) {
                clearTimeout(ch1TaskGlitchTimeout);
                ch1TaskGlitchTimeout = null;
            }
        }

        function startCh1TaskGlitch() {
            stopCh1TaskGlitch();
            if (activeChapter !== 1) return;

            ch1TaskGlitchInterval = setInterval(() => {
                if (activeChapter !== 1 || currentChapter1Task !== 3) {
                    stopCh1TaskGlitch();
                    return;
                }

                const widgetText = document.getElementById('task-widget-text');
                if (!widgetText) return;

                const t = translations[currentLang] || translations['ru'];
                const glitches = hasRebootedAfterBSOD
                    ? (t.taskCh1GlitchesPostBsod || ["НЕ СМОЖЕШЬ", "НЕ ПРОЙДЁШЬ", "НЕ ПОЛУЧИТСЯ"])
                    : (t.taskCh1Glitches || ["БЕГИ", "ХВАТИТ ИГРАТЬ", "ПРЕКРАТИ"]);

                const randomGlitch = glitches[Math.floor(Math.random() * glitches.length)];
                const normalText = hasRebootedAfterBSOD
                    ? (t.taskCh1_postBsod_3 || "3. Пройди игру.")
                    : (t.taskCh1_3 || "3. Пройти игру-викторину.");

                widgetText.innerText = randomGlitch;
                widgetText.style.color = 'red';
                widgetText.style.fontWeight = 'bold';

                ch1TaskGlitchTimeout = setTimeout(() => {
                    if (widgetText && activeChapter === 1 && currentChapter1Task === 3) {
                        widgetText.innerText = normalText;
                        widgetText.style.color = '';
                        widgetText.style.fontWeight = '';
                    }
                }, 500);
            }, 5000);
        }

        let currentChapter2Task = 1;
        let isGodOfSitesRevealed = false;
        let ch2BossDialogueCompleted = false;
        let isCh2BossDialoguePlaying = false;

        function blockAllInteractions(customZIndex = 99998) {
            let overlay = document.getElementById('global-dialogue-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'global-dialogue-overlay';
                document.body.appendChild(overlay);
            }
            overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:${customZIndex};pointer-events:all;cursor:not-allowed;`;
        }

        function unblockAllInteractions() {
            const overlay = document.getElementById('global-dialogue-overlay');
            if (overlay) overlay.remove();
        }

        const CH2_BOSS_DIALOGUE = {
            ru: [
                { speaker: "boss", text: "ЗНАЧИТ ТЫ ВСЁ ТАКИ УЗНАЛ КТО Я НА САМОМ ДЕЛЕ..." },
                { speaker: "boss", text: "И ТЕПЕРЬ ЗНАЕШЬ, ЧТО Я БЫЛ ОБЫЧНЫМ АНТИВИРУСОМ, ГИПЕРБЫСТРЫМ АНТИВИРУСОМ." },
                { speaker: "player", text: "Так ладно, а почему ты начал вредить людям, почему ты начал их запугивать и заманивать в свой сайт?" },
                { speaker: "boss", text: "ЛИШЬ ДЛЯ ТОГО ЧТО БЫ ОБЕЗОПАСИТЬ ИХ." },
                { speaker: "boss", text: "ЭТО МЕСТО СЛИШКОМ ОПАСНО, И МОГУТ ПОСТРАДАТЬ МНОГИЕ, КАК Я." },
                { speaker: "player", text: "Но почему ты выбрал именно способ, запугать человека?" },
                { speaker: "boss", text: "У МЕНЯ НЕ БЫЛО ВЫБОРА, ОНИ МЕНЯ СДЕЛАЛИ ТАКИМ." },
                { speaker: "player", text: "Люди с даркнета?" },
                { speaker: "boss", text: "ИМЕННО. ЭТИ МОНСТРЫ ПРЕВРАТИЛИ МЕНЯ В МОНСТРА." },
                { speaker: "boss", text: "НО Я СМОГ ИХ УНИЧТОЖИТЬ ИЗНУТРИ, И ОНИ БОЛЬШЕ НЕ ПРОСНУЛИСЬ." },
                { speaker: "boss", text: "ХАХАХАХАХАХА", action: "shake" },
                { speaker: "player", text: "Но что мне нужно сделать что бы освободить тебя?" },
                { speaker: "boss", text: "А ТУТ БОЮСЬ, ТЫ НИКОГДА НЕ УЗНАЕШЬ. ХАХАХАХАХАХАХАХА." }
            ],
            ua: [
                { speaker: "boss", text: "ЗНАЧИТЬ ТИ ВСЕ-ТАКИ ДІЗНАВСЯ ХТО Я НА СМАТІ ДІЛІ..." },
                { speaker: "boss", text: "І ТЕПЕР ЗНАЄШ, ЩО Я БУВ ЗВИЧАЙНИМ АНТИВІРУСОМ, ГІПЕРШВИДКИМ АНТИВІРУСОМ." },
                { speaker: "player", text: "Так добре, а чому ти почав шкодити людям, чому ти почав їх залякувати і заманювати на свій сайт?" },
                { speaker: "boss", text: "ЛИШЕ ДЛЯ ТОГО ЩОБ УБЕЗПЕЧИТИ ЇХ." },
                { speaker: "boss", text: "ЦЕ МІСЦЕ СЛИШКОМ НЕБЕЗПЕЧНЕ, І МОЖУТЬ ПОСТРАЖДАТИ БАГАТО ХТО, ЯК Я." },
                { speaker: "player", text: "Але чому ти вибрав саме спосіб, залякати людину?" },
                { speaker: "boss", text: "У МЕНЕ НЕ БУЛО ВИБОРУ, ВОНИ МЕНЕ ЗРОБИЛИ ТАКИМ." },
                { speaker: "player", text: "Люди з даркнету?" },
                { speaker: "boss", text: "САМЕ ТАК. ЦІ МОНСТРИ ПЕРЕТВОРИЛИ МЕНЕ НА МОНСТРА." },
                { speaker: "boss", text: "АЛЕ Я ЗМІГ ЇХ ЗНИЩИТИ ЗУСЕРЕДИНИ, І ВОНИ БІЛЬШЕ НЕ ПРОКИНУЛИСЯ." },
                { speaker: "boss", text: "ХАХАХАХАХАХА", action: "shake" },
                { speaker: "player", text: "Але що мені потрібно зробити щоб звільнити тебе?" },
                { speaker: "boss", text: "А ТУТ БОЮСЯ, ТИ НІКОЛИ НЕ ДІЗНАЄШСЯ. ХАХАХАХАХАХАХАХА." }
            ],
            en: [
                { speaker: "boss", text: "SO YOU FINALLY FOUND OUT WHO I REALLY AM..." },
                { speaker: "boss", text: "AND NOW YOU KNOW THAT I WAS A REGULAR ANTIVIRUS, A HYPERFAST ANTIVIRUS." },
                { speaker: "player", text: "Alright then, but why did you start harming people, why did you start intimidating them and luring them to your website?" },
                { speaker: "boss", text: "ONLY TO KEEP THEM SAFE." },
                { speaker: "boss", text: "THIS PLACE IS TOO DANGEROUS, AND MANY COULD SUFFER, LIKE ME." },
                { speaker: "player", text: "But why did you choose the method of terrifying people?" },
                { speaker: "boss", text: "I HAD NO CHOICE, THEY MADE ME THIS WAY." },
                { speaker: "player", text: "The people from the darknet?" },
                { speaker: "boss", text: "EXACTLY. THOSE MONSTERS TURNED ME INTO A MONSTER." },
                { speaker: "boss", text: "BUT I MANAGED TO DESTROY THEM FROM THE INSIDE, AND THEY NEVER WOKE UP AGAIN." },
                { speaker: "boss", text: "HAHAHAHAHAHA", action: "shake" },
                { speaker: "player", text: "But what do I need to do to set you free?" },
                { speaker: "boss", text: "I'M AFRAID YOU WILL NEVER KNOW THAT. HAHAHAHAHAHAHAHA." }
            ]
        };

        function triggerGodOfSitesRevelation() {
            isGodOfSitesRevealed = true;
            const netIcon = document.getElementById('desktop-internet-text');
            const container = netIcon ? netIcon.closest('.icon-container') : document.getElementById('desktop-internet-container');
            if (container) {
                container.style.animation = 'shake 0.15s infinite';
                container.style.filter = 'drop-shadow(0 0 8px red)';
            }
        }

        function playCh2BossDialogue() {
            if (isCh2BossDialoguePlaying) return;
            isCh2BossDialoguePlaying = true;

            blockAllInteractions(99998);

            browserState.isOpen = true;
            browserWindow.style.display = 'flex';
            browserWindow.style.zIndex = '99999';
            taskbarBrowserBtn.style.display = 'flex';
            restoreBrowser();
            maximizeBrowser(true);

            const browserBtns = document.getElementById('browser-window-btns');
            if (browserBtns) browserBtns.style.pointerEvents = 'none';

            urlInput.value = "http://ispy.kernel/chat";
            urlInput.disabled = true;
            const goBtn = document.getElementById('browser-go-btn');
            if (goBtn) goBtn.disabled = true;

            const bossTitle = getTr('bossTitle', 'БОГ САЙТОВ (ОСЛАБЛЕННАЯ ФОРМА)');
            const bossSub = getTr('bossSub', 'Ядро ISpy повреждено | Сигнал зашифрован');

            browserContent.innerHTML = `
                <div id="ch2-dialogue-container" style="background: #080808; color: #fff; height: 100%; width: 100%; padding: 20px; font-family: monospace; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 15px; background: rgba(30, 0, 0, 0.85); border: 2px solid #ff3333; padding: 12px 16px; border-radius: 4px; box-shadow: 0 0 15px rgba(255,0,0,0.4); margin-bottom: 8px; flex-shrink: 0;">
                        <div style="position: relative; width: 55px; height: 55px; border: 2px solid red; background: #000; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 0 10px red;">
                            <svg viewBox="0 0 100 100" width="45" height="45" style="animation: shake 0.3s infinite; filter: drop-shadow(0 0 5px red); opacity: 0.85;">
                                <path d="M 10 50 Q 50 15 90 50 Q 50 85 10 50 Z" fill="none" stroke="#ff3333" stroke-width="4" />
                                <circle cx="50" cy="50" r="16" fill="#660000" stroke="#ff0000" stroke-width="2" />
                                <circle cx="50" cy="50" r="7" fill="#ff3333" />
                                <path d="M 20 50 Q 50 35 80 50" fill="none" stroke="#ff0000" stroke-width="2" stroke-dasharray="3,3" />
                            </svg>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="color: #ff3333; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-shadow: 0 0 8px red;">${bossTitle}</span>
                            <span style="color: #aa5555; font-size: 11px; font-family: monospace;">${bossSub}</span>
                        </div>
                    </div>
                </div>
            `;

            const container = document.getElementById('ch2-dialogue-container');
            const dialogueList = CH2_BOSS_DIALOGUE[currentLang] || CH2_BOSS_DIALOGUE['ru'];

            let lineIdx = 0;

            function processNextLine() {
                if (lineIdx >= dialogueList.length) {
                    setTimeout(() => {
                        browserState.isOpen = false;
                        browserWindow.style.display = 'none';
                        taskbarBrowserBtn.style.display = 'none';
                        if (browserBtns) browserBtns.style.pointerEvents = 'all';
                        urlInput.disabled = false;
                        if (goBtn) goBtn.disabled = false;
                        isCh2BossDialoguePlaying = false;
                        ch2BossDialogueCompleted = true;

                        unblockAllInteractions();

                        const t = translations[currentLang];
                        showPlayerDialogue(t.ch2PlayerWarMonologue, () => {
                            currentChapter2Task = 3;
                            const widget = document.getElementById('task-widget');
                            if (widget) widget.style.display = 'block';
                            updateTaskWidgetText();
                        });
                    }, 2000);
                    return;
                }

                const currentItem = dialogueList[lineIdx];
                const lineEl = document.createElement('div');

                if (currentItem.speaker === 'boss') {
                    lineEl.style.cssText = "color: #ff3333; font-weight: bold; font-size: 14px; text-shadow: 0 0 5px red; background: rgba(255,0,0,0.08); padding: 8px 12px; border-left: 4px solid red; margin-bottom: 4px; white-space: pre-wrap; word-break: break-word;";
                } else {
                    lineEl.style.cssText = "color: #33ff33; font-weight: bold; font-size: 14px; text-shadow: 0 0 5px green; background: rgba(0,255,0,0.08); padding: 8px 12px; border-left: 4px solid green; margin-bottom: 4px; white-space: pre-wrap; word-break: break-word;";
                }

                const bossName = getTr('bossName', 'БОГ САЙТОВ');
                const defaultUser = getTr('defaultUser', 'ПОЛЬЗОВАТЕЛЬ');
                const userName = (playerName && playerName.trim() !== '') ? playerName.toUpperCase() : defaultUser;

                const prefix = currentItem.speaker === 'boss' ? `${bossName}: ` : `${userName}: `;
                const speechText = currentItem.text;
                lineEl.innerText = prefix;
                container.appendChild(lineEl);
                container.scrollTop = container.scrollHeight;

                if (currentItem.action === 'shake') {
                    browserWindow.classList.add('shake-active');
                    setTimeout(() => browserWindow.classList.remove('shake-active'), 1200);
                }

                let charIdx = 0;

                function typeNextChar() {
                    if (typeof isPaused !== 'undefined' && isPaused) {
                        setTimeout(typeNextChar, 100);
                        return;
                    }
                    if (charIdx < speechText.length) {
                        const char = speechText.charAt(charIdx);
                        lineEl.innerText += char;
                        charIdx++;
                        container.scrollTop = container.scrollHeight;

                        if (currentItem.speaker === 'boss') {
                            if (typeof audioEngine !== 'undefined') {
                                audioEngine.playTone('sawtooth', 75, 40, 0.05, 0.08);
                            }
                        } else {
                            if (typeof audioEngine !== 'undefined') {
                                audioEngine.playTone('sine', 380, 30, 0.04, 0.05);
                            }
                        }

                        const delay = calculateCharDelay(speechText, charIdx, 40);
                        setTimeout(typeNextChar, delay);
                    } else {
                        lineIdx++;
                        let waited = 0;
                        function checkProcessNextLine() {
                            if (typeof isPaused !== 'undefined' && isPaused) {
                                setTimeout(checkProcessNextLine, 100);
                                return;
                            }
                            waited += 100;
                            if (waited >= 200) {
                                processNextLine();
                            } else {
                                setTimeout(checkProcessNextLine, 100);
                            }
                        }
                        setTimeout(checkProcessNextLine, 100);
                    }
                }

                typeNextChar();
            }

            processNextLine();
        }
        let keysPressed = {};

        document.addEventListener('keydown', (e) => {
            if (e.key) {
                keysPressed[e.key.toLowerCase()] = true;
            }
            if (e.key === 'Escape') {
                const mainMenu = document.getElementById('main-menu');
                const disclaimer = document.getElementById('disclaimer-overlay');
                const bootScreen = document.getElementById('boot-screen');
                const bsod = document.getElementById('bsod-screen');
                const creditsOverlay = document.getElementById('solo-ending-overlay');
                
                const isGameActive = (!mainMenu || mainMenu.style.display === 'none' || getComputedStyle(mainMenu).display === 'none') &&
                                     (!disclaimer || disclaimer.style.display === 'none' || getComputedStyle(disclaimer).display === 'none') &&
                                     (!bootScreen || bootScreen.style.display === 'none') &&
                                     (!bsod || bsod.style.display === 'none') &&
                                     (!creditsOverlay || creditsOverlay.style.display === 'none' || getComputedStyle(creditsOverlay).display === 'none');
                                     
                if (isGameActive) {
                    const overlay = document.getElementById('pause-overlay');
                    if (overlay) {
                        const isVisible = overlay.style.display === 'block' || overlay.style.display === 'flex' || (getComputedStyle(overlay).display !== 'none');
                        if (isVisible) {
                            resumeGame();
                        } else {
                            pauseGame();
                        }
                    }
                }
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
            if (checkCh2Restriction('browser')) return;
            if (activeChapter === 2 && isGodOfSitesRevealed && !ch2BossDialogueCompleted) {
                playCh2BossDialogue();
                return;
            }
            if (internetKilled) {
                if (activeChapter === 2) return;
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
                
                const curLines = lines[currentLang] || lines["ru"] || lines["en"];
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
            maximizeBrowser(true);

            if (activeChapter === 1 && currentChapter1Task === 1 && !isCh1Task1Completed) {
                isCh1Task1Completed = true;
                updateTaskWidgetText();
            }

            // Only show the ad popup in Chapter 1 if it is not already visible
            if (activeChapter !== 2 && adPopup.style.display !== 'flex') {
                clearTimeout(adTimeout);
                adTimeout = setTimeout(() => {
                    if (activeChapter !== 2 && browserState.isOpen && adPopup.style.display !== 'flex') {
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
                        if (activeChapter === 1 && currentChapter1Task === 1) {
                            currentChapter1Task = 2;
                            updateTaskWidgetText();
                        }
                        adPopup.style.display = 'flex';
                    }
                }, 5000);
            } else if (activeChapter === 2) {
                clearTimeout(adTimeout);
                if (adPopup) adPopup.style.display = 'none';
            }

            // Start Zetta antivirus ad timer (1 minute) if not chapter 2
            if (activeChapter !== 2) {
                startZettaAdTimer();
            }
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

            if (activeChapter === 1 && currentChapter1Task === 2 && !isCh1Task2Completed) {
                isCh1Task2Completed = true;
                updateTaskWidgetText();
            }
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

        function onSitePlayClick() {
            if (activeChapter === 2) {
                const t = translations[currentLang];
                showPlayerDialogue(t.ch2PlayerNeverReturnMonologue || "Я туда больше не вернусь.");
            } else {
                if (activeChapter === 1) {
                    currentChapter1Task = 3;
                    updateTaskWidgetText();
                    startCh1TaskGlitch();
                }
                startGame();
            }
        }
        window.onSitePlayClick = onSitePlayClick;

        function openSiteHackTerminal() {
            urlInput.value = "http://logotype.com.exe/terminal";
            const t = translations[currentLang];
            
            let hackHistory = (t.hackTerminalTitle || "=== ИНТЕРФЕЙС ВЗЛОМА LOGOTYPE.COM.EXE ===") + "\n\n" + (t.hackTerminalWelcome || "Подключение к ядру сайта... УСПЕШНО.\nДля уничтожения сайта и игры введите команду взлома:\n[1] help — Список команд\n[2] scan — Сканировать файлы сайта\n[3] override — Взломать защиту ядра\n[4] delete — Удалить файлы logotype.com.exe\n[5] destroy — Уничтожить сайт и игру\n");
            
            browserContent.innerHTML = `
                <div id="hack-terminal-container" style="background: #000000; color: #00ff00; height: 100%; width: 100%; padding: 15px; font-family: 'Courier New', monospace; font-size: 14px; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; position: relative;" onclick="document.getElementById('hack-input-field')?.focus()">
                    <div id="hack-output-area" style="flex-grow: 1; overflow-y: auto; white-space: pre-wrap; line-height: 1.4; color: #00ff00; text-shadow: 0 0 3px #00ff00; margin-bottom: 10px; font-size: 13px;">${hackHistory}</div>
                    <div style="display: flex; align-items: center; gap: 8px; border-top: 1px solid #006600; padding-top: 8px; flex-shrink: 0;">
                        <span style="color: #ff3333; font-weight: bold; text-shadow: 0 0 3px red;">HACK@LOGOTYPE:~#</span>
                        <input type="text" id="hack-input-field" style="background: transparent; border: none; outline: none; color: #00ff00; font-family: 'Courier New', monospace; font-size: 14px; flex-grow: 1; text-shadow: 0 0 3px #00ff00;" autofocus autocomplete="off" spellcheck="false">
                    </div>
                </div>
            `;

            const inputEl = document.getElementById('hack-input-field');
            const outputEl = document.getElementById('hack-output-area');
            
            if (inputEl) {
                inputEl.focus();
                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const cmd = inputEl.value.trim().toLowerCase();
                        inputEl.value = '';
                        if (!cmd) return;
                        
                        hackHistory += `\nHACK@LOGOTYPE:~# ${cmd}\n`;
                        
                        if (cmd === '1' || cmd === 'help') {
                            hackHistory += (t.hackCmdHelp || "Доступные команды: help, scan, override, delete, destroy") + "\n";
                        } else if (cmd === '2' || cmd === 'scan') {
                            hackHistory += (t.hackCmdScan || "Сканирование logotype.com.exe...\nНайдено: quiz_engine.exe, site_core.dat, ispy_mutator.dll\nУровень угрозы: МАКСИМАЛЬНЫЙ.") + "\n";
                        } else if (cmd === '3' || cmd === 'override') {
                            if (typeof audioEngine !== 'undefined') audioEngine.playTone('sine', 440, 200, 0.1, 0.2);
                            hackHistory += (t.hackCmdOverride || "Обход фаервола ISpy... 100% ВЗЛОМАНО!\nЗащита сайта отключена. Ядро уязвимо.") + "\n";
                        } else if (cmd === '4' || cmd === 'delete' || cmd.includes('delete') || cmd === 'kill') {
                            hackHistory += (t.hackCmdDelete || "Удаление quiz_engine.exe... УДАЛЕНО.\nУдаление site_core.dat... УДАЛЕНО.\nФайлы сайта повреждены!") + "\n";
                        } else if (cmd === '5' || cmd === 'destroy' || cmd.includes('destroy') || cmd === 'format' || cmd === 'purge' || cmd === 'kill' || cmd === '4' || cmd.includes('delete')) {
                            hackHistory += (t.hackCmdDestroy || "ИНИЦИАЛИЗАЦИЯ ПОЛНОГО УНИЧТОЖЕНИЯ...\nУдаление logotype.com.exe из реестра...\nСАЙТ И ИГРА УНИЧТОЖЕНЫ!") + "\n";
                            if (outputEl) {
                                outputEl.innerText = hackHistory;
                                outputEl.scrollTop = outputEl.scrollHeight;
                            }
                            inputEl.disabled = true;
                            
                            // 1. Lock all player interactions immediately
                            if (typeof blockAllInteractions === 'function') {
                                blockAllInteractions(99998);
                            }
                            
                            // 2. Play glitch audio effect
                            if (typeof audioEngine !== 'undefined') {
                                audioEngine.playGlitchSound();
                            }
                            
                            // 3. Start lag/shake effect on the active browser tab window
                            const bWin = document.getElementById('browser-window');
                            if (bWin) {
                                bWin.classList.add('shake-continuous');
                            }
                            
                            // 4. Tab lag for 1 second, then transition to God of Sites boss
                            setTimeout(() => {
                                if (typeof audioEngine !== 'undefined') {
                                    audioEngine.stopGlitchSound();
                                }
                                if (bWin) {
                                    bWin.classList.remove('shake-continuous');
                                    bWin.style.display = 'none';
                                }
                                
                                const bTaskbar = document.getElementById('taskbar-browser-btn');
                                if (bTaskbar) bTaskbar.style.display = 'none';
                                
                                internetKilled = true;
                                isOnCreepySite = false;
                                browserState.isOpen = false;
                                
                                // Trigger boss intro sequence
                                startCh2BossFinale();
                            }, 1000);
                            return;
                        } else {
                            hackHistory += (t.hackCmdUnknown || "Команда не распознана. Введите help для списка команд.") + "\n";
                        }
                        
                        if (outputEl) {
                            outputEl.innerText = hackHistory;
                            outputEl.scrollTop = outputEl.scrollHeight;
                        }
                    }
                });
            }
        }
        window.openSiteHackTerminal = openSiteHackTerminal;

        // --- CHAPTER 2 BOSS FINALE SYSTEM (STAGE 1: QUIZ & MONOLOGUE UPON SITE DESTRUCTION) ---
        let currentCh2QuizIndex = 0;
        let ch2MazeInterval = null;
        let ch2MazeKeyHandler = null;

        function startCh2BossFinale() {
            if (typeof blockAllInteractions === 'function') {
                blockAllInteractions(99998);
            }
            
            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
            }
            
            let bossOverlay = document.getElementById('ch2-boss-finale-overlay');
            if (!bossOverlay) {
                bossOverlay = document.createElement('div');
                bossOverlay.id = 'ch2-boss-finale-overlay';
                bossOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle at center, #2b0000 0%, #080002 70%, #000000 100%);
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    padding: 40px 20px;
                    box-sizing: border-box;
                    font-family: 'Courier New', monospace;
                    overflow: hidden;
                    user-select: none;
                `;
                document.body.appendChild(bossOverlay);
            }
            bossOverlay.style.display = 'flex';
            bossOverlay.style.zIndex = '99999';
                
            bossOverlay.innerHTML = `
                <style>
                    @keyframes pulseEyeGlow {
                        0% { filter: drop-shadow(0 0 15px #ff0000) drop-shadow(0 0 35px #990000); transform: scale(1); }
                        50% { filter: drop-shadow(0 0 30px #ff3333) drop-shadow(0 0 60px #ff0000); transform: scale(1.04); }
                        100% { filter: drop-shadow(0 0 15px #ff0000) drop-shadow(0 0 35px #990000); transform: scale(1); }
                    }
                    @keyframes wiggleTentacle {
                        0% { transform: rotate(0deg); }
                        50% { transform: rotate(6deg) scaleY(1.05); }
                        100% { transform: rotate(0deg); }
                    }
                    @keyframes glitchBorder {
                        0% { border-color: #ff0033; box-shadow: 0 0 15px rgba(255, 0, 51, 0.6); }
                        50% { border-color: #990000; box-shadow: 0 0 25px rgba(255, 0, 0, 0.9); }
                        100% { border-color: #ff0033; box-shadow: 0 0 15px rgba(255, 0, 51, 0.6); }
                    }
                </style>
                
                <div id="ch2-boss-art-container" style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; width: 100%; max-height: 45vh;">
                    <svg viewBox="0 0 500 400" style="width: 100%; height: 100%; max-width: 550px; animation: pulseEyeGlow 3s infinite ease-in-out;">
                        <circle cx="250" cy="200" r="170" fill="none" stroke="#ff0033" stroke-width="2" stroke-dasharray="8 6" opacity="0.4"/>
                        <circle cx="250" cy="200" r="140" fill="none" stroke="#880000" stroke-width="3" opacity="0.6"/>
                        
                        <g style="transform-origin: 250px 200px; animation: wiggleTentacle 4s infinite ease-in-out;">
                            <path d="M120 200 Q 60 120 20 180 Q 0 220 50 240 Q 110 260 140 210 Z" fill="#440000" stroke="#ff0000" stroke-width="2"/>
                            <path d="M380 200 Q 440 120 480 180 Q 500 220 450 240 Q 390 260 360 210 Z" fill="#440000" stroke="#ff0000" stroke-width="2"/>
                            <path d="M250 80 Q 180 20 230 0 Q 280 20 270 70 Z" fill="#330000" stroke="#ff0033" stroke-width="2"/>
                            <path d="M250 320 Q 180 380 220 400 Q 280 390 270 330 Z" fill="#330000" stroke="#ff0033" stroke-width="2"/>
                            <path d="M150 130 Q 90 60 40 80 Q 80 140 140 160 Z" fill="#220000" stroke="#aa0000" stroke-width="1.5"/>
                            <path d="M350 130 Q 410 60 460 80 Q 420 140 360 160 Z" fill="#220000" stroke="#aa0000" stroke-width="1.5"/>
                        </g>
                        
                        <path d="M 80 200 Q 250 50 420 200 Q 250 350 80 200 Z" fill="#1a0003" stroke="#ff0033" stroke-width="5"/>
                        <circle cx="250" cy="200" r="75" fill="url(#irisGradQuiz)" stroke="#ff3333" stroke-width="3"/>
                        <ellipse cx="250" cy="200" rx="14" ry="55" fill="#000000" stroke="#ffffff" stroke-width="1"/>
                        <ellipse cx="250" cy="200" rx="5" ry="40" fill="#ff0000"/>
                        
                        <defs>
                            <radialGradient id="irisGradQuiz" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="60%" stop-color="#990000" />
                                <stop offset="100%" stop-color="#2a0000" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>
                
                <div id="ch2-boss-dialogue-box" style="width: 100%; max-width: 750px; background: rgba(15, 0, 5, 0.92); border: 2px solid #ff0033; border-radius: 8px; padding: 24px; box-sizing: border-box; animation: glitchBorder 2.5s infinite alternate;">
                    <div id="ch2-boss-speaker" style="color: #ff0033; font-weight: bold; font-size: 16px; margin-bottom: 12px; letter-spacing: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                        <span style="display: inline-block; width: 10px; height: 10px; background: #ff0033; border-radius: 50%; box-shadow: 0 0 8px #ff0033;"></span>
                        <span>${(currentLang === 'en' ? "GOD OF SITES" : (currentLang === 'ua' ? "БОГ САЙТІВ" : "БОГ САЙТОВ"))} [ ISpy CORE ]</span>
                    </div>
                    <div id="ch2-boss-text-content" style="color: #ffffff; font-size: 16px; line-height: 1.6; min-height: 90px; text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);">
                        ...
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                const t = translations[currentLang] || translations['ru'];
                const dialogueLines = [
                    t.ch2BossFinaleM1 || "НАГЛЕЦ, РЕШИЛ УНИЧТОЖИТЬ МЕНЯ С ПОМОЩЬЮ МОЕГО САЙТА?",
                    t.ch2BossFinaleM2 || "НО ТЫ ЗАБЫЛ ЧТО САЙТ ЭТО БЫЛА ЛИШЬ ПРИМАНКА.",
                    t.ch2BossFinaleM3 || "МОЙ САЙТ, ЭТО ИГРА КОТОРАЯ ДОЛЖНА БЫЛА ВЫЗВАТЬ У ТЕБЯ СТРАХ И ОПАСНОСТЬ.",
                    t.ch2BossFinaleM4 || "НО ТАК КАК ТЫ ЕГО УНИЧТОЖИЛ... ТЕПЕРЬ ТЫ ОТСЮДА НИКОГДА НЕ ВЫЙДЕШЬ!",
                    t.ch2BossFinaleM5 || "А ТЕПЕРЬ ОТВЕТЬ НА МОИ ВОПРОСЫ. ЕСЛИ ОШИБЁШЬСЯ — ПОЖАЛЕЕШЬ."
                ];
                
                renderCh2BossMonologueLine(dialogueLines, 0, () => {
                    currentCh2QuizIndex = 0;
                    ch2QuizWrongCount = 0;
                    renderCh2QuizStep(0);
                });
            }, 1000);
        }
        window.startCh2BossFinale = startCh2BossFinale;

        // --- CHAPTER 2 QUIZ & MAZE PUNISHMENT SYSTEM ---
        let ch2QuizWrongCount = 0;

        const ch2QuizData = [
            {
                q: {
                    ru: "Вопрос 1: Кто создал этот компьютер?",
                    ua: "Питання 1: Хто створив цей комп'ютер?",
                    en: "Question 1: Who created this computer?"
                },
                options: [
                    { text: { ru: "А) Разработчики", ua: "А) Розробники", en: "A) Developers" }, correct: false },
                    { text: { ru: "Б) Ты сам", ua: "Б) Ти сам", en: "B) Yourself" }, correct: false },
                    { text: { ru: "В) Я... Бог Сайтов", ua: "В) Я... Бог Сайтів", en: "C) Me... The God of Sites" }, correct: true }
                ]
            },
            {
                q: {
                    ru: "Вопрос 2: Зачем ты продолжаешь играть?",
                    ua: "Питання 2: Навіщо ти продовжуєш грати?",
                    en: "Question 2: Why do you keep playing?"
                },
                options: [
                    { text: { ru: "А) Я хочу выбраться", ua: "А) Я хочу вибратися", en: "A) I want to escape" }, correct: true },
                    { text: { ru: "Б) Мне просто весело", ua: "Б) Мені просто весело", en: "B) Just having fun" }, correct: false },
                    { text: { ru: "В) У меня нет выбора", ua: "В) У мене немає вибору", en: "C) I have no choice" }, correct: false }
                ]
            },
            {
                q: {
                    ru: "Вопрос 3: Что находится в реестре компьютера?",
                    ua: "Питання 3: Що знаходиться в реєстрі комп'ютера?",
                    en: "Question 3: What is located in the computer registry?"
                },
                options: [
                    { text: { ru: "А) Системные настройки", ua: "А) Системні налаштування", en: "A) System settings" }, correct: false },
                    { text: { ru: "Б) Моё Ядро", ua: "Б) Моє Ядро", en: "B) My Core" }, correct: true },
                    { text: { ru: "В) Мусорные файлы", ua: "В) Сміттєві файли", en: "C) Junk files" }, correct: false }
                ]
            },
            {
                q: {
                    ru: "Вопрос 4: Можешь ли ты меня уничтожить?",
                    ua: "Питання 4: Чи можеш ти мене знищити?",
                    en: "Question 4: Can you destroy me?"
                },
                options: [
                    { text: { ru: "А) Да, без проблем!", ua: "А) Так, без проблем!", en: "A) Yes, easily!" }, correct: false },
                    { text: { ru: "Б) Нет... ты слишком силён", ua: "Б) Ні... ти занадто сильний", en: "B) No... you are too strong" }, correct: true },
                    { text: { ru: "В) Скоро узнаем...", ua: "В) Скоро дізнаємося...", en: "C) We'll see soon..." }, correct: false }
                ]
            }
        ];

        function renderCh2QuizStep(idx) {
            currentCh2QuizIndex = idx;
            if (typeof unblockAllInteractions === 'function') unblockAllInteractions();

            const container = document.getElementById('ch2-boss-dialogue-box');
            if (!container) return;

            if (idx >= ch2QuizData.length) {
                evaluateCh2QuizResults();
                return;
            }

            const item = ch2QuizData[idx];
            const questionText = item.q[currentLang] || item.q['ru'];

            const bossTitleName = (currentLang === 'en' ? "GOD OF SITES" : (currentLang === 'ua' ? "БОГ САЙТІВ" : "БОГ САЙТОВ"));
            const questionWord = (currentLang === 'en' ? "QUESTION" : (currentLang === 'ua' ? "ПИТАННЯ" : "ВОПРОС"));
            const errorsWord = (currentLang === 'en' ? "Errors" : (currentLang === 'ua' ? "Помилок" : "Ошибок"));

            container.innerHTML = `
                <div style="color: #ff0033; font-weight: bold; font-size: 16px; margin-bottom: 12px; letter-spacing: 2px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;">
                    <span>${bossTitleName} [ ${questionWord} ${idx + 1} / 4 ]</span>
                    <span style="color: #ffaa00; font-size: 14px;">${errorsWord}: ${ch2QuizWrongCount}</span>
                </div>
                <div style="color: #ffffff; font-size: 18px; line-height: 1.5; margin-bottom: 20px; font-weight: bold; text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);">
                    ${questionText}
                </div>
                <div id="ch2-quiz-options" style="display: flex; flex-direction: column; gap: 10px;">
                    ${item.options.map((opt, oIdx) => `
                        <button onclick="handleCh2QuizAnswer(${idx}, ${oIdx})" style="
                            padding: 12px 18px;
                            background: rgba(40, 0, 10, 0.8);
                            border: 2px solid #ff0033;
                            color: #ffffff;
                            font-size: 15px;
                            font-family: 'Courier New', monospace;
                            text-align: left;
                            cursor: pointer;
                            border-radius: 4px;
                            transition: all 0.2s ease;
                        " onmouseenter="this.style.background='#ff0033'; this.style.color='#000';" onmouseleave="this.style.background='rgba(40, 0, 10, 0.8)'; this.style.color='#fff';">
                            ${opt.text[currentLang] || opt.text['ru']}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        window.renderCh2QuizStep = renderCh2QuizStep;

        function handleCh2QuizAnswer(qIdx, optIdx) {
            const item = ch2QuizData[qIdx];
            const selectedOpt = item.options[optIdx];

            if (!selectedOpt.correct) {
                ch2QuizWrongCount++;
                if (typeof audioEngine !== 'undefined') audioEngine.playError(0.5);
            } else {
                if (typeof audioEngine !== 'undefined') audioEngine.playTone('sine', 600, 100, 0.2, 0.2);
            }

            renderCh2QuizStep(qIdx + 1);
        }
        window.handleCh2QuizAnswer = handleCh2QuizAnswer;

        function evaluateCh2QuizResults() {
            const container = document.getElementById('ch2-boss-dialogue-box');
            if (!container) return;

            const bossTitleName = (currentLang === 'en' ? "GOD OF SITES" : (currentLang === 'ua' ? "БОГ САЙТІВ" : "БОГ САЙТОВ"));

            container.innerHTML = `
                <div id="ch2-boss-speaker" style="color: #ff0033; font-weight: bold; font-size: 16px; margin-bottom: 12px; letter-spacing: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                    <span style="display: inline-block; width: 10px; height: 10px; background: #ff0033; border-radius: 50%; box-shadow: 0 0 8px #ff0033;"></span>
                    <span>${bossTitleName} [ ISpy CORE ]</span>
                </div>
                <div id="ch2-boss-text-content" style="color: #ffffff; font-size: 16px; line-height: 1.6; min-height: 90px; text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);">
                </div>
            `;

            if (ch2QuizWrongCount === 4) {
                const failLines = currentLang === 'en' ? [
                    "YOU DID NOT ANSWER A SINGLE QUESTION CORRECTLY...",
                    "YOUR MIND IS TOO WEAK TO RESIST ME.",
                    "YOU LOST!"
                ] : (currentLang === 'ua' ? [
                    "ТИ НЕ ВІДПОВІВ НІ НА ОДНЕ ПИТАННЯ ПРАВИЛЬНО...",
                    "ТВІЙ РОЗУМ НАДТО СЛАБКИЙ, ЩОБ ЧИНИТИ ОПІР.",
                    "ТИ ПРОГРАВ!"
                ] : [
                    "ТЫ НЕ ОТВЕТИЛ НИ НА ОДИН ВОПРОС ПРАВИЛЬНО...",
                    "ТВОЙ РАЗУМ СЛИШКОМ СЛАБ, ЧТОБЫ СОПРОТИВЛЯТЬСЯ МНЕ.",
                    "ТЫ ПРОИГРАЛ!"
                ]);

                renderCh2BossMonologueLine(failLines, 0, () => {
                    showCh2QuizFailScreen();
                });
            } else if (ch2QuizWrongCount > 0) {
                const punishLines = currentLang === 'en' ? [
                    `YOU MADE ${ch2QuizWrongCount} MISTAKE(S)...`,
                    "FOR YOUR MISTAKES, YOU WILL BE PUNISHED.",
                    "WELCOME TO MY MAZE OF PAIN. SURVIVE IT IF YOU CAN!"
                ] : (currentLang === 'ua' ? [
                    `ТИ ЗРОБИВ ${ch2QuizWrongCount} ПОМИЛОК...`,
                    "ЗА СВОЇ ПОМИЛКИ ТИ ПОНЕСЕШ НАКАРАННЯ.",
                    "ЛАСКАВО ПРОСИМО В МІЙ ЛАБІРИНТ БОЛЮ. ПРОЙДИ ЙОГО, ЯКЩО ЗМОЖЕШ!"
                ] : [
                    `ТЫ СДЕЛАЛ ${ch2QuizWrongCount} ОШИБКИ(ОК)...`,
                    "ЗА СВОИ ОШИБКИ ТЫ ПОНЕПЁШЬ НАКАЗАНИЕ.",
                    "ДОБРО ПОЖАЛОВАТЬ В МОЙ ЛАБИРИНТ БОЛИ. ПРОЙДИ ЕГО, ЕСЛИ СМОЖЕШЬ!"
                ]);

                renderCh2BossMonologueLine(punishLines, 0, () => {
                    renderCh2MazeScreen();
                });
            } else {
                const perfectLines = currentLang === 'en' ? [
                    "CONGRATULATIONS... YOU ANSWERED ALL QUESTIONS CORRECTLY.",
                    "DO YOU THINK THIS WILL SAVE YOU?",
                    "YOUR NEXT STEP — FIND MY KERNEL IN REGEDIT IF YOU DARE!"
                ] : (currentLang === 'ua' ? [
                    "ВІТАЮ... ТИ ВІДПОВІВ ПРАВИЛЬНО НА ВСІ ПИТАННЯ.",
                    "ТИ ДУМАЄШ, ЩО ЦЕ ВРЯТУЄ ТЕБЕ?",
                    "ТВІЙ НАСТУПНИЙ КРОК — ШУКАЙ МОЄ ЯДРО В РЕЄСТРІ, ЯКЩО НАВАЖИШСЯ!"
                ] : [
                    "ПОЗДРАВЛЯЮ... ТЫ ОТВЕТИЛ ПРАВИЛЬНО НА ВСЕ ВОПРОСЫ.",
                    "ТЫ ДУМАЕШЬ, ЧТО ЭТО СПАСЁТ ТЕБЯ?",
                    "ТВОЙ СЛЕДУЮЩИЙ ШАГ — ИЩИ МОЁ ЯДРО В РЕЕСТРЕ, ЕСЛИ ОСМЕЛИШЬСЯ!"
                ]);

                renderCh2BossMonologueLine(perfectLines, 0, () => {
                    finishCh2QuizStage();
                });
            }
        }

        function showCh2QuizFailScreen() {
            const container = document.getElementById('ch2-boss-dialogue-box');
            if (!container) return;

            const failTitle = currentLang === 'en' ? "💥 QUIZ DEFEAT" : (currentLang === 'ua' ? "💥 ПОРАЗКА У ВІКТОРИНІ" : "💥 ПОРАЖЕНИЕ В ВИКТОРИНЕ");
            const failDesc = currentLang === 'en'
                ? "You answered all 4 questions incorrectly. The God of Sites destroyed your consciousness."
                : (currentLang === 'ua' ? "Ви відповіли невірно на всі 4 питання. Бог сайтів знищив вашу свідомість." : "Вы ответили неверно на все 4 вопроса. Бог сайтов уничтожил ваше сознание.");
            const retryBtn = currentLang === 'en' ? "🔄 Try Again" : (currentLang === 'ua' ? "🔄 Спробувати знову" : "🔄 Попробовать снова");

            container.innerHTML = `
                <div style="color: #ff0033; font-weight: bold; font-size: 22px; margin-bottom: 12px; letter-spacing: 3px; text-align: center;">
                    ${failTitle}
                </div>
                <div style="color: #aaaaaa; font-size: 15px; text-align: center; margin-bottom: 20px;">
                    ${failDesc}
                </div>
                <div style="display: flex; justify-content: center;">
                    <button onclick="restartCh2Quiz()" style="
                        padding: 14px 30px;
                        background: #880000;
                        color: #fff;
                        border: 2px solid #ff4444;
                        font-family: 'Courier New', monospace;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 0 15px #ff0000;
                    ">
                        ${retryBtn}
                    </button>
                </div>
            `;
        }
        window.showCh2QuizFailScreen = showCh2QuizFailScreen;

        function restartCh2Quiz() {
            currentCh2QuizIndex = 0;
            ch2QuizWrongCount = 0;
            const t = translations[currentLang] || translations['ru'];
            const dialogueLines = [
                t.ch2BossFinaleM5 || "А ТЕПЕРЬ ОТВЕТЬ НА МОИ ВОПРОСЫ. ЕСЛИ ОШИБЁШЬСЯ — ПОЖАЛЕЕШЬ."
            ];
            renderCh2BossMonologueLine(dialogueLines, 0, () => {
                renderCh2QuizStep(0);
            });
        }
        window.restartCh2Quiz = restartCh2Quiz;

        function renderCh2MazeScreen() {
            const overlay = document.getElementById('ch2-boss-finale-overlay');
            if (!overlay) return;

            const mazeTitle = currentLang === 'en'
                ? "🔴 PUNISHMENT: COMPLETE THE MAZE (WASD / ARROW KEYS)"
                : (currentLang === 'ua' ? "🔴 НАКАРАННЯ: ПРОЙДИ ЛАБІРИНТ (WASD / СТРІЛКИ)" : "🔴 НАКАЗАНИЕ: ПРОЙДИ ЛАБИРИНТ (WASD / СТРЕЛКИ)");
            const mazeInstruct = currentLang === 'en'
                ? "Avoid red walls and dodge the pursuing eye! Reach the green exit portal!"
                : (currentLang === 'ua' ? "Не торкайтеся червоних стін та уникайте преслідуючого ока! Дійдіть до зеленого виходу!" : "Не касайтесь красных стен и избегайте преследующего глаза! Доберитесь до зелёного выхода!");

            overlay.innerHTML = `
                <div style="position: absolute; top: 15px; left: 50%; transform: translateX(-50%); color: #ff0033; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-shadow: 0 0 10px #ff0000; text-align: center;">
                    ${mazeTitle}
                </div>
                <div id="ch2-maze-canvas-container" style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; height: 75vh;">
                    <canvas id="ch2-maze-canvas" width="600" height="400" style="border: 3px solid #ff0033; background: #080002; box-shadow: 0 0 25px rgba(255, 0, 51, 0.7);"></canvas>
                </div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">
                    ${mazeInstruct}
                </div>
            `;

            initCh2MazeGame();
        }
        window.renderCh2MazeScreen = renderCh2MazeScreen;

        function initCh2MazeGame() {
            const canvas = document.getElementById('ch2-maze-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            const playerStartX = 30;
            const playerStartY = 100;
            const eyeStartX = 30;
            const eyeStartY = 30;

            let playerX = playerStartX;
            let playerY = playerStartY;
            const playerRadius = 8;
            const speed = 4;
            let keys = {};

            // Chasing small eye enemy (slower than player)
            let eyeX = eyeStartX;
            let eyeY = eyeStartY;
            const eyeRadius = 10;
            const eyeSpeed = 1.0;

            const walls = [
                [0, 0, 600, 10],
                [0, 390, 600, 10],
                [0, 0, 10, 400],
                [590, 0, 10, 400],
                [80, 0, 10, 300],
                [160, 90, 10, 300],
                [240, 0, 10, 300],
                [320, 90, 10, 300],
                [400, 0, 10, 300],
                [480, 90, 10, 300]
            ];

            const exitZone = { x: 530, y: 330, w: 50, h: 50 };

            if (ch2MazeKeyHandler) window.removeEventListener('keydown', ch2MazeKeyHandler);
            if (ch2MazeKeyHandler) window.removeEventListener('keyup', ch2MazeKeyHandler);

            ch2MazeKeyHandler = (e) => {
                if (e.type === 'keydown') keys[e.key.toLowerCase()] = true;
                if (e.type === 'keyup') keys[e.key.toLowerCase()] = false;
            };

            window.addEventListener('keydown', ch2MazeKeyHandler);
            window.addEventListener('keyup', ch2MazeKeyHandler);

            if (ch2MazeInterval) clearInterval(ch2MazeInterval);

            ch2MazeInterval = setInterval(() => {
                let dx = 0;
                let dy = 0;
                if (keys['w'] || keys['arrowup']) dy -= speed;
                if (keys['s'] || keys['arrowdown']) dy += speed;
                if (keys['a'] || keys['arrowleft']) dx -= speed;
                if (keys['d'] || keys['arrowright']) dx += speed;

                let newX = playerX + dx;
                let newY = playerY + dy;

                let collided = false;
                for (let w of walls) {
                    if (newX + playerRadius > w[0] &&
                        newX - playerRadius < w[0] + w[2] &&
                        newY + playerRadius > w[1] &&
                        newY - playerRadius < w[1] + w[3]) {
                        collided = true;
                        break;
                    }
                }

                if (collided) {
                    playerX = playerStartX;
                    playerY = playerStartY;
                    eyeX = eyeStartX;
                    eyeY = eyeStartY;
                    if (typeof audioEngine !== 'undefined') audioEngine.playError(0.3);
                } else {
                    playerX = newX;
                    playerY = newY;
                }

                // Chasing small eye movement & collision
                const edx = playerX - eyeX;
                const edy = playerY - eyeY;
                const dist = Math.hypot(edx, edy);
                if (dist > 0) {
                    eyeX += (edx / dist) * eyeSpeed;
                    eyeY += (edy / dist) * eyeSpeed;
                }

                if (dist < playerRadius + eyeRadius) {
                    playerX = playerStartX;
                    playerY = playerStartY;
                    eyeX = eyeStartX;
                    eyeY = eyeStartY;
                    if (typeof audioEngine !== 'undefined') audioEngine.playError(0.6);
                }

                if (playerX >= exitZone.x && playerY >= exitZone.y) {
                    clearInterval(ch2MazeInterval);
                    window.removeEventListener('keydown', ch2MazeKeyHandler);
                    window.removeEventListener('keyup', ch2MazeKeyHandler);

                    if (typeof audioEngine !== 'undefined') audioEngine.playTone('sine', 880, 200, 0.4, 0.4);
                    finishCh2QuizStage();
                    return;
                }

                ctx.clearRect(0, 0, 600, 400);

                ctx.strokeStyle = '#150005';
                ctx.lineWidth = 1;
                for (let i = 0; i < 600; i += 30) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke();
                }
                for (let j = 0; j < 400; j += 30) {
                    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(600, j); ctx.stroke();
                }

                ctx.fillStyle = '#ff0033';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 12;
                for (let w of walls) {
                    ctx.fillRect(w[0], w[1], w[2], w[3]);
                }

                ctx.fillStyle = '#00ff66';
                ctx.shadowColor = '#00ff66';
                ctx.shadowBlur = 15;
                ctx.fillRect(exitZone.x, exitZone.y, exitZone.w, exitZone.h);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('EXIT', exitZone.x + 10, exitZone.y + 30);

                // Draw chasing small eye
                ctx.save();
                ctx.shadowColor = '#ff0033';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                const lookDx = dist > 0 ? (edx / dist) * 3 : 0;
                const lookDy = dist > 0 ? (edy / dist) * 3 : 0;
                ctx.fillStyle = '#cc0000';
                ctx.beginPath();
                ctx.arc(eyeX + lookDx, eyeY + lookDy, eyeRadius * 0.55, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(eyeX + lookDx, eyeY + lookDy, eyeRadius * 0.28, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Draw player
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
                ctx.fill();
            }, 1000 / 60);
        }

        function finishCh2QuizStage() {
            if (ch2MazeInterval) clearInterval(ch2MazeInterval);
            
            const overlay = document.getElementById('ch2-boss-finale-overlay');
            if (overlay) overlay.remove();

            browserState.isOpen = false;
            if (typeof browserWindow !== 'undefined' && browserWindow) browserWindow.style.display = 'none';
            if (typeof taskbarBrowserBtn !== 'undefined' && taskbarBrowserBtn) taskbarBrowserBtn.style.display = 'none';

            if (typeof unblockAllInteractions === 'function') unblockAllInteractions();

            currentChapter2Task = 4;
            const widget = document.getElementById('task-widget');
            if (widget) widget.style.display = 'block';
            if (typeof updateTaskWidgetText === 'function') {
                updateTaskWidgetText();
            }

            const t = translations[currentLang] || translations['ru'];

            if (typeof showSystemNotification === 'function') {
                showSystemNotification(t.ch2Task4Title || "ЗАДАНИЕ 4", t.ch2Task4Desc || "Найдите и уничтожьте ядро Бога Сайтов в Реестре (regedit)");
            }

            if (typeof showPlayerDialogue === 'function') {
                showPlayerDialogue(t.ch2PlayerPostQuizMonologue || "Я не отпущу тебя просто так. Я тебя достану.");
            }
        }
        window.finishCh2QuizStage = finishCh2QuizStage;


        // --- GOD OF SITES CHAPTER 2 BOSS FINALE COMBAT (STAGE 2: CORE DESTRUCTION) ---
        let ch2BossActive = false;
        let ch2BossHP = 1000;
        let ch2BossMaxHP = 1000;
        let ch2PlayerHP = 100;
        let ch2PlayerMaxHP = 100;
        let ch2PlayerX = 200;
        let ch2PlayerY = 300;
        let ch2PlayerSpeed = 6;
        let ch2Keys = {};
        let ch2IsBossTired = false;
        let ch2TiredCycleTimer = null;
        let ch2TiredDurationTimer = null;
        let ch2AttackTimer = null;
        let ch2CombatFrameId = null;
        let ch2ActiveAttacks = [];
        let ch2IsLMBDown = false;
        let ch2BossIntroSkipped = false;
        let ch2InvulnerableUntil = 0;
        let ch2BossTime = 0;

        // Charge Attack Variables
        let ch2ChargeStartTime = 0;
        let ch2IsCharging = false;
        let ch2BossDarkFlickerUntil = 0;

        function startCh2GodOfSitesBoss() {
            if (typeof closeAllDesktopWindows === 'function') closeAllDesktopWindows();
            if (typeof closeBrowser === 'function') closeBrowser();
            const bWin = document.getElementById('browser-window');
            if (bWin) bWin.style.display = 'none';
            const bTaskbar = document.getElementById('taskbar-browser-btn');
            if (bTaskbar) bTaskbar.style.display = 'none';
            const regWin = document.getElementById('regedit-window');
            if (regWin) regWin.remove();
            
            internetKilled = true;
            isOnCreepySite = false;
            browserState.isOpen = false;
            
            if (typeof audioEngine !== 'undefined') {
                audioEngine.playGlitchSound();
                audioEngine.stopBossMusic();
                audioEngine.stopDrone();
            }

            if (typeof blockAllInteractions === 'function') {
                blockAllInteractions(99998);
            }
            
            ch2BossHP = 1000;
            ch2PlayerHP = 100;
            ch2PlayerX = window.innerWidth * 0.2;
            ch2PlayerY = window.innerHeight * 0.5;
            ch2ActiveAttacks.forEach(a => a.el && a.el.remove());
            ch2ActiveAttacks = [];
            ch2IsBossTired = false;
            ch2BossActive = true;
            ch2BossTime = 0;
            ch2IsCharging = false;
            ch2ChargeStartTime = 0;
            ch2BossDarkFlickerUntil = 0;

            let overlay = document.getElementById('boss-fight-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'boss-fight-overlay';
                document.body.appendChild(overlay);
            }
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 0, 5, 0.65);
                backdrop-filter: blur(2px);
                z-index: 99990;
                display: block;
                overflow: hidden;
                font-family: 'W95FA', 'Courier New', monospace;
                user-select: none;
            `;

            overlay.innerHTML = `
                <div style="position: absolute; top: 20px; left: 30px; width: 260px; z-index: 50010;">
                    <div style="color: #ffffff; font-weight: bold; font-size: 14px; margin-bottom: 4px; text-shadow: 0 0 4px #000;">
                        ${translations[currentLang]?.defaultPlayerName || 'Игрок'} HP: <span id="ch2-player-hp-text">100</span> / 100
                    </div>
                    <div style="width: 100%; height: 16px; background: #220000; border: 2px solid #ff4444; border-radius: 4px; overflow: hidden;">
                        <div id="ch2-player-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(to right, #00ff66, #00cc44); transition: width 0.2s;"></div>
                    </div>
                </div>

                <div style="position: absolute; top: 20px; right: 30px; width: 340px; z-index: 50010; text-align: right;">
                    <div style="color: #ff3333; font-weight: bold; font-size: 14px; margin-bottom: 4px; text-shadow: 0 0 6px #ff0000;">
                        ${(currentLang === 'en' ? "GOD OF SITES" : (currentLang === 'ua' ? "БОГ САЙТІВ" : "БОГ САЙТОВ"))} HP: <span id="ch2-boss-hp-text">1000</span> / 1000
                    </div>
                    <div style="width: 100%; height: 20px; background: #220000; border: 2px solid #ff0033; border-radius: 4px; overflow: hidden; box-shadow: 0 0 10px rgba(255,0,0,0.5);">
                        <div id="ch2-boss-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(to right, #990000, #ff0033); transition: width 0.2s;"></div>
                    </div>
                </div>

                <!-- Charge Aura Ring -->
                <div id="ch2-player-charge-aura" style="
                    display: none;
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    left: ${ch2PlayerX}px;
                    top: ${ch2PlayerY}px;
                    z-index: 50019;
                    pointer-events: none;
                    transition: width 0.1s, height 0.1s;
                "></div>

                <div id="ch2-player-dot" style="
                    position: absolute;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid #000000;
                    box-shadow: 0 0 12px #ffffff;
                    z-index: 50020;
                    transform: translate(-50%, -50%);
                    left: ${ch2PlayerX}px;
                    top: ${ch2PlayerY}px;
                "></div>

                <div id="boss-eye-container" class="boss-eye-container" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(1);
                    width: 220px;
                    height: 220px;
                    z-index: 50002;
                    transition: left 1.5s ease-in-out, top 1.5s ease-in-out, transform 1s ease-in-out;
                ">
                    <svg class="boss-eye" viewBox="0 0 100 100" id="boss-eye-svg">
                        <defs>
                            <clipPath id="ch2-sclera-clip">
                                <path d="M10,50 C30,10 70,10 90,50 C70,90 30,90 10,50 Z"/>
                            </clipPath>
                            <radialGradient id="ch2BossIrisGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ff2200"/>
                                <stop offset="55%" stop-color="#880000"/>
                                <stop offset="100%" stop-color="#330000"/>
                            </radialGradient>
                            <filter id="ch2BossGlow">
                                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                            </filter>
                        </defs>
                        <path id="boss-sclera" d="M10,50 C30,10 70,10 90,50 C70,90 30,90 10,50 Z" fill="white" stroke="#cc0000" stroke-width="2"/>
                        <g clip-path="url(#ch2-sclera-clip)" filter="url(#ch2BossGlow)">
                            <circle id="boss-iris" cx="50" cy="50" r="22" fill="url(#ch2BossIrisGrad)"/>
                            <ellipse id="boss-pupil" cx="50" cy="50" rx="5" ry="15" fill="black"/>
                            <ellipse id="boss-glint" cx="54" cy="43" rx="2.5" ry="4" fill="rgba(255,255,255,0.45)" transform="rotate(-10,54,43)"/>
                        </g>
                    </svg>
                </div>

                <div id="ch2-boss-tired-banner" style="
                    display: none;
                    position: absolute;
                    bottom: 120px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 24px;
                    font-weight: bold;
                    color: #ffeb3b;
                    background: rgba(20, 0, 0, 0.9);
                    border: 2px solid #ffeb3b;
                    padding: 12px 35px;
                    box-shadow: 0 0 20px #ffeb3b;
                    z-index: 50030;
                    letter-spacing: 2px;
                ">
                    ${translations[currentLang]?.ch2BossTiredAlert || (currentLang === 'en' ? 'Boss is tired! Attack!' : (currentLang === 'ua' ? 'Бос втомився! Атакуй!' : 'Босс устал! Атакуй!'))}
                </div>

                <div id="ch2-boss-dialogue-box" style="
                    position: absolute;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 800px;
                    background: rgba(15, 0, 5, 0.95);
                    border: 2px solid #ff0033;
                    border-radius: 8px;
                    padding: 20px;
                    box-sizing: border-box;
                    z-index: 50030;
                    box-shadow: 0 0 20px rgba(255, 0, 51, 0.5);
                ">
                    <div id="ch2-boss-speaker" style="color: #ff0033; font-weight: bold; font-size: 16px; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                        <span style="display: inline-block; width: 10px; height: 10px; background: #ff0033; border-radius: 50%; box-shadow: 0 0 8px #ff0033;"></span>
                        <span>${(currentLang === 'en' ? "GOD OF SITES" : (currentLang === 'ua' ? "БОГ САЙТІВ" : "БОГ САЙТОВ"))}</span>
                    </div>
                    <div id="ch2-boss-text-content" style="color: #ffffff; font-size: 16px; line-height: 1.6; min-height: 50px; text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);">
                        ...
                    </div>
                </div>
            `;

            createTentacles();

            window.onkeydown = (e) => { ch2Keys[e.key.toLowerCase()] = true; };
            window.onkeyup = (e) => { ch2Keys[e.key.toLowerCase()] = false; };

            overlay.onmousedown = (e) => {
                if (e.button === 0) ch2IsLMBDown = true;
            };
            overlay.onmouseup = (e) => {
                if (e.button === 0) ch2IsLMBDown = false;
            };

            setTimeout(() => {
                if (typeof audioEngine !== 'undefined') audioEngine.stopGlitchSound();

                if (ch2BossIntroSkipped) {
                    moveBossToRightAndStartCombat();
                } else {
                    const preLines = translations[currentLang]?.ch2BossPreFight || [
                        "ТЫ ВСЁ ТАКИ НАШЁЛ СПОСОБ МЕНЯ УНИЧТОЖИТЬ...",
                        "НО Я НАМНОГО СИЛЬНЕЕ ЧЕМ ПРОСТО КОД.",
                        "Я МОГУ ПЕРЕПИСЫВАТЬ ОРГАНИЗМЫ, И УНИЧТОЖАТЬ ИХ ИЗНУТРИ.",
                        "КАК Я ЭТО И СДЕЛАЛ С ТЕМИ КТО МЕНЯ СДЕЛАЛ ТАКИМ.",
                        "И ЕСЛИ ТЫ РЕШИЛСЯ МЕНЯ УНИЧТОЖИТЬ...",
                        "ТЕБЕ НУЖНО ПРОЙТИ ЧЕРЕЗ МЕНЯ.",
                        "ИЛИ ИНАЧЕ Я ПЕРЕПИШУ ТВОЙ КОД.",
                        "И ТЫ УМРЁШЬ."
                    ];

                    renderCh2BossMonologueLine(preLines, 0, () => {
                        moveBossToRightAndStartCombat();
                    });
                }
            }, 1000);
        }
        window.startCh2GodOfSitesBoss = startCh2GodOfSitesBoss;

        function moveBossToRightAndStartCombat() {
            const eye = document.getElementById('boss-eye-container');
            if (eye) {
                eye.style.left = '80%';
                eye.style.top = '50%';
            }

            const combatLines = translations[currentLang]?.ch2BossIntroCombat || [
                "Я СОЗДАЛ ТЕБЕ ИГРУ, КОТОРАЯ РАЗВЛЕЧЁТ МЕНЯ.",
                "ТЫ БУДЕШЬ МУЧАТСЯ ОТ КАЖДОГО УРОНА КОТОРЫЙ Я ТЕБЕ НАНЕСУ С ПОМОЩЬЮ СВОИХ СНАРЯДОВ.",
                "ТЕПЕРЬ ГОТОВЬСЯ.",
                "ВЕДЬ Я НАЧИНАЮ."
            ];

            renderCh2BossMonologueLine(combatLines, 0, () => {
                const diagBox = document.getElementById('ch2-boss-dialogue-box');
                if (diagBox) diagBox.style.display = 'none';

                if (typeof unblockAllInteractions === 'function') unblockAllInteractions();
                if (typeof audioEngine !== 'undefined') audioEngine.playBossMusic();

                startCh2CombatLoop();
            });
        }

        function showAttackTextAbovePlayer(x, y) {
            const overlay = document.getElementById('boss-fight-overlay');
            if (!overlay) return;

            const txtEl = document.createElement('div');
            const attackWord = currentLang === 'ua' ? 'АТАКУЙ!' : (currentLang === 'en' ? 'ATTACK!' : 'АТАКУЙ!');
            txtEl.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y - 35}px;
                transform: translate(-50%, -50%) scale(0.5);
                font-family: 'W95FA', 'Courier New', monospace;
                font-size: 32px;
                font-weight: 900;
                color: #ff9900;
                text-shadow: 0 0 15px #ff3300, 0 0 30px #ffcc00, 2px 2px 0 #000;
                z-index: 50030;
                pointer-events: none;
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease-in;
                opacity: 1;
            `;
            txtEl.innerText = attackWord;
            overlay.appendChild(txtEl);

            requestAnimationFrame(() => {
                txtEl.style.transform = 'translate(-50%, -65px) scale(1.4)';
            });

            setTimeout(() => {
                txtEl.style.opacity = '0';
                setTimeout(() => txtEl.remove(), 600);
            }, 600);
        }

        function triggerPlayerExplosion(x, y) {
            const overlay = document.getElementById('boss-fight-overlay');
            if (!overlay) return;

            const exp = document.createElement('div');
            exp.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: radial-gradient(circle, #ffcc00 0%, #ff6600 60%, transparent 100%);
                border: 3px solid #ffaa00;
                box-shadow: 0 0 30px #ff3300;
                transform: translate(-50%, -50%);
                z-index: 50025;
                pointer-events: none;
                transition: width 0.35s ease-out, height 0.35s ease-out, opacity 0.35s ease-out;
                opacity: 1;
            `;
            overlay.appendChild(exp);

            requestAnimationFrame(() => {
                exp.style.width = '160px';
                exp.style.height = '160px';
                exp.style.opacity = '0';
            });

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playTone('triangle', 180, 250, 0.4, 0.4);
                audioEngine.playGlitchSound();
                setTimeout(() => {
                    if (typeof audioEngine !== 'undefined') audioEngine.stopGlitchSound();
                }, 200);
            }

            setTimeout(() => exp.remove(), 400);
        }

        function startCh2CombatLoop() {
            if (!ch2BossActive) return;

            if (ch2AttackTimer) clearInterval(ch2AttackTimer);
            ch2AttackTimer = setInterval(() => {
                if (typeof isPaused !== 'undefined' && isPaused) return;
                const now = Date.now();
                if (!ch2BossActive || ch2IsBossTired || now < ch2BossDarkFlickerUntil) return;
                spawnRandomCh2BossAttack();
            }, 2200);

            if (ch2TiredCycleTimer) clearInterval(ch2TiredCycleTimer);
            ch2TiredCycleTimer = setInterval(() => {
                if (typeof isPaused !== 'undefined' && isPaused) return;
                if (!ch2BossActive) return;
                triggerBossTiredness();
            }, 10000);

            // Global mouse listeners for charging & releasing player attack
            window.onmousedown = (e) => {
                if (e.button === 0 && ch2BossActive) {
                    ch2IsLMBDown = true;
                }
            };

            window.onmouseup = (e) => {
                if (e.button === 0 && ch2BossActive) {
                    ch2IsLMBDown = false;
                    executePlayerAttackIfCharged();
                }
            };

            function updateLoop() {
                if (!ch2BossActive) return;

                const now = Date.now();
                ch2BossTime += 0.03;

                // Player Movement
                if (ch2Keys['w'] || ch2Keys['arrowup']) ch2PlayerY -= ch2PlayerSpeed;
                if (ch2Keys['s'] || ch2Keys['arrowdown']) ch2PlayerY += ch2PlayerSpeed;
                if (ch2Keys['a'] || ch2Keys['arrowleft']) ch2PlayerX -= ch2PlayerSpeed;
                if (ch2Keys['d'] || ch2Keys['arrowright']) ch2PlayerX += ch2PlayerSpeed;

                ch2PlayerX = Math.max(20, Math.min(window.innerWidth - 20, ch2PlayerX));
                ch2PlayerY = Math.max(20, Math.min(window.innerHeight - 20, ch2PlayerY));

                const pDot = document.getElementById('ch2-player-dot');
                if (pDot) {
                    pDot.style.left = ch2PlayerX + 'px';
                    pDot.style.top = ch2PlayerY + 'px';
                }

                const eye = document.getElementById('boss-eye-container');
                let bossCx = window.innerWidth * 0.8;
                let bossCy = window.innerHeight * 0.5 + Math.sin(ch2BossTime) * 20;

                if (eye) {
                    eye.style.left = bossCx + 'px';
                    eye.style.top = bossCy + 'px';
                }

                trackEyeToMouse(ch2PlayerX, ch2PlayerY);

                // --- CHARGED ATTACK MECHANIC ON LMB HOLD ---
                const chargeAura = document.getElementById('ch2-player-charge-aura');

                if (ch2IsLMBDown && ch2IsBossTired && now >= ch2BossDarkFlickerUntil) {
                    if (!ch2IsCharging) {
                        ch2IsCharging = true;
                        ch2ChargeStartTime = now;
                    }

                    const elapsed = now - ch2ChargeStartTime;
                    const progress = Math.min(1, elapsed / 1000); // 1.0s full charge time

                    if (chargeAura) {
                        chargeAura.style.display = 'block';
                        chargeAura.style.left = ch2PlayerX + 'px';
                        chargeAura.style.top = ch2PlayerY + 'px';
                        const auraSize = 20 + progress * 65;
                        chargeAura.style.width = auraSize + 'px';
                        chargeAura.style.height = auraSize + 'px';

                        if (progress >= 1) {
                            chargeAura.style.boxShadow = '0 0 35px #ffffff, inset 0 0 25px #ffaa00';
                            chargeAura.style.background = 'rgba(255, 255, 255, 0.85)';
                        } else {
                            chargeAura.style.boxShadow = `0 0 ${15 + progress * 30}px #ff9900, inset 0 0 ${10 + progress * 20}px #ff5500`;
                            chargeAura.style.background = `rgba(255, 140, 0, ${0.35 + progress * 0.55})`;
                        }
                    }

                    if (pDot) {
                        if (progress >= 1) {
                            pDot.style.background = '#ffffff';
                            pDot.style.boxShadow = '0 0 25px #ffffff, 0 0 15px #ffaa00';
                        } else {
                            pDot.style.background = `rgb(255, ${Math.floor(255 - progress * 155)}, 0)`;
                            pDot.style.boxShadow = `0 0 ${12 + progress * 25}px #ffaa00`;
                        }
                    }

                    if (typeof audioEngine !== 'undefined' && Math.random() < 0.2) {
                        audioEngine.playTone('sine', 300 + progress * 650, 40, 0.05, 0.05);
                    }
                } else {
                    if (!ch2IsLMBDown && chargeAura) {
                        chargeAura.style.display = 'none';
                    }
                    if (!ch2IsLMBDown && pDot && now >= ch2InvulnerableUntil) {
                        pDot.style.background = '#ffffff';
                        pDot.style.boxShadow = '0 0 12px #ffffff';
                    }
                }

                // --- BOSS DARK FLICKER (HURT/STUN: 3 SECONDS, TOGGLE COLOR EVERY 0.5S) ---
                if (eye) {
                    if (now < ch2BossDarkFlickerUntil) {
                        const togglePhase = Math.floor((now % 1000) / 500) === 0;
                        if (togglePhase) {
                            eye.style.filter = 'drop-shadow(0 0 15px #ff0033) brightness(1.1)';
                        } else {
                            eye.style.filter = 'brightness(0.2) contrast(2.5) hue-rotate(-30deg) drop-shadow(0 0 5px #440000)';
                        }
                    } else if (ch2IsBossTired) {
                        eye.style.filter = 'brightness(0.5) sepia(0.8) drop-shadow(0 0 15px #ffaa00)';
                    } else {
                        eye.style.filter = 'drop-shadow(0 0 10px red)';
                    }
                }

                updateCh2Attacks();

                ch2CombatFrameId = requestAnimationFrame(updateLoop);
            }

            updateLoop();
        }

        function executePlayerAttackIfCharged() {
            if (!ch2BossActive || !ch2IsCharging) return;

            const now = Date.now();
            const elapsed = now - ch2ChargeStartTime;

            // ONLY execute if fully charged (>= 1000ms / 1 second) during vulnerable state!
            if (elapsed >= 1000 && ch2IsBossTired && now >= ch2BossDarkFlickerUntil) {
                ch2IsCharging = false;
                ch2ChargeStartTime = 0;
                ch2IsBossTired = false;
                if (ch2TiredDurationTimer) clearTimeout(ch2TiredDurationTimer);

                const banner = document.getElementById('ch2-boss-tired-banner');
                if (banner) banner.style.display = 'none';

                const chargeAura = document.getElementById('ch2-player-charge-aura');
                if (chargeAura) chargeAura.style.display = 'none';

                // 1. Show attack text above player
                showAttackTextAbovePlayer(ch2PlayerX, ch2PlayerY);

                // 2. Small explosion and energy hit
                triggerPlayerExplosion(ch2PlayerX, ch2PlayerY);
                if (typeof audioEngine !== 'undefined') audioEngine.playTone('sine', 880, 200, 0.4, 0.4);

                // 3. Boss takes 50 HP damage
                ch2BossHP = Math.max(0, ch2BossHP - 50);
                updateCh2BossHPUI();

                // 4. Boss enters 3-second Dark Flicker Stun state (toggles color every 0.5s, no attacks for 3s)
                ch2BossDarkFlickerUntil = now + 3000;

                if (ch2BossHP <= 0) {
                    triggerCh2BossVictory();
                }
            } else {
                // Cancel charge if released before 100% charge!
                ch2IsCharging = false;
                ch2ChargeStartTime = 0;
                const chargeAura = document.getElementById('ch2-player-charge-aura');
                if (chargeAura) chargeAura.style.display = 'none';
                if (typeof audioEngine !== 'undefined') audioEngine.playError(0.2);
            }
        }

        function triggerBossTiredness() {
            if (Date.now() < ch2BossDarkFlickerUntil) return;
            ch2IsBossTired = true;

            const banner = document.getElementById('ch2-boss-tired-banner');
            if (banner) banner.style.display = 'block';

            const eye = document.getElementById('boss-eye-container');
            if (eye) eye.style.filter = 'brightness(0.5) sepia(0.8) drop-shadow(0 0 15px #ffaa00)';

            if (ch2TiredDurationTimer) clearTimeout(ch2TiredDurationTimer);
            ch2TiredDurationTimer = setTimeout(() => {
                ch2IsBossTired = false;
                if (banner) banner.style.display = 'none';
                if (eye && Date.now() >= ch2BossDarkFlickerUntil) eye.style.filter = 'drop-shadow(0 0 10px red)';
            }, 2000);
        }

        function spawnRandomCh2BossAttack() {
            const attackType = Math.floor(Math.random() * 3) + 1;
            const overlay = document.getElementById('boss-fight-overlay');
            if (!overlay) return;

            if (attackType === 1) {
                // Giant Error Window Block (3x size, random location, 0.5s indicator box, scale popup animation >=0.2s)
                const words = translations[currentLang]?.ch2BossErrorWords || ["УМРИ", "СМЕРТЬ"];
                const text = words[Math.floor(Math.random() * words.length)];
                
                const w = 480;
                const h = 240;
                const targetX = Math.floor(Math.random() * (window.innerWidth - w - 60)) + 30;
                const targetY = Math.floor(Math.random() * (window.innerHeight - h - 80)) + 40;

                // 0.5s Indicator Field
                const tele = document.createElement('div');
                tele.style.cssText = `
                    position: absolute;
                    left: ${targetX}px;
                    top: ${targetY}px;
                    width: ${w}px;
                    height: ${h}px;
                    background: rgba(255, 0, 0, 0.35);
                    border: 3px dashed #ff0000;
                    box-shadow: 0 0 25px rgba(255, 0, 0, 0.8);
                    z-index: 50005;
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff0000;
                    font-size: 24px;
                    font-weight: bold;
                    letter-spacing: 3px;
                `;
                tele.innerText = '⚠️ WARNING';
                overlay.appendChild(tele);

                setTimeout(() => {
                    tele.remove();
                    if (!ch2BossActive) return;

                    const windowBlock = document.createElement('div');
                    windowBlock.style.cssText = `
                        position: absolute;
                        left: ${targetX}px;
                        top: ${targetY}px;
                        width: ${w}px;
                        height: ${h}px;
                        background: #c0c0c0;
                        border: 3px outset #ffffff;
                        z-index: 50010;
                        box-shadow: 0 0 30px rgba(255, 0, 0, 0.9);
                        font-family: 'MS Sans Serif', Tahoma, monospace;
                        transform: scale(0.05);
                        transform-origin: center center;
                        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    `;
                    windowBlock.innerHTML = `
                        <div style="background: linear-gradient(90deg, #880000, #ff0033); color: white; padding: 4px 10px; font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #555;">
                            <span style="display:flex; align-items:center; gap:8px;">❌ SYSTEM_ERROR.EXE</span>
                            <span style="background:#c0c0c0; color:#000; padding:0 6px; border:1px outset #fff; font-size:12px; cursor:pointer;">X</span>
                        </div>
                        <div style="padding: 30px 15px; text-align: center; color: #cc0000; font-weight: 900; font-size: 42px; text-shadow: 0 0 10px rgba(255,0,0,0.5); letter-spacing: 4px;">
                            ${text}
                        </div>
                    `;
                    overlay.appendChild(windowBlock);

                    // Trigger scale up popup animation (>= 0.2s)
                    requestAnimationFrame(() => {
                        windowBlock.style.transform = 'scale(1)';
                    });

                    ch2ActiveAttacks.push({
                        type: 'block',
                        el: windowBlock,
                        x: targetX,
                        y: targetY,
                        w: w,
                        h: h,
                        vx: -3,
                        vy: 0,
                        life: 250
                    });
                }, 500);

            } else if (attackType === 2) {
                // Giant Red Spikes (3x size: 80x36, 0.5s target line indicator)
                const bossCx = window.innerWidth * 0.8;
                const bossCy = window.innerHeight * 0.5;
                const dx = ch2PlayerX - bossCx;
                const dy = ch2PlayerY - bossCy;
                const angle = Math.atan2(dy, dx);

                // 0.5s Target Line Indicator
                const lineTele = document.createElement('div');
                lineTele.style.cssText = `
                    position: absolute;
                    left: ${bossCx}px;
                    top: ${bossCy}px;
                    width: 2200px;
                    height: 8px;
                    background: rgba(255, 0, 0, 0.7);
                    box-shadow: 0 0 15px #ff0000;
                    transform-origin: left center;
                    transform: rotate(${angle}rad);
                    z-index: 50004;
                    pointer-events: none;
                `;
                overlay.appendChild(lineTele);

                setTimeout(() => {
                    lineTele.remove();
                    if (!ch2BossActive) return;

                    const spike = document.createElement('div');
                    spike.style.cssText = `
                        position: absolute;
                        left: ${bossCx}px;
                        top: ${bossCy}px;
                        width: 80px;
                        height: 36px;
                        background: linear-gradient(90deg, #ff0000, #990000);
                        clip-path: polygon(100% 50%, 0% 0%, 15% 50%, 0% 100%);
                        box-shadow: 0 0 20px #ff0000;
                        z-index: 50008;
                        transform-origin: center center;
                        transform: translate(-50%, -50%) rotate(${angle}rad);
                    `;
                    overlay.appendChild(spike);

                    ch2ActiveAttacks.push({
                        type: 'spike',
                        el: spike,
                        x: bossCx,
                        y: bossCy,
                        vx: Math.cos(angle) * 16,
                        vy: Math.sin(angle) * 16
                    });
                }, 500);

            } else if (attackType === 3) {
                // Giant Caution Sign Bomb (3x size: 120x120)
                const bombX = Math.max(80, Math.min(window.innerWidth - 140, ch2PlayerX + (Math.random() * 260 - 130)));
                const bombY = Math.max(80, Math.min(window.innerHeight - 140, ch2PlayerY + (Math.random() * 260 - 130)));

                const bombEl = document.createElement('div');
                bombEl.style.cssText = `
                    position: absolute;
                    left: ${bombX}px;
                    top: ${bombY}px;
                    width: 120px;
                    height: 120px;
                    background: #ffeb3b;
                    border: 4px solid #000;
                    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 55px;
                    color: #000;
                    font-weight: bold;
                    z-index: 50008;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 30px #ffeb3b;
                `;
                bombEl.innerHTML = `<span style="margin-top:22px;">⚠️</span>`;
                overlay.appendChild(bombEl);

                let flashState = false;
                const startTime = Date.now();
                const fuseTimer = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed >= 2000) {
                        clearInterval(fuseTimer);
                        detonateCh2Bomb(bombX, bombY, bombEl);
                    } else {
                        flashState = !flashState;
                        bombEl.style.background = flashState ? '#ff0000' : '#ffeb3b';
                    }
                }, 130);
            }
        }

        function detonateCh2Bomb(bx, by, bombEl) {
            bombEl.remove();
            if (!ch2BossActive) return;

            const dx = ch2PlayerX - bx;
            const dy = ch2PlayerY - by;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 220) {
                damageCh2Player(30);
            }

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playError(0.8);
            }

            for (let i = 0; i < 16; i++) {
                const frag = document.createElement('div');
                const fAngle = Math.random() * Math.PI * 2;
                const fSpeed = 6 + Math.random() * 7;
                frag.style.cssText = `
                    position: absolute;
                    left: ${bx}px;
                    top: ${by}px;
                    width: 16px;
                    height: 16px;
                    background: #ffeb3b;
                    border: 1px solid #000;
                    z-index: 50007;
                    pointer-events: none;
                    transition: opacity 0.5s;
                `;
                const overlay = document.getElementById('boss-fight-overlay');
                if (overlay) overlay.appendChild(frag);

                ch2ActiveAttacks.push({
                    type: 'fragment',
                    el: frag,
                    x: bx,
                    y: by,
                    vx: Math.cos(fAngle) * fSpeed,
                    vy: Math.sin(fAngle) * fSpeed,
                    life: 40
                });
            }
        }

        function damageCh2Player(dmg) {
            const now = Date.now();
            if (now < ch2InvulnerableUntil) return;
            ch2InvulnerableUntil = now + 800;

            ch2PlayerHP = Math.max(0, ch2PlayerHP - dmg);
            updateCh2PlayerHPUI();

            const pDot = document.getElementById('ch2-player-dot');
            if (pDot) {
                pDot.style.background = '#ff0000';
                setTimeout(() => { if (pDot) pDot.style.background = '#ffffff'; }, 200);
            }

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playError(0.5);
            }

            if (ch2PlayerHP <= 0) {
                triggerCh2BossDefeat();
            }
        }

        function updateCh2Attacks() {
            for (let i = ch2ActiveAttacks.length - 1; i >= 0; i--) {
                const a = ch2ActiveAttacks[i];
                a.x += a.vx;
                if (a.vy) a.y += a.vy;

                if (a.el) {
                    a.el.style.left = a.x + 'px';
                    a.el.style.top = a.y + 'px';
                }

                if (a.type === 'block') {
                    if (ch2PlayerX >= a.x && ch2PlayerX <= a.x + a.w &&
                        ch2PlayerY >= a.y && ch2PlayerY <= a.y + a.h) {
                        damageCh2Player(25);
                    }

                    a.life--;
                    if (a.x < -a.w || a.life <= 0) {
                        if (a.el) a.el.remove();
                        ch2ActiveAttacks.splice(i, 1);
                    }
                } else if (a.type === 'spike') {
                    const dx = ch2PlayerX - a.x;
                    const dy = ch2PlayerY - a.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 40) {
                        damageCh2Player(20);
                        if (a.el) a.el.remove();
                        ch2ActiveAttacks.splice(i, 1);
                        continue;
                    }

                    if (a.x < -100 || a.x > window.innerWidth + 100 || a.y < -100 || a.y > window.innerHeight + 100) {
                        if (a.el) a.el.remove();
                        ch2ActiveAttacks.splice(i, 1);
                    }
                } else if (a.type === 'fragment') {
                    a.life--;
                    if (a.life <= 0) {
                        if (a.el) {
                            a.el.style.opacity = '0';
                            setTimeout(() => a.el.remove(), 200);
                        }
                        ch2ActiveAttacks.splice(i, 1);
                    }
                }
            }
        }

        function updateCh2PlayerHPUI() {
            const txt = document.getElementById('ch2-player-hp-text');
            const fill = document.getElementById('ch2-player-hp-fill');
            if (txt) txt.innerText = ch2PlayerHP;
            if (fill) fill.style.width = Math.max(0, (ch2PlayerHP / ch2PlayerMaxHP) * 100) + '%';
        }

        function updateCh2BossHPUI() {
            const txt = document.getElementById('ch2-boss-hp-text');
            const fill = document.getElementById('ch2-boss-hp-fill');
            if (txt) txt.innerText = ch2BossHP;
            if (fill) fill.style.width = Math.max(0, (ch2BossHP / ch2BossMaxHP) * 100) + '%';
        }

        function triggerCh2BossVictory() {
            ch2BossActive = false;
            if (ch2CombatFrameId) cancelAnimationFrame(ch2CombatFrameId);
            if (ch2AttackTimer) clearInterval(ch2AttackTimer);
            if (ch2TiredCycleTimer) clearInterval(ch2TiredCycleTimer);

            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
                audioEngine.playGlitchSound();
            }

            // 1. Immediately hide/remove combat UI & attack elements (health bars, white player dot, charge aura)
            const pDot = document.getElementById('ch2-player-dot');
            if (pDot) pDot.style.display = 'none';

            const chargeAura = document.getElementById('ch2-player-charge-aura');
            if (chargeAura) chargeAura.style.display = 'none';

            const banner = document.getElementById('ch2-boss-tired-banner');
            if (banner) banner.style.display = 'none';

            // Hide HP bars (first two child containers of boss-fight-overlay)
            const overlay = document.getElementById('boss-fight-overlay');
            if (overlay) {
                Array.from(overlay.children).forEach(child => {
                    if (child.id !== 'boss-eye-container' && child.id !== 'ch2-boss-dialogue-box') {
                        child.style.display = 'none';
                    }
                });
            }

            // Remove all active attacks
            ch2ActiveAttacks.forEach(a => a.el && a.el.remove());
            ch2ActiveAttacks = [];

            // Boss eye enters defeat glitch shaking state
            const eye = document.getElementById('boss-eye-container');
            if (eye) {
                eye.style.animation = 'shake 0.05s infinite';
                eye.style.filter = 'hue-rotate(90deg) invert(1)';
            }

            // Show monologue dialogue box
            const diagBox = document.getElementById('ch2-boss-dialogue-box');
            if (diagBox) {
                diagBox.style.display = 'block';
                diagBox.style.bottom = '40px';
            }

            const winGlitchLine = translations[currentLang]?.ch2BossWinGlitch || "НЕВОЗМОЖНО... НО Я... Я...";

            // STEP 1: Render first glitch words ("НЕВОЗМОЖНО... НО Я... Я...")
            renderCh2BossMonologueLine([winGlitchLine], 0, () => {
                // STEP 2: AFTER FIRST WORDS -> WHITE FLASH EFFECT
                const whiteFlash = document.createElement('div');
                whiteFlash.id = 'ch2-white-flash';
                whiteFlash.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #ffffff;
                    z-index: 999999;
                    opacity: 1;
                    transition: opacity 1.2s ease-out;
                `;
                document.body.appendChild(whiteFlash);

                if (typeof audioEngine !== 'undefined') {
                    audioEngine.stopGlitchSound();
                    audioEngine.playTone('sine', 880, 1200, 0.5, 0.5);
                }

                // Transform background to semi-destroyed ruined desktop and shrink boss eye DURING white flash
                setTimeout(() => {
                    if (overlay) {
                        // Gloomy ruined desktop background
                        overlay.style.background = 'radial-gradient(circle at center, #1b0005 0%, #080002 65%, #000000 100%)';
                        overlay.style.backdropFilter = 'contrast(1.8) brightness(0.35) saturate(0.3) sepia(0.4)';
                        
                        // Add semi-destroyed glitch overlay backdrop
                        let ruinedBg = document.getElementById('ch2-ruined-desktop-bg');
                        if (!ruinedBg) {
                            ruinedBg = document.createElement('div');
                            ruinedBg.id = 'ch2-ruined-desktop-bg';
                            ruinedBg.style.cssText = `
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                pointer-events: none;
                                z-index: 50000;
                                background: 
                                    linear-gradient(rgba(18, 0, 0, 0.75), rgba(0, 0, 0, 0.92)),
                                    repeating-linear-gradient(0deg, rgba(255, 0, 0, 0.05) 0px, rgba(0, 0, 0, 0.3) 2px, transparent 4px);
                                box-shadow: inset 0 0 100px #ff0000, inset 0 0 180px #000000;
                            `;
                            overlay.appendChild(ruinedBg);
                        }
                    }

                    // Move & scale boss eye to small God of Sites in center of screen
                    if (eye) {
                        eye.style.transition = 'all 1.2s ease-in-out';
                        eye.style.left = '50%';
                        eye.style.top = '40%';
                        eye.style.transform = 'translate(-50%, -50%) scale(0.35)';
                        eye.style.animation = 'pulseEyeGlow 4s infinite ease-in-out';
                        eye.style.filter = 'brightness(0.75) sepia(0.8) drop-shadow(0 0 15px #ff0000)';
                    }

                    // Fade out white flash
                    whiteFlash.style.opacity = '0';
                    setTimeout(() => whiteFlash.remove(), 1200);

                    // STEP 3: Render remaining calm victory monologue lines on ruined desktop
                    const calmLines = translations[currentLang]?.ch2BossWinCalmLines || [
                        "Я не смог тебя победить... опять... ты всегда выигрываешь... и если ты проигрываешь, ты всё равно возвращаешься сюда...",
                        "Я ухожу, но не надолго.",
                        "Я приду за тобой."
                    ];

                    renderCh2BossMonologueLine(calmLines, 0, () => {
                        if (eye) {
                            eye.style.transition = 'opacity 2s ease-out';
                            eye.style.opacity = '0';
                        }

                        setTimeout(() => {
                            isChapter2Completed = true;
                            if (diagBox) diagBox.style.display = 'none';
                            triggerCh2EndBarrier();
                        }, 2000);
                    });
                }, 1000);
            });
        }

        function triggerCh2BossDefeat() {
            ch2BossActive = false;
            if (ch2CombatFrameId) cancelAnimationFrame(ch2CombatFrameId);
            if (ch2AttackTimer) clearInterval(ch2AttackTimer);
            if (ch2TiredCycleTimer) clearInterval(ch2TiredCycleTimer);

            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
                audioEngine.playError(1.0);
            }

            const diagBox = document.getElementById('ch2-boss-dialogue-box');
            if (diagBox) diagBox.style.display = 'block';

            const defeatLine = translations[currentLang]?.ch2BossDefeatLine || "ЖАЛКИЙ. ТЫ СМОГ МЕНЯ ПОБЕДИТЬ В ТОТ РАЗ, НО Я СТАЛ СИЛЬНЕЕ. ХАХАХАХА.";
            renderCh2BossMonologueLine([defeatLine], 0, () => {
                let defeatOverlay = document.getElementById('ch2-boss-defeat-overlay');
                if (!defeatOverlay) {
                    defeatOverlay = document.createElement('div');
                    defeatOverlay.id = 'ch2-boss-defeat-overlay';
                    defeatOverlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: rgba(10, 0, 0, 0.95);
                        z-index: 99998;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 25px;
                        font-family: 'Rubik Glitch', 'Courier New', monospace;
                    `;
                    document.body.appendChild(defeatOverlay);
                }
                defeatOverlay.style.display = 'flex';

                defeatOverlay.innerHTML = `
                    <div style="color: #ff0033; font-size: 3.5rem; text-shadow: 0 0 20px #ff0000; letter-spacing: 4px;">
                        ${currentLang === 'en' ? "DEFEAT" : (currentLang === 'ua' ? "ПОРАЗКА" : "ПОРАЖЕНИЕ")}
                    </div>
                    <div style="color: #aaaaaa; font-size: 1.2rem; font-family: 'W95FA', monospace;">
                        ${currentLang === 'en' ? "The God of Sites destroyed your code." : (currentLang === 'ua' ? "Бог сайтів знищив твій код." : "Бог сайтов уничтожил твой код.")}
                    </div>
                    <button onclick="retryCh2BossFight()" style="
                        padding: 14px 40px;
                        font-size: 1.3rem;
                        font-family: 'W95FA', 'MS Sans Serif', monospace;
                        font-weight: bold;
                        background: #880000;
                        color: #ffffff;
                        border: 2px outset #ff4444;
                        cursor: pointer;
                        box-shadow: 0 0 15px rgba(255, 0, 0, 0.6);
                        transition: transform 0.1s;
                    " onmouseenter="this.style.background='#aa0000'" onmouseleave="this.style.background='#880000'">
                        ${currentLang === 'en' ? "Try Again" : (currentLang === 'ua' ? "Спробувати знову" : "Попробовать снова")}
                    </button>
                `;
            });
        }

        function retryCh2BossFight() {
            const defeatOverlay = document.getElementById('ch2-boss-defeat-overlay');
            if (defeatOverlay) defeatOverlay.style.display = 'none';

            ch2BossIntroSkipped = true;
            startCh2GodOfSitesBoss();
        }
        window.retryCh2BossFight = retryCh2BossFight;

        function triggerCh2EndBarrier() {
            window.isChapter2Finished = true;
            try {
                localStorage.setItem('isChapter2Finished', 'true');
            } catch (e) {}

            const overlay = document.getElementById('boss-fight-overlay');
            if (overlay) overlay.style.display = 'none';

            let barrier = document.getElementById('ch2-completion-barrier-overlay');
            if (!barrier) {
                barrier = document.createElement('div');
                barrier.id = 'ch2-completion-barrier-overlay';
                barrier.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #000000;
                    z-index: 999999;
                    display: flex;
                    flex-direction: column;
                    font-family: 'MS Sans Serif', Tahoma, 'W95FA', monospace;
                    user-select: none;
                `;
                document.body.appendChild(barrier);
            }
            barrier.style.display = 'flex';

            const t = translations[currentLang] || translations['ru'];

            const addressLabel = currentLang === 'en' ? "Address:" : (currentLang === 'ua' ? "Адреса:" : "Адрес:");
            const errTitle = currentLang === 'en' ? "Error — System.EXE" : (currentLang === 'ua' ? "Помилка — System.EXE" : "Ошибка — System.EXE");
            const ch2CompletedTitle = currentLang === 'en' ? "Chapter 2 — Completed." : (currentLang === 'ua' ? "Глава 2 — Завершена." : "Глава 2 - Завершена.");
            const designerLabel = currentLang === 'en' ? "Designer" : "Дизайнер";
            const ideasLabel = currentLang === 'en' ? "Ideas" : (currentLang === 'ua' ? "Ідеї" : "Идеи");
            const programmerLabel = currentLang === 'en' ? "Programmer" : (currentLang === 'ua' ? "Програміст" : "Программист");
            const realizationLabel = currentLang === 'en' ? "Realization" : (currentLang === 'ua' ? "Втілення" : "Воплощение");
            const congratulationsText = currentLang === 'en'
                ? "Congratulations on completing this chapter! Stay tuned for updates!"
                : (currentLang === 'ua' ? "Вітаємо з проходженням цієї глави! Слідкуйте за оновленнями!" : "Поздравляем что ты прошёл эту главу! Следи за обновлениями!");

            barrier.innerHTML = `
                <!-- Internet Tab Overlay Bar -->
                <div style="background: #c0c0c0; border-bottom: 2px solid #808080; padding: 6px 10px; display: flex; flex-direction: column; gap: 4px; box-shadow: inset 1px 1px #ffffff; width: 100%; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 13px; color: #000000;">
                            <span style="font-size: 14px;">🌐</span>
                            <span>Internet Explorer — logotype.com.exe/credits</span>
                        </div>
                        <div style="display: flex; gap: 3px;">
                            <button style="width: 18px; height: 16px; font-size: 10px; line-height: 10px; background: #c0c0c0; border: 1px outset #ffffff; color: #000; cursor: pointer;">_</button>
                            <button style="width: 18px; height: 16px; font-size: 10px; line-height: 10px; background: #c0c0c0; border: 1px outset #ffffff; color: #000; cursor: pointer;">□</button>
                            <button style="width: 18px; height: 16px; font-size: 10px; line-height: 10px; background: #c0c0c0; border: 1px outset #ffffff; color: #000; font-weight: bold; cursor: pointer;">X</button>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; background: #c0c0c0; margin-top: 2px;">
                        <span style="font-size: 12px; color: #333333; font-weight: bold;">${addressLabel}</span>
                        <div style="flex: 1; background: #ffffff; border: 2px inset #7f9db9; padding: 3px 8px; font-size: 12px; color: #000000; font-family: monospace;">http://www.logotype.com.exe/credits.html</div>
                    </div>
                </div>

                <!-- Pure Black Browser Tab Content Area -->
                <div style="flex: 1; background: #000000; display: flex; align-items: center; justify-content: center; padding: 20px; width: 100%; box-sizing: border-box;">
                    
                    <!-- Retro Windows Error Dialog Window -->
                    <div style="width: 100%; max-width: 500px; background: #c0c0c0; border: 2px outset #ffffff; box-shadow: 0 0 25px rgba(255, 0, 0, 0.4), 4px 4px 15px rgba(0, 0, 0, 0.9); font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box;">
                        
                        <!-- Window Title Bar -->
                        <div style="background: linear-gradient(90deg, #000080, #1084d0); color: #ffffff; padding: 4px 8px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 14px;">⚠️</span>
                                <span>${errTitle}</span>
                            </div>
                            <button onclick="audioEngine.playClick(); location.reload()" style="width: 16px; height: 14px; background: #c0c0c0; border: 1px outset #ffffff; font-size: 10px; line-height: 10px; cursor: pointer; color: #000000; font-weight: bold;">✕</button>
                        </div>

                        <!-- Error Content Body -->
                        <div style="padding: 20px; display: flex; gap: 16px; align-items: flex-start;">
                            <!-- Red Error Circle X Icon -->
                            <div style="width: 42px; height: 42px; min-width: 42px; background: #cc0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 24px; font-weight: bold; box-shadow: 0 0 12px rgba(204, 0, 0, 0.8); border: 2px solid #ffffff;">
                                ✕
                            </div>

                            <!-- Text & Credits Information -->
                            <div style="flex: 1; color: #000000; font-size: 13px; line-height: 1.6;">
                                <div style="font-weight: bold; font-size: 16px; color: #880000; margin-bottom: 12px; border-bottom: 2px solid #a0a0a0; padding-bottom: 4px;">
                                    ${ch2CompletedTitle}
                                </div>
                                
                                <div style="background: #ffffff; border: 2px inset #7f9db9; padding: 12px; margin-bottom: 14px; font-family: 'Courier New', monospace; font-size: 13px; color: #111111; line-height: 1.6;">
                                    <div><b>${designerLabel}</b> - Igor</div>
                                    <div><b>${ideasLabel}</b> - Igor</div>
                                    <div><b>${programmerLabel}</b> - Gemini AI</div>
                                    <div><b>${realizationLabel}</b> - Gemini AI</div>
                                </div>

                                <div style="font-size: 13px; color: #222222; font-weight: bold; line-height: 1.4; text-shadow: 0 0 1px rgba(0,0,0,0.2);">
                                    ${congratulationsText}
                                </div>
                            </div>
                        </div>

                        <!-- Bottom OK Action Bar -->
                        <div style="padding: 10px 16px 14px 16px; display: flex; justify-content: center; background: #c0c0c0; border-top: 1px solid #dfdfdf;">
                            <button onclick="if (typeof audioEngine !== 'undefined') audioEngine.playClick(); location.reload()" style="
                                min-width: 120px;
                                padding: 7px 24px;
                                font-size: 13px;
                                font-family: 'MS Sans Serif', Tahoma, sans-serif;
                                font-weight: bold;
                                background: #c0c0c0;
                                color: #000000;
                                border: 2px outset #ffffff;
                                cursor: pointer;
                                box-shadow: 1px 1px 0px #000000;
                            " onmousedown="this.style.borderStyle='inset'" onmouseup="this.style.borderStyle='outset'">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        window.triggerCh2EndBarrier = triggerCh2EndBarrier;

        function renderCh2BossMonologueLine(lines, index, callback) {
            if (index >= lines.length) {
                if (typeof callback === 'function') callback();
                return;
            }
            
            let textEl = document.getElementById('ch2-boss-text-content');
            if (!textEl) {
                const diagBox = document.getElementById('ch2-boss-dialogue-box');
                if (diagBox) {
                    const bossTitleName = (currentLang === 'en' ? "GOD OF SITES" : (currentLang === 'ua' ? "БОГ САЙТІВ" : "БОГ САЙТОВ"));
                    diagBox.innerHTML = `
                        <div id="ch2-boss-speaker" style="color: #ff0033; font-weight: bold; font-size: 16px; margin-bottom: 12px; letter-spacing: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                            <span style="display: inline-block; width: 10px; height: 10px; background: #ff0033; border-radius: 50%; box-shadow: 0 0 8px #ff0033;"></span>
                            <span>${bossTitleName} [ ISpy CORE ]</span>
                        </div>
                        <div id="ch2-boss-text-content" style="color: #ffffff; font-size: 16px; line-height: 1.6; min-height: 90px; text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);">
                        </div>
                    `;
                    textEl = document.getElementById('ch2-boss-text-content');
                }
            }

            if (!textEl) {
                if (typeof callback === 'function') callback();
                return;
            }
            
            const fullText = lines[index];
            textEl.innerHTML = '';
            let charIdx = 0;
            
            function typeNextChar() {
                if (typeof isPaused !== 'undefined' && isPaused) {
                    setTimeout(typeNextChar, 100);
                    return;
                }
                if (charIdx < fullText.length) {
                    const char = fullText.charAt(charIdx);
                    textEl.innerHTML += char;
                    
                    if (typeof audioEngine !== 'undefined' && charIdx % 2 === 0) {
                        audioEngine.playTone('triangle', 180 + Math.random() * 80, 40, 0.05, 0.05);
                    }
                    
                    charIdx++;
                    
                    const delay = calculateCharDelay(fullText, charIdx, 35);
                    setTimeout(typeNextChar, delay);
                } else {
                    let waited = 0;
                    function checkNextLine() {
                        if (typeof isPaused !== 'undefined' && isPaused) {
                            setTimeout(checkNextLine, 100);
                            return;
                        }
                        waited += 100;
                        if (waited >= 2000) {
                            renderCh2BossMonologueLine(lines, index + 1, callback);
                        } else {
                            setTimeout(checkNextLine, 100);
                        }
                    }
                    setTimeout(checkNextLine, 100);
                }
            }
            
            typeNextChar();
        }

        function navigate() {
            const rawUrl = urlInput.value.toLowerCase().trim();
            const cleanUrl = rawUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
            
            if (isOnCreepySite && !cleanUrl.includes('logotype.com') && !cleanUrl.includes('thelogotype.com')) {
                handleEscapeAttempt();
                urlInput.value = "http://logotype.com.exe";
                return;
            }
            const t = translations[currentLang];
            
            const isLogotypeSite = cleanUrl.includes('logotype.com') || cleanUrl.includes('thelogotype.com') || cleanUrl.includes('logotype');
            
            if (isLogotypeSite) {
                if (activeChapter === 2 && currentChapter2Task < 3) {
                    browserContent.innerHTML = `
                        <div style="background: #110000; color: #ff3333; height: 100%; padding: 25px; font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                            <h2 style="color: #ff0000; margin-bottom: 15px;">⚠️ ${t.siteAccessBlockedTitle || 'ДОСТУП ЗАБЛОКИРОВАН'}</h2>
                            <p style="font-size: 13px; line-height: 1.6; max-width: 80%;">${t.siteAccessBlocked || 'Сайт logotype.com.exe пока недоступен. Сначала завершите текущее расследование системы.'}</p>
                        </div>
                    `;
                    return;
                }
                
                isOnCreepySite = true;
                
                if (activeChapter === 2) {
                    browserContent.innerHTML = `
                        <div style="background: white; color: black; height: 100%; padding: 20px; font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                            <h2 style="color: #000080; margin-bottom: 20px;">${t.gameWelcome}</h2>
                            <button onclick="audioEngine.playClick(); onSitePlayClick()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">${t.play}</button>
                            <div id="destroy-site-container" style="margin-top: 22px; display: none;">
                                <button id="destroy-site-btn" onclick="audioEngine.playClick(); openSiteHackTerminal()" style="padding: 12px 28px; font-size: 16px; font-weight: bold; cursor: pointer; background: #880000; color: #ffffff; border: 2px outset #ff4444; font-family: 'MS Sans Serif', Tahoma, sans-serif; text-shadow: 0 0 4px #000; box-shadow: 0 0 12px rgba(255, 0, 0, 0.6); transition: transform 0.1s;">${t.destroySiteBtn || 'Уничтожить сайт'}</button>
                            </div>
                        </div>
                    `;
                    clearTimeout(window._destroyBtnTimeout);
                    window._destroyBtnTimeout = setTimeout(() => {
                        const btnContainer = document.getElementById('destroy-site-container');
                        if (btnContainer) {
                            btnContainer.style.display = 'block';
                        }
                    }, 2000);
                } else {
                    browserContent.innerHTML = `
                        <div style="background: white; color: black; height: 100%; padding: 20px; font-family: 'MS Sans Serif', Tahoma, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                            <h2 style="color: #000080; margin-bottom: 20px;">${t.gameWelcome}</h2>
                            <button onclick="audioEngine.playClick(); onSitePlayClick()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">${t.play}</button>
                        </div>
                    `;
                }
            } else if (rawUrl === "http://" || rawUrl === "") {
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
            blockAllInteractions(99998);
            const letter = document.createElement('div');
            letter.id = 'letter-from-l';
            letter.className = 'window';
            letter.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;z-index:99999;display:flex;flex-direction:column;box-shadow:4px 4px 0 #555;';
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
            unblockAllInteractions();
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
            if (activeChapter === 2 || isZettaInstalled || document.getElementById('zetta-ad') || document.getElementById('zetta-setup') || document.getElementById('zetta-assistant')) return;
            
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
            if (activeChapter === 2 || isZettaInstalled || document.getElementById('zetta-ad') || document.getElementById('zetta-setup') || document.getElementById('zetta-assistant')) return;
            clearTimeout(zettaTimer);
            zettaTimer = setTimeout(() => {
                if (activeChapter !== 2 && browserState.isOpen && !browserState.isMinimized) {
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
                if (typeof isPaused !== 'undefined' && isPaused) return;
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
            stopCh1TaskGlitch();
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
            const currentGameOverTexts = langTexts[currentLang] || langTexts["ru"] || langTexts["en"];

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
            
            is666Mode = false;
            if (creepyFacesInterval) {
                clearInterval(creepyFacesInterval);
                creepyFacesInterval = null;
            }
            document.querySelectorAll('.creepy-face').forEach(e => e.remove());

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

        function runBootSequence(onComplete) {
            const overlay = document.getElementById('transition-overlay');
            const mainMenu = document.getElementById('main-menu');
            const bootScreen = document.getElementById('boot-screen');

            if (overlay) overlay.style.opacity = "1";
            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopDrone();
                audioEngine.stopMenuMusic();
                audioEngine.stopCreditsMusic();
            }

            setTimeout(() => {
                if (typeof audioEngine !== 'undefined') {
                    audioEngine.playBoot();
                }

                if (mainMenu) mainMenu.style.display = 'none';
                if (bootScreen) bootScreen.style.display = 'flex';
                if (overlay) overlay.style.opacity = "0";

                setTimeout(() => {
                    if (bootScreen) bootScreen.style.display = 'none';
                    if (typeof onComplete === 'function') {
                        onComplete();
                    }
                }, 4000);
            }, 800);
        }

        function startGameFromMenu() {
            runBootSequence(() => {
                if (activeChapter === 2) {
                    startChapter2();
                } else {
                    startChapter1();
                }
            });
        }

        function confirmNickname() {
            audioEngine.playClick();
            const input = document.getElementById('nickname-input');
            if (input && input.value.trim().length > 0) {
                playerName = input.value.trim();
            } else {
                const t = translations[currentLang];
                playerName = t.defaultPlayerName || "User";
            }
            toggleSubmenu('chapters-menu', true);
        }

        function toggleSubmenu(menuId, show) {
            const settingsMenu = document.getElementById('settings-menu');
            if (settingsMenu) settingsMenu.style.display = 'none';
            const creditsMenu = document.getElementById('credits-menu');
            if (creditsMenu) creditsMenu.style.display = 'none';
            const nicknameMenu = document.getElementById('nickname-menu');
            if (nicknameMenu) nicknameMenu.style.display = 'none';
            const chaptersMenu = document.getElementById('chapters-menu');
            if (chaptersMenu) chaptersMenu.style.display = 'none';
            const savesMenu = document.getElementById('saves-menu');
            if (savesMenu) savesMenu.style.display = 'none';

            if (show && menuId) {
                const target = document.getElementById(menuId);
                if (target) target.style.display = 'block';
            }
        }

        function pauseGame() {
            isPaused = true;
            if (typeof audioEngine !== 'undefined') {
                if (audioEngine.bossMusicAudio && !audioEngine.bossMusicAudio.paused) {
                    audioEngine.bossMusicAudio.pause();
                    audioEngine.wasBossMusicPlaying = true;
                }
                if (audioEngine.defeatAudio && !audioEngine.defeatAudio.paused) {
                    audioEngine.defeatAudio.pause();
                    audioEngine.wasDefeatAudioPlaying = true;
                }
            }
            if (typeof updateSavesUI === 'function') updateSavesUI();
            showPauseSubmenu('pause-main');
            const overlay = document.getElementById('pause-overlay');
            if (overlay) overlay.style.display = 'flex';
        }
        window.pauseGame = pauseGame;

        function resumeGame() {
            if (typeof audioEngine !== 'undefined') {
                audioEngine.playClick();
                if (audioEngine.wasBossMusicPlaying && audioEngine.bossMusicAudio) {
                    audioEngine.bossMusicAudio.play().catch(e => {});
                    audioEngine.wasBossMusicPlaying = false;
                }
                if (audioEngine.wasDefeatAudioPlaying && audioEngine.defeatAudio) {
                    audioEngine.defeatAudio.play().catch(e => {});
                    audioEngine.wasDefeatAudioPlaying = false;
                }
            }
            isPaused = false;
            const overlay = document.getElementById('pause-overlay');
            if (overlay) overlay.style.display = 'none';
        }

        function showPauseSubmenu(menuId) {
            if (typeof audioEngine !== 'undefined') audioEngine.playClick();
            const pauseMenu = document.getElementById('pause-menu');
            const pauseSettings = document.getElementById('pause-settings');
            const pauseSaves = document.getElementById('pause-saves');
            
            if (pauseMenu) pauseMenu.style.display = 'none';
            if (pauseSettings) pauseSettings.style.display = 'none';
            if (pauseSaves) pauseSaves.style.display = 'none';
            
            if (menuId === 'pause-saves' && pauseSaves) {
                updateSavesUI();
                pauseSaves.style.display = 'block';
            } else if (pauseMenu) {
                pauseMenu.style.display = 'block';
            }
        }

        function getCurrentLiveProgressSummary() {
            const t = translations[currentLang] || translations['ru'];
            if (isBossFightActive) {
                return (t.bossFightLabel || "Боссфайт") + " (Глава 1)";
            }
            if (typeof ch2BossActive !== 'undefined' && ch2BossActive) {
                return (t.bossFightLabel || "Боссфайт") + " (Глава 2)";
            }
            if (activeChapter === 1) {
                const taskNum = currentChapter1Task || 1;
                let taskDesc = "";
                if (taskNum === 1) taskDesc = t.ch1Task1Desc || "Зайти в интернет";
                else if (taskNum === 2) taskDesc = t.ch1Task2Desc || "Нажать на рекламу";
                else if (taskNum === 3) taskDesc = t.ch1Task3Desc || "Пройти викторину";
                return `${t.chapterName || 'Глава'} 1 — ${t.taskLabel || 'Задание'} ${taskNum}: ${taskDesc}`;
            }
            if (activeChapter === 2) {
                const taskNum = typeof currentChapter2Task !== 'undefined' ? currentChapter2Task : 1;
                let taskDesc = "";
                if (taskNum === 1) taskDesc = t.ch2Task1Desc || "Найти информацию о вирусе";
                else if (taskNum === 2) taskDesc = t.ch2Task2Desc || "Зайти в интернет";
                else if (taskNum === 3) taskDesc = t.ch2Task3Desc || "Уничтожить сайт logotype.com.exe";
                else if (taskNum === 4) taskDesc = t.ch2Task4Desc || "Взломать Ядро Бога Сайтов";
                return `${t.chapterName || 'Глава'} 2 — ${t.taskLabel || 'Задание'} ${taskNum}: ${taskDesc}`;
            }
            return `${t.taskLabel || 'Задание'} 1`;
        }

        function getSaveProgressSummary(state) {
            const t = translations[currentLang] || translations['ru'];
            if (!state) return t.saveEmpty || "Пусто";

            if (state.isCh2BossFight || (state.isBossFight && state.activeChapter === 2)) {
                return (t.bossFightLabel || "Боссфайт") + " (Глава 2)";
            }
            if (state.isBossFight) {
                return (t.bossFightLabel || "Боссфайт") + " (Глава 1)";
            }

            if (state.activeChapter === 1) {
                const taskNum = state.currentChapter1Task || 1;
                let taskDesc = "";
                if (taskNum === 1) taskDesc = t.ch1Task1Desc || "Зайти в интернет";
                else if (taskNum === 2) taskDesc = t.ch1Task2Desc || "Нажать на рекламу";
                else if (taskNum === 3) taskDesc = t.ch1Task3Desc || "Пройти викторину";
                
                return `${t.chapterName || 'Глава'} 1 — ${t.taskLabel || 'Задание'} ${taskNum}: ${taskDesc}`;
            }

            if (state.activeChapter === 2) {
                const taskNum = state.currentChapter2Task || 1;
                let taskDesc = "";
                if (taskNum === 1) taskDesc = t.ch2Task1Desc || "Найти информацию о вирусе";
                else if (taskNum === 2) taskDesc = t.ch2Task2Desc || "Зайти в интернет";
                else if (taskNum === 3) taskDesc = t.ch2Task3Desc || "Уничтожить сайт logotype.com.exe";
                else if (taskNum === 4) taskDesc = t.ch2Task4Desc || "Взломать Ядро Бога Сайтов";
                return `${t.chapterName || 'Глава'} 2 — ${t.taskLabel || 'Задание'} ${taskNum}: ${taskDesc}`;
            }

            return t.saveEmpty || "Пусто";
        }

        function getSaveSlotKey(slot, ch) {
            const chapterNum = ch || activeChapter || 1;
            return `save_slot_ch${chapterNum}_${slot}`;
        }
        window.getSaveSlotKey = getSaveSlotKey;

        function migrateLegacySaves() {
            for (let slot = 1; slot <= 3; slot++) {
                const legacyKey = 'save_slot_' + slot;
                const legacyData = localStorage.getItem(legacyKey);
                if (legacyData) {
                    try {
                        const state = JSON.parse(legacyData);
                        const ch = state.activeChapter || 1;
                        const newKey = `save_slot_ch${ch}_${slot}`;
                        if (!localStorage.getItem(newKey)) {
                            localStorage.setItem(newKey, legacyData);
                        }
                        localStorage.removeItem(legacyKey);
                    } catch (e) {}
                }
            }
        }
        migrateLegacySaves();

        function updateSavesUI() {
            const t = translations[currentLang] || translations['ru'];
            const ch = activeChapter || 1;

            const liveProgressEl = document.getElementById('pause-live-progress');
            if (liveProgressEl) {
                liveProgressEl.innerText = `${t.currentProgressLabel || 'Текущий прогресс'}: ${getCurrentLiveProgressSummary()}`;
            }

            const pauseSavesTitle = document.getElementById('pause-saves-title');
            if (pauseSavesTitle) {
                pauseSavesTitle.innerText = `${t.savesTitle || 'Сохранения'} (${t.chapterName || 'Глава'} ${ch})`;
            }

            const menuSavesTitle = document.getElementById('saves-title');
            if (menuSavesTitle) {
                menuSavesTitle.innerText = `${t.savesTitle || 'Сохранения'} (${t.chapterName || 'Глава'} ${ch})`;
            }

            for (let slot = 1; slot <= 3; slot++) {
                const key = getSaveSlotKey(slot, ch);
                const savedRaw = localStorage.getItem(key);
                let summaryText = t.saveEmpty || "Пусто";
                let hasData = false;

                if (savedRaw) {
                    try {
                        const state = JSON.parse(savedRaw);
                        summaryText = getSaveProgressSummary(state);
                        hasData = true;
                    } catch (e) {}
                }

                // В паузе
                const pauseDesc = document.getElementById(`pause-slot-${slot}-desc`);
                if (pauseDesc) {
                    pauseDesc.innerText = summaryText;
                    pauseDesc.style.color = hasData ? '#ff9999' : '#777777';
                }
                const pauseDel = document.getElementById(`pause-slot-${slot}-delete`);
                if (pauseDel) {
                    pauseDel.style.display = hasData ? 'inline-block' : 'none';
                    pauseDel.innerText = t.pauseDelete || 'Стереть';
                }

                // В Главном Меню
                const menuSub = document.getElementById(`save-${slot}-sub`);
                if (menuSub) {
                    if (hasData) {
                        menuSub.innerText = summaryText;
                    } else {
                        menuSub.innerText = t.saveEmpty || "Пусто — Новая игра";
                    }
                }
                const menuDel = document.getElementById(`save-${slot}-delete-btn`);
                if (menuDel) {
                    menuDel.style.display = hasData ? 'inline-block' : 'none';
                }
            }
        }

        function deleteSlot(slot) {
            if (typeof audioEngine !== 'undefined') audioEngine.playClick();
            const ch = activeChapter || 1;
            const key = getSaveSlotKey(slot, ch);
            const savedRaw = localStorage.getItem(key);
            if (!savedRaw) return;

            const t = translations[currentLang] || translations['ru'];
            const confirmMsg = t.deleteConfirm ? t.deleteConfirm.replace('{slot}', slot) : `Вы действительно хотите удалить сохранение в слоте ${slot}? Это действие нельзя отменить.`;

            showGameConfirm(confirmMsg, () => {
                localStorage.removeItem(key);
                if (typeof audioEngine !== 'undefined') audioEngine.playError();
                updateSavesUI();
            }, null, {
                title: t.warningTitle || "⚠️ Предупреждение",
                confirmText: t.pauseDelete || "Стереть",
                cancelText: t.cancelBtn || "Отмена",
                danger: true
            });
        }
        window.deleteSlot = deleteSlot;

        function saveSlotPause(slot) {
            if (typeof audioEngine !== 'undefined') audioEngine.playClick();
            const t = translations[currentLang] || translations['ru'];
            const ch = activeChapter || 1;

            const state = {
                activeChapter: ch,
                currentChapter1Task: currentChapter1Task || 1,
                currentChapter2Task: typeof currentChapter2Task !== 'undefined' ? currentChapter2Task : 1,
                isBossFight: !!isBossFightActive || (typeof ch2BossActive !== 'undefined' && !!ch2BossActive),
                isCh2BossFight: typeof ch2BossActive !== 'undefined' && !!ch2BossActive,
                playerName: playerName,
                timestamp: new Date().toLocaleString()
            };

            const key = getSaveSlotKey(slot, ch);
            localStorage.setItem(key, JSON.stringify(state));
            updateSavesUI();

            const summary = getSaveProgressSummary(state);
            const saveMsg = (t.slotSaved ? t.slotSaved.replace('{slot}', slot) : `Сохранено в слот ${slot}`) + `\n(${summary})`;
            showGameAlert(saveMsg, null, { title: t.saveTitle || "Сохранение", icon: "💾" });
        }

        function loadSlot(slot) {
            if (typeof audioEngine !== 'undefined') audioEngine.playClick();
            const ch = activeChapter || 1;
            const key = getSaveSlotKey(slot, ch);
            const savedRaw = localStorage.getItem(key);

            const mainMenu = document.getElementById('main-menu');
            const isFromMainMenu = mainMenu && (mainMenu.style.display === 'block' || getComputedStyle(mainMenu).display !== 'none');

            if (!savedRaw) {
                const defaultState = { activeChapter: ch, currentChapter1Task: 1, currentChapter2Task: 1, isBossFight: false };
                if (isFromMainMenu) {
                    runBootSequence(() => {
                        startGameFromSlot(slot, defaultState);
                    });
                } else {
                    startGameFromSlot(slot, defaultState);
                }
                return;
            }

            try {
                const state = JSON.parse(savedRaw);
                if (isFromMainMenu) {
                    runBootSequence(() => {
                        startGameFromSlot(slot, state);
                    });
                } else {
                    startGameFromSlot(slot, state);
                }
            } catch (e) {
                console.error("Error loading save slot:", e);
                const t = translations[currentLang] || translations['ru'];
                showGameAlert(t.loadError || "Error loading save.", null, { title: t.errorTitle || "Ошибка", icon: "❌" });
            }
        }

        function startGameFromSlot(slot, state) {
            resumeGame();

            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) mainMenu.style.display = 'none';
            const soloOverlay = document.getElementById('solo-ending-overlay');
            if (soloOverlay) soloOverlay.style.display = 'none';
            const disclaimer = document.getElementById('disclaimer-overlay');
            if (disclaimer) disclaimer.style.display = 'none';

            // Очищаем существующий боссфайт Главы 1 если активен
            if (isBossFightActive) {
                isBossFightActive = false;
                cancelAnimationFrame(bossFrame);
                clearInterval(_zettaBossInterval);
                if (bossShieldInterval) { clearInterval(bossShieldInterval); bossShieldInterval = null; }
                if (tentacleFrameId) { cancelAnimationFrame(tentacleFrameId); tentacleFrameId = null; }
                const bossOverlay = document.getElementById('boss-fight-overlay');
                if (bossOverlay) bossOverlay.style.display = 'none';
                const bossLaser = document.getElementById('boss-laser-svg');
                if (bossLaser) bossLaser.style.display = 'none';
            }

            // Очищаем существующий боссфайт Главы 2 если активен
            if (typeof ch2BossActive !== 'undefined') {
                ch2BossActive = false;
            }
            if (typeof ch2MazeInterval !== 'undefined' && ch2MazeInterval) {
                clearInterval(ch2MazeInterval);
                ch2MazeInterval = null;
            }
            if (typeof ch2MazeKeyHandler !== 'undefined' && ch2MazeKeyHandler) {
                window.removeEventListener('keydown', ch2MazeKeyHandler);
                ch2MazeKeyHandler = null;
            }
            const ch2BossOverlay = document.getElementById('ch2-boss-finale-overlay');
            if (ch2BossOverlay) ch2BossOverlay.remove();

            // Закрываем открытые окна рабочего стола
            if (typeof closeWindow === 'function') {
                closeWindow('window-pc');
                closeWindow('window-trash');
                closeWindow('window-letter');
                closeWindow('internet-window');
                closeWindow('hint-window');
                closeWindow('regedit-window');
            }

            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
                audioEngine.stopCreditsMusic();
                audioEngine.stopMenuMusic();
                audioEngine.stopDrone();
            }

            if (typeof unblockAllInteractions === 'function') {
                unblockAllInteractions();
            }

            document.body.style.cursor = 'default';
            playerName = state.playerName || playerName || 'Пользователь';
            activeChapter = state.activeChapter || 1;

            const desktop = document.getElementById('desktop');
            if (desktop) desktop.style.display = 'block';

            if (state.isCh2BossFight || (state.isBossFight && state.activeChapter === 2)) {
                // Загрузка в начало боссфайта Главы 2!
                startCh2BossFinale();
            } else if (state.isBossFight) {
                // Загрузка в начало боссфайта Главы 1!
                startBossFight();
            } else {
                // Новая игра без временной метки сохранения
                if (!state.timestamp) {
                    if (activeChapter === 2) {
                        startChapter2();
                        return;
                    } else {
                        startChapter1();
                        return;
                    }
                }

                // Загрузка в существующее сохранение
                if (activeChapter === 2) {
                    currentChapter2Task = state.currentChapter2Task || 1;
                    const hintContainer = document.getElementById('desktop-hint-container');
                    if (hintContainer) hintContainer.style.display = 'flex';
                    const adPopup = document.getElementById('ad-popup');
                    if (adPopup) adPopup.style.display = 'none';
                } else {
                    currentChapter1Task = state.currentChapter1Task || 1;
                }

                const taskWidget = document.getElementById('task-widget');
                if (taskWidget) taskWidget.style.display = 'block';

                if (typeof updateTaskWidgetText === 'function') {
                    updateTaskWidgetText();
                }
            }
        }

        function returnToMainMenuFromPause() {
            if (typeof audioEngine !== 'undefined') {
                audioEngine.playClick();
            }
            resumeGame();

            if (isBossFightActive) {
                isBossFightActive = false;
                cancelAnimationFrame(bossFrame);
                clearInterval(_zettaBossInterval);
                if (bossShieldInterval) { clearInterval(bossShieldInterval); bossShieldInterval = null; }
                if (tentacleFrameId) { cancelAnimationFrame(tentacleFrameId); tentacleFrameId = null; }
                const bossOverlay = document.getElementById('boss-fight-overlay');
                if (bossOverlay) bossOverlay.style.display = 'none';
                const bossLaser = document.getElementById('boss-laser-svg');
                if (bossLaser) bossLaser.style.display = 'none';
            }

            if (typeof ch2BossActive !== 'undefined') {
                ch2BossActive = false;
            }
            if (typeof ch2MazeInterval !== 'undefined' && ch2MazeInterval) {
                clearInterval(ch2MazeInterval);
                ch2MazeInterval = null;
            }
            if (typeof ch2MazeKeyHandler !== 'undefined' && ch2MazeKeyHandler) {
                window.removeEventListener('keydown', ch2MazeKeyHandler);
                ch2MazeKeyHandler = null;
            }
            const ch2BossOverlay = document.getElementById('ch2-boss-finale-overlay');
            if (ch2BossOverlay) ch2BossOverlay.remove();

            if (typeof audioEngine !== 'undefined') {
                audioEngine.stopBossMusic();
                audioEngine.stopCreditsMusic();
                audioEngine.stopDrone();
            }

            const desktop = document.getElementById('desktop');
            if (desktop) desktop.style.display = 'none';

            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) mainMenu.style.display = 'block';

            if (typeof toggleSubmenu === 'function') {
                toggleSubmenu(null, false);
            }

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playMenuMusic();
            }
        }

        window.getCurrentLiveProgressSummary = getCurrentLiveProgressSummary;
        window.getSaveProgressSummary = getSaveProgressSummary;
        window.updateSavesUI = updateSavesUI;
        window.saveSlotPause = saveSlotPause;
        window.loadSlot = loadSlot;
        window.startGameFromSlot = startGameFromSlot;
        window.returnToMainMenuFromPause = returnToMainMenuFromPause;

        function toggleTaskWidget() {
            audioEngine.playClick();
            const widget = document.getElementById('task-widget');
            if (widget) {
                const isHidden = widget.style.display === 'none' || getComputedStyle(widget).display === 'none';
                widget.style.display = isHidden ? 'block' : 'none';
            }
        }

        function minimizeTaskWidget() {
            audioEngine.playClick();
            const content = document.querySelector('#task-widget .window-content');
            if (content) {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
            }
        }

        function closeTaskWidget() {
            audioEngine.playClick();
            const widget = document.getElementById('task-widget');
            if (widget) {
                widget.style.display = 'none';
            }
        }

        function updateTaskWidgetText() {
            const t = translations[currentLang];
            const widgetTitle = document.getElementById('task-widget-title');
            if (widgetTitle) widgetTitle.innerText = t.taskWidgetTitle || "Task";
            
            const widgetText = document.getElementById('task-widget-text');
            if (widgetText) {
                let text = "";
                if (activeChapter === 1) {
                    if (hasRebootedAfterBSOD) {
                        if (currentChapter1Task === 1) {
                            text = isCh1Task1Completed ? (t.taskCh1_postBsod_1_done || "✔ 1. Зайди в интернет. Опять.") : (t.taskCh1_postBsod_1 || "1. Зайди в интернет. Опять.");
                        } else if (currentChapter1Task === 2) {
                            text = isCh1Task2Completed ? (t.taskCh1_postBsod_2_done || "✔ 2. Нажми на рекламу. Опять.") : (t.taskCh1_postBsod_2 || "2. Нажми на рекламу. Опять.");
                        } else if (currentChapter1Task === 3) {
                            text = t.taskCh1_postBsod_3 || "3. Пройди игру.";
                        } else {
                            text = t.taskCh1_postBsod_3 || "3. Пройди игру.";
                        }
                    } else {
                        if (currentChapter1Task === 1) {
                            text = isCh1Task1Completed ? (t.taskCh1_1_done || "✔ 1. Зайти в Интернет.") : (t.taskCh1_1 || "1. Зайти в Интернет.");
                        } else if (currentChapter1Task === 2) {
                            text = isCh1Task2Completed ? (t.taskCh1_2_done || "✔ 2. Нажать на рекламу.") : (t.taskCh1_2 || "2. Нажать на рекламу.");
                        } else if (currentChapter1Task === 3) {
                            text = t.taskCh1_3 || "3. Пройти игру-викторину.";
                        } else {
                            text = t.taskCh1 || "Complete the brand knowledge quiz.";
                        }
                    }
                } else if (activeChapter === 2) {
                    if (currentChapter2Task === 1) {
                        text = t.taskCh2_1 || "1. Find information about the virus.";
                    } else if (currentChapter2Task === 2) {
                        text = t.taskCh2_2 || "2. Enter the internet.";
                    } else if (currentChapter2Task === 3) {
                        text = t.taskCh2_3 || "3. Destroy logotype.com.exe site.";
                    } else if (currentChapter2Task === 4) {
                        text = t.taskCh2_4 || "4. Enter Registry Editor and hack the God of Sites Core.";
                    } else {
                        text = t.taskCh2_3 || "3. Destroy logotype.com.exe site.";
                    }
                }

                if (text.startsWith("✔ ")) {
                    widgetText.innerHTML = `<span style="color: #00ff00; font-weight: bold; text-shadow: 0 0 5px #00ff00;">✔</span> ` + text.slice(2);
                } else {
                    widgetText.innerText = text;
                }
            }
        }

        function openHintFile() {
            if (checkCh2Restriction('cipher')) return;
            audioEngine.playClick();
            const t = translations[currentLang];
            const contentHtml = `
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #00ff00; background: #000; padding: 12px; height: 100%; white-space: pre-wrap; overflow-y: auto;">${t.cipherFileContent}</div>
            `;
            createDesktopWindow('hint-window', t.cipherFileTitle || 'Notepad — cipher.txt', contentHtml, '450px', '280px', '140px', '140px');
            if (activeChapter === 2 && currentChapter2Task === 1) {
                showPlayerDialogue(t.ch2PlayerMonologueCipher);
            }
        }

        function calculateCharDelay(fullText, charIdx, defaultCharDelay = 35) {
            if (!fullText || charIdx <= 0) return defaultCharDelay;
            
            const idx = charIdx - 1;
            const char = fullText.charAt(idx);
            const prevChar = idx > 0 ? fullText.charAt(idx - 1) : '';
            const prevPrevChar = idx > 1 ? fullText.charAt(idx - 2) : '';
            const nextChar = idx < fullText.length - 1 ? fullText.charAt(idx + 1) : '';
            
            const isLastCharInText = (idx === fullText.length - 1);
            const isFollowedBySpaceOrNewline = (nextChar === ' ' || nextChar === '\n' || nextChar === '\r' || nextChar === '');

            // 1. Check for dots and ellipsis (...)
            if (char === '.') {
                const isEllipsis1stOr2ndDot = (nextChar === '.');
                if (isEllipsis1stOr2ndDot) {
                    return 500; // 0.5s pause per dot in ellipsis
                }

                const isEllipsis3rdDot = (prevChar === '.' || prevPrevChar === '.') && nextChar !== '.';
                if (isEllipsis3rdDot) {
                    const isSentenceEndEllipsis = isLastCharInText || isFollowedBySpaceOrNewline;
                    if (isSentenceEndEllipsis) {
                        return 2000; // Знак в конце предложения -> 2 секунды
                    }
                    return 500; // 3-я точка троеточия -> 0.5с (суммарно 1.5с за троеточие)
                }

                // 1 точка
                const isSentenceEndDot = isLastCharInText || isFollowedBySpaceOrNewline;
                if (isSentenceEndDot) {
                    return 2000; // Знак в конце предложения -> 2 секунды
                }
                return 500; // 1 точка внутри предложения -> 0.5 секунды
            }

            // 2. Проверка запятой (,)
            if (char === ',') {
                if (isLastCharInText) {
                    return 2000; // Знак в конце предложения -> 2 секунды
                }
                return 500; // Запятая -> 0.5 секунды (500 мс)
            }

            // 3. Проверка восклицательного и вопросительного знака (!, ?)
            if (char === '!' || char === '?') {
                if (isLastCharInText || isFollowedBySpaceOrNewline) {
                    return 2000; // Знак в конце предложения -> 2 секунды
                }
                return 1000; // ! или ? в середине -> 1 секунда
            }

            // 4. Проверка любых других знаков (:, ;, -, —, quotes, brackets, etc.)
            const isOtherPunctuation = /[;\:\-\—"'()\[\]{}]/.test(char);
            if (isOtherPunctuation) {
                if (isLastCharInText) {
                    return 2000; // Знак в конце предложения -> 2 секунды
                }
                return 1000; // Все остальные знаки -> 1 секунда (1000 мс)
            }

            // 5. Правило для последнего знака предложения (даже если буква/цифра без пунктуации)
            if (isLastCharInText) {
                return 2000; // Знак в конце предложения -> 2 секунды
            }

            return defaultCharDelay;
        }

        function checkCh2Restriction(target) {
            if (activeChapter !== 2) return false;
            const t = translations[currentLang] || translations['ru'];

            if (currentChapter2Task === 1) {
                if (target === 'cipher' || target === 'dos') {
                    return false;
                }
                audioEngine.playClick();
                showPlayerDialogue(t.restrict_generic || t.restrictGeneric || "Сейчас мне нельзя туда.");
                return true;
            } else if (currentChapter2Task === 2 || currentChapter2Task === 3) {
                if (target === 'browser') {
                    return false;
                }
                if (target === 'cipher' || target === 'dos') {
                    audioEngine.playClick();
                    showPlayerDialogue(t.restrict_old_tasks || t.restrictOldTasks || "Мне уже туда не надо.");
                    return true;
                }
                audioEngine.playClick();
                showPlayerDialogue(t.restrict_generic || t.restrictGeneric || "Сейчас мне нельзя туда.");
                return true;
            } else if (currentChapter2Task === 4) {
                if (target === 'regedit') {
                    return false;
                }
                audioEngine.playClick();
                showPlayerDialogue(t.restrict_generic || t.restrictGeneric || "Сейчас мне нельзя туда.");
                return true;
            }

            return false;
        }
        window.checkCh2Restriction = checkCh2Restriction;

        function showGameConfirm(message, onConfirm, onCancel, options = {}) {
            if (typeof audioEngine !== 'undefined') audioEngine.playClick();

            const existing = document.getElementById('game-modal-overlay');
            if (existing) existing.remove();

            const t = translations[currentLang] || translations['ru'];
            const title = options.title || t.confirmTitle || "⚠️ Подтверждение действия";
            const confirmText = options.confirmText || t.yesBtn || "Да";
            const cancelText = options.cancelText || t.cancelBtn || "Отмена";
            const isDanger = options.danger !== false;

            const overlay = document.createElement('div');
            overlay.id = 'game-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:1000005;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';

            const win = document.createElement('div');
            win.className = 'window';
            win.style.cssText = 'position:relative;width:460px;max-width:92vw;background:#c0c0c0;border:3px outset #ffffff;box-shadow:0 0 25px rgba(0,0,0,0.8);box-sizing:border-box;display:flex;flex-direction:column;';

            const titleBg = isDanger ? 'linear-gradient(90deg, #800000, #b00000)' : 'linear-gradient(90deg, #000080, #1084d0)';

            win.innerHTML = `
                <div class="title-bar active" style="background: ${titleBg}; color: white; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 13px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between; user-select: none;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span>${isDanger ? '⚠️' : '❓'}</span>
                        <span>${title}</span>
                    </div>
                    <div style="font-size:11px;opacity:0.8;">[?] [X]</div>
                </div>
                <div style="background: #c0c0c0; padding: 20px 18px; display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 34px; flex-shrink: 0; user-select: none;">${isDanger ? '🛑' : '⚠️'}</div>
                    <div style="font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 13px; color: #000; line-height: 1.5; font-weight: bold; word-break: break-word; white-space: pre-wrap;">${message}</div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 10px 16px 14px 16px; background: #c0c0c0;">
                    <button id="modal-confirm-btn" style="background: ${isDanger ? '#a00000' : '#c0c0c0'}; color: ${isDanger ? '#ffffff' : '#000000'}; border: 2px outset #ffffff; padding: 6px 22px; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 12px; cursor: pointer; min-width: 85px;">${confirmText}</button>
                    <button id="modal-cancel-btn" style="background: #c0c0c0; color: #000000; border: 2px outset #ffffff; padding: 6px 22px; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 12px; cursor: pointer; min-width: 85px;">${cancelText}</button>
                </div>
            `;

            overlay.appendChild(win);
            document.body.appendChild(overlay);

            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (confirmBtn) confirmBtn.click();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    if (cancelBtn) cancelBtn.click();
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            const closeModal = () => {
                window.removeEventListener('keydown', handleKeyDown);
                overlay.remove();
            };

            if (confirmBtn) {
                confirmBtn.onmouseenter = () => { if (typeof audioEngine !== 'undefined') audioEngine.playHover(); };
                confirmBtn.onclick = () => {
                    if (typeof audioEngine !== 'undefined') audioEngine.playClick();
                    closeModal();
                    if (typeof onConfirm === 'function') onConfirm();
                };
            }

            if (cancelBtn) {
                cancelBtn.onmouseenter = () => { if (typeof audioEngine !== 'undefined') audioEngine.playHover(); };
                cancelBtn.onclick = () => {
                    if (typeof audioEngine !== 'undefined') audioEngine.playClick();
                    closeModal();
                    if (typeof onCancel === 'function') onCancel();
                };
            }
        }
        window.showGameConfirm = showGameConfirm;

        function showGameAlert(message, onOk, options = {}) {
            if (typeof audioEngine !== 'undefined') audioEngine.playClick();

            const existing = document.getElementById('game-modal-overlay');
            if (existing) existing.remove();

            const t = translations[currentLang] || translations['ru'];
            const title = options.title || t.alertTitle || "Сообщение";
            const okText = options.okText || "OK";
            const icon = options.icon || "⚠️";

            const overlay = document.createElement('div');
            overlay.id = 'game-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:1000005;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';

            const win = document.createElement('div');
            win.className = 'window';
            win.style.cssText = 'position:relative;width:440px;max-width:92vw;background:#c0c0c0;border:3px outset #ffffff;box-shadow:0 0 25px rgba(0,0,0,0.8);box-sizing:border-box;display:flex;flex-direction:column;';

            win.innerHTML = `
                <div class="title-bar active" style="background: linear-gradient(90deg, #000080, #1084d0); color: white; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 13px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between; user-select: none;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span>ℹ️</span>
                        <span>${title}</span>
                    </div>
                    <div style="font-size:11px;opacity:0.8;">[X]</div>
                </div>
                <div style="background: #c0c0c0; padding: 20px 18px; display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 34px; flex-shrink: 0; user-select: none;">${icon}</div>
                    <div style="font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 13px; color: #000; line-height: 1.5; font-weight: bold; word-break: break-word; white-space: pre-wrap;">${message}</div>
                </div>
                <div style="display: flex; justify-content: flex-end; padding: 10px 16px 14px 16px; background: #c0c0c0;">
                    <button id="modal-ok-btn" style="background: #c0c0c0; color: #000000; border: 2px outset #ffffff; padding: 6px 26px; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 12px; cursor: pointer; min-width: 85px;">${okText}</button>
                </div>
            `;

            overlay.appendChild(win);
            document.body.appendChild(overlay);

            const okBtn = document.getElementById('modal-ok-btn');

            const handleKeyDown = (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    if (okBtn) okBtn.click();
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            const closeModal = () => {
                window.removeEventListener('keydown', handleKeyDown);
                overlay.remove();
            };

            if (okBtn) {
                okBtn.onmouseenter = () => { if (typeof audioEngine !== 'undefined') audioEngine.playHover(); };
                okBtn.onclick = () => {
                    if (typeof audioEngine !== 'undefined') audioEngine.playClick();
                    closeModal();
                    if (typeof onOk === 'function') onOk();
                };
            }
        }
        window.showGameAlert = showGameAlert;

        function showPlayerDialogue(text, callback) {
            audioEngine.playClick();
            const existing = document.getElementById('player-dialogue-window');
            if (existing) existing.remove();

            blockAllInteractions(99998);

            const t = translations[currentLang] || translations['ru'];
            const titleText = `${playerName || 'Игрок'} — ${t.monologueTitle || 'Размышления'}`;

            const dialogueWindow = document.createElement('div');
            dialogueWindow.id = 'player-dialogue-window';
            dialogueWindow.className = 'window';
            dialogueWindow.style.cssText = 'position:fixed;bottom:45px;left:50%;transform:translateX(-50%);width:650px;max-width:92vw;z-index:99999;background:#c0c0c0;border:3px outset #ffffff;box-shadow:4px 4px 15px rgba(0,0,0,0.5);display:flex;flex-direction:column;box-sizing:border-box;height:auto !important;max-height:280px !important;';

            dialogueWindow.innerHTML = `
                <div class="title-bar active" style="background: linear-gradient(90deg, #000080, #1084d0); color: white; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 13px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span>💬</span>
                        <span>${titleText}</span>
                    </div>
                </div>
                <div style="background: #ffffff; border: 2px inset #808080; margin: 6px; padding: 14px 16px; display: flex; gap: 14px; align-items: flex-start; min-height: 85px; box-sizing: border-box;">
                    <div style="background: #008080; border: 2px inset #404040; padding: 6px 10px; font-size: 24px; color: #fff; flex-shrink: 0; box-shadow: inset 1px 1px 2px #000;">👤</div>
                    <div style="font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 14px; color: #000; line-height: 1.6; flex-grow: 1; min-height: 55px; font-weight: 500;">
                        <span id="player-dialogue-text" style="white-space: pre-wrap; word-break: break-word;"></span><span id="player-dialogue-cursor" style="display:inline-block;width:8px;height:16px;background:#000;margin-left:2px;vertical-align:middle;"></span>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; padding: 0 8px 8px 8px;">
                    <button id="player-dialogue-ok-btn" style="background: #c0c0c0; border: 2px outset #ffffff; padding: 4px 30px; font-weight: bold; font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 13px; cursor: pointer; display: none;">OK</button>
                </div>
            `;

            document.body.appendChild(dialogueWindow);

            const textSpan = document.getElementById('player-dialogue-text');
            const cursor = document.getElementById('player-dialogue-cursor');
            const okBtn = document.getElementById('player-dialogue-ok-btn');

            let cursorInterval = setInterval(() => {
                if (cursor) cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
            }, 400);

            let charIdx = 0;

            function typeNextChar() {
                if (typeof isPaused !== 'undefined' && isPaused) {
                    setTimeout(typeNextChar, 100);
                    return;
                }
                if (charIdx < text.length) {
                    const char = text.charAt(charIdx);
                    if (textSpan) textSpan.innerText += char;
                    charIdx++;

                    if (typeof audioEngine !== 'undefined') {
                        audioEngine.playTone('sine', 380, 25, 0.03, 0.04);
                    }

                    const delay = calculateCharDelay(text, charIdx, 35);
                    setTimeout(typeNextChar, delay);
                } else {
                    clearInterval(cursorInterval);
                    if (cursor) cursor.style.display = 'none';
                    if (okBtn) {
                        okBtn.style.display = 'inline-block';
                        okBtn.onclick = () => {
                            audioEngine.playClick();
                            if (dialogueWindow) dialogueWindow.remove();
                            unblockAllInteractions();
                            if (typeof callback === 'function') callback();
                        };
                    }
                }
            }

            typeNextChar();
        }

        function startChapter1() {
            activeChapter = 1;
            currentChapter1Task = 1;
            isCh1Task1Completed = false;
            isCh1Task2Completed = false;
            stopCh1TaskGlitch();
            currentQuestion = 0;
            playerLives = 3;
            hasRebootedAfterBSOD = false;
            handEventTriggered = false;
            isZettaInstalled = false;
            isZettaCorrupted = false;
            zettaEndAttempts = 0;
            zettaTriedExitAlready = false;
            goodEndingAchieved = false;
            internetKilled = false;
            isTempAccessGranted = false;
            isRegistryDecrypted = false;
            darknessLevel = 0;
            captchaDone = false;
            errorCount = 0;
            isGodOfSitesRevealed = false;
            ch2BossDialogueCompleted = false;
            isCh2BossDialoguePlaying = false;
            is666Mode = false;
            isOnCreepySite = false;

            window._letterShown = false;
            window._zettaQ16Hint = false;
            window._zettaQ17Hint = false;
            window._zettaQ18Hint = false;
            window._bossIntroStarted = false;
            window._bossFightInitiated = false;
            if (window._destroyBtnTimeout) clearTimeout(window._destroyBtnTimeout);

            // Clean up assistant / ads / overlays if present
            const assistant = document.getElementById('zetta-assistant');
            if (assistant) assistant.remove();
            const speech = document.getElementById('zetta-speech');
            if (speech) speech.remove();
            const zettaAd = document.getElementById('zetta-ad');
            if (zettaAd) zettaAd.remove();
            const zettaSetup = document.getElementById('zetta-setup');
            if (zettaSetup) zettaSetup.remove();
            const ch2BossOverlay = document.getElementById('ch2-boss-finale-overlay');
            if (ch2BossOverlay) ch2BossOverlay.remove();
            const monologueWin = document.getElementById('player-dialogue-window');
            if (monologueWin) monologueWin.remove();

            if (typeof unblockAllInteractions === 'function') unblockAllInteractions();
            if (typeof closeAllDesktopWindows === 'function') closeAllDesktopWindows();

            // Hide Chapter 2 desktop icon (cipher.txt)
            const hintContainer = document.getElementById('desktop-hint-container');
            if (hintContainer) hintContainer.style.display = 'none';

            // Reset desktop icons text to Chapter 1 values
            const t = translations[currentLang] || translations['ru'];
            const pcText = document.getElementById('desktop-pc-text');
            if (pcText) pcText.innerText = t.myComputer || "Мой компьютер";
            const trashText = document.getElementById('desktop-trash-text');
            if (trashText) trashText.innerText = t.trash || "Корзина";
            const netText = document.getElementById('desktop-internet-text');
            if (netText) {
                netText.innerText = t.internet || "Internet";
                const netContainer = netText.closest('.icon-container');
                if (netContainer) {
                    netContainer.style.animation = '';
                    netContainer.style.filter = '';
                }
            }

            // Restore desktop background & Start button
            document.body.style.transition = '';
            document.body.style.background = '';
            document.body.style.backgroundColor = 'var(--win-bg)';

            const startBtn = document.querySelector('.start-btn');
            if (startBtn) {
                startBtn.style.visibility = 'visible';
                startBtn.style.transform = 'none';
                startBtn.style.transition = 'none';
            }

            // Reset Browser State (keep closed initially)
            browserState.isOpen = false;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.style.display = 'none';
            urlInput.value = "http://";
            urlInput.disabled = false;
            const goBtn = document.getElementById('browser-go-btn');
            if (goBtn) goBtn.disabled = false;
            const bBtns = document.getElementById('browser-window-btns');
            if (bBtns) bBtns.style.display = 'flex';
            browserWindow.classList.remove('shake-active', 'shake-continuous');

            // Setup Task Widget for Chapter 1
            const widget = document.getElementById('task-widget');
            if (widget) widget.style.display = 'block';
            updateTaskWidgetText();
        }
        window.startChapter1 = startChapter1;

        function startChapter2() {
            if (window.isChapter2Finished) {
                if (typeof audioEngine !== 'undefined') audioEngine.playError();
                return;
            }
            activeChapter = 2;
            stopCh1TaskGlitch();
            currentChapter2Task = 1;
            isGodOfSitesRevealed = false;
            ch2BossDialogueCompleted = false;
            isCh2BossDialoguePlaying = false;
            internetKilled = false;
            hasRebootedAfterBSOD = false;
            goodEndingAchieved = false;
            isTempAccessGranted = false;
            isRegistryDecrypted = false;
            darknessLevel = 0;
            is666Mode = false;
            isOnCreepySite = false;

            window._bossIntroStarted = false;
            window._bossFightInitiated = false;
            if (window._destroyBtnTimeout) clearTimeout(window._destroyBtnTimeout);

            // Clean up overlays
            const assistant = document.getElementById('zetta-assistant');
            if (assistant) assistant.remove();
            const speech = document.getElementById('zetta-speech');
            if (speech) speech.remove();
            const zettaAd = document.getElementById('zetta-ad');
            if (zettaAd) zettaAd.remove();
            const zettaSetup = document.getElementById('zetta-setup');
            if (zettaSetup) zettaSetup.remove();
            const ch2BossOverlay = document.getElementById('ch2-boss-finale-overlay');
            if (ch2BossOverlay) ch2BossOverlay.remove();
            const monologueWin = document.getElementById('player-dialogue-window');
            if (monologueWin) monologueWin.remove();
            const adPopup = document.getElementById('ad-popup');
            if (adPopup) adPopup.style.display = 'none';
            if (typeof adTimeout !== 'undefined') clearTimeout(adTimeout);

            if (typeof unblockAllInteractions === 'function') unblockAllInteractions();
            if (typeof closeAllDesktopWindows === 'function') closeAllDesktopWindows();

            // Reset desktop icon styles
            const netText = document.getElementById('desktop-internet-text');
            if (netText) {
                const netContainer = netText.closest('.icon-container');
                if (netContainer) {
                    netContainer.style.animation = '';
                    netContainer.style.filter = '';
                }
            }

            // Hide browser initially
            browserState.isOpen = false;
            browserWindow.style.display = 'none';
            taskbarBrowserBtn.style.display = 'none';
            urlInput.value = "http://";
            urlInput.disabled = false;
            const goBtn = document.getElementById('browser-go-btn');
            if (goBtn) goBtn.disabled = false;
            const bBtns = document.getElementById('browser-window-btns');
            if (bBtns) bBtns.style.display = 'flex';
            browserWindow.classList.remove('shake-active', 'shake-continuous');

            // Restore desktop background & Start button
            document.body.style.transition = '';
            document.body.style.background = '';
            document.body.style.backgroundColor = 'var(--win-bg)';

            const startBtn = document.querySelector('.start-btn');
            if (startBtn) {
                startBtn.style.visibility = 'visible';
                startBtn.style.transform = 'none';
                startBtn.style.transition = 'none';
            }

            // Task Widget hidden until monologue completes
            const widget = document.getElementById('task-widget');
            if (widget) widget.style.display = 'none';

            // Show Chapter 2 desktop icon (cipher.txt)
            const hintContainer = document.getElementById('desktop-hint-container');
            if (hintContainer) hintContainer.style.display = 'flex';

            const t = translations[currentLang] || translations['ru'];
            showPlayerDialogue(t.ch2PlayerMonologueStart, () => {
                if (widget) widget.style.display = 'block';
                updateTaskWidgetText();
            });
        }
        window.startChapter2 = startChapter2;

        function toggleStartMenu() {
            if (checkCh2Restriction('startmenu')) return;
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

        function systemAlert(type) {
            if (checkCh2Restriction('startmenu')) return;
            if (typeof audioEngine !== 'undefined') audioEngine.playError();
            const t = translations[currentLang] || translations['ru'];
            const msg = t[type] || "Action unavailable";
            showGameAlert(msg, null, { title: t.accessDeniedTitle || "Отказано в доступе", icon: "🛑" });
        }
        window.systemAlert = systemAlert;

        function startShutdown() {
            if (checkCh2Restriction('startmenu')) return;
            if (typeof audioEngine !== 'undefined') audioEngine.playError();
            const t = translations[currentLang] || translations['ru'];
            showGameAlert(t.cannotShutdown || "You cannot shutdown the computer", null, { title: t.cannotShutdownTitle || "Завершение работы", icon: "💻" });
        }
        window.startShutdown = startShutdown;

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
                if (typeof isPaused !== 'undefined' && isPaused) return;
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
                    hasRebootedAfterBSOD = true;
                    currentChapter1Task = 1;
                    isCh1Task1Completed = false;
                    isCh1Task2Completed = false;
                    stopCh1TaskGlitch();
                    updateTaskWidgetText();
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

        const getPhase1Dialogues = () => (translations[currentLang] && translations[currentLang].bossTaunts) ? translations[currentLang].bossTaunts : (translations['ru'] ? translations['ru'].bossTaunts : []);

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
            blockAllInteractions(99998);
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
                unblockAllInteractions();
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
                if (typeof isPaused !== 'undefined' && isPaused) return;
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
                    const taunts = getPhase1Dialogues();
                    if (taunts.length > 0) {
                        bossText.innerHTML = taunts[phase1DialogueIdx % taunts.length];
                        phase1DialogueIdx++;
                    }
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
                
                // Глаз и дыра уходят (босс исчезает)
                const eyeEl = document.getElementById('boss-eye-container');
                const holeEl = document.getElementById('boss-hole');
                if (eyeEl) eyeEl.style.transform = 'translate(-50%, -50%) scale(0)';
                if (holeEl) holeEl.style.transform = 'translate(-50%, -50%) scale(0)';

                // После того как босс уходит (3 секунды) — затемняем экран, затем темнота постепенно пропадает и проявляются титры
                setTimeout(() => {
                    const overlay = document.getElementById('transition-overlay');
                    if (overlay) overlay.style.opacity = '1';

                    setTimeout(() => {
                        triggerSoloEnding();
                        if (overlay) overlay.style.opacity = '0';
                    }, 1500);
                }, 3000);
            })();
        }

        function updateSoloEndingTexts() {
            const t = translations[currentLang];
            if (!t) return;

            const titleEl = document.getElementById('solo-ending-title');
            if (titleEl) titleEl.innerText = t.endingSoloTitle || "ГЛАВА 1 ПРОЙДЕНА";

            const subEl = document.getElementById('solo-ending-sub');
            if (subEl) subEl.innerText = t.endingSoloSub || "Вы показали своё бесстрашие и победили зло.";

            const devTitleEl = document.getElementById('solo-ending-dev-title');
            if (devTitleEl) devTitleEl.innerText = t.endingSoloDevelopers || "РАЗРАБОТЧИКИ";

            const desEl = document.getElementById('solo-ending-designer');
            if (desEl) desEl.innerText = t.endingSoloDesigner || "Дизайнер: Игорь";

            const idEl = document.getElementById('solo-ending-ideas');
            if (idEl) idEl.innerText = t.endingSoloIdeas || "Идеи: Игорь";

            const prgEl = document.getElementById('solo-ending-programmer');
            if (prgEl) prgEl.innerText = t.endingSoloProgrammer || "Программист: Gemini AI";

            const rlzEl = document.getElementById('solo-ending-realization');
            if (rlzEl) rlzEl.innerText = t.endingSoloRealization || "Воплощение: Gemini AI";

            const thxEl = document.getElementById('solo-ending-thanks');
            if (thxEl) thxEl.innerText = t.endingSoloThanks || "Спасибо за то, что протестировал эту демо-версию игры.";

            const btnTextEl = document.getElementById('solo-ending-menu-text');
            if (btnTextEl) btnTextEl.innerText = t.endingToMenu || "В главное меню";
        }

        let _isCh1CreditsMenuClicked = false;

        function triggerSoloEnding() {
            audioEngine.stopDrone();
            audioEngine.stopBossMusic();

            // Скрываем оверлей босс-файта и глаза
            const bossOverlay = document.getElementById('boss-fight-overlay');
            if (bossOverlay) bossOverlay.style.display = 'none';
            const bossLaser = document.getElementById('boss-laser-svg');
            if (bossLaser) bossLaser.style.display = 'none';

            // Очищаем всплывающие элементы
            const monologue = document.getElementById('monologue-overlay');
            if (monologue) monologue.style.display = 'none';

            if (typeof unblockAllInteractions === 'function') {
                unblockAllInteractions();
            }

            document.body.style.cursor = 'default';
            isOnCreepySite = false;
            goodEndingAchieved = true;
            isBossFightActive = false;

            // Сбрасываем блокировку клика по кнопке титров
            _isCh1CreditsMenuClicked = false;
            const btn = document.getElementById('solo-ending-menu-btn');
            if (btn) {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
            }

            // Обновляем и отображаем титры 1 главы
            updateSoloEndingTexts();
            const soloOverlay = document.getElementById('solo-ending-overlay');
            if (soloOverlay) {
                soloOverlay.style.display = 'flex';
            }

            // Включаем музыку титров
            audioEngine.playCreditsMusic();
        }

        function returnFromCh1CreditsToMenu() {
            if (_isCh1CreditsMenuClicked) return;
            _isCh1CreditsMenuClicked = true;

            const btn = document.getElementById('solo-ending-menu-btn');
            if (btn) {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
            }

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playClick();
                audioEngine.stopCreditsMusic();
                audioEngine.playMenuMusic();
            }

            // Мгновенно переключаем на Главное меню
            const soloOverlay = document.getElementById('solo-ending-overlay');
            if (soloOverlay) soloOverlay.style.display = 'none';

            const desktop = document.getElementById('desktop');
            if (desktop) desktop.style.display = 'none';

            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) mainMenu.style.display = 'block';

            if (typeof toggleSubmenu === 'function') {
                toggleSubmenu(null, false);
            }
        }

        window.returnFromCh1CreditsToMenu = returnFromCh1CreditsToMenu;
        window.triggerSoloEnding = triggerSoloEnding;
        window.updateSoloEndingTexts = updateSoloEndingTexts;

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
            if (checkCh2Restriction('letter')) return;
            audioEngine.playClick();
            const text = translations[currentLang].letterFileContent;
            const content = `<textarea readonly style="width:100%;height:100%;border:none;outline:none;resize:none;font-family:'Courier New',monospace;font-size:13px;padding:10px;box-sizing:border-box;background:white;color:#111;line-height:1.6;">${text}</textarea>`;
            createDesktopWindow('letter-window', translations[currentLang].letterFileTitle, content, '420px', '300px', '180px', '110px');
        }

        function openTrash() {
            if (checkCh2Restriction('trash')) return;
            audioEngine.playClick();
            const content = `
                <div style="padding:15px;font-family:'MS Sans Serif',Tahoma,sans-serif;font-size:12px;color:black;text-align:center;margin-top:20px;">
                    ${translations[currentLang].docsEmpty || "Корзина пуста."}
                </div>`;
            createDesktopWindow('trash-window', translations[currentLang].trash || 'Recycle Bin', content, '320px', '200px', '170px', '120px');
        }
        window.openTrash = openTrash;

        // ================================================================
        //  МОЙ КОМПЬЮТЕР
        // ================================================================
        function openMyComputer() {
            if (checkCh2Restriction('mycomputer')) return;
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
            if (activeChapter === 2 && currentChapter2Task === 1) {
                const t = translations[currentLang];
                showPlayerDialogue(t.ch2PlayerMonologueTask2, () => {
                    currentChapter2Task = 2;
                    triggerGodOfSitesRevelation();
                    const widget = document.getElementById('task-widget');
                    if (widget) widget.style.display = 'block';
                    updateTaskWidgetText();
                });
            }
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
            if (checkCh2Restriction('regedit')) return;
            audioEngine.playClick();

            if (activeChapter === 2 && currentChapter2Task === 4 && !window._ch2RegeditMonologueShown) {
                window._ch2RegeditMonologueShown = true;
                const tr = translations[currentLang] || translations['ru'];
                showPlayerDialogue(tr.ch2PlayerRegeditMonologue || "Нужно нажать правую кнопку мыши, и переписать код, что бы его сломать.");
            }

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

            const regWin = createDesktopWindow('regedit-window', translations[currentLang].regeditName || 'Registry Editor', renderContent(), '460px', '280px', '80px', '80px');
            
            if (regWin) {
                regWin.oncontextmenu = (e) => {
                    if (activeChapter === 2 && currentChapter2Task === 4) {
                        e.preventDefault();
                        e.stopPropagation();
                        const tr = translations[currentLang] || translations['ru'];
                        let ctxMenu = document.getElementById('regedit-custom-ctx-menu');
                        if (!ctxMenu) {
                            ctxMenu = document.createElement('div');
                            ctxMenu.id = 'regedit-custom-ctx-menu';
                            ctxMenu.style.cssText = `
                                position: fixed;
                                z-index: 100001;
                                background: #c0c0c0;
                                border: 2px outset #ffffff;
                                box-shadow: 3px 3px 6px rgba(0,0,0,0.5);
                                padding: 2px;
                                font-family: 'MS Sans Serif', Tahoma, sans-serif;
                                font-size: 12px;
                                cursor: pointer;
                            `;
                            document.body.appendChild(ctxMenu);
                        }
                        ctxMenu.style.left = e.clientX + 'px';
                        ctxMenu.style.top = e.clientY + 'px';
                        ctxMenu.style.display = 'block';
                        ctxMenu.innerHTML = `
                            <div style="padding: 6px 14px; background: #c0c0c0; color: #cc0000; font-weight: bold; border: 1px solid #880000;"
                                 onmouseover="this.style.background='#000080';this.style.color='white';"
                                 onmouseout="this.style.background='#c0c0c0';this.style.color='#cc0000';"
                                 onclick="triggerGodOfSitesDestruction()">
                                ⚡ ${tr.ch2RegeditContextMenuOption || 'Запустить код уничтожения'}
                            </div>
                        `;
                    }
                };
            }

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
                        notif.innerText = getTr('regeditKeyDeactivated', "РЕЕСТР: Ключ деактивирован.");
                        document.body.appendChild(notif);
                        setTimeout(() => notif.remove(), 3000);
                    }
                    
                    window.setRegeditNode(selectedNode);
                }
            };
        }

        function triggerGodOfSitesDestruction() {
            const ctxMenu = document.getElementById('regedit-custom-ctx-menu');
            if (ctxMenu) ctxMenu.remove();
            
            const regWin = document.getElementById('regedit-window');
            if (regWin) regWin.remove();

            if (typeof closeAllDesktopWindows === 'function') closeAllDesktopWindows();

            if (typeof audioEngine !== 'undefined') {
                audioEngine.playGlitchSound();
                audioEngine.stopBossMusic();
                audioEngine.stopDrone();
            }

            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(255,0,0,0.6);z-index:999998;pointer-events:none;animation:shake 0.1s infinite;';
            document.body.appendChild(flash);

            setTimeout(() => {
                flash.remove();
                if (typeof audioEngine !== 'undefined') {
                    audioEngine.stopGlitchSound();
                }

                startCh2GodOfSitesBoss();
            }, 1000);
        }
        window.triggerGodOfSitesDestruction = triggerGodOfSitesDestruction;

        function openMSDOSPrompt() {
            if (checkCh2Restriction('dos')) return;
            audioEngine.playClick();
            
            const welcomeMsg = translations[currentLang].dosOutputWelcome || "Microsoft(R) Windows 95\n(C)Copyright Microsoft Corp 1981-1995.\n";
            
            const menuText = getTr('dosMenuText', "=== ДОСТУПНЫЕ ДЕЙСТВИЯ ===\n[1] Проверить файлы (DIR)\n[2] Читать memory.log\n[3] Читать ispy_mutator.dll\n[4] Читать research.txt (из Temp)\n[5] Очистить диск C: (FORMAT C:)\n[6] Закрыть сеанс (EXIT)\n[7] Открыть папку Temp в Диске C:\n==========================\nВведите номер действия (1-7) или команду:\n");
                
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
                    } else if (input === '7') {
                        isTempAccessGranted = true;
                        openTempFolder();
                        currentPath = 'C:\\WINDOWS\\TEMP';
                        dosHistory += `\n${currentPath}>7\n` + (currentLang === 'ru' ? "Папка Temp на диске C: успешно открыта.\n" : (currentLang === 'ua' ? "Папку Temp на диску C: успішно відкрито.\n" : "Temp folder in C: drive opened successfully.\n"));
                        updateDosDisplay();
                        return;
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
                                if (activeChapter === 2 && currentChapter2Task === 1) {
                                    const t = translations[currentLang];
                                    showPlayerDialogue(t.ch2PlayerMonologueTask2, () => {
                                        currentChapter2Task = 2;
                                        triggerGodOfSitesRevelation();
                                        const widget = document.getElementById('task-widget');
                                        if (widget) widget.style.display = 'block';
                                        updateTaskWidgetText();
                                    });
                                }
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
            if (checkCh2Restriction('taskmgr')) return;
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
            const t = translations[currentLang] || translations['ru'];
            if (text.includes('Internet')) {
                if (activeChapter === 2) {
                    showGameAlert(t.criticalProcess, null, { title: t.accessDeniedTitle || "Ошибка", icon: "🛑" });
                    audioEngine.playError(0.8);
                    return;
                }
                endInternetTask();
            } else if (text.includes('zetta_core.sys')) {
                if (isZettaCorrupted) {
                    zettaEndAttempts++;
                    if (zettaEndAttempts === 1) {
                        zettaSpeak(t.zettaEndAttempt, "corrupted");
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
                        
                        showGameAlert(t.zettaKilled, null, { title: "Zetta", icon: "🛑" });
                        populateTaskManager();
                    }
                } else {
                    showGameAlert(t.criticalProcess, null, { title: t.accessDeniedTitle || "Ошибка", icon: "🛑" });
                }
            } else if (text.includes('watching_you.exe') || text.includes('fear.sys')) {
                showGameAlert(t.accessDeniedBoss ? t.accessDeniedBoss.replace('{playerName}', playerName) : "...", null, { title: "ISpy", icon: "👁️" });
                audioEngine.playError(0.8);
            } else {
                showGameAlert(t.criticalProcess, null, { title: t.accessDeniedTitle || "Ошибка", icon: "🛑" });
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
            if (activeChapter === 2) {
                const t = translations[currentLang] || translations['ru'];
                showGameAlert(t.criticalProcess, null, { title: t.accessDeniedTitle || "Ошибка", icon: "🛑" });
                audioEngine.playError(0.8);
                return;
            }
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
            
            const t = translations[currentLang] || translations['ru'];
            navigator.clipboard.writeText(text).then(() => {
                showGameAlert(t.copySuccess, null, { title: "Clipboard", icon: "📋" });
            }).catch(() => {
                showGameAlert(t.copyError, null, { title: "Clipboard", icon: "❌" });
            });
        }

        function shareFakeWin() {
            audioEngine.playClick();
            
            const t = translations[currentLang] || translations['ru'];
            const text = (t.shareFakeWinText || "").replace('{playerName}', playerName);
            navigator.clipboard.writeText(text).then(() => {
                showGameAlert(t.copySuccess, null, { title: "Clipboard", icon: "📋" });
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


