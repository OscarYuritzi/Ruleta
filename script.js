import { supabase, getUserSession, updateSpinningState, getActiveSessions, removeUserSession } from './src/supabase.js';

// Global variables
let currentUser = null;
let currentCouple = null;
let currentUserSession = null;
let currentWheelType = null;
let currentOptions = [];
let isSpinning = false;
let wheelRotation = 0;
let realtimeChannel = null;
let lastProcessedResult = null;
let connectedPartners = [];
let partnerStatusElement = null;

// DOM Elements
const wheelSelection = document.getElementById('wheel-selection');
const wheelCreator = document.getElementById('wheel-creator');
const savedWheels = document.getElementById('saved-wheels');
const resultModal = document.getElementById('result-modal');

// Couple Connection Elements
let coupleConnectionScreen = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicación de ruletas...');
    createParticles();
    showCoupleConnection();
});

// Create couple connection screen
function showCoupleConnection() {
    console.log('👫 Mostrando pantalla de conexión de parejas');
    
    // Hide all main sections
    wheelSelection.classList.add('hidden');
    wheelCreator.classList.add('hidden');
    savedWheels.classList.add('hidden');
    
    // Create couple connection screen
    coupleConnectionScreen = document.createElement('section');
    coupleConnectionScreen.id = 'couple-connection';
    coupleConnectionScreen.className = 'couple-connection';
    coupleConnectionScreen.innerHTML = `
        <div class="connection-card">
            <div class="connection-header">
                <h2>💕 Conectar con tu Pareja</h2>
                <p>Ambos deben usar el mismo <strong>Nombre de Pareja</strong> para sincronizarse</p>
            </div>
            
            <div class="connection-form">
                <div class="input-group-vertical">
                    <label for="user-name">Tu Nombre:</label>
                    <input type="text" id="user-name" placeholder="Ej: María, Juan..." maxlength="20">
                </div>
                
                <div class="input-group-vertical">
                    <label for="couple-name">Nombre de Pareja (ambos deben usarlo):</label>
                    <input type="text" id="couple-name" placeholder="Ej: MariaYJuan, AmorEterno..." maxlength="30">
                </div>
                
                <button id="connect-couple" class="connect-btn">
                    <span class="btn-icon">💑</span>
                    Conectar con mi Pareja
                </button>
                
                <div class="connection-help">
                    <h4>💡 ¿Cómo funciona?</h4>
                    <ul>
                        <li><strong>Paso 1:</strong> Ambos escriben sus nombres individuales</li>
                        <li><strong>Paso 2:</strong> Ambos escriben el MISMO nombre de pareja</li>
                        <li><strong>Paso 3:</strong> ¡Se conectan automáticamente!</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    // Insert into main container
    const mainContainer = document.querySelector('.main-container .container');
    mainContainer.insertBefore(coupleConnectionScreen, wheelSelection);
    
    // Create partner status element
    createPartnerStatusElement();
    
    // Add event listeners
    document.getElementById('connect-couple').addEventListener('click', connectCouple);
    document.getElementById('user-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('couple-name').focus();
        }
    });
    document.getElementById('couple-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connectCouple();
        }
    });
}

// Connect couple function
async function connectCouple() {
    const userName = document.getElementById('user-name').value.trim();
    const coupleName = document.getElementById('couple-name').value.trim();
    const connectBtn = document.getElementById('connect-couple');
    
    if (!userName || !coupleName) {
        alert('❌ Por favor completa ambos campos');
        return;
    }
    
    if (userName.length < 2) {
        alert('❌ Tu nombre debe tener al menos 2 caracteres');
        return;
    }
    
    if (coupleName.length < 3) {
        alert('❌ El nombre de pareja debe tener al menos 3 caracteres');
        return;
    }
    
    // Show loading state
    connectBtn.innerHTML = '<span class="btn-icon">⏳</span> Conectando...';
    connectBtn.disabled = true;
    
    try {
        console.log(`👤 Conectando usuario: ${userName} con pareja: ${coupleName}`);
        
        // Create user session with couple name
        const { data: session, error } = await createCoupleSession(userName, coupleName);
        
        if (error) {
            console.error('❌ Error creando sesión:', error);
            alert('❌ Error conectando. Inténtalo de nuevo.');
            return;
        }
        
        // Store user info
        currentUser = userName;
        currentCouple = coupleName;
        currentUserSession = session;
        
        console.log(`✅ Sesión creada exitosamente:`, session);
        
        // Setup realtime subscription
        await setupRealtimeSubscription();
        
        // Small delay to ensure subscription is active
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for existing partners and notify
        await checkExistingPartners();
        
        // Hide connection screen and show main app
        coupleConnectionScreen.classList.add('hidden');
        wheelSelection.classList.remove('hidden');
        savedWheels.classList.remove('hidden');
        
        // Initialize the main app
        initializeMainApp();
        
        // Show success message
        showSuccessNotification(`💕 ¡Conectado como ${userName}!`);
        
    } catch (error) {
        console.error('❌ Error general:', error);
        alert('❌ Error conectando. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
        // Restore button state
        connectBtn.innerHTML = '<span class="btn-icon">💑</span> Conectar con mi Pareja';
        connectBtn.disabled = false;
    }
}

// Create couple session with Supabase
async function createCoupleSession(userName, coupleName) {
    if (!supabase) {
        return { data: null, error: new Error('Supabase not configured') };
    }
    
    try {
        // Check if user already has an active session in this couple
        const { data: existingSessions, error: fetchError } = await supabase
            .from('realtime_sessions')
            .select('*')
            .eq('user_name', userName)
            .eq('couple_name', coupleName)
            .limit(1);
        
        if (existingSessions && existingSessions.length > 0 && !fetchError) {
            const existingSession = existingSessions[0];
            // Update last activity
            const { data, error } = await supabase
                .from('realtime_sessions')
                .update({ last_activity: new Date().toISOString() })
                .eq('id', existingSession.id)
                .select()
                .single();
            
            return { data, error };
        }
        
        // Create new session
        const { data, error } = await supabase
            .from('realtime_sessions')
            .insert([{
                user_name: userName,
                couple_name: coupleName,
                last_activity: new Date().toISOString()
            }])
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error creating couple session:', error);
        return { data: null, error };
    }
}

// Setup realtime subscription for couple
async function setupRealtimeSubscription() {
    if (!supabase || !currentCouple) return;
    
    console.log(`🔔 Configurando suscripción en tiempo real para pareja: ${currentCouple}`);
    
    // Remove existing subscription if any
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }
    
    // Create new subscription for this couple
    realtimeChannel = supabase
        .channel(`couple-${currentCouple}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'realtime_sessions',
                filter: `couple_name=eq.${currentCouple}`
            },
            (payload) => {
                console.log('🔄 Cambio detectado en pareja:', payload);
                handleRealtimeUpdate(payload);
            }
        )
        .subscribe();
    
    console.log(`✅ Suscripción configurada para pareja: ${currentCouple}`);
}

