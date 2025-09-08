import { supabase, getUserSession, updateSpinningState, getActiveSessions, removeUserSession } from './src/supabase.js';

class WheelApp {
    constructor() {
        this.currentUser = null;
        this.userSession = null;
        this.realtimeChannel = null;
        this.canvas = null;
        this.ctx = null;
        this.isSpinning = false;
        this.currentAngle = 0;
        this.options = [];
        this.wheelType = null;
        this.colors = ['#e30070', '#ff6b9d', '#c44569', '#f8b500', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ff9a9e', '#fecfef'];
        this.lastResultShown = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando WheelApp...');
        
        // Verificar conexión Supabase
        if (!supabase) {
            console.error('❌ Supabase no configurado');
            alert('Error: Base de datos no configurada. Por favor configura Supabase.');
            return;
        }

        this.setupUI();
        this.createParticles();
        
        // Obtener nombre de usuario
        await this.getUsername();
        
        // Configurar Realtime
        await this.setupRealtimeSubscription();
        
        console.log('✅ WheelApp inicializado correctamente');
    }

    async getUsername() {
        let username = localStorage.getItem('wheelapp_username');
        
        if (!username) {
            username = prompt('¡Hola! 👋\n\nPor favor ingresa tu nombre para sincronizar con otros usuarios:');
            
            if (!username || username.trim() === '') {
                username = `Usuario_${Math.random().toString(36).substr(2, 6)}`;
            }
            
            username = username.trim();
            localStorage.setItem('wheelapp_username', username);
        }
        
        this.currentUser = username;
        console.log(`👤 Usuario: ${this.currentUser}`);
        
        // Crear/obtener sesión
        const { data: session, error } = await getUserSession(this.currentUser);
        if (error) {
            console.error('❌ Error creando sesión:', error);
            return;
        }
        
        this.userSession = session;
        console.log('✅ Sesión creada:', session.id);
    }

    async setupRealtimeSubscription() {
        if (!supabase) return;

        console.log('🔄 Configurando Realtime...');
        
        // Suscripción a cambios en tiempo real
        this.realtimeChannel = supabase
            .channel('wheel-sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'realtime_sessions'
            }, (payload) => {
                console.log('📡 Cambio recibido:', payload);
                this.handleRealtimeChange(payload);
            })
            .subscribe((status) => {
                console.log('🔗 Estado Realtime:', status);
            });
    }

    handleRealtimeChange(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        console.log(`🔄 Evento: ${eventType}`, newRecord);
        
        // Ignorar cambios de nuestra propia sesión
        if (newRecord && newRecord.id === this.userSession?.id) {
            console.log('🚫 Ignorando cambio propio');
            return;
        }
        
        // Manejar diferentes eventos
        if (eventType === 'UPDATE' && newRecord) {
            this.handleUserUpdate(newRecord);
        }
    }

    async handleUserUpdate(session) {
        console.log('👤 Actualizando desde otro usuario:', session);
        
        // Si alguien está girando
        if (session.is_spinning && !this.isSpinning) {
            console.log(`🎯 ${session.user_name} está girando...`);
            
            // Cambiar a la ruleta correspondiente
            if (session.wheel_type && session.wheel_type !== this.wheelType) {
                console.log(`🔄 Cambiando a ruleta: ${session.wheel_type}`);
                this.switchToWheel(session.wheel_type, session.current_options || []);
            }
            
            // Mostrar indicador de giro
            this.showSpinningIndicator(session.user_name);
            
            // Sincronizar rotación si está disponible
            if (session.wheel_rotation) {
                this.syncWheelRotation(session.wheel_rotation);
            }
        }
        
        // Si terminó de girar y hay resultado
        if (!session.is_spinning && session.last_result && 
            session.last_result !== this.lastResultShown) {
            console.log(`🎉 ${session.user_name} obtuvo: ${session.last_result}`);
            this.showOtherUserResult(session.user_name, session.last_result);
            this.lastResultShown = session.last_result;
        }
    }

