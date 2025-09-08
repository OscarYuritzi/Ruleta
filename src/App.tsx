import React, { useState, useRef, useEffect } from 'react';
import { Heart, Plus, Trash2, RotateCcw, Save, ArrowLeft } from 'lucide-react';

interface WheelOption {
  id: number;
  text: string;
  color: string;
}

interface SavedWheel {
  id: number;
  name: string;
  type: string;
  options: WheelOption[];
  createdAt: string;
}

const ROMANTIC_COLORS = [
  '#ff6b9d', '#c44569', '#f8b500', '#ff9a9e',
  '#fecfef', '#fbb6ce', '#f093fb', '#f5576c',
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
];

const SURPRISE_CONTENT = [
  "¿Cuál es tu recuerdo más romántico conmigo? 💕",
  "¿Qué es lo que más extrañas de mí? 😢💗",
  "¿Cuál fue el momento en que supiste que me amabas? 😍",
  "¿Qué harías si estuviéramos juntos ahora mismo? 🤗",
  "Envía una foto tuya sonriendo ahora mismo 📸😊",
  "Graba un audio diciéndome 'te amo' en 3 idiomas 🗣️❤️",
  "Haz una videollamada de 5 minutos solo mirándonos 👀💕",
  "Escribe un poema corto sobre nosotros 📝💗",
  "Vamos a ver una película juntos por videollamada 🎬💕",
  "Cocinemos algo al mismo tiempo, cada uno en su casa 👨‍🍳👩‍🍳",
  "Intercambiemos 5 fotos de nuestra infancia 👶📱",
  "Enviémonos notas de voz diciendo por qué nos amamos 🎙️❤️"
];