// Check for existing partners in the couple
async function checkExistingPartners() {
    if (!supabase || !currentCouple) return;
    
    try {
        const { data: sessions, error } = await supabase
            .from('realtime_sessions')
            .select('*')
            .eq('couple_name', currentCouple)
            .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString());
        
        if (!error && sessions && sessions.length > 0) {
            // Filter out current user and get partners
            connectedPartners = sessions
                .filter(s => s.user_name !== currentUser)
                .map(s => s.user_name);
            
            updatePartnerStatus();
            
            // Show notification for each existing partner
            connectedPartners.forEach(partnerName => {
                showPartnerConnectionNotification(partnerName, 'already_connected');
            });
        }
    } catch (error) {
        console.error('Error checking existing partners:', error);
    }
}

// Create partner status element
function createPartnerStatusElement() {
    partnerStatusElement = document.createElement('div');
    partnerStatusElement.className = 'partner-status hidden';
    partnerStatusElement.innerHTML = `
        <div class="partner-status-content">
            <span class="partner-icon">👤</span>
            <span class="partner-text">Esperando a tu pareja...</span>
        </div>
    `;
    
    const mainContainer = document.querySelector('.main-container .container');
    mainContainer.insertBefore(partnerStatusElement, wheelSelection);
}

// Update partner status display
function updatePartnerStatus() {
    if (!partnerStatusElement) return;
    
    if (connectedPartners.length > 0) {
        partnerStatusElement.innerHTML = `
            <div class="partner-status-content connected">
                <span class="partner-icon">💕</span>
                <span class="partner-text">Conectado con: ${connectedPartners.join(', ')}</span>
                <span class="partner-indicator">🟢</span>
            </div>
        `;
        partnerStatusElement.classList.remove('hidden');
    } else {
        partnerStatusElement.innerHTML = `
            <div class="partner-status-content">
                <span class="partner-icon">👤</span>
                <span class="partner-text">Esperando a tu pareja...</span>
                <span class="partner-indicator">🔴</span>
            </div>
        `;
        partnerStatusElement.classList.remove('hidden');
    }
}

