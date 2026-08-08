// MamaTrack GPS — AI Chatbot & SMS Gateway Console
import React, { useState, useEffect, useRef } from 'react';
import { db, SmsService } from '../services/db';
import { useTheme } from '../contexts/ThemeContext';
import { Send, MessageSquare, List, Trash2, Bot, X, ShieldAlert } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const SMSSimulator: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 640);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'sms'>('ai');
  const [smsLogs, setSmsLogs] = useState<any[]>(() => db.smsLogs);

  // Chatbot State
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mamatrack_ai_chat');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [
      {
        id: 1,
        sender: 'ai',
        text: 'Hello! I am your virtual MamaTrack AI Health Assistant. Ask me any questions about pregnancy wellness, baby\'s heart rate, maternal danger signs, or how to interact with the system.',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('mamatrack_ai_chat', JSON.stringify(chatLogs));
  }, [chatLogs]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logsEndRef = useRef<HTMLDivElement>(null);
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
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const diffY = clientY - startY.current;
      
      if (Math.abs(diffY) > 5) {
        hasDragged.current = true;
      }
      
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

  // Poll for SMS logs to ensure real-time reactive display
  useEffect(() => {
    const timer = setInterval(() => {
      const currentLogs = db.smsLogs;
      if (currentLogs.length !== smsLogs.length) {
        setSmsLogs(currentLogs);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [smsLogs]);

  // Auto-scroll scrollable areas
  useEffect(() => {
    if (activeTab === 'sms' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [smsLogs, isOpen, activeTab]);

  useEffect(() => {
    if (activeTab === 'ai' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLogs, isOpen, activeTab, isAITyping]);

  const clearLogs = () => {
    SmsService.clearLogs();
    setSmsLogs([]);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear your AI chat history?')) {
      setChatLogs([
        {
          id: 1,
          sender: 'ai',
          text: 'Hello! I am your virtual MamaTrack AI Health Assistant. Ask me any questions about pregnancy wellness, baby\'s heart rate, maternal danger signs, or how to interact with the system.',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  // Chat message submission
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatLogs(prev => [...prev, userMessage]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    setIsAITyping(true);

    // AI simulation delay
    setTimeout(() => {
      let responseText = '';

      if (query.includes('heart rate') || query.includes('heartbeat') || query.includes('bpm')) {
        responseText = `👶 **Measuring Baby's Heart Rate:**\n\nA baby's fetal heart rate (normally **110 to 160 beats per minute**) is monitored in maternal clinics using these key diagnostic methods:\n\n1. 🩺 **Handheld Fetal Doppler**: An ultrasound device used by midwives to listen to and project the fetal heart rate starting around week 12.\n2. 📈 **Cardiotocography (CTG)**: A double-belt device secured to the mother's abdomen to track both the baby's heart patterns and uterine contraction forces concurrently.\n3. 🎺 **Pinard Horn (Fetoscope)**: A hollow wood/metal tube held against the mother's abdomen. The clinician listens directly to locate the heartbeat anatomically.`;
      } 
      else if (query.includes('danger sign') || query.includes('emergency') || query.includes('critical') || query.includes('warning') || query.includes('bleeding')) {
        responseText = `⚠️ **Critical Maternal Danger Signs:**\n\nPlease immediately consult your midwife or press the red **Trigger SOS** button on your home dashboard if you experience any of the following symptoms:\n\n* **Vaginal bleeding** or sudden leakage of amniotic fluid.\n* **Severe, constant abdominal pain** or uterine contractions before week 37.\n* **Sudden swelling** of the face, fingers, hands, or ankles.\n* **Severe, persistent headaches** or blurred vision.\n* **High fever**, chills, or convulsions.\n* **Reduced or absent baby kicks** (fewer than 10 movements in 2 hours).`;
      }
      else if (query.includes('get started') || query.includes('steps') || query.includes('interact') || query.includes('how to use')) {
        responseText = `🤱 **How to Interact with the MamaTrack System:**\n\n1. **Trigger SOS**: Click the 🚨 button on the Overview tab or side panel to broadcast your exact location and dispatch an ambulance.\n2. **Vitals Ledger**: Input your Blood Pressure, Glucose levels, and Kick counts under **Health Ledger & Vitals** to monitor health score trends.\n3. **Check WHO Milestones**: Navigate to the **WHO ANC Checklist** to complete the 8 recommended antenatal checks.\n4. **Doctor Consult**: Under **Profile & Doctors**, select an on-duty specialist to engage in clinical chat.`;
      }
      else if (query.includes('vitals') || query.includes('bp') || query.includes('blood pressure') || query.includes('glucose') || query.includes('sugar')) {
        responseText = `🩺 **Monitoring Maternal Vitals:**\n\n* **Blood Pressure (BP)**: Normal is around **120/80 mmHg**. If your BP exceeds **140/90 mmHg**, it may indicate pre-eclampsia. Alert your doctor immediately.\n* **Blood Glucose**: Normal fasting levels are **<95 mg/dL**. Elevated readings can signal gestational diabetes.\n* Log these vitals under the **Health Ledger & Vitals** tab to update your health score automatically.`;
      }
      else if (query.includes('doctor') || query.includes('consult') || query.includes('chat') || query.includes('midwife')) {
        responseText = `💬 **Consulting with Doctors:**\n\n* You can connect directly with on-duty obstetricians and midwives under the **Profile & Doctors** tab.\n* Select a matched doctor from the directory, type your specific concerns, and attach notes to receive clinical feedback.`;
      }
      else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('help')) {
        responseText = `👋 Hello! I am your virtual MamaTrack AI Health Assistant. I am here to answer pregnancy wellness questions and help you navigate the system. Ask me about **baby's heart rate**, **maternal danger signs**, or **how to use** the dashboard!`;
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
    }, 1200);
  };

  const renderAiChat = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
        borderRadius: '12px',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
        padding: '12px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '260px'
      }}>
        {chatLogs.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.sender === 'user'
              ? (isDark ? 'linear-gradient(135deg, #fb7185, #f43f5e)' : 'linear-gradient(135deg, #fb7185, #f43f5e)')
              : (isDark ? '#334155' : '#ffffff'),
            color: msg.sender === 'user' ? '#ffffff' : (isDark ? '#f8fafc' : '#334155'),
            borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
            border: msg.sender === 'user' ? 'none' : (isDark ? '1px solid #475569' : '1px solid #e2e8f0'),
            padding: '10px 14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            whiteSpace: 'pre-wrap',
            fontSize: '0.78rem',
            lineHeight: 1.5
          }}>
            {msg.text}
          </div>
        ))}
        {isAITyping && (
          <div style={{
            alignSelf: 'flex-start',
            background: isDark ? '#334155' : '#ffffff',
            borderRadius: '14px 14px 14px 2px',
            border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
            padding: '10px 14px',
            fontSize: '0.75rem',
            color: isDark ? '#94a3b8' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#f43f5e', borderRadius: '50%', animation: 'typingBounce 1.2s infinite' }} />
            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#f43f5e', borderRadius: '50%', animation: 'typingBounce 1.2s infinite 0.2s' }} />
            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#f43f5e', borderRadius: '50%', animation: 'typingBounce 1.2s infinite 0.4s' }} />
            <style>{`
              @keyframes typingBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
            `}</style>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Ask a health question (e.g. baby heart rate)..."
          disabled={isAITyping}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #cbd5e1',
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#ffffff' : '#1e293b',
            fontSize: '0.78rem',
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isAITyping}
          style={{
            background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(244,63,94,0.15)'
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );

  const renderSmsLogs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* SMS Logs List */}
      <div style={{
        flex: 1,
        minHeight: '260px',
        overflowY: 'auto',
        background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
        borderRadius: '12px',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #cbd5e1',
        padding: '14px',
        marginBottom: '12px'
      }}>
        {smsLogs.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.8rem', textAlign: 'center', gap: '8px' }}>
            <ShieldAlert size={36} />
            <span>No SMS alerts logged yet.<br />Trigger an emergency or schedule checkups to test alerts.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {smsLogs.map((log) => (
              <div key={log.id} style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    To: {log.to_name} ({log.to_number})
                  </span>
                  <span style={{ fontSize: '0.65rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.76rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.45 }}>
                  {log.message}
                </p>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8' }}>Logs saved locally in localStorage</span>
        {smsLogs.length > 0 && (
          <button
            onClick={clearLogs}
            style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear Logs
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @media (max-width: 640px) {
          .sms-simulator-float-btn {
            top: ${yPos === null ? '90px' : `${yPos}px`} !important;
            bottom: auto !important;
            right: 16px !important;
            padding: 8px 14px !important;
            font-size: 0.78rem !important;
            border-radius: 24px !important;
          }
          .sms-simulator-drawer {
            width: calc(100% - 32px) !important;
            height: ${isMaximized ? 'calc(100vh - 120px)' : '460px'} !important;
            top: ${yPos === null ? '120px' : `${yPos > window.innerHeight / 2 ? yPos - 470 : yPos + 50}px`} !important;
            bottom: auto !important;
            right: 16px !important;
          }
        }
      `}</style>

      {/* Floating Toggle Button (Icon Only) */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className="sms-simulator-float-btn"
        title="Open AI Chatbot Console"
        style={{
          position: 'fixed',
          bottom: yPos === null ? '24px' : 'auto',
          top: yPos === null ? undefined : `${yPos}px`,
          right: '24px',
          zIndex: 99999,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
          color: '#ffffff',
          border: '2px solid #ffffff',
          boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.5)' : '0 8px 25px rgba(244,63,94,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          fontFamily: 'inherit',
          transition: isDragging.current ? 'transform 0.2s ease' : 'transform 0.2s ease, bottom 0.3s ease, top 0.3s ease, right 0.3s ease',
          userSelect: 'none',
          touchAction: 'manipulation'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Bot size={24} />
        {smsLogs.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#0f61ef',
            color: '#fff',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.68rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            border: '2px solid #fff'
          }}>
            {smsLogs.length}
          </span>
        )}
      </button>

      {/* Simulator Drawer Panel */}
      {isOpen && (
        <div 
          className="sms-simulator-drawer"
          style={{
            position: 'fixed',
            bottom: yPos === null ? '85px' : 'auto',
            top: yPos === null ? undefined : `${yPos > window.innerHeight / 2 ? (isMaximized && isDesktop ? yPos - 600 : yPos - 520) : yPos + 50}px`,
            right: '24px',
            zIndex: 99999,
            width: isMaximized && isDesktop ? '680px' : '420px',
            height: isMaximized && isDesktop ? '560px' : '500px',
            background: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            borderRadius: '20px',
            boxShadow: isDark ? '0 15px 45px rgba(0,0,0,0.5)' : '0 15px 45px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transition: isDragging.current ? 'width 0.3s ease, height 0.3s ease' : 'bottom 0.3s ease, right 0.3s ease, width 0.3s ease, height 0.3s ease, top 0.3s ease',
          }}
        >

          {/* Header */}
          <div style={{
            background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} style={{ color: '#f43f5e' }} /> MamaTrack AI Assistant
              </h4>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>Simulated pregnancy health & support chat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore size" : "Maximize view"}
                style={{ background: 'none', border: 'none', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {isMaximized ? '🗗' : '🗖'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: isDark ? '#94a3b8' : '#64748b', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            background: isDark ? 'rgba(30, 41, 59, 0.3)' : '#f1f5f9',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0',
            padding: '6px 12px',
            gap: '8px'
          }}>
            <button
              onClick={() => setActiveTab('ai')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'ai' ? (isDark ? '#475569' : '#ffffff') : 'transparent',
                color: activeTab === 'ai' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'ai' && !isDark ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MessageSquare size={13} /> AI Health Chat
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'sms' ? (isDark ? '#475569' : '#ffffff') : 'transparent',
                color: activeTab === 'sms' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'sms' && !isDark ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <List size={13} /> SMS Gateway Logs ({smsLogs.length})
            </button>
            
            {activeTab === 'ai' ? (
              <button
                onClick={clearChat}
                title="Clear Chat History"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'ai' ? renderAiChat() : renderSmsLogs()}
          </div>
        </div>
      )}
    </>
  );
};