    switchToWheel(wheelType, options = []) {
        console.log(`🔄 Cambiando a ruleta: ${wheelType}`);
        
        this.wheelType = wheelType;
        this.options = options;
        
        // Ocultar selección y mostrar creator
        document.getElementById('wheel-selection').classList.add('hidden');
        document.getElementById('wheel-creator').classList.remove('hidden');
        
        // Actualizar título
        const titles = {
            'mystery': 'Ruleta Misteriosa 🎁',
            'normal': 'Ruleta Normal 🎀',
            'surprise': 'Ruleta Sorpresa 💗'
        };
        
        document.getElementById('creator-title').textContent = titles[wheelType] || 'Ruleta';
        
        // Si es mystery o surprise, usar opciones predefinidas
        if (wheelType === 'mystery') {
            this.options = this.getMysteryOptions();
        } else if (wheelType === 'surprise') {
            this.options = this.getSurpriseOptions();
        }
        
        // Actualizar UI
        this.updateOptionsDisplay();
        this.drawWheel();
    }

    showSpinningIndicator(userName) {
        // Mostrar indicador en el botón
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) {
            spinBtn.textContent = `🎯 ${userName} está girando...`;
            spinBtn.disabled = true;
        }
        
        // Agregar clase de spinning al pointer
        const pointer = document.querySelector('.wheel-pointer');
        if (pointer) {
            pointer.classList.add('spinning');
        }
    }

    syncWheelRotation(rotation) {
        if (this.canvas) {
            // Aplicar rotación visual suave
            this.currentAngle = rotation;
            this.drawWheel();
        }
    }

    showOtherUserResult(userName, result) {
        console.log(`🎉 Mostrando resultado de ${userName}: ${result}`);
        
        // Crear y mostrar modal de resultado
        const modal = document.createElement('div');
        modal.className = 'result-notification';
        modal.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <h3>🎉 ¡Resultado!</h3>
                </div>
                <div class="notification-body">
                    <div class="notification-user">👤 ${userName}</div>
                    <div class="notification-result">${result}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Mostrar con animación
        setTimeout(() => modal.classList.add('show'), 100);
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }, 5000);
        
        // Resetear botón de spin
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) {
            spinBtn.textContent = '🎯 Girar Ruleta';
            spinBtn.disabled = false;
        }
        
        // Quitar clase spinning
        const pointer = document.querySelector('.wheel-pointer');
        if (pointer) {
            pointer.classList.remove('spinning');
        }
    }

    setupUI() {
        // Canvas setup
        this.canvas = document.getElementById('wheel-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }

        // Event listeners
        this.setupEventListeners();
        
        // Mostrar selección inicial
        document.getElementById('wheel-selection').classList.remove('hidden');
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const size = Math.min(container.offsetWidth - 40, 600);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        
        this.drawWheel();
    }

    setupEventListeners() {
        // Selección de tipo de ruleta
        document.querySelectorAll('.wheel-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const wheelType = card.dataset.type;
                this.selectWheelType(wheelType);
            });
        });

        // Botón volver
        document.querySelector('.back-btn')?.addEventListener('click', () => {
            this.showWheelSelection();
        });

        // Agregar opción
        document.getElementById('add-option')?.addEventListener('click', () => {
            this.addOption();
        });

        // Input enter
        document.getElementById('option-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addOption();
            }
        });

        // Botones de acción
        document.getElementById('clear-options')?.addEventListener('click', () => {
            this.clearOptions();
        });

        document.getElementById('save-wheel')?.addEventListener('click', () => {
            this.saveWheel();
        });

        // Botón girar
        document.getElementById('spin-btn')?.addEventListener('click', () => {
            this.spinWheel();
        });

        // Modal de resultado
        document.getElementById('spin-again')?.addEventListener('click', () => {
            this.closeResultModal();
        });

        document.getElementById('close-result')?.addEventListener('click', () => {
            this.closeResultModal();
        });

        // Redimensionar canvas
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    selectWheelType(type) {
        console.log(`🎯 Seleccionando ruleta: ${type}`);
        
        this.wheelType = type;
        
        // Configurar opciones según el tipo
        if (type === 'mystery') {
            this.options = this.getMysteryOptions();
            document.getElementById('options-panel').style.display = 'none';
        } else if (type === 'surprise') {
            this.options = this.getSurpriseOptions();
            document.getElementById('options-panel').style.display = 'none';
        } else {
            this.options = [];
            document.getElementById('options-panel').style.display = 'block';
        }
        
        // Actualizar título
        const titles = {
            'mystery': 'Ruleta Misteriosa 🎁',
            'normal': 'Ruleta Normal 🎀', 
            'surprise': 'Ruleta Sorpresa 💗'
        };
        
        document.getElementById('creator-title').textContent = titles[type];
        
        // Mostrar creator
        document.getElementById('wheel-selection').classList.add('hidden');
        document.getElementById('wheel-creator').classList.remove('hidden');
        
        // Actualizar UI
        this.updateOptionsDisplay();
        this.drawWheel();
    }

    getMysteryOptions() {
        return [
            'Opción 1 🎁', 'Opción 2 🎁', 'Opción 3 🎁', 'Opción 4 🎁',
            'Opción 5 🎁', 'Opción 6 🎁', 'Opción 7 🎁', 'Opción 8 🎁'
        ];
    }

    getSurpriseOptions() {
        return [
            'Envía una foto tuya 📸',
            'Cuenta tu mejor recuerdo juntos 💕',
            'Dile 3 cosas que amas de él/ella ❤️',
            'Canta una canción romántica 🎵',
            'Escribe un poema de amor 📝',
            'Planifica una cita virtual 🌹',
            'Comparte tu sueño más romántico 💭',
            'Di por qué eres afortunado/a de tenerle 🍀'
        ];
    }

    addOption() {
        const input = document.getElementById('option-input');
        const text = input.value.trim();
        
        if (text) {
            this.options.push(text);
            input.value = '';
            this.updateOptionsDisplay();
            this.drawWheel();
        }
    }

    updateOptionsDisplay() {
        const optionsList = document.getElementById('options-list');
        if (!optionsList) return;
        
        optionsList.innerHTML = '';
        
        this.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <span class="option-text">${option}</span>
                <button class="remove-option" onclick="wheelApp.removeOption(${index})">✕</button>
            `;
            optionsList.appendChild(optionDiv);
        });
    }

    removeOption(index) {
        this.options.splice(index, 1);
        this.updateOptionsDisplay();
        this.drawWheel();
    }

    clearOptions() {
        this.options = [];
        this.updateOptionsDisplay();
        this.drawWheel();
    }

    drawWheel() {
        if (!this.ctx || this.options.length === 0) {
            // Mostrar círculo vacío
            if (this.ctx) {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const radius = Math.min(centerX, centerY) - 10;
                
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#333';
                this.ctx.fill();
                this.ctx.strokeStyle = '#e30070';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
                
                // Texto
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '24px Poppins';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Agrega opciones', 0, 0);
                
                this.ctx.restore();
            }
            return;
        }
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const anglePerSegment = (2 * Math.PI) / this.options.length;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.currentAngle);
        
        this.options.forEach((option, index) => {
            const startAngle = index * anglePerSegment;
            const endAngle = startAngle + anglePerSegment;
            
            // Dibujar segmento
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, startAngle, endAngle);
            this.ctx.lineTo(0, 0);
            this.ctx.fillStyle = this.colors[index % this.colors.length];
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Dibujar texto
            this.ctx.save();
            this.ctx.rotate(startAngle + anglePerSegment / 2);
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `${Math.max(12, radius / 20)}px Poppins`;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 2;
            
            let displayText = option;
            if (this.wheelType === 'mystery') {
                displayText = `Opción ${index + 1} 🎁`;
            }
            
            this.ctx.fillText(displayText, radius * 0.3, 0);
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }

    async spinWheel() {
        if (this.isSpinning || this.options.length === 0) return;
        
        console.log('🎯 Iniciando giro...');
        this.isSpinning = true;
        
        // Actualizar estado en base de datos
        await updateSpinningState(
            this.userSession.id, 
            true, 
            this.currentAngle, 
            this.wheelType, 
            this.options
        );
        
        // UI feedback
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = true;
        spinBtn.textContent = '🌀 Girando...';
        
        // Animación de giro
        const spinAngle = Math.random() * 2 * Math.PI + 6 * Math.PI;
        const finalAngle = this.currentAngle + spinAngle;
        const duration = 3000 + Math.random() * 2000;
        
        const startTime = Date.now();
        const startAngle = this.currentAngle;
        
        const animate = async () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.currentAngle = startAngle + spinAngle * easeOut;
            
            // Enviar actualización de rotación
            if (Math.random() < 0.1) { // 10% de las veces para no saturar
                await updateSpinningState(
                    this.userSession.id, 
                    true, 
                    this.currentAngle, 
                    this.wheelType, 
                    this.options
                );
            }
            
            this.drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                await this.finishSpin(finalAngle);
            }
        };
        
        animate();
    }

    async finishSpin(finalAngle) {
        this.currentAngle = finalAngle;
        this.isSpinning = false;
        
        // Calcular resultado
        const normalizedAngle = (2 * Math.PI - (this.currentAngle % (2 * Math.PI))) % (2 * Math.PI);
        const segmentAngle = (2 * Math.PI) / this.options.length;
        const winningIndex = Math.floor(normalizedAngle / segmentAngle) % this.options.length;
        const result = this.options[winningIndex];
        
        console.log('🎉 Resultado:', result);
        
        // Actualizar estado final en base de datos
        await updateSpinningState(
            this.userSession.id, 
            false, 
            this.currentAngle, 
            this.wheelType, 
            this.options,
            result
        );
        
        // Mostrar resultado
        this.showResult(result);
        
        // Resetear botón
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = false;
        spinBtn.textContent = '🎯 Girar Ruleta';
    }

    showResult(result) {
        document.getElementById('result-text').textContent = result;
        document.getElementById('result-modal').classList.add('show');
    }

    closeResultModal() {
        document.getElementById('result-modal').classList.remove('show');
    }

    showWheelSelection() {
        document.getElementById('wheel-creator').classList.add('hidden');
        document.getElementById('wheel-selection').classList.remove('hidden');
        this.wheelType = null;
        this.options = [];
    }

    saveWheel() {
        if (this.options.length === 0) {
            alert('Agrega al menos una opción para guardar la ruleta');
            return;
        }
        
        const wheelName = prompt('Nombre para tu ruleta:');
        if (wheelName) {
            const savedWheels = JSON.parse(localStorage.getItem('saved_wheels') || '[]');
            const wheel = {
                id: Date.now(),
                name: wheelName,
                type: this.wheelType,
                options: [...this.options],
                created: new Date().toISOString()
            };
            
            savedWheels.push(wheel);
            localStorage.setItem('saved_wheels', JSON.stringify(savedWheels));
            alert('¡Ruleta guardada!');
        }
    }

    createParticles() {
        const particles = document.getElementById('particles');
        const particleEmojis = ['💕', '✨', '🌟', '💗', '❤️', '💖', '🎀', '🌸'];
        
        setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDuration = (3 + Math.random() * 3) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            
            particles.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 8000);
        }, 2000);
    }
}

// Inicializar aplicación
let wheelApp;
document.addEventListener('DOMContentLoaded', () => {
    wheelApp = new WheelApp();
});

// Limpiar al salir
window.addEventListener('beforeunload', async () => {
    if (wheelApp?.userSession) {
        await removeUserSession(wheelApp.userSession.id);
    }
});