// Show partner connection notification
function showPartnerConnectionNotification(partnerName, type) {
    let message = '';
    let bgColor = '';
    
    switch(type) {
        case 'joining':
            message = `💕 Tu pareja ${partnerName} se está uniendo`;
            bgColor = 'linear-gradient(45deg, #00d2d3, #0984e3)';
            break;
        case 'already_connected':
            message = `💖 Tu pareja ${partnerName} ya está en la sala`;
            bgColor = 'linear-gradient(45deg, #00b894, #00cec9)';
            break;
        case 'disconnected':
            message = `💔 Tu pareja ${partnerName} se ha desconectado`;
            bgColor = 'linear-gradient(45deg, #e17055, #fdcb6e)';
            break;
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideInFromRight 0.5s ease-out;
        max-width: 300px;
        text-align: center;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.remove();
    }, 4000);
}
// Handle realtime updates
function handleRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`📡 Evento: ${eventType}`, { newRecord, oldRecord });
    
    // Skip our own updates
    if (newRecord && newRecord.user_name === currentUser) {
        console.log('🔄 Ignorando mi propia actualización');
        return;
    }
    
    // Handle partner connection/disconnection
    if (eventType === 'INSERT' && newRecord && newRecord.user_name !== currentUser) {
        console.log(`👋 Nuevo partner conectado: ${newRecord.user_name}`);
        if (!connectedPartners.includes(newRecord.user_name)) {
            connectedPartners.push(newRecord.user_name);
            updatePartnerStatus();
            showPartnerConnectionNotification(newRecord.user_name, 'joining');
            
            // Update our session to trigger partner's status update
            if (currentUserSession) {
                updateSpinningState(
                    currentUserSession.id,
                    false,
                    wheelRotation,
                    currentWheelType,
                    currentOptions
                );
            }
        }
    }
    
    if (eventType === 'DELETE' && oldRecord && oldRecord.user_name !== currentUser) {
        console.log(`👋 Partner desconectado: ${oldRecord.user_name}`);
        connectedPartners = connectedPartners.filter(name => name !== oldRecord.user_name);
        updatePartnerStatus();
        showPartnerConnectionNotification(oldRecord.user_name, 'disconnected');
    }
    
    if (eventType === 'UPDATE' && newRecord) {
        // Handle partner activity updates
        if (newRecord.user_name !== currentUser) {
            // Update partners list if partner is active
            const isPartnerActive = new Date(newRecord.last_activity) > new Date(Date.now() - 5 * 60 * 1000);
            const isInPartnersList = connectedPartners.includes(newRecord.user_name);
            
            if (isPartnerActive && !isInPartnersList) {
                connectedPartners.push(newRecord.user_name);
                updatePartnerStatus();
                showPartnerConnectionNotification(newRecord.user_name, 'joining');
            } else if (!isPartnerActive && isInPartnersList) {
                connectedPartners = connectedPartners.filter(name => name !== newRecord.user_name);
                updatePartnerStatus();
                showPartnerConnectionNotification(newRecord.user_name, 'disconnected');
            }
        }
        
        // Partner started spinning
        if (newRecord.is_spinning && !oldRecord?.is_spinning && newRecord.user_name !== currentUser) {
            console.log(`🎯 ${newRecord.user_name} comenzó a girar`);
            syncPartnerSpin(newRecord);
        }
        
        // Partner finished spinning
        if (!newRecord.is_spinning && oldRecord?.is_spinning && newRecord.user_name !== currentUser) {
            console.log(`🎉 ${newRecord.user_name} terminó de girar:`, newRecord.last_result);
            syncPartnerResult(newRecord);
        }
        
        // Partner changed wheel type or options
        if (newRecord.user_name !== currentUser && 
            (newRecord.wheel_type !== oldRecord?.wheel_type || 
            JSON.stringify(newRecord.current_options) !== JSON.stringify(oldRecord?.current_options))) {
            console.log(`🔄 ${newRecord.user_name} cambió la ruleta`);
            syncPartnerWheel(newRecord);
        }
    }
}

