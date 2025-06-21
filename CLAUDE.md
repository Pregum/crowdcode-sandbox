# YouTube Live × Gemini Flash × Mastra PoC

## Overview
This project implements a minimal proof-of-concept that processes YouTube Live chat messages through Gemini 2.5 Flash with function calling, broadcasting tool calls via WebSocket to a browser overlay with a moveable block on a grid.

## Architecture
1. **YouTube Live Chat** → Natural language input (e.g., "右に一マス動かして")
2. **Gemini 2.5 Flash** → Function calling with JSON response format
3. **Mastra Agent** → Tool execution framework
4. **WebSocket Server** → Broadcasts state and operations on port 8765
5. **Browser Overlay** → 20×15 grid canvas with real-time updates

## Key Components
- `src/tools/moveBlock.ts` - Mastra tool for block movement
- `src/agent.ts` - Mastra agent configuration with Gemini Flash
- `src/bridge.ts` - YouTube chat listener and agent integration
- `src/server.ts` - WebSocket server with authoritative game state
- `public/index.html` - Canvas overlay with operation logs

## Setup
1. Create `.env` file with:
   ```
   VIDEO_ID=your_youtube_video_id
   GOOGLE_API_KEY=your_gemini_api_key
   ```
2. Run `npm install`
3. Start with `mastra dev`
4. Open browser to view the overlay

## WebSocket Protocol
- State updates: `{ "type": "state", "state": { "x": N, "y": N } }`
- Operations: `{ "type": "op", "op": { "name": "move_block", "arguments": { "dx": N, "dy": N } } }`

## Development
- TypeScript with strict typing
- Vite for development server and HMR
- Mastra CLI for unified development experience