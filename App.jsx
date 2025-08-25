import React, { useState, useEffect, useRef } from 'react';

// Simple SVG Icons
const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const RevIcon = () => (
  <div style={{
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
      animation: 'float 3s ease-in-out infinite'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '4px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#ffffff',
          borderRadius: '50%',
          animation: 'blink 4s infinite'
        }}></div>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#ffffff',
          borderRadius: '50%',
          animation: 'blink 4s infinite'
        }}></div>
      </div>
      <div style={{
        width: '16px',
        height: '8px',
        background: '#ffffff',
        borderRadius: '0 0 16px 16px'
      }}></div>
    </div>
  </div>
);

// Language configurations
const LANGUAGES = {
  en: {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
    speechLang: 'en-US',
    texts: {
      title: 'Talk to Rev',
      ready: 'Ready to talk',
      listening: 'Listening...',
      processing: 'Processing...',
      speaking: 'Rev is speaking...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connectionLost: 'Connection lost - refresh to reconnect',
      connectionError: 'Connection error',
      connectionFailed: 'Connection failed',
      notConnected: 'Not connected - refresh page',
      speechError: 'Speech recognition error - try again',
      micError: 'Microphone error - check permissions',
      speechNotSupported: 'Speech recognition not supported',
      clickToStart: 'Click to start talking'
    }
  },
  hi: {
    code: 'hi-IN',
    name: 'हिंदी',
    flag: '🇮🇳',
    speechLang: 'hi-IN',
    texts: {
      title: 'Rev से बात करें',
      ready: 'बात करने के लिए तैयार',
      listening: 'सुन रहा हूँ...',
      processing: 'प्रोसेसिंग...',
      speaking: 'Rev बोल रहा है...',
      connected: 'जुड़ा हुआ',
      disconnected: 'डिस्कनेक्ट हो गया',
      connectionLost: 'कनेक्शन खो गया - दोबारा कनेक्ट करने के लिए रिफ्रेश करें',
      connectionError: 'कनेक्शन एरर',
      connectionFailed: 'कनेक्शन फेल हो गया',
      notConnected: 'कनेक्ट नहीं है - पेज रिफ्रेश करें',
      speechError: 'स्पीच रिकग्निशन एरर - दोबारा कोशिश करें',
      micError: 'माइक्रोफोन एरर - अनुमतियाँ जांचें',
      speechNotSupported: 'स्पीच रिकग्निशन सपोर्ट नहीं है',
      clickToStart: 'बात करना शुरू करने के लिए क्लिक करें'
    }
  }
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Click to start talking');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const lang = LANGUAGES[currentLanguage];

  // Inline styles to replace external CSS
  const styles = {
    app: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 35%, #0a0a0a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      color: '#ffffff'
    },
    backgroundPattern: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0.03,
      backgroundImage: 'radial-gradient(circle at 25% 25%, #4facfe 0%, transparent 50%), radial-gradient(circle at 75% 75%, #00f2fe 0%, transparent 50%)',
      pointerEvents: 'none',
      zIndex: 0
    },
    header: {
      position: 'relative',
      zIndex: 10,
      padding: '1.5rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoText: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '2px'
    },
    languageSelector: {
      position: 'relative'
    },
    languageButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.3s ease'
    },
    languageMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: '0.5rem',
      background: 'rgba(30, 30, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 1000,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      minWidth: '140px'
    },
    languageOption: {
      width: '100%',
      padding: '0.75rem 1rem',
      background: 'transparent',
      border: 'none',
      color: '#ffffff',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    languageOptionActive: {
      background: 'rgba(79, 172, 254, 0.3)',
      color: '#4facfe'
    },
    main: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      zIndex: 10
    },
    talkContainer: {
      textAlign: 'center',
      maxWidth: '500px',
      width: '100%'
    },
    revAvatar: {
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'center'
    },
    revIcon: {
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    robotHead: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
      animation: 'float 3s ease-in-out infinite'
    },
    robotEyes: {
      display: 'flex',
      gap: '8px',
      marginBottom: '4px'
    },
    eye: {
      width: '8px',
      height: '8px',
      background: '#ffffff',
      borderRadius: '50%',
      animation: 'blink 4s infinite'
    },
    robotMouth: {
      width: '16px',
      height: '8px',
      background: '#ffffff',
      borderRadius: '0 0 16px 16px'
    },
    talkTitle: {
      fontSize: '3rem',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '3rem',
      textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
    },
    micContainer: {
      marginBottom: '2rem',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative'
    },
    micButton: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: 'none',
      background: 'linear-gradient(135deg, #4285f4, #1e88e5)',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(66, 133, 244, 0.3)',
      position: 'relative',
      zIndex: 5
    },
    micButtonListening: {
      background: 'linear-gradient(135deg, #ff4444, #cc1f1f)',
      boxShadow: '0 8px 32px rgba(255, 68, 68, 0.4)',
      animation: 'pulse 1.5s infinite'
    },
    micButtonProcessing: {
      background: 'linear-gradient(135deg, #ff9800, #f57c00)',
      boxShadow: '0 8px 32px rgba(255, 152, 0, 0.4)'
    },
    micButtonSpeaking: {
      background: 'linear-gradient(135deg, #4caf50, #388e3c)',
      boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)'
    },
    statusText: {
      fontSize: '1.2rem',
      color: '#b0b0b0',
      marginBottom: '2rem',
      minHeight: '1.5rem'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      color: '#888'
    },
    connectionDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      transition: 'all 0.3s ease'
    },
    connectionDotConnected: {
      background: '#4caf50',
      boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)'
    },
    connectionDotDisconnected: {
      background: '#f44336',
      boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)'
    }
  };

  // Initialize WebSocket and Speech APIs
  useEffect(() => {
    connectWebSocket();
    initializeSpeechAPIs();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Update status when language changes
  useEffect(() => {
    if (!isListening && !isProcessing && !isSpeaking) {
      setStatus(isConnected ? lang.texts.ready : lang.texts.clickToStart);
    }
  }, [currentLanguage, isConnected, isListening, isProcessing, isSpeaking]);

  // Update speech recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang.speechLang;
    }
  }, [currentLanguage]);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3001');
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setStatus(lang.texts.ready);
        console.log('WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        setStatus(lang.texts.connectionLost);
        console.log('WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus(lang.texts.connectionError);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      setStatus(lang.texts.connectionFailed);
    }
  };

  const initializeSpeechAPIs = () => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = lang.speechLang;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus(lang.texts.listening);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        setStatus(lang.texts.processing);
        setIsListening(false);
        setIsProcessing(true);
        sendTextToAI(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        setStatus(lang.texts.speechError);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (!isProcessing) {
          setStatus(lang.texts.ready);
        }
      };
    }
    
    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'session_started':
        setStatus(lang.texts.ready);
        break;
        
      case 'text_response':
        setIsProcessing(false);
        // Use detected language for TTS if provided
        const responseLanguage = data.autoDetected ? data.language : currentLanguage;
        speakResponse(data.text, responseLanguage);
        break;
        
      case 'error':
        console.error('Server error:', data.message);
        setStatus('Error: ' + data.message);
        setIsProcessing(false);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendTextToAI = (text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text_input',
        text: text
        // Removed language parameter - AI will auto-detect
      }));
    }
  };

  const speakResponse = (text, detectedLanguage) => {
    if (synthRef.current) {
      // Stop any current speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Use detected language for TTS, fallback to current UI language
      const ttsLanguage = detectedLanguage || currentLanguage;
      const speechLang = ttsLanguage === 'hi' ? 'hi-IN' : 'en-US';
      utterance.lang = speechLang;
      
      // Try to find a voice for the detected language
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.toLowerCase().startsWith(ttsLanguage.toLowerCase())
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatus(lang.texts.speaking);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatus(lang.texts.ready);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        setStatus(lang.texts.speechError);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const handleMicClick = () => {
    if (!isConnected) {
      setStatus(lang.texts.notConnected);
      return;
    }
    
    if (isSpeaking) {
      // Stop speaking
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
      setStatus(lang.texts.ready);
      return;
    }
    
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }
    
    if (isProcessing) {
      return; // Do nothing while processing
    }
    
    // Start listening
    if (recognitionRef.current) {
      try {
        // Start session without language parameter
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ 
            type: 'start_session'
          }));
        }
        
        recognitionRef.current.lang = lang.speechLang;
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setStatus(lang.texts.micError);
      }
    } else {
      setStatus(lang.texts.speechNotSupported);
    }
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    setShowLanguageMenu(false);
    
    // Update status text immediately
    if (!isListening && !isProcessing && !isSpeaking) {
      setStatus(isConnected ? LANGUAGES[langCode].texts.ready : LANGUAGES[langCode].texts.clickToStart);
    }
  };

  const getMicButtonClass = () => {
    if (isListening) return 'mic-button listening';
    if (isProcessing) return 'mic-button processing';
    if (isSpeaking) return 'mic-button speaking';
    return 'mic-button';
  };

  const getStatusText = () => {
    if (isListening) return lang.texts.listening;
    if (isProcessing) return lang.texts.processing;
    if (isSpeaking) return lang.texts.speaking;
    return status;
  };

  const getMicButtonStyle = () => {
    let baseStyle = { ...styles.micButton };
    if (isListening) return { ...baseStyle, ...styles.micButtonListening };
    if (isProcessing) return { ...baseStyle, ...styles.micButtonProcessing };
    if (isSpeaking) return { ...baseStyle, ...styles.micButtonSpeaking };
    return baseStyle;
  };

  const getConnectionDotStyle = () => {
    return {
      ...styles.connectionDot,
      ...(isConnected ? styles.connectionDotConnected : styles.connectionDotDisconnected)
    };
  };

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .language-button:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(79, 172, 254, 0.5) !important;
          transform: translateY(-2px);
        }
        .language-option:hover {
          background: rgba(79, 172, 254, 0.2) !important;
        }
        .mic-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 12px 40px rgba(66, 133, 244, 0.4);
        }
        .mic-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <div style={styles.backgroundPattern}></div>
      
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>REVOLT</span>
        </div>
        
        <div style={styles.languageSelector}>
          <button 
            className="language-button"
            style={styles.languageButton}
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <GlobeIcon />
            <span>{lang.flag} {lang.name}</span>
          </button>
          
          {showLanguageMenu && (
            <div style={styles.languageMenu}>
              {Object.entries(LANGUAGES).map(([code, language]) => (
                <button
                  key={code}
                  className="language-option"
                  style={{
                    ...styles.languageOption,
                    ...(code === currentLanguage ? styles.languageOptionActive : {})
                  }}
                  onClick={() => handleLanguageChange(code)}
                >
                  <span>{language.flag} {language.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.talkContainer}>
          <div style={styles.revAvatar}>
            <RevIcon />
          </div>
          
          <h1 style={styles.talkTitle}>{lang.texts.title}</h1>
          
          <div style={styles.micContainer}>
            <button 
              className="mic-button"
              style={getMicButtonStyle()}
              onClick={handleMicClick}
              disabled={!isConnected && !isProcessing}
            >
              <MicIcon />
            </button>
          </div>
          
          <p style={styles.statusText}>{getStatusText()}</p>
          
          <div style={styles.connectionStatus}>
            <div style={getConnectionDotStyle()}></div>
            <span>{isConnected ? lang.texts.connected : lang.texts.disconnected}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