// Sync partner spinning
function syncPartnerSpin(partnerSession) {
    const partnerName = partnerSession.user_name;
    
    // Switch to partner's wheel if different
    if (partnerSession.wheel_type !== currentWheelType) {
        switchToWheelType(partnerSession.wheel_type, partnerSession.current_options || []);
    }
    
    // Show spinning indicator
    showPartnerSpinning(partnerName);
    
    // Simulate wheel spinning
    if (wheelCreator && !wheelCreator.classList.contains('hidden')) {
        startWheelAnimation(partnerSession.wheel_rotation || 0);
    }
}

// Sync partner result
function syncPartnerResult(partnerSession) {
    const partnerName = partnerSession.user_name;
    const result = partnerSession.last_result;
    
    // Make sure we have a valid result
    if (!result || result.trim() === '') {
        console.log('⚠️ Resultado vacío, ignorando');
        return;
    }
    
    // Avoid showing the same result multiple times
    const resultKey = `${partnerName}-${result}-${partnerSession.id}-${partnerSession.last_activity}`;
    if (lastProcessedResult === resultKey) {
        console.log('🔄 Resultado ya procesado, ignorando');
        return;
    }
    
    lastProcessedResult = `${partnerName}-${result}-${partnerSession.id}`;
    
    // Hide spinning indicator
    hidePartnerSpinning();
    
    // Show partner result
    showPartnerResult(partnerName, result);
    
    console.log(`✅ Resultado sincronizado de ${partnerName}: ${result}`);
}

// Sync partner wheel
function syncPartnerWheel(partnerSession) {
    console.log(`🔄 Sincronizando ruleta de ${partnerSession.user_name}`);
    
    // Switch to partner's wheel type
    if (partnerSession.wheel_type && partnerSession.wheel_type !== currentWheelType) {
        switchToWheelType(partnerSession.wheel_type, partnerSession.current_options || []);
    }
    
    // Update options if it's a normal wheel
    if (partnerSession.wheel_type === 'normal' && partnerSession.current_options) {
        currentOptions = partnerSession.current_options;
        updateOptionsDisplay();
        drawWheel();
    }
}

// Show partner spinning indicator
function showPartnerSpinning(partnerName) {
    // Update spin button text
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        spinBtn.textContent = `🎯 ${partnerName} está girando...`;
        spinBtn.disabled = true;
    }
    
    // Add spinning class to pointer
    const wheelPointer = document.querySelector('.wheel-pointer');
    if (wheelPointer) {
        wheelPointer.classList.add('spinning');
    }
    
    console.log(`👀 Mostrando que ${partnerName} está girando`);
}

