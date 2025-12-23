
import React, { useState, useEffect, useRef } from 'react';
import { AppState, UserProfile, Message } from './types';
import { COLORS, ICONS } from './constants';
import Radar from './components/Radar';
import { getGeminiResponse, simulateLocalParticipants } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.SETUP);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [location, setLocation] = useState<string>("Locating...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Daily reset check
  useEffect(() => {
    const saved = localStorage.getItem('radioactive_profile');
    const today = new Date().toISOString().split('T')[0];

    if (saved) {
      const parsed: UserProfile = JSON.parse(saved);
      if (parsed.lastLoginDate === today) {
        setProfile(parsed);
        setState(AppState.SCANNING);
      } else {
        localStorage.removeItem('radioactive_profile');
      }
    }
  }, []);

  // Location logic
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // In a real app, we'd reverse geocode or geohash. 
          // For demo, we'll just say the general vicinity.
          const { latitude, longitude } = pos.coords;
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => setLocation("Mesh Disconnected")
      );
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nickname = formData.get('nickname') as string;
    if (!nickname) return;

    const newProfile: UserProfile = {
      nickname,
      lastLoginDate: new Date().toISOString().split('T')[0],
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    localStorage.setItem('radioactive_profile', JSON.stringify(newProfile));
    setProfile(newProfile);
    setState(AppState.SCANNING);
  };

  const handleScanComplete = async () => {
    setState(AppState.CHAT);
    
    // Simulate initial messages from nearby participants
    const participants = await simulateLocalParticipants(location);
    const initialMsgs = participants.map((p: any, idx: number) => ({
      id: `p-${idx}`,
      sender: p.nickname,
      text: p.status,
      timestamp: Date.now() - (idx * 60000),
      distance: p.distance,
      isAi: true
    }));
    setMessages(initialMsgs.sort((a: any, b: any) => a.timestamp - b.timestamp));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: profile.nickname,
      text: inputText,
      timestamp: Date.now(),
      distance: 0
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.isAi ? 'model' : 'user', text: m.text }));
    const aiResponse = await getGeminiResponse(inputText, location, history);

    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: `ai-${Date.now()}`,
      sender: "PROXIMA (Local)",
      text: aiResponse,
      timestamp: Date.now(),
      isAi: true,
      distance: 5
    }]);
  };

  if (state === AppState.SETUP) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
        <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl">
              <ICONS.Radio className="w-12 h-12 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">RADIOACTIVE</h1>
          <p className="text-zinc-500 text-center mb-8 text-sm">
            Temporary proximity mesh. Nicknames reset at midnight. No logs. No accounts.
          </p>
          
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase mb-2 ml-1">Identity for today</label>
              <input 
                name="nickname"
                type="text" 
                maxLength={20}
                required
                placeholder="Enter a nickname..."
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Enter Mesh <ICONS.Scan className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center gap-3 text-zinc-600">
            <ICONS.MapPin className="w-4 h-4" />
            <span className="text-xs font-mono">{location}</span>
          </div>
        </div>
      </div>
    );
  }

  if (state === AppState.SCANNING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 space-y-12">
        <Radar scanning={true} onScanComplete={handleScanComplete} />
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-emerald-400">Pulsing local area...</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">
            Looking for nearby radioactive signals in sector <span className="font-mono text-zinc-400">{location}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white max-w-2xl mx-auto border-x border-zinc-800 shadow-2xl">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800 flex items-center justify-between backdrop-blur-md bg-zinc-950/80 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ICONS.Radio className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight leading-none mb-1">LOCAL MESH</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>{location}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Your Identity</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: profile?.color }}>{profile?.nickname}</span>
            <div className="w-6 h-6 rounded-md" style={{ backgroundColor: profile?.color + '20', border: `1px solid ${profile?.color}` }} />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-2xl text-center mb-8">
          <p className="text-xs text-zinc-500 leading-relaxed italic">
            "Radioactive" encryption active. Messages in this mesh fade once you leave the area or disconnect. Refreshing the browser resets the session.
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = profile && msg.sender === profile.nickname;
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {!isMe && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{~~msg.distance}m</span>}
                <span className={`text-[11px] font-bold uppercase tracking-wider`} style={{ color: isMe ? profile.color : (msg.isAi ? '#10b981' : '#71717a') }}>
                  {msg.sender}
                </span>
                {isMe && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">SELF</span>}
              </div>
              
              <div 
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? 'bg-emerald-600/10 border border-emerald-500/30 rounded-tr-none text-emerald-50' 
                    : msg.isAi 
                      ? 'bg-zinc-800/80 border border-emerald-900/50 rounded-tl-none text-zinc-200' 
                      : 'bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-300'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[9px] text-zinc-600 mt-1 px-1 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex flex-col items-start animate-pulse">
            <span className="text-[11px] font-bold text-emerald-500 mb-1 px-1">PROXIMA IS TYPING...</span>
            <div className="w-12 h-6 bg-zinc-900 rounded-full flex items-center justify-center gap-1">
              <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce delay-75" />
              <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md pb-8">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Cast your signal..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="h-14 w-14 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-zinc-800 text-white rounded-2xl transition-all shadow-lg flex items-center justify-center shrink-0"
          >
            <ICONS.Send className="w-6 h-6" />
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-700 mt-4 uppercase tracking-[0.2em] font-black">
          Signal range: 50m
        </p>
      </div>
    </div>
  );
};

export default App;
