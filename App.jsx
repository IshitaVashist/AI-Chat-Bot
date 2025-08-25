import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Simple SVG Icons
const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const RevIcon = () => (
  <div className="rev-icon">
    <div className="robot-head">
      <div className="robot-eyes">
        <div className="eye"></div>
        <div className="eye"></div>
      </div>
      <div className="robot-mouth"></div>
    </div>
  </div>
);

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Click to start talking');
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

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

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3001');
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setStatus('Ready to talk');
        console.log('WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        setStatus('Connection lost - refresh to reconnect');
        console.log('WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Connection error');
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      setStatus('Connection failed');
    }
  };

  const initializeSpeechAPIs = () => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('Listening...');
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        setStatus('Processing...');
        setIsListening(false);
        setIsProcessing(true);
        sendTextToAI(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        setStatus('Speech recognition error - try again');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (!isProcessing) {
          setStatus('Ready to talk');
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
        setStatus('Session active - Ready to talk');
        break;
        
      case 'text_response':
        setIsProcessing(false);
        speakResponse(data.text);
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
      }));
    }
  };

  const speakResponse = (text) => {
    if (synthRef.current) {
      // Stop any current speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatus('Rev is speaking...');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatus('Ready to talk');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        setStatus('Speech error - try again');
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const handleMicClick = () => {
    if (!isConnected) {
      setStatus('Not connected - refresh page');
      return;
    }
    
    if (isSpeaking) {
      // Stop speaking
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
      setStatus('Ready to talk');
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
        // Start session if not already started
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'start_session' }));
        }
        
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setStatus('Microphone error - check permissions');
      }
    } else {
      setStatus('Speech recognition not supported');
    }
  };

  const getMicButtonClass = () => {
    if (isListening) return 'mic-button listening';
    if (isProcessing) return 'mic-button processing';
    if (isSpeaking) return 'mic-button speaking';
    return 'mic-button';
  };

  const getStatusText = () => {
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Rev is speaking...';
    return status;
  };

  return (
    <div className="app">
      <div className="background-pattern"></div>
      
      <header className="app-header">
        <div className="revolt-logo">
          <img src="/revolt-logo.png" alt="Revolt" className="logo" onError={(e) => e.target.style.display = 'none'} />
          <span className="logo-text">REVOLT</span>
        </div>
      </header>

      <main className="app-main">
        <div className="talk-container">
          <div className="rev-avatar">
            <RevIcon />
          </div>
          
          <h1 className="talk-title">Talk to Rev</h1>
          
          <div className="mic-container">
            <button 
              className={getMicButtonClass()}
              onClick={handleMicClick}
              disabled={!isConnected && !isProcessing}
            >
              <MicIcon />
              {isListening && <div className="pulse-ring"></div>}
              {isProcessing && <div className="processing-ring"></div>}
              {isSpeaking && <div className="speaking-ring"></div>}
            </button>
          </div>
          
          <p className="status-text">{getStatusText()}</p>
          
          <div className="connection-status">
            <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;