// Hide partner spinning indicator
function hidePartnerSpinning() {
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        spinBtn.textContent = '🎯 Girar Ruleta';
        spinBtn.disabled = false;
    }
    
    const wheelPointer = document.querySelector('.wheel-pointer');
    if (wheelPointer) {
        wheelPointer.classList.remove('spinning');
    }
    
    console.log('✅ Ocultando indicador de giro');
}

// Show partner result
function showPartnerResult(partnerName, result) {
    console.log(`🎉 Mostrando resultado de ${partnerName}: ${result}`);
    
    const resultText = document.getElementById('result-text');
    const resultModal = document.getElementById('result-modal');
    
    if (resultText && resultModal) {
        resultText.innerHTML = `
            <div style="margin-bottom: 15px; color: #e30070; font-size: 1.2rem;">
                💕 Resultado de tu pareja ${partnerName}:
            </div>
            <div style="font-size: 1.6rem; font-weight: bold; line-height: 1.4;">
                ${result}
            </div>
            <div style="margin-top: 20px; font-size: 1rem; color: #cc0066; font-style: italic;">
                ¡Tu pareja ha girado la ruleta! 🎯✨
            </div>
        `;
        
        resultModal.classList.add('show');
        
        // Auto-close after 10 seconds (más tiempo para leer)
        setTimeout(() => {
            resultModal.classList.remove('show');
        }, 10000);
    }
}

// Switch to wheel type
function switchToWheelType(wheelType, options = []) {
    console.log(`🔄 Cambiando a ruleta: ${wheelType}`, options);
    
    currentWheelType = wheelType;
    currentOptions = options;
    
    // Show wheel creator
    wheelSelection.classList.add('hidden');
    wheelCreator.classList.remove('hidden');
    
    // Update title
    const creatorTitle = document.getElementById('creator-title');
    const titleMap = {
        'mystery': 'Ruleta Misteriosa 🎁',
        'normal': 'Ruleta Normal 🎀',
        'surprise': 'Ruleta Sorpresa 💗'
    };
    creatorTitle.textContent = titleMap[wheelType] || 'Crear Ruleta';
    
    // Load appropriate wheel
    if (wheelType === 'mystery') {
        loadMysteryWheel();
    } else if (wheelType === 'surprise') {
        loadSurpriseWheel();
    } else {
        updateOptionsDisplay();
        drawWheel();
    }
}

// Initialize main app
function initializeMainApp() {
    console.log('🎮 Inicializando aplicación principal');
    setupEventListeners();
    loadSavedWheels();
}

// Setup event listeners
function setupEventListeners() {
    // Wheel type selection
    document.querySelectorAll('.wheel-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            selectWheelType(type);
        });
    });
    
    // Back button
    document.querySelector('.back-btn').addEventListener('click', () => {
        wheelCreator.classList.add('hidden');
        wheelSelection.classList.remove('hidden');
        currentWheelType = null;
        currentOptions = [];
    });
    
    // Add option
    document.getElementById('add-option').addEventListener('click', addOption);
    document.getElementById('option-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addOption();
        }
    });
    
    // Spin button
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    
    // Clear options
    document.getElementById('clear-options').addEventListener('click', clearOptions);
    
    // Save wheel
    document.getElementById('save-wheel').addEventListener('click', saveWheel);
    
    // Modal buttons
    document.getElementById('spin-again').addEventListener('click', () => {
        resultModal.classList.remove('show');
    });
    
    document.getElementById('close-result').addEventListener('click', () => {
        resultModal.classList.remove('show');
    });
}

