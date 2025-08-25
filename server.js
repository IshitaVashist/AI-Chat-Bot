const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Universal system instructions for automatic language detection
const SYSTEM_INSTRUCTION = `You are a helpful assistant for Revolt Motors, an Indian electric vehicle company. You should only discuss topics related to:
- Revolt Motors products and services
- Electric vehicles and motorcycles
- Sustainable transportation
- Company information, dealerships, and support
- Technical specifications of Revolt bikes
- Charging infrastructure and battery technology

IMPORTANT LANGUAGE RULES:
1. AUTOMATICALLY DETECT the language of the user's input
2. ALWAYS RESPOND in the SAME LANGUAGE as the user's question
3. If user asks in English, respond in English
4. If user asks in Hindi (हिंदी), respond in Hindi
5. If user asks in any other language, try to respond in that language or fall back to English
6. Maintain the same language throughout the conversation unless the user switches

If users ask about topics unrelated to Revolt Motors or electric vehicles, politely redirect them back to Revolt Motors topics in the same language they used. Keep responses conversational and helpful.

Examples:
- User: "Tell me about RV400" → Respond in English
- User: "RV400 के बारे में बताइए" → Respond in Hindi
- User: "What is the range?" → Respond in English  
- User: "रेंज कितनी है?" → Respond in Hindi`;

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  let model = null;
  let chat = null;
  // Removed currentLanguage variable - now using auto-detection
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'start_session':
          await startSession(ws, 'auto');
          break;
          
        case 'text_input':
          if (chat) {
            await handleTextInput(ws, message.text);
          } else {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Session not started. Please start session first.' 
            }));
          }
          break;
          
        case 'end_session':
          chat = null;
          model = null;
          ws.send(JSON.stringify({ type: 'session_ended' }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    chat = null;
    model = null;
  });
  
  async function startSession(clientWs, language = 'auto') {
    try {
      model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION, // Use universal instruction
      });
      
      chat = model.startChat({
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });
      
      // Send session started notification (no initial greeting to avoid language assumption)
      clientWs.send(JSON.stringify({ 
        type: 'session_started',
        language: language
      }));
      
      console.log(`Session started successfully with auto-language detection`);
      
    } catch (error) {
      console.error('Error starting session:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Failed to start session: ' + error.message
      }));
    }
  }
  
  async function handleTextInput(clientWs, text) {
    try {
      console.log('Processing text input with auto-language detection:', text);
      
      // Let AI auto-detect language and respond accordingly
      const result = await chat.sendMessage(text);
      const response = await result.response;
      const responseText = response.text();
      
      // Simple language detection for TTS (check if response contains Hindi characters)
      const containsHindi = /[\u0900-\u097F]/.test(responseText);
      const detectedLanguage = containsHindi ? 'hi' : 'en';
      
      console.log(`AI Response (detected: ${detectedLanguage}):`, responseText);
      
      // Send text response with detected language for proper TTS
      clientWs.send(JSON.stringify({
        type: 'text_response',
        text: responseText,
        language: detectedLanguage,
        autoDetected: true
      }));
      
    } catch (error) {
      console.error('Error processing text input:', error);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process input: ' + error.message
      }));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Language support endpoint
app.get('/languages', (req, res) => {
  res.json({
    mode: 'auto-detection',
    supported_languages: ['en', 'hi', 'auto'],
    note: 'AI automatically detects and responds in the same language as user input'
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Language mode: Auto-detection enabled (English/Hindi)');
});

module.exports = { app, server };
