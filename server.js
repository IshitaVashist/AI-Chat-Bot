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

// System instructions for Revolt Motors
const SYSTEM_INSTRUCTION = `You are a helpful assistant for Revolt Motors, an Indian electric vehicle company. You should only discuss topics related to:
- Revolt Motors products and services
- Electric vehicles and motorcycles
- Sustainable transportation
- Company information, dealerships, and support
- Technical specifications of Revolt bikes
- Charging infrastructure and battery technology

If users ask about topics unrelated to Revolt Motors or electric vehicles, politely redirect them back to Revolt Motors topics. Keep responses conversational and helpful.`;

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  let model = null;
  let chat = null;
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'start_session':
          await startSession(ws);
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
  
  async function startSession(clientWs) {
    try {
      model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash', // Using text model instead of audio for better compatibility
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      
      chat = model.startChat({
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });
      
      // Notify client that session is ready
      clientWs.send(JSON.stringify({ type: 'session_started' }));
      console.log('Session started successfully');
      
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
      console.log('Processing text input:', text);
      
      const result = await chat.sendMessage(text);
      const response = await result.response;
      const responseText = response.text();
      
      console.log('AI Response:', responseText);
      
      // Send text response to client
      clientWs.send(JSON.stringify({
        type: 'text_response',
        text: responseText
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };