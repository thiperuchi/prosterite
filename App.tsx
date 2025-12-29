import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { 
  Home, 
  Pill, 
  Activity, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Circle,
  Trash2,
  Calendar,
  Trophy,
  AlertCircle,
  FileText,
  MessageCircle,
  User,
  Send,
  ArrowLeft,
  Sparkles,
  Mic,
  StopCircle,
  Crown,
  Moon,
  Sun,
  ShoppingCart,
  Phone,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  QrCode
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Medication, SymptomLog, ScreenName, UserStats, ForumPost, ForumReply, ChatMessage } from './types';
import { EDUCATION_CONTENT, INITIAL_MEDS_DEMO } from './constants';
import { Card, Button, Badge } from './components/ui';

// --- Helper Functions ---
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
};

// --- Screens ---

// AI Assistant (WhatsApp Style)
const AIAssistantScreen: React.FC = () => {
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Sou o assistente virtual do Prosterite. Estou aqui para ajudar com seu tratamento, dúvidas sobre as gotas ou cápsulas, e suporte geral. Como posso ajudar?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Refs for Audio (to avoid re-renders)
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Você é um atendente de suporte via WhatsApp do produto "Prosterite" (suplemento para próstata). Seja breve, use emojis e seja muito atencioso. Se o usuário perguntar onde comprar, diga que é pelo botão "Comprar" no topo do app e ENFATIZE que há 10% DE DESCONTO pagando no Pix ou Cartão de Crédito. O usuário disse: "${inputText}"` }]
          }
        ]
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "Desculpe, não entendi.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Erro de conexão.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceConnect = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      // Initialize connection
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'Você é o assistente de voz do Prosterite. Fale português do Brasil. Seja curto e amigável. Se falarem de preço, mencione os 10% de desconto no Pix ou Cartão.'
        },
        callbacks: {
          onopen: () => {
             // Connection established
             setIsConnected(true);
             setIsConnecting(false);
             
             // Setup Audio Pipeline
             const source = inputAudioContext.createMediaStreamSource(stream);
             sourceRef.current = source;
             const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
             scriptProcessorRef.current = scriptProcessor;

             scriptProcessor.onaudioprocess = (e) => {
               if (!sessionRef.current) return;
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createBlob(inputData);
               sessionRef.current.sendRealtimeInput({ media: pcmBlob });
             };

             source.connect(scriptProcessor);
             scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
               const ctx = outputAudioContextRef.current;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
               
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.addEventListener('ended', () => sourcesRef.current.delete(source));
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }
          },
          onclose: () => handleVoiceDisconnect(),
          onerror: (e) => {
            console.error(e);
            handleVoiceDisconnect();
          }
        }
      });

      // Await session and store in ref to avoid circular dependency in callbacks
      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      alert("Erro ao conectar microfone.");
    }
  };

  const handleVoiceDisconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    sessionRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  useEffect(() => {
    return () => handleVoiceDisconnect();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5] dark:bg-slate-900 absolute inset-0 z-50">
      <header className="bg-[#075E54] dark:bg-slate-800 p-4 text-white flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#075E54]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Suporte Prosterite</h1>
            <p className="text-xs opacity-80 mt-1">{isConnected ? 'Gravando...' : 'Online'}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setMode(mode === 'chat' ? 'voice' : 'chat')}>
            {mode === 'chat' ? <Phone className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mode === 'chat' && (
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat dark:bg-none">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2 px-3 rounded-lg text-sm shadow relative ${
                  msg.role === 'user' 
                    ? 'bg-[#DCF8C6] dark:bg-emerald-700 text-slate-800 dark:text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                  <span className="text-[10px] text-slate-400 block text-right mt-1 opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
             ))}
             {isTyping && <div className="text-xs text-slate-500 p-2 italic">Digitando...</div>}
             <div ref={messagesEndRef} />
          </div>
          <div className="p-2 bg-transparent shrink-0">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 pr-2 rounded-full shadow-lg">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite sua dúvida..."
                className="flex-1 p-3 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="w-10 h-10 bg-[#075E54] rounded-full flex items-center justify-center text-white">
                <Send className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'voice' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#E5DDD5] dark:bg-slate-900">
           <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-[#075E54]'}`}>
             <Mic className="w-12 h-12 text-white" />
           </div>
           <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-white">
             {isConnected ? "Ouvindo você..." : "Falar com Especialista"}
           </h2>
           <p className="mt-2 text-slate-600 dark:text-slate-400 mb-8 max-w-xs">
             Toque no botão abaixo para iniciar ou parar a chamada de voz com nossa IA.
           </p>
           {!isConnected ? (
             <Button fullWidth onClick={handleVoiceConnect} disabled={isConnecting}>
               {isConnecting ? 'Conectando...' : 'Iniciar Chamada'}
             </Button>
           ) : (
             <Button fullWidth variant="danger" onClick={handleVoiceDisconnect}>
               Encerrar Chamada
             </Button>
           )}
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<{
  meds: Medication[];
  onCheckMed: (id: string) => void;
  streak: number;
  logs: SymptomLog[];
  onNavigate: (screen: ScreenName) => void;
}> = ({ meds, onCheckMed, streak, logs, onNavigate }) => {
  const today = getTodayDateString();
  const completedMeds = meds.filter(m => m.history.includes(today));
  const progress = meds.length > 0 ? (completedMeds.length / meds.length) * 100 : 0;
  const loggedToday = logs.some(l => l.date === today);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Prosterite</h1>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">App Oficial</span>
          </div>
        </div>
        <Button size="sm" variant="gold" className="shadow-none" onClick={() => window.open('https://guiaprosterite.com', '_blank')}>
          <ShoppingCart className="w-4 h-4 mr-1" /> Comprar
        </Button>
      </header>
      
      {/* Buy Banner - Updated with 10% Discount */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-amber-600 dark:to-amber-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transform transition-all hover:scale-[1.02]">
         <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
         <div className="relative z-10">
           <div className="flex items-start justify-between">
             <div>
               <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-2">
                 <Sparkles className="w-3 h-3" /> Oferta Relâmpago
               </div>
               <h3 className="font-bold text-xl mb-1">10% DE DESCONTO</h3>
               <p className="text-sm text-slate-300 dark:text-white/90 mb-4 max-w-[200px]">
                 Pagando via <span className="font-bold text-white border-b border-white/40">PIX</span> ou <span className="font-bold text-white border-b border-white/40">Cartão</span>.
               </p>
               <div className="flex gap-2">
                  <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 border-none font-bold" onClick={() => window.open('https://guiaprosterite.com', '_blank')}>
                    <QrCode className="w-4 h-4 mr-1" /> Usar Desconto
                  </Button>
               </div>
             </div>
             <div className="flex flex-col items-center">
                <Crown className="w-16 h-16 text-yellow-400 drop-shadow-lg rotate-12" />
                <span className="text-xs font-bold text-yellow-400 mt-1 uppercase tracking-wide">Premium</span>
             </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <p className="text-xs text-slate-400 uppercase font-bold mb-1">Sequência</p>
           <div className="flex items-end gap-1">
             <span className="text-3xl font-bold text-slate-900 dark:text-white">{streak}</span>
             <span className="text-sm text-slate-500 mb-1">dias</span>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <p className="text-xs text-slate-400 uppercase font-bold mb-1">Progresso Hoje</p>
           <div className="flex items-end gap-1">
             <span className="text-3xl font-bold text-emerald-500">{Math.round(progress)}%</span>
           </div>
        </div>
      </div>

      <Card title="Tratamento de Hoje">
        {meds.length === 0 ? (
          <div className="text-center py-4 text-slate-500">Sem medicamentos.</div>
        ) : (
          <div className="space-y-3">
            {meds.sort((a,b) => a.time.localeCompare(b.time)).map(med => {
              const isTaken = med.history.includes(today);
              return (
                <div key={med.id} onClick={() => onCheckMed(med.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isTaken ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900' : 'bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTaken ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 dark:bg-slate-800'}`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isTaken ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage} • {med.time}</p>
                    </div>
                  </div>
                  {isTaken ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      
      {!loggedToday && (
        <button onClick={() => onNavigate('symptoms')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 font-bold transition-all active:scale-95">
          <Activity className="w-5 h-5" />
          Como você está hoje?
        </button>
      )}
    </div>
  );
};

// ... (Other screens remain structurally similar but ensuring no syntax errors)

const MedicationScreen: React.FC<{ meds: Medication[]; setMeds: any }> = ({ meds, setMeds }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('08:00');

  const add = () => {
    if(!name) return;
    setMeds([...meds, { id: Date.now().toString(), name, dosage: dose, time, history: [] }]);
    setIsAdding(false); setName(''); setDose('');
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medicamentos</h1>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}><Plus className="w-4 h-4" /></Button>
      </header>
      {isAdding && (
        <Card title="Novo">
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" className="w-full p-2 border rounded" />
            <div className="flex gap-2">
               <input value={dose} onChange={e => setDose(e.target.value)} placeholder="Dose" className="flex-1 p-2 border rounded" />
               <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-24 p-2 border rounded" />
            </div>
            <Button fullWidth onClick={add}>Salvar</Button>
          </div>
        </Card>
      )}
      <div className="space-y-3">
        {meds.map(m => (
          <Card key={m.id}>
             <div className="flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-slate-900 dark:text-white">{m.name}</h3>
                 <p className="text-sm text-slate-500">{m.dosage} às {m.time}</p>
               </div>
               <button onClick={() => setMeds(meds.filter((x: Medication) => x.id !== m.id))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ReportsScreen: React.FC<{ logs: SymptomLog[] }> = ({ logs }) => {
    const data = logs.slice(-7).map(l => ({ date: formatDate(l.date).slice(0,5), val: l.painLevel }));
    return (
        <div className="space-y-6 pb-24">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatório</h1>
            <Card title="Dor (7 dias)" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0,10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={3} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
            <div className="space-y-2">
                {logs.slice().reverse().map(l => (
                    <div key={l.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border flex justify-between">
                        <span>{formatDate(l.date)}</span>
                        <span className="font-bold">Dor: {l.painLevel}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EducationScreen: React.FC = () => {
    return (
        <div className="space-y-6 pb-24">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Guia Prosterite</h1>
            {EDUCATION_CONTENT.map(item => (
                <Card key={item.id} title={item.title}>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{item.content}</p>
                </Card>
            ))}
        </div>
    );
};

const SymptomsScreen: React.FC<{ onSave: (l: SymptomLog) => void }> = ({ onSave }) => {
    const [pain, setPain] = useState(0);
    return (
        <div className="space-y-6 pb-24">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Como você está?</h1>
            <Card title={`Dor: ${pain}/10`}>
                <input type="range" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            </Card>
            <Button fullWidth size="lg" onClick={() => onSave({
                id: Date.now().toString(),
                date: getTodayDateString(),
                painLevel: pain,
                urgency: 'media',
                discomfort: 'leve'
            })}>Salvar</Button>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  // Use a new key to force reload of Prosterite meds
  const [meds, setMeds] = useState<Medication[]>(() => {
      const s = localStorage.getItem('prosterite_app_meds_v1');
      return s ? JSON.parse(s) : INITIAL_MEDS_DEMO;
  });
  
  const [logs, setLogs] = useState<SymptomLog[]>(() => {
      const s = localStorage.getItem('prosterite_app_logs_v1');
      return s ? JSON.parse(s) : [];
  });

  const [streak, setStreak] = useState(0);

  useEffect(() => {
    localStorage.setItem('prosterite_app_meds_v1', JSON.stringify(meds));
    localStorage.setItem('prosterite_app_logs_v1', JSON.stringify(logs));
  }, [meds, logs]);

  useEffect(() => {
    if(darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleCheckMed = (id: string) => {
    const today = getTodayDateString();
    setMeds(meds.map(m => m.id === id ? { ...m, history: m.history.includes(today) ? m.history.filter(d => d !== today) : [...m.history, today] } : m));
  };

  return (
    <div className="flex justify-center min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 relative shadow-2xl flex flex-col border-x border-slate-200 dark:border-slate-800">
            
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-40">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white/50 dark:bg-black/50 rounded-full backdrop-blur-md">
                    {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                </button>
            </div>

            {/* WA Floating Button */}
            {screen !== 'ai_assistant' && (
                <button onClick={() => setScreen('ai_assistant')} className="absolute bottom-24 right-4 z-40 p-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}

            <main className="flex-1 overflow-y-auto no-scrollbar p-5 pt-16">
                {screen === 'dashboard' && <Dashboard meds={meds} onCheckMed={handleCheckMed} streak={streak} logs={logs} onNavigate={setScreen} />}
                {screen === 'medication' && <MedicationScreen meds={meds} setMeds={setMeds} />}
                {screen === 'reports' && <ReportsScreen logs={logs} />}
                {screen === 'education' && <EducationScreen />}
                {screen === 'symptoms' && <SymptomsScreen onSave={(l) => { setLogs([...logs, l]); setScreen('dashboard'); }} />}
                {screen === 'ai_assistant' && <AIAssistantScreen />}
            </main>

            {/* Nav */}
            <nav className="border-t dark:border-slate-800 bg-white dark:bg-slate-900 p-2 flex justify-around pb-6 sticky bottom-0 z-30">
                <button onClick={() => setScreen('dashboard')} className={`p-2 flex flex-col items-center ${screen === 'dashboard' ? 'text-amber-500' : 'text-slate-400'}`}>
                    <Home className="w-6 h-6" /><span className="text-[10px]">Início</span>
                </button>
                <button onClick={() => setScreen('medication')} className={`p-2 flex flex-col items-center ${screen === 'medication' ? 'text-amber-500' : 'text-slate-400'}`}>
                    <Pill className="w-6 h-6" /><span className="text-[10px]">Remédios</span>
                </button>
                <button onClick={() => setScreen('symptoms')} className={`p-2 flex flex-col items-center ${screen === 'symptoms' ? 'text-amber-500' : 'text-slate-400'}`}>
                    <Activity className="w-6 h-6" /><span className="text-[10px]">Diário</span>
                </button>
                <button onClick={() => setScreen('reports')} className={`p-2 flex flex-col items-center ${screen === 'reports' ? 'text-amber-500' : 'text-slate-400'}`}>
                    <FileText className="w-6 h-6" /><span className="text-[10px]">Relatórios</span>
                </button>
            </nav>
        </div>
    </div>
  );
}