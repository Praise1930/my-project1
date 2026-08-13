// MamaTrack GPS — AI Health Assistant Chatbot Component
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Send, Bot, X, Trash2, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const SMSSimulator: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  // Chatbot State
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mamatrack_ai_chat');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore error */ }
    }
    return [
      {
        id: 1,
        sender: 'ai',
        text: 'Hello! I am your MamaTrack AI Virtual Health Assistant. Ask me any questions about pregnancy wellness, baby\'s heart rate, maternal danger signs, ANC checkups, or how to use the emergency dispatch system.',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('mamatrack_ai_chat', JSON.stringify(chatLogs));
  }, [chatLogs]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dragging state along the side (vertical)
  const [yPos, setYPos] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);
  const hasDragged = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const diffY = clientY - startY.current;
      if (Math.abs(diffY) > 5) hasDragged.current = true;
      let newTop = startTop.current + diffY;
      newTop = Math.max(10, Math.min(window.innerHeight - 60, newTop));
      setYPos(newTop);
    };

    const handleEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setTimeout(() => {
          hasDragged.current = false;
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    isDragging.current = true;
    hasDragged.current = false;
    startY.current = clientY;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startTop.current = rect.top;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      return;
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogs, isOpen, isAITyping]);

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear your AI chat history?')) {
      setChatLogs([
        {
          id: 1,
          sender: 'ai',
          text: 'Hello! I am your MamaTrack AI Virtual Health Assistant. Ask me any questions about pregnancy wellness, baby\'s heart rate, maternal danger signs, ANC checkups, or how to use the emergency dispatch system.',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  // Chat message submission
  const sendQuery = (rawQuery: string) => {
    if (!rawQuery.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: rawQuery,
      timestamp: new Date().toISOString()
    };

    setChatLogs(prev => [...prev, userMessage]);
    const query = rawQuery.toLowerCase();
    setChatInput('');
    setIsAITyping(true);

    // AI response simulation
    setTimeout(() => {
      let responseText = '';

      if (query.includes('heart rate') || query.includes('heartbeat') || query.includes('bpm')) {
        responseText = `👶 **Measuring Baby's Heart Rate:**\n\nA baby's fetal heart rate (normally **110 to 160 beats per minute**) is monitored in maternal clinics using these key diagnostic methods:\n\n1. 🩺 **Handheld Fetal Doppler**: An ultrasound device used by midwives to listen to and project the fetal heart rate starting around week 12.\n2. 📈 **Cardiotocography (CTG)**: A double-belt device secured to the mother's abdomen to track both the baby's heart patterns and uterine contraction forces concurrently.\n3. 🎺 **Pinard Horn (Fetoscope)**: A hollow wood/metal tube held against the mother's abdomen. The clinician listens directly to locate the heartbeat anatomically.`;
      } 
      else if (query.includes('danger sign') || query.includes('emergency') || query.includes('critical') || query.includes('warning') || query.includes('bleeding')) {
        responseText = `⚠️ **Critical Maternal Danger Signs:**\n\nPlease immediately consult your midwife or press the red **Trigger SOS** button on your home dashboard if you experience any of the following symptoms:\n\n* **Vaginal bleeding** or sudden leakage of amniotic fluid.\n* **Severe, constant abdominal pain** or uterine contractions before week 37.\n* **Sudden swelling** of the face, fingers, hands, or ankles.\n* **Severe, persistent headaches** or blurred vision.\n* **High fever**, chills, or convulsions.\n* **Reduced or absent baby kicks** (fewer than 10 movements in 2 hours).`;
      }
      else if (query.includes('sos') || query.includes('dispatch') || query.includes('ambulance') || query.includes('trigger')) {
        responseText = `🚨 **How to Trigger an Emergency SOS:**\n\n1. **Trigger SOS**: Click the 🚨 button on the Overview tab or side panel to broadcast your exact location and dispatch an ambulance.\n2. **Automatic Route Calculation**: The system automatically locates the nearest on-duty driver & qualified hospital.\n3. **Cancel SOS**: If triggered by mistake, click the toggle button again to cancel and state your reason.`;
      }
      else if (query.includes('vitals') || query.includes('bp') || query.includes('blood pressure') || query.includes('glucose') || query.includes('sugar')) {
        responseText = `🩺 **Monitoring Maternal Vitals:**\n\n* **Blood Pressure (BP)**: Normal is around **120/80 mmHg**. If your BP exceeds **140/90 mmHg**, it may indicate pre-eclampsia. Alert your doctor immediately.\n* **Blood Glucose**: Normal fasting levels are **<95 mg/dL**. Elevated readings can signal gestational diabetes.\n* Log these vitals under the **Health Ledger & Vitals** tab to update your health score automatically.`;
      }
      else if (query.includes('doctor') || query.includes('consult') || query.includes('chat') || query.includes('midwife')) {
        responseText = `💬 **Consulting with Doctors:**\n\n* You can connect directly with on-duty obstetricians and midwives under the **Profile & Doctors** tab.\n* Select a matched doctor from the directory, type your specific concerns, and attach notes to receive clinical feedback.`;
      }
      else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('help')) {
        responseText = `👋 Hello! I am your MamaTrack AI Virtual Health Assistant. I am here to answer pregnancy wellness questions and help you navigate the system. Ask me about **baby's heart rate**, **maternal danger signs**, or **how to trigger SOS**!`;
      }
      else {
        responseText = `📖 **Pregnancy Wellness Advice:**\n\nThank you for your question. As an expectant mother, please ensure you:\n\n* Take daily prenatal vitamins containing **iron and folic acid**.\n* Stay well hydrated and maintain a balanced diet of proteins, fruits, and leafy greens.\n* Keep up with your scheduled clinical antenatal (ANC) appointments.\n\n*For diagnostic concerns, consult your assigned VHT midwife or write to an on-duty doctor on the Doctor Consult panel.*`;
      }

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toISOString()
      };

      setChatLogs(prev => [...prev, aiMessage]);
      setIsAITyping(false);
    }, 1000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(chatInput);
  };

  return (
    <>
      {/* Floating AI Launcher Toggle Button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        title="MamaTrack AI Health Assistant"
        aria-label="MamaTrack AI Health Assistant"
        style={{
          position: 'fixed',
          right: '18px',
          top: yPos !== null ? `${yPos}px` : 'auto',
          bottom: yPos === null ? '24px' : 'auto',
          zIndex: 999990,
          background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.45)',
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          fontWeight: 700,
          fontSize: '0.85rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Sparkles size={18} />
        <span>MamaTrack AI</span>
      </button>

      {/* AI Assistant Chat Modal Popup Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '80px',
            width: 'min(380px, calc(100vw - 32px))',
            height: '520px',
            maxHeight: '82vh',
            zIndex: 999999,
            background: isDark ? '#0f172a' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>MamaTrack AI Health Assistant</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Virtual Maternal Wellness & Support</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={clearChat}
                title="Clear Chat"
                style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.8, cursor: 'pointer', padding: '4px' }}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Window"
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 12px',
            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
            scrollbarWidth: 'none'
          }}>
            {[
              { label: '⚠️ Danger Signs', query: 'What are danger signs in pregnancy?' },
              { label: '👶 Baby Heartbeat', query: 'How to measure baby heart rate?' },
              { label: '🚨 Trigger SOS', query: 'How to trigger emergency SOS?' },
              { label: '🩺 Vitals & BP', query: 'What are normal BP vitals?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(chip.query)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  color: isDark ? '#cbd5e1' : '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: isDark ? '#0f172a' : '#f8fafc',
            }}
          >
            {chatLogs.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '84%',
                  background: msg.sender === 'user'
                    ? '#3b82f6'
                    : (isDark ? '#1e293b' : '#ffffff'),
                  color: msg.sender === 'user'
                    ? '#ffffff'
                    : (isDark ? '#f1f5f9' : '#1e293b'),
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  boxShadow: msg.sender === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </div>
            ))}

            {isAITyping && (
              <div style={{ alignSelf: 'flex-start', background: isDark ? '#1e293b' : '#ffffff', padding: '8px 14px', borderRadius: '14px', fontSize: '0.8rem', color: '#64748b' }}>
                MamaTrack AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSendChat}
            style={{
              padding: '10px 14px',
              background: isDark ? '#1e293b' : '#ffffff',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Ask MamaTrack AI..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '20px',
                border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                background: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: chatInput.trim() ? '#3b82f6' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: chatInput.trim() ? 'pointer' : 'default',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