function App() {
  const [currentView, setCurrentView] = useState<'selection' | 'creator'>('selection');
  const [wheelType, setWheelType] = useState<'mystery' | 'normal' | 'surprise'>('normal');
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [savedWheels, setSavedWheels] = useState<SavedWheel[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load saved wheels from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('romanticWheels');
    if (saved) {
      setSavedWheels(JSON.parse(saved));
    }
  }, []);

  // Draw wheel whenever options change
  useEffect(() => {
    drawWheel();
  }, [options, rotation]);

  const selectWheelType = (type: 'mystery' | 'normal' | 'surprise') => {
    setWheelType(type);
    setCurrentView('creator');
    setOptions([]);
    setResult(null);
    
    if (type === 'surprise') {
      loadSurpriseContent();
    }
  };

  const loadSurpriseContent = () => {
    const shuffled = [...SURPRISE_CONTENT].sort(() => Math.random() - 0.5);
    const selectedContent = shuffled.slice(0, 8).map((text, index) => ({
      id: Date.now() + index,
      text,
      color: ROMANTIC_COLORS[index % ROMANTIC_COLORS.length]
    }));
    setOptions(selectedContent);
  };

  const addOption = () => {
    if (newOption.trim() && options.length < 20) {
      const newWheelOption: WheelOption = {
        id: Date.now(),
        text: newOption.trim(),
        color: ROMANTIC_COLORS[options.length % ROMANTIC_COLORS.length]
      };
      setOptions([...options, newWheelOption]);
      setNewOption('');
    }
  };

  const removeOption = (id: number) => {
    setOptions(options.filter(option => option.id !== id));
  };

  const clearOptions = () => {
    setOptions([]);
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || options.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const segments = options.length;
    const anglePerSegment = (2 * Math.PI) / segments;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw segments
    options.forEach((option, index) => {
      const startAngle = index * anglePerSegment;
      const endAngle = (index + 1) * anglePerSegment;

      // Draw segment
      ctx.beginPath();
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.lineTo(0, 0);
      ctx.fillStyle = option.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text (only for normal wheel)
      if (wheelType !== 'mystery') {
        ctx.save();
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;

        const text = option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text;
        ctx.fillText(text, radius * 0.7, 5);
        ctx.restore();
      } else {
        // Draw mystery icon
        ctx.save();
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillText('🎁', radius * 0.7, 8);
        ctx.restore();
      }
    });

    ctx.restore();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setResult(null);

    const segments = options.length;
    const segmentAngle = 360 / segments;
    const randomSpins = 5 + Math.random() * 5;
    const randomSegment = Math.floor(Math.random() * segments);
    const finalRotation = 360 * randomSpins + (360 - randomSegment * segmentAngle - segmentAngle / 2);

    setRotation(finalRotation);

    setTimeout(() => {
      setResult(options[randomSegment].text);
      setIsSpinning(false);
    }, 3000);
  };

  const saveWheel = () => {
    if (options.length < 2) {
      alert('Agrega al menos 2 opciones para guardar la ruleta 💕');
      return;
    }

    const name = prompt('¿Cómo quieres llamar a tu ruleta romántica? 💗');
    if (!name) return;

    const wheel: SavedWheel = {
      id: Date.now(),
      name,
      type: wheelType,
      options: [...options],
      createdAt: new Date().toLocaleDateString()
    };

    const updatedWheels = [...savedWheels, wheel];
    setSavedWheels(updatedWheels);
    localStorage.setItem('romanticWheels', JSON.stringify(updatedWheels));
    alert('¡Ruleta guardada con amor! 💕✨');
  };

  const loadWheel = (wheel: SavedWheel) => {
    setWheelType(wheel.type as 'mystery' | 'normal' | 'surprise');
    setOptions(wheel.options);
    setCurrentView('creator');
    setResult(null);
  };

  const deleteWheel = (wheelId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta ruleta? 💔')) return;

    const updatedWheels = savedWheels.filter(w => w.id !== wheelId);
    setSavedWheels(updatedWheels);
    localStorage.setItem('romanticWheels', JSON.stringify(updatedWheels));
  };

  if (currentView === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-pink-300">
        {/* Floating particles background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              {['💕', '✨', '💗', '🌟', '❤️', '💎'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="relative z-10 bg-white/90 backdrop-blur-sm shadow-lg">
          <div className="container mx-auto px-4 py-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              🐶 Ruletas del Amor 💕✨
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Conexión romántica a través de la distancia 🌟
            </p>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">
              Elige tu Aventura Romántica 😍💗
            </h2>
          </div>

          {/* Wheel type cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div
              onClick={() => selectWheelType('mystery')}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-pink-300"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 animate-bounce">🎁</div>
                <h3 className="text-xl font-bold text-purple-700 mb-3">Ruleta Misteriosa</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sorpresas ocultas que solo se revelan al girar 🤩
                </p>
                <div className="text-2xl">❤️‍🔥💎🎆</div>
              </div>
            </div>

            <div
              onClick={() => selectWheelType('normal')}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-pink-300"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 animate-bounce">🎀</div>
                <h3 className="text-xl font-bold text-purple-700 mb-3">Ruleta Normal</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Crea tu ruleta personalizada con opciones visibles 💓
                </p>
                <div className="text-2xl">🌟✨🎉</div>
              </div>
            </div>

            <div
              onClick={() => selectWheelType('surprise')}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-pink-300 md:col-span-2 lg:col-span-1"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 animate-bounce">💗</div>
                <h3 className="text-xl font-bold text-purple-700 mb-3">Ruleta Sorpresa</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Contenido romántico predefinido para parejas 🫶🏽
                </p>
                <div className="text-2xl">🎇💕❤️</div>
              </div>
            </div>
          </div>

          {/* Saved wheels */}
          {savedWheels.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-purple-700 mb-6 text-center">
                Tus Ruletas Guardadas 💎
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedWheels.map((wheel) => (
                  <div
                    key={wheel.id}
                    className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-700 truncate">
                        {wheel.type === 'mystery' ? '🎁' : wheel.type === 'surprise' ? '💗' : '🎀'} {wheel.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {wheel.options.length} opciones • {wheel.createdAt}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadWheel(wheel)}
                        className="flex-1 bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200"
                      >
                        Cargar ✨
                      </button>
                      <button
                        onClick={() => deleteWheel(wheel.id)}
                        className="bg-gradient-to-r from-pink-400 to-red-400 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all duration-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-pink-300">
      {/* Floating particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            {['💕', '✨', '💗', '🌟', '❤️', '💎'][Math.floor(Math.random() * 6)]}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('selection')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-2 rounded-full hover:shadow-lg transition-all duration-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              {wheelType === 'mystery' ? 'Ruleta Misteriosa 🎁✨' : 
               wheelType === 'surprise' ? 'Ruleta Sorpresa 💗🌟' : 
               'Ruleta Normal 🎀💕'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Options panel */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-purple-700 mb-4">
              Agregar Opciones 💕
            </h3>
            
            {wheelType !== 'surprise' && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                  placeholder="Escribe una opción romántica... 😍"
                  className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:outline-none text-sm"
                />
                <button
                  onClick={addOption}
                  disabled={!newOption.trim() || options.length >= 20}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] text-sm font-medium"
                >
                  <Plus size={16} className="mx-auto" />
                </button>
                <button
                  onClick={spinWheel}
                  disabled={isSpinning || options.length < 2}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] text-sm font-medium whitespace-nowrap"
                >
                  {isSpinning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Girando...</span>
                    </div>
                  ) : options.length < 2 ? (
                    'Agrega opciones'
                  ) : (
                    '🎯 Girar ruleta'
                  )}
                </button>
              </div>
            )}

            {wheelType === 'surprise' && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={spinWheel}
                  disabled={isSpinning || options.length < 2}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                >
                  {isSpinning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Girando...</span>
                    </div>
                  ) : (
                    '🎯 Girar ruleta'
                  )}
                </button>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-3 flex justify-between items-center"
                >
                  <span className="text-sm text-gray-700 flex-1 mr-2">
                    {wheelType === 'mystery' ? `Opción ${index + 1} 🎁` : option.text}
                  </span>
                  <button
                    onClick={() => removeOption(option.id)}
                    className="bg-pink-400 text-white p-1.5 rounded-lg hover:bg-pink-500 transition-colors duration-200 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearOptions}
                disabled={options.length === 0}
                className="flex-1 bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <RotateCcw size={16} className="inline mr-1" />
                Limpiar
              </button>
              <button
                onClick={saveWheel}
                disabled={options.length < 2}
                className="flex-1 bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Save size={16} className="inline mr-1" />
                Guardar
              </button>
            </div>
          </div>

          {/* Wheel panel */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col items-center">
              {/* Wheel container - Much larger size */}
              <div className="relative mb-6">
                {/* Pointer */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 text-5xl">
                  📍
                </div>
                
                {/* Canvas - Extra large sizing */}
                <canvas
                  ref={canvasRef}
                  className="rounded-full shadow-2xl border-8 border-white transition-transform duration-3000 ease-out block mx-auto"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    width: '600px',
                    height: '600px'
                  }}
                />
              </div>

              {/* Wheel info */}
              <div className="text-center text-sm text-gray-600">
                {options.length > 0 && (
                  <p>{options.length} opciones • {wheelType === 'mystery' ? 'Misteriosa' : wheelType === 'surprise' ? 'Sorpresa' : 'Normal'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center transform animate-pulse">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-purple-700 mb-4">¡Resultado!</h2>
            <p className="text-lg text-gray-700 mb-6 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-semibold">
              {result}
            </p>
            <div className="text-3xl mb-6">💕✨🌟💗</div>
            <div className="flex gap-3">
              <button
                onClick={() => setResult(null)}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
              >
                Cerrar ❤️
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  spinWheel();
                }}
                className="flex-1 bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
              >
                Girar de Nuevo 💫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;