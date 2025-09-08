class RomanticRoulette {
    constructor() {
        this.currentWheel = null;
        this.wheelType = null;
        this.options = [];
        this.canvas = null;
        this.ctx = null;
        this.isSpinning = false;
        this.rotation = 0;
        this.savedWheels = JSON.parse(localStorage.getItem('romanticWheels')) || [];
        
        // Romantic surprise wheel content
        this.surpriseContent = {
            romantic_questions: [
                "¿Cuál es tu recuerdo más romántico conmigo? 💕",
                "¿Qué es lo que más extrañas de mí? 😢💗",
                "¿Cuál fue el momento en que supiste que me amabas? 😍",
                "¿Qué harías si estuviéramos juntos ahora mismo? 🤗",
                "¿Cuál es tu fantasía romántica favorita? 💭❤️",
                "¿Qué parte de mi cuerpo es tu favorita? 😏💕",
                "¿Cómo imaginas nuestra primera cita después de vernos? 🌹",
                "¿Qué canción te recuerda a mí? 🎵💓"
            ],
            virtual_challenges: [
                "Envía una foto tuya sonriendo ahora mismo 📸😊",
                "Graba un audio diciéndome 'te amo' en 3 idiomas 🗣️❤️",
                "Haz una videollamada de 5 minutos solo mirándonos 👀💕",
                "Escribe un poema corto sobre nosotros 📝💗",
                "Canta mi canción favorita por videollamada 🎤🎵",
                "Baila algo sensual para mí por video 💃✨",
                "Cuenta hasta 100 pero solo números que te recuerden a mí 🔢💕",
                "Dibuja nuestro futuro juntos y envíamelo 🎨👫"
            ],
            romantic_activities: [
                "Vamos a ver una película juntos por videollamada 🎬💕",
                "Cocinemos algo al mismo tiempo, cada uno en su casa 👨‍🍳👩‍🍳",
                "Hagamos una sesión de fotos virtual 📷✨",
                "Planifiquemos nuestro próximo encuentro 🗓️❤️",
                "Juguemos verdad o reto romántico 🎯💗",
                "Escuchemos música romántica juntos 🎵💕",
                "Contémonos secretos que nadie más sabe 🤫💓",
                "Hagamos planes para cuando vivamos juntos 🏠👫"
            ],
            sweet_exchanges: [
                "Intercambiemos 5 fotos de nuestra infancia 👶📱",
                "Enviémonos notas de voz diciendo por qué nos amamos 🎙️❤️",
                "Compartamos una selfie haciendo la misma pose 🤳💕",
                "Mandémonos fotos de nuestro lugar favorito de la casa 🏡📸",
                "Intercambiemos capturas de pantalla de chats antiguos 💬💗",
                "Enviémonos una foto de algo que nos recuerda al otro 💭📷",
                "Mandémonos un video corto de nuestro día 🎥🌅",
                "Intercambiemos una foto de lo que estamos comiendo 🍽️😋"
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedWheels();
        this.startParticleSystem();
    }

    setupEventListeners() {
        // Wheel type selection
        document.querySelectorAll('.wheel-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectWheelType(card.dataset.type);
            });
        });

        // Creator actions
        document.querySelector('.back-btn').addEventListener('click', () => {
            this.showWheelSelection();
        });

        document.getElementById('add-option').addEventListener('click', () => {
            this.addOption();
        });

        document.getElementById('option-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addOption();
            }
        });

        document.getElementById('clear-options').addEventListener('click', () => {
            this.clearOptions();
        });

        document.getElementById('save-wheel').addEventListener('click', () => {
            this.saveWheel();
        });

        document.getElementById('spin-btn').addEventListener('click', () => {
            this.spinWheel();
        });

        // Modal actions
        document.getElementById('spin-again').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('close-result').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on overlay click
        document.getElementById('result-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('result-modal')) {
                this.closeModal();
            }
        });
    }

    selectWheelType(type) {
        this.wheelType = type;
        this.options = [];
        
        document.getElementById('wheel-selection').classList.add('hidden');
        document.getElementById('wheel-creator').classList.remove('hidden');
        
        this.initCanvas();
        
        const title = document.getElementById('creator-title');
        
        switch (type) {
            case 'mystery':
                title.textContent = 'Ruleta Misteriosa 🎁✨';
                break;
            case 'normal':
                title.textContent = 'Ruleta Normal 🎀💕';
                break;
            case 'surprise':
                title.textContent = 'Ruleta Sorpresa 💗🌟';
                this.loadSurpriseContent();
                break;
        }
        
        this.updateDisplay();
    }

    loadSurpriseContent() {
        // Combine all surprise content categories
        const allContent = [
            ...this.surpriseContent.romantic_questions,
            ...this.surpriseContent.virtual_challenges,
            ...this.surpriseContent.romantic_activities,
            ...this.surpriseContent.sweet_exchanges
        ];
        
        // Shuffle and select random items
        this.options = this.shuffleArray(allContent).slice(0, 12);
        this.updateDisplay();
        this.drawWheel();
    }

    initCanvas() {
        this.canvas = document.getElementById('wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set actual canvas size for crisp rendering
        const scale = window.devicePixelRatio || 1;
        this.canvas.width = 600 * scale;
        this.canvas.height = 600 * scale;
        this.ctx.scale(scale, scale);
        
        this.drawWheel();
    }

    addOption() {
        const input = document.getElementById('option-input');
        const text = input.value.trim();
        
        if (text && text.length > 0 && this.options.length < 20) {
            // Clean the text and ensure it's properly formatted
            const cleanText = text.replace(/\s+/g, ' ').trim();
            
            // Check for duplicates
            if (this.options.includes(cleanText)) {
                alert('¡Esta opción ya existe! 💕');
                return;
            }
            
            this.options.push(cleanText);
            input.value = '';
            this.updateDisplay();
            this.drawWheel();
            
            // Add some romantic emojis randomly
            const randomEmojis = ['💕', '✨', '💗', '🌟', '❤️', '💎', '🎉'];
            this.createParticleEffect(randomEmojis[Math.floor(Math.random() * randomEmojis.length)]);
        } else if (text.length === 0) {
            alert('¡Escribe algo romántico para agregar! 💕');
        }
    }

    removeOption(index) {
        this.options.splice(index, 1);
        this.updateDisplay();
        this.drawWheel();
    }

    clearOptions() {
        this.options = [];
        this.updateDisplay();
        this.drawWheel();
    }

    updateDisplay() {
        const list = document.getElementById('options-list');
        list.innerHTML = '';
        
        this.options.forEach((option, index) => {
            const item = document.createElement('div');
            item.className = 'option-item fade-in';
            
            const optionText = this.wheelType === 'mystery' ? `Opción ${index + 1} 🎁` : option;
            
            item.innerHTML = `
                <span class="option-text">${optionText}</span>
                <button class="remove-option" onclick="roulette.removeOption(${index})">🗑️</button>
            `;
            
            list.appendChild(item);
        });
        
        // Update spin button state
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = this.options.length < 2;
        if (this.options.length >= 2) {
            spinBtn.textContent = `🎯 Girar ruleta`;
        } else {
            spinBtn.textContent = 'Agrega más opciones ✨';
        }
    }

    drawWheel() {
        if (!this.ctx || this.options.length === 0) {
            this.drawEmptyWheel();
            return;
        }
        
        const centerX = 300;
        const centerY = 300;
        const radius = 250;
        const segments = this.options.length;
        const anglePerSegment = (2 * Math.PI) / segments;
        
        // Colors: predominantly white with fuchsia and black accents
        const colors = [
            '#ffffff', '#ff1493', '#ffb6c1', '#ff69b4', 
            '#ffe4e1', '#ffc0cb', '#fff0f5', '#e30052'
        ];
        
        this.ctx.clearRect(0, 0, 600, 600);
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.rotation * Math.PI / 180);
        
        // Draw segments
        for (let i = 0; i < segments; i++) {
            const startAngle = i * anglePerSegment;
            const endAngle = (i + 1) * anglePerSegment;
            const color = colors[i % colors.length];
            
            // Create gradient for each segment
            const gradient = this.ctx.createRadialGradient(0, 0, 50, 0, 0, radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.2));
            
            // Draw segment
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, startAngle, endAngle);
            this.ctx.lineTo(0, 0);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Beautiful border with romantic colors
            this.ctx.strokeStyle = '#e30052';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = 'rgba(227, 0, 82, 0.3)';
            this.ctx.shadowBlur = 5;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Draw text
            this.ctx.save();
            this.ctx.rotate(startAngle + anglePerSegment / 2);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Text size based on segments
            const fontSize = segments > 12 ? 11 : segments > 8 ? 13 : 15;
            this.ctx.font = `bold ${fontSize}px 'Poppins', Arial, sans-serif`;
            
            // Text position - well within segment
            const textRadius = radius * 0.7;
            
            // Better text colors for readability
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;

            let displayText;
            if (this.wheelType === 'mystery') {
                displayText = '🎁';
            } else {
                displayText = this.options[i];
            }
            
            // Handle text length
            const maxLength = segments > 10 ? 12 : segments > 6 ? 18 : 25;
            
            if (displayText.length <= maxLength) {
                // Add text shadow for better readability
                this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                this.ctx.shadowOffsetX = 1;
                this.ctx.shadowOffsetY = 1;
                this.ctx.shadowBlur = 2;
                this.ctx.strokeText(displayText, textRadius, 0);
                this.ctx.fillText(displayText, textRadius, 0);
                this.ctx.shadowBlur = 0;
            } else {
                // Split text into two lines
                const mid = Math.ceil(displayText.length / 2);
                const spaceIndex = displayText.indexOf(' ', mid - 5);
                
                let line1, line2;
                if (spaceIndex > -1 && spaceIndex < mid + 5) {
                    line1 = displayText.substring(0, spaceIndex);
                    line2 = displayText.substring(spaceIndex + 1);
                } else {
                    line1 = displayText.substring(0, mid);
                    line2 = displayText.substring(mid);
                }
                
                if (line1.length > maxLength / 2 + 2) {
                    line1 = line1.substring(0, maxLength / 2) + '…';
                }
                if (line2.length > maxLength / 2 + 2) {
                    line2 = line2.substring(0, maxLength / 2) + '…';
                }
                
                this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                this.ctx.shadowOffsetX = 1;
                this.ctx.shadowOffsetY = 1;
                this.ctx.shadowBlur = 2;
                this.ctx.strokeText(line1, textRadius, -fontSize * 0.5);
                this.ctx.fillText(line1, textRadius, -fontSize * 0.5);
                this.ctx.strokeText(line2, textRadius, fontSize * 0.5);
                this.ctx.fillText(line2, textRadius, fontSize * 0.5);
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        }

        this.ctx.restore();

        // Draw beautiful center circle with gradient
        const centerGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 45);
        centerGradient.addColorStop(0, '#ffffff');
        centerGradient.addColorStop(0.7, '#ffb6c1');
        centerGradient.addColorStop(1, '#e30052');
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
        this.ctx.fillStyle = centerGradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#e30052';
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = 'rgba(227, 0, 82, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Center heart with glow effect
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#e30052';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 8;
        this.ctx.strokeText('💕', centerX, centerY);
        this.ctx.fillText('💕', centerX, centerY);
        this.ctx.shadowBlur = 0;
    }
    
    // Helper function to darken colors
    darkenColor(color, factor) {
        if (color === '#ffffff') return '#f0f0f0';
        // Simple darkening for other colors
        const colors = {
            '#ff1493': '#cc1075',
            '#ffb6c1': '#cc919a',
            '#ff69b4': '#cc5490',
            '#ffe4e1': '#ccb5b3',
            '#ffc0cb': '#cc9aa2',
            '#fff0f5': '#ccc0c4',
            '#e30052': '#b50042'
        };
        return colors[color] || color;
    }

    drawEmptyWheel() {
        if (!this.ctx) return;
        
        const centerX = 300;
        const centerY = 300;
        const radius = 250;
        
        this.ctx.clearRect(0, 0, 600, 600);
        
        // Draw beautiful empty circle with romantic gradient
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#ffb6c1');
        gradient.addColorStop(1, '#e30052');
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#e30052';
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = 'rgba(227, 0, 82, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Draw message
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 22px "Poppins", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.shadowBlur = 3;
        this.ctx.fillText('Agrega opciones', centerX, centerY - 10);
        this.ctx.fillText('románticas 💕', centerX, centerY + 15);
        this.ctx.shadowBlur = 0;
        
        // Draw beautiful center
        const centerGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 45);
        centerGradient.addColorStop(0, '#ffffff');
        centerGradient.addColorStop(0.7, '#ffb6c1');
        centerGradient.addColorStop(1, '#e30052');
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
        this.ctx.fillStyle = centerGradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#e30052';
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = 'rgba(227, 0, 82, 0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#e30052';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 6;
        this.ctx.strokeText('💕', centerX, centerY);
        this.ctx.fillText('💕', centerX, centerY);
        this.ctx.shadowBlur = 0;
    }

    spinWheel() {
        if (this.isSpinning || this.options.length < 2) return;
        
        this.isSpinning = true;
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = true;
        spinBtn.textContent = '🎯 Girando... 💫';
        
        // Create spinning effect
        this.createSpinParticles();
        
        // Add pointer animation
        const pointer = document.querySelector('.wheel-pointer');
        pointer.classList.add('spinning');
        
        // Calculate random result
        const segments = this.options.length;
        const segmentAngle = 360 / segments;
        const randomSpins = 8 + Math.random() * 4; // More spins
        const randomSegment = Math.floor(Math.random() * segments);
        const finalRotation = 360 * randomSpins + (360 - randomSegment * segmentAngle - segmentAngle / 2);
        
        // Smooth animation with gradual deceleration
        const startTime = Date.now();
        const duration = 4000; // Optimal duration for smooth deceleration
        const startRotation = this.rotation;
        
        let lastSegment = -1;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth cubic-bezier easing for gradual deceleration
            const easeOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            this.rotation = startRotation + (finalRotation - startRotation) * easeOut;
            this.drawWheel();
            
            // Add tick sound effect when crossing segments
            const currentSegment = Math.floor(((360 - (this.rotation % 360)) / segmentAngle)) % segments;
            if (currentSegment !== lastSegment && progress > 0.1 && progress < 0.95) {
                this.playTickSound();
                lastSegment = currentSegment;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                pointer.classList.remove('spinning');
                this.showResult(randomSegment);
                this.isSpinning = false;
                spinBtn.disabled = false;
                spinBtn.textContent = '🎯 Girar Ruleta';
            }
        };
        
        animate();
    }

    showResult(segmentIndex) {
        const result = this.options[segmentIndex];
        const modal = document.getElementById('result-modal');
        const resultText = document.getElementById('result-text');
        
        resultText.textContent = result;
        modal.classList.add('show');
        
        // Create celebration particles
        this.createCelebrationEffect();
        
        // Play romantic sound (if available)
        this.playRomanticSound();
    }

    closeModal() {
        const modal = document.getElementById('result-modal');
        modal.classList.remove('show');
    }

    saveWheel() {
        if (this.options.length < 2) {
            alert('Agrega al menos 2 opciones para guardar la ruleta 💕');
            return;
        }
        
        const name = prompt('¿Cómo quieres llamar a tu ruleta romántica? 💗');
        if (!name) return;
        
        const wheel = {
            id: Date.now(),
            name: name,
            type: this.wheelType,
            options: [...this.options],
            createdAt: new Date().toLocaleDateString()
        };
        
        this.savedWheels.push(wheel);
        localStorage.setItem('romanticWheels', JSON.stringify(this.savedWheels));
        this.loadSavedWheels();
        
        alert('¡Ruleta guardada con amor! 💕✨');
        this.createParticleEffect('💾');
    }

    loadSavedWheels() {
        const grid = document.getElementById('wheels-grid');
        grid.innerHTML = '';
        
        if (this.savedWheels.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No tienes ruletas guardadas aún 💔</p>';
            return;
        }
        
        this.savedWheels.forEach(wheel => {
            const card = document.createElement('div');
            card.className = 'saved-wheel-card fade-in';
            
            const typeEmoji = wheel.type === 'mystery' ? '🎁' : wheel.type === 'surprise' ? '💗' : '🎀';
            
            card.innerHTML = `
                <div class="saved-wheel-title">${typeEmoji} ${wheel.name}</div>
                <div class="saved-wheel-info">${wheel.options.length} opciones • ${wheel.createdAt}</div>
                <div class="saved-wheel-actions">
                    <button class="load-wheel-btn" onclick="roulette.loadWheel(${wheel.id})">Cargar ✨</button>
                    <button class="delete-wheel-btn" onclick="roulette.deleteWheel(${wheel.id})">Eliminar 🗑️</button>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    loadWheel(wheelId) {
        const wheel = this.savedWheels.find(w => w.id === wheelId);
        if (!wheel) return;
        
        this.selectWheelType(wheel.type);
        this.options = [...wheel.options];
        this.updateDisplay();
        this.drawWheel();
        
        this.createParticleEffect('💕');
    }

    deleteWheel(wheelId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta ruleta? 💔')) return;
        
        this.savedWheels = this.savedWheels.filter(w => w.id !== wheelId);
        localStorage.setItem('romanticWheels', JSON.stringify(this.savedWheels));
        this.loadSavedWheels();
        
        this.createParticleEffect('💔');
    }

    showWheelSelection() {
        document.getElementById('wheel-selection').classList.remove('hidden');
        document.getElementById('wheel-creator').classList.add('hidden');
        this.wheelType = null;
        this.options = [];
    }

    // Particle System
    startParticleSystem() {
        setInterval(() => {
            this.createRandomParticle();
        }, 2000);
    }

    createRandomParticle() {
        const particles = ['💕', '✨', '💗', '🌟', '❤️', '💎'];
        const particle = particles[Math.floor(Math.random() * particles.length)];
        this.createParticleEffect(particle);
    }

    createParticleEffect(emoji) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emoji;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        
        document.getElementById('particles').appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 8000);
    }

    createSpinParticles() {
        const spinParticles = ['💫', '⭐', '✨', '🌟', '💥'];
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const particle = spinParticles[Math.floor(Math.random() * spinParticles.length)];
                this.createParticleEffect(particle);
            }, i * 100);
        }
    }

    createCelebrationEffect() {
        const celebrationParticles = ['🎉', '🎊', '💕', '✨', '🌟', '💗', '❤️', '💎'];
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = celebrationParticles[Math.floor(Math.random() * celebrationParticles.length)];
                this.createParticleEffect(particle);
            }, i * 50);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    playRomanticSound() {
        // Create a simple romantic tone using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a sweet romantic melody
            const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3 + index * 0.1);
                
                oscillator.start(audioContext.currentTime + index * 0.1);
                oscillator.stop(audioContext.currentTime + 0.4 + index * 0.1);
            });
        } catch (error) {
            console.log('Audio not supported');
        }
    }
    
    playTickSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Audio not supported');
        }
    }
    
    highlightCurrentSegment(segmentIndex) {
        // Add visual highlight effect
        this.currentHighlight = segmentIndex;
        setTimeout(() => {
            this.currentHighlight = null;
        }, 150);
    }
}

// Initialize the application
let roulette;
document.addEventListener('DOMContentLoaded', () => {
    roulette = new RomanticRoulette();
});