// Select wheel type
async function selectWheelType(type) {
    console.log(`🎯 Seleccionando tipo de ruleta: ${type}`);
    
    currentWheelType = type;
    wheelSelection.classList.add('hidden');
    wheelCreator.classList.remove('hidden');
    
    // Update title
    const creatorTitle = document.getElementById('creator-title');
    const titleMap = {
        'mystery': 'Ruleta Misteriosa 🎁',
        'normal': 'Ruleta Normal 🎀', 
        'surprise': 'Ruleta Sorpresa 💗'
    };
    creatorTitle.textContent = titleMap[type] || 'Crear Ruleta';
    
    // Load appropriate wheel
    if (type === 'mystery') {
        loadMysteryWheel();
    } else if (type === 'surprise') {
        loadSurpriseWheel();
    } else {
        currentOptions = [];
        updateOptionsDisplay();
        drawWheel();
    }
    
    // Sync wheel type with partner
    if (currentUserSession) {
        await updateSpinningState(
            currentUserSession.id,
            false,
            0,
            type,
            currentOptions
        );
    }
}

// Load mystery wheel
function loadMysteryWheel() {
    const mysteryOptions = ['🎁', '💎', '🌟', '✨', '🎉', '💫', '🎊', '🎈'];
    currentOptions = mysteryOptions;
    updateOptionsDisplay();
    drawWheel();
    
    // Hide options panel for mystery wheel
    const optionsPanel = document.getElementById('options-panel');
    optionsPanel.style.display = 'none';
}

// Load surprise wheel
function loadSurpriseWheel() {
    const surpriseOptions = [
        'Envía una foto tuya sonriendo 😊',
        'Cuéntame tu recuerdo favorito de nosotros 💕',
        'Escríbeme una carta de amor ❤️',
        'Canta o dedícame una canción 🎵',
        'Dime 3 cosas que más te gustan de mí 😍',
        'Envía una foto de algo que te recuerde a mí 🌹',
        'Escribe un poema romántico 📝',
        'Dibuja algo para mí 🎨'
    ];
    currentOptions = surpriseOptions;
    updateOptionsDisplay();
    drawWheel();
    
    // Hide options panel for surprise wheel
    const optionsPanel = document.getElementById('options-panel');
    optionsPanel.style.display = 'none';
}

// Add option
async function addOption() {
    if (currentWheelType !== 'normal') return;
    
    const input = document.getElementById('option-input');
    const text = input.value.trim();
    
    if (text && !currentOptions.includes(text)) {
        currentOptions.push(text);
        input.value = '';
        updateOptionsDisplay();
        drawWheel();
        
        // Sync options with partner
        if (currentUserSession) {
            await updateSpinningState(
                currentUserSession.id,
                false,
                wheelRotation,
                currentWheelType,
                currentOptions
            );
        }
    }
}

// Update options display
function updateOptionsDisplay() {
    const optionsPanel = document.getElementById('options-panel');
    
    if (currentWheelType === 'normal') {
        optionsPanel.style.display = 'block';
        
        const optionsList = document.getElementById('options-list');
        optionsList.innerHTML = '';
        
        currentOptions.forEach((option, index) => {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            optionItem.innerHTML = `
                <span class="option-text">${option}</span>
                <button class="remove-option" data-index="${index}">🗑️</button>
            `;
            optionsList.appendChild(optionItem);
        });
        
        // Add remove listeners
        document.querySelectorAll('.remove-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                removeOption(index);
            });
        });
    }
}

// Remove option
async function removeOption(index) {
    if (currentWheelType !== 'normal') return;
    
    currentOptions.splice(index, 1);
    updateOptionsDisplay();
    drawWheel();
    
    // Sync options with partner
    if (currentUserSession) {
        await updateSpinningState(
            currentUserSession.id,
            false,
            wheelRotation,
            currentWheelType,
            currentOptions
        );
    }
}

// Clear options
async function clearOptions() {
    if (currentWheelType !== 'normal') return;
    
    currentOptions = [];
    updateOptionsDisplay();
    drawWheel();
    
    // Sync options with partner
    if (currentUserSession) {
        await updateSpinningState(
            currentUserSession.id,
            false,
            wheelRotation,
            currentWheelType,
            currentOptions
        );
    }
}

// Draw wheel
function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentOptions.length === 0) {
        // Draw empty wheel
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 50, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Agrega opciones', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 50;
    const anglePerSegment = (2 * Math.PI) / currentOptions.length;
    
    // Colors for segments
    const colors = [
        '#ff6b9d', '#c44569', '#f8b500', '#feca57',
        '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3',
        '#ff9f43', '#10ac84', '#ee5a6f', '#60a3bc'
    ];
    
    // Draw segments
    currentOptions.forEach((option, index) => {
        const startAngle = index * anglePerSegment + wheelRotation;
        const endAngle = startAngle + anglePerSegment;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        const textAngle = startAngle + anglePerSegment / 2;
        const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
        const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
        
        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // For surprise wheel, show only emojis on the wheel (for mystery)
        // For other wheels, show full text (truncated if needed)
        let displayText = option;
        if (currentWheelType === 'surprise') {
            // Extract emoji from the option text
            const emojiMatch = option.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
            displayText = emojiMatch ? emojiMatch[0] : '🎁';
        } else {
            displayText = option.length > 15 ? option.substring(0, 15) + '...' : option;
        }
        
        ctx.fillText(displayText, 0, 0);
        
        ctx.restore();
    });
}

// Spin wheel
async function spinWheel() {
    if (currentOptions.length === 0 || isSpinning) return;
    
    console.log(`🎯 ${currentUser} girando ruleta tipo: ${currentWheelType}`);
    
    isSpinning = true;
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.textContent = '🎯 Girando...';
    spinBtn.disabled = true;
    
    // Notify partner that we're spinning
    if (currentUserSession) {
        await updateSpinningState(
            currentUserSession.id,
            true,
            wheelRotation,
            currentWheelType,
            currentOptions
        );
    }
    
    // Spin animation
    const spins = 5 + Math.random() * 5;
    const finalRotation = wheelRotation + spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    
    startWheelAnimation(finalRotation);
    
    // Wait for spin to complete
    setTimeout(async () => {
        wheelRotation = finalRotation % (2 * Math.PI);
        
        // Calculate result
        const segmentAngle = (2 * Math.PI) / currentOptions.length;
        const normalizedAngle = (2 * Math.PI - (wheelRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % currentOptions.length;
        const result = currentOptions[segmentIndex];
        
        console.log(`🎉 Resultado: ${result}`);
        console.log(`📤 Enviando resultado a pareja: ${result}`);
        
        isSpinning = false;
        spinBtn.textContent = '🎯 Girar Ruleta';
        spinBtn.disabled = false;
        
        // Notify partner with result
        if (currentUserSession) {
            const updateResult = await updateSpinningState(
                currentUserSession.id,
                false,
                wheelRotation,
                currentWheelType,
                currentOptions,
                result
            );
            
            if (updateResult.error) {
                console.error('❌ Error enviando resultado a pareja:', updateResult.error);
            } else {
                console.log('✅ Resultado enviado exitosamente a pareja');
            }
        }
        
        // Show result
        showResult(result);
        
    }, 3000);
}

// Start wheel animation
function startWheelAnimation(targetRotation) {
    const canvas = document.getElementById('wheel-canvas');
    const startRotation = wheelRotation;
    const rotationDiff = targetRotation - startRotation;
    const duration = 3000;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        wheelRotation = startRotation + rotationDiff * easeOut;
        drawWheel();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Show result
function showResult(result) {
    const resultText = document.getElementById('result-text');
    const resultModal = document.getElementById('result-modal');
    
    resultText.innerHTML = `
        <div style="margin-bottom: 15px; color: #e30070; font-size: 1.2rem;">
            🎯 Tu resultado:
        </div>
        <div style="font-size: 1.6rem; font-weight: bold; line-height: 1.4;">
            ${result}
        </div>
    `;
    
    resultModal.classList.add('show');
}

// Show success notification
function showSuccessNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #e30070, #cc0066);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 5px 20px rgba(227, 0, 112, 0.3);
        animation: slideInFromRight 0.5s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation keyframes if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInFromRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Save wheel (placeholder)
function saveWheel() {
    if (currentOptions.length === 0) {
        alert('❌ No hay opciones para guardar');
        return;
    }
    
    const wheelName = prompt('💾 Nombre para esta ruleta:');
    if (wheelName) {
        // Save to localStorage (could be enhanced to use Supabase)
        const savedWheels = JSON.parse(localStorage.getItem('savedWheels') || '[]');
        savedWheels.push({
            name: wheelName,
            type: currentWheelType,
            options: [...currentOptions],
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('savedWheels', JSON.stringify(savedWheels));
        
        loadSavedWheels();
        showSuccessNotification(`💾 Ruleta "${wheelName}" guardada`);
    }
}

// Load saved wheels (placeholder)
function loadSavedWheels() {
    const wheelsGrid = document.getElementById('wheels-grid');
    const savedWheels = JSON.parse(localStorage.getItem('savedWheels') || '[]');
    
    if (savedWheels.length === 0) {
        wheelsGrid.innerHTML = '<p style="text-align: center; color: #cccccc;">No hay ruletas guardadas</p>';
        return;
    }
    
    wheelsGrid.innerHTML = savedWheels.map((wheel, index) => `
        <div class="saved-wheel-card">
            <div class="saved-wheel-title">${wheel.name}</div>
            <div class="saved-wheel-info">${wheel.options.length} opciones</div>
            <div class="saved-wheel-actions">
                <button class="load-wheel-btn" data-index="${index}">Cargar</button>
                <button class="delete-wheel-btn" data-index="${index}">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.load-wheel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            loadSavedWheel(savedWheels[index]);
        });
    });
    
    document.querySelectorAll('.delete-wheel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteSavedWheel(index);
        });
    });
}

// Load saved wheel
async function loadSavedWheel(wheel) {
    currentWheelType = wheel.type;
    currentOptions = [...wheel.options];
    
    // Switch to wheel creator
    wheelSelection.classList.add('hidden');
    wheelCreator.classList.remove('hidden');
    
    // Update title
    const creatorTitle = document.getElementById('creator-title');
    const titleMap = {
        'mystery': 'Ruleta Misteriosa 🎁',
        'normal': 'Ruleta Normal 🎀',
        'surprise': 'Ruleta Sorpresa 💗'
    };
    creatorTitle.textContent = titleMap[wheel.type] || 'Crear Ruleta';
    
    // Show options panel only for normal wheels
    const optionsPanel = document.getElementById('options-panel');
    optionsPanel.style.display = wheel.type === 'normal' ? 'block' : 'none';
    
    updateOptionsDisplay();
    drawWheel();
    
    // Sync with partner
    if (currentUserSession) {
        await updateSpinningState(
            currentUserSession.id,
            false,
            0,
            wheel.type,
            wheel.options
        );
    }
    
    showSuccessNotification(`✅ Ruleta "${wheel.name}" cargada`);
}

// Delete saved wheel
function deleteSavedWheel(index) {
    const savedWheels = JSON.parse(localStorage.getItem('savedWheels') || '[]');
    const wheelName = savedWheels[index].name;
    
    if (confirm(`¿Eliminar la ruleta "${wheelName}"?`)) {
        savedWheels.splice(index, 1);
        localStorage.setItem('savedWheels', JSON.stringify(savedWheels));
        loadSavedWheels();
        showSuccessNotification(`🗑️ Ruleta "${wheelName}" eliminada`);
    }
}

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const emojis = ['💕', '💗', '💖', '💘', '💝', '💟', '💌', '💒', '🌹', '❤️', '💋', '😍', '🥰', '😘'];
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 3 + 6) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        particlesContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 8000);
    }
    
    // Create initial particles
    for (let i = 0; i < 10; i++) {
        setTimeout(createParticle, i * 1000);
    }
    
    // Create new particles continuously
    setInterval(createParticle, 2000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    if (currentUserSession && supabase) {
        await removeUserSession(currentUserSession.id);
    }
    
    if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
    }
});