# Revolt Motors Voice Assistant

A real-time conversational voice interface built with the Gemini Live API, replicating the functionality of the Revolt Motors chatbot with voice capabilities.

## Features

- **Real-time Voice Conversation**: Natural voice interaction with AI assistant
- **Interruption Handling**: Users can interrupt the AI mid-response
- **Low Latency**: Fast response times (1-2 seconds)
- **Revolt Motors Focus**: AI assistant trained specifically for Revolt Motors topics
- **Clean UI**: Simple, functional interface with real-time indicators
- **WebSocket Communication**: Server-to-server architecture for optimal performance

## Tech Stack

### Backend
- **Node.js** with Express
- **WebSocket** for real-time communication
- **Gemini Live API** for voice processing
- **CORS** enabled for cross-origin requests

### Frontend
- **React** with Vite
- **Lucide React** for icons
- **Web Audio API** for audio processing
- **WebSocket** client for real-time communication

## Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Gemini API Key from [Google AI Studio](https://aistudio.google.com)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd revolt-voice-assistant
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment file and add your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Edit `backend/.env` with your actual Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
# Server will run on http://localhost:3001
```

### Start Frontend Development Server

```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:3000
```

## Usage

1. **Open the application** in your browser at `http://localhost:3000`
2. **Grant microphone permissions** when prompted
3. **Click "Start Session"** to initialize the Gemini Live connection
4. **Click "Start Recording"** to begin voice interaction
5. **Speak naturally** - ask questions about Revolt Motors, electric vehicles, etc.
6. **Interrupt the AI** by clicking "Interrupt AI" while it's speaking
7. **Stop recording** when you're done speaking

## API Key Setup

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a free account
3. Generate an API key
4. Add the key to your `backend/.env` file

### Model Selection

The project is configured to use different Gemini models based on your needs:

- **Production**: `gemini-2.5-flash-preview-native-audio-dialog` (rate limited)
- **Testing**: `gemini-live-2.5-flash-preview` (less rate limited)
- **Development**: `gemini-2.0-flash-live-001` (most permissive)

Change the model in `backend/server.js` line 67 as needed.

## System Instructions

The AI assistant is configured to only discuss topics related to:
- Revolt Motors products and services
- Electric vehicles and motorcycles
- Sustainable transportation
- Company information and support
- Technical specifications
- Charging infrastructure

## Project Structure

```
revolt-voice-assistant/
├── backend/
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── .env                # Environment variables
│   └── .env.example        # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.css         # Styling
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── index.html          # HTML template
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
└── README.md               # This file
```

## Features Implementation

### Voice Recording
- Uses Web Audio API for high-quality audio capture
- Real-time audio streaming to backend
- Visual indicators for recording state

### WebSocket Communication
- Bidirectional real-time communication
- Handles session management
- Error handling and reconnection

### Audio Playback
- Processes base64 encoded audio responses
- Handles audio playback with Web Audio API
- Visual indicators for AI speaking state

### Interruption System
- Allows users to interrupt AI responses
- Immediately stops current audio playback
- Sends interrupt signal to Gemini Live API

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Ensure browser permissions are granted
   - Try refreshing the page and allowing microphone access

2. **WebSocket Connection Failed**
   - Check if backend server is running
   - Verify port 3001 is not blocked
   - Check console for error messages

3. **API Rate Limits**
   - Switch to a different Gemini model for testing
   - Monitor your API usage in Google AI Studio

4. **Audio Playback Issues**
   - Check browser audio permissions
   - Ensure speakers/headphones are connected
   - Verify audio context initialization

### Development Tips

- Use browser developer tools to monitor WebSocket messages
- Check backend console logs for API responses
- Test with different Gemini models during development
- Monitor network traffic for debugging

## Deployment

### Backend Deployment
- Deploy to services like Heroku, Railway, or DigitalOcean
- Ensure environment variables are set
- Configure CORS for your frontend domain

### Frontend Deployment
- Build the production version: `npm run build`
- Deploy to Netlify, Vercel, or similar static hosting
- Update WebSocket URL to point to your backend domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the Gemini Live API documentation
3. Open an issue in the repository