import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Paperclip, Settings, X, Terminal, Cpu, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types & Services
import { Message, Sender, OrionState, DeviceContext, OrionSettings } from './types';
import { DEFAULT_SETTINGS, INITIAL_GREETING } from './constants';
import { generateOrionResponse } from './services/geminiService';

// Components
import OrionOrb from './components/OrionOrb';
import SystemHUD from './components/SystemHUD';

const App: React.FC = () => {
  // --- State Management ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [orionState, setOrionState] = useState<OrionState>(OrionState.Idle);
  const [settings, setSettings] = useState<OrionSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  
  // Device Context State
  const [deviceContext, setDeviceContext] = useState<DeviceContext>({
    batteryLevel: null,
    isCharging: false,
    isOnline: navigator.onLine,
    platform: navigator.platform,
    currentTime: new Date().toLocaleString(),
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Initialize System
  useEffect(() => {
    // Add initial greeting after a short delay to simulate boot
    setTimeout(() => {
      setMessages([{
        id: 'init-1',
        text: INITIAL_GREETING,
        sender: Sender.Orion,
        timestamp: new Date()
      }]);
    }, 1000);

    // Context Clock Tick
    const clockInterval = setInterval(() => {
      setDeviceContext(prev => ({ ...prev, currentTime: new Date().toLocaleString() }));
    }, 60000);

    // Online Status Listeners
    const handleOnline = () => setDeviceContext(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setDeviceContext(prev => ({ ...prev, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API (Experimental)
    if ('getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then(battery => {
        const updateBattery = () => {
          setDeviceContext(prev => ({
            ...prev,
            batteryLevel: battery.level,
            isCharging: battery.charging
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }

    return () => {
      clearInterval(clockInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, orionState]);


  // --- Handlers ---

  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && attachedImages.length === 0) || orionState === OrionState.Thinking) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.User,
      timestamp: new Date(),
      attachments: [...attachedImages]
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setAttachedImages([]);
    setOrionState(OrionState.Thinking);

    try {
      const responseText = await generateOrionResponse(
        messages, 
        input, // pass the raw input before clearing for context
        attachedImages, 
        deviceContext, 
        settings
      );

      // Simulate "Typing/Speaking" delay for organic feel
      setOrionState(OrionState.Responding);
      
      setTimeout(() => {
        const newOrionMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: Sender.Orion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newOrionMessage]);
        setOrionState(OrionState.Idle);
      }, 800); // Small artificial delay for visual feedback

    } catch (error) {
      setOrionState(OrionState.Error);
      setTimeout(() => setOrionState(OrionState.Idle), 3000);
    }
  }, [input, attachedImages, messages, deviceContext, settings, orionState]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Render Helpers ---

  const renderMessage = (msg: Message) => {
    const isOrion = msg.sender === Sender.Orion;
    return (
      <motion.div 
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex w-full mb-6 ${isOrion ? 'justify-start' : 'justify-end'}`}
      >
        <div className={`max-w-[80%] ${isOrion ? 'text-slate-200' : 'text-slate-900 bg-orion-highlight/90'} rounded-2xl p-4 shadow-lg backdrop-blur-sm ${isOrion ? 'bg-slate-800/50 border border-slate-700' : ''}`}>
          
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto">
              {msg.attachments.map((img, idx) => (
                <img key={idx} src={img} alt="attachment" className="h-24 rounded-lg border border-white/20" />
              ))}
            </div>
          )}

          <div className="prose prose-invert text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
            {msg.text}
          </div>
          <div className={`text-[10px] mt-2 font-mono opacity-50 ${isOrion ? 'text-left' : 'text-right'}`}>
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-orion-base flex flex-col items-center overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-orion-base to-black opacity-80 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orion-highlight to-transparent opacity-20" />

      {/* Header / HUD */}
      <header className="z-10 w-full p-6 flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-xl font-mono tracking-[0.2em] font-bold text-white opacity-90">ORION</h1>
          <span className="text-[10px] text-orion-highlight font-mono tracking-widest opacity-60">SYSTEM V1.0-ALPHA</span>
        </div>
        <div className="hidden md:block">
           <SystemHUD context={deviceContext} />
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl flex flex-col relative z-10 px-4">
        
        {/* The Core Entity (Orb) */}
        <div className="flex-shrink-0 flex justify-center py-4">
          <OrionOrb state={orionState} intensity={settings.visualIntensity} />
        </div>

        {/* Chat / Output Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto pr-2 scroll-smooth fade-mask"
        >
          <div className="min-h-full flex flex-col justify-end pb-4">
            {messages.map(renderMessage)}
            {orionState === OrionState.Thinking && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center space-x-2 text-orion-accent text-xs font-mono ml-4 mb-4"
              >
                <Cpu size={12} className="animate-spin" />
                <span>PROCESSING CONTEXT...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full pb-8 pt-4">
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden transition-all focus-within:border-orion-highlight/50 focus-within:shadow-orion-highlight/10">
            
            {attachedImages.length > 0 && (
               <div className="flex gap-2 p-3 bg-slate-950/50 border-b border-slate-800">
                 {attachedImages.map((img, i) => (
                   <div key={i} className="relative group">
                     <img src={img} className="h-12 w-12 rounded object-cover opacity-70" />
                     <button 
                       onClick={() => setAttachedImages([])}
                       className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <X size={10} />
                     </button>
                   </div>
                 ))}
               </div>
            )}

            <div className="flex items-end p-4 gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Paperclip size={20} />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Command operational entity..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-600 resize-none h-6 max-h-32 py-2 font-mono text-sm overflow-hidden"
                style={{ height: 'auto', minHeight: '24px' }}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />

              <button 
                onClick={handleSendMessage}
                disabled={(!input.trim() && attachedImages.length === 0) || orionState === OrionState.Thinking}
                className="p-2 bg-orion-highlight/10 text-orion-highlight hover:bg-orion-highlight hover:text-slate-900 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-orion-highlight"
              >
                <Send size={20} />
              </button>
            </div>
            
            {/* Input Decorator Line */}
            <div className={`h-[2px] w-full bg-gradient-to-r from-transparent via-orion-highlight to-transparent transition-opacity duration-500 ${orionState === OrionState.Thinking ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
          </div>
          
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-600 font-mono">
               ORION COGNITIVE LAYER ACTIVE • SECURE CONNECTION
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-orion-accent" />
                  CONFIGURATION
                </h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Personality Config */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">Personality Matrix</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['professional', 'friendly', 'direct'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSettings(prev => ({ ...prev, personality: p as any }))}
                        className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                          settings.personality === p 
                            ? 'bg-orion-highlight/20 border-orion-highlight text-orion-highlight' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Config */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">Visual Intensity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['minimal', 'balanced', 'immersive'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setSettings(prev => ({ ...prev, visualIntensity: v as any }))}
                        className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                          settings.visualIntensity === v 
                            ? 'bg-orion-accent/20 border-orion-accent text-orion-accent' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Status Dump */}
                <div className="bg-slate-950 rounded-lg p-4 font-mono text-[10px] text-slate-500 overflow-hidden border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-slate-300">
                     <Terminal size={12} />
                     <span>SYSTEM DIAGNOSTICS</span>
                  </div>
                  <pre>
{`PLATFORM: ${deviceContext.platform}
BATTERY: ${deviceContext.batteryLevel ? (deviceContext.batteryLevel * 100).toFixed(0) + '%' : 'N/A'}
STATUS: ${deviceContext.isOnline ? 'ONLINE' : 'DISCONNECTED'}
SESSION_ID: ${Date.now().toString().slice(-6)}`}
                  </pre>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
