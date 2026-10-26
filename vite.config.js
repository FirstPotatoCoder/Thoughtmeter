import os from 'node:os';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { WebSocketServer } from 'ws';

/**
 * Detect primary local IPv4 address for zero-config Wi-Fi LAN hosting.
 */
function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Thoughtmeter Realtime WebSocket Relay Plugin for LAN & Local Dev.
 * Attaches directly to Vite's HTTP server on `/thoughtmeter-relay`.
 * Enables instant, zero-configuration local multi-device sync between
 * teacher laptops and student smartphones on the same Wi-Fi.
 */
function thoughtmeterRelayPlugin() {
  return {
    name: 'thoughtmeter-relay-plugin',
    configureServer(server) {
      if (!server.httpServer) return;

      // Endpoint to provide clients with the host's LAN IP address
      server.middlewares.use((req, res, next) => {
        if (req.url === '/thoughtmeter-lan-info') {
          const lanIp = getLanIp();
          const port = server.config.server.port || 5173;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ lanIp, port }));
          return;
        }
        next();
      });

      const wss = new WebSocketServer({ noServer: true });
      const rooms = new Map();
      const roomStates = new Map();

      server.httpServer.on('upgrade', (request, socket, head) => {
        try {
          const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
          if (url.pathname === '/thoughtmeter-relay') {
            wss.handleUpgrade(request, socket, head, (ws) => {
              wss.emit('connection', ws, request);
            });
          }
        } catch {
          // Ignore unrelated upgrade requests
        }
      });

      wss.on('connection', (ws) => {
        let boundRoom = null;
        let isHost = false;

        const broadcastToRoom = (roomCode, message, excludeWs = null) => {
          const clients = rooms.get(roomCode);
          if (!clients) return;
          const payload = typeof message === 'string' ? message : JSON.stringify(message);
          for (const client of clients) {
            if (client !== excludeWs && client.readyState === 1) {
              client.send(payload);
            }
          }
        };

        const updateParticipantCount = (roomCode) => {
          const state = roomStates.get(roomCode);
          const clients = rooms.get(roomCode);
          if (state?.hostWs?.readyState === 1 && clients) {
            const count = Math.max(0, clients.size - 1);
            state.hostWs.send(JSON.stringify({ type: 'PARTICIPANT_COUNT', count }));
          }
        };

        ws.on('message', (raw) => {
          try {
            const data = JSON.parse(raw.toString());
            const { type, roomCode } = data;
            const cleanCode = (roomCode || '').replace(/\s+/g, '');

            if (type === 'HOST_ROOM') {
              boundRoom = cleanCode;
              isHost = true;
              if (!rooms.has(cleanCode)) rooms.set(cleanCode, new Set());
              rooms.get(cleanCode).add(ws);
              roomStates.set(cleanCode, {
                slide: data.slide,
                deckTitle: data.deckTitle,
                hostWs: ws,
              });
              ws.send(JSON.stringify({ type: 'HOST_ACK', roomCode: cleanCode }));
              updateParticipantCount(cleanCode);
            } else if (type === 'JOIN_ROOM') {
              boundRoom = cleanCode;
              isHost = false;
              if (!rooms.has(cleanCode)) rooms.set(cleanCode, new Set());
              rooms.get(cleanCode).add(ws);

              const state = roomStates.get(cleanCode);
              if (state) {
                ws.send(
                  JSON.stringify({
                    type: 'ROOM_STATE',
                    roomCode: cleanCode,
                    slide: state.slide,
                    deckTitle: state.deckTitle,
                  }),
                );
              }
              updateParticipantCount(cleanCode);
            } else if (type === 'UPDATE_SLIDE') {
              const state = roomStates.get(cleanCode);
              if (state) {
                state.slide = data.slide;
                if (data.deckTitle) state.deckTitle = data.deckTitle;
              }
              broadcastToRoom(
                cleanCode,
                {
                  type: 'SLIDE_CHANGE',
                  slide: data.slide,
                  deckTitle: data.deckTitle,
                },
                ws,
              );
            } else if (type === 'SUBMIT_VOTE') {
              const state = roomStates.get(cleanCode);
              if (state?.hostWs?.readyState === 1) {
                state.hostWs.send(
                  JSON.stringify({
                    type: 'NEW_VOTE',
                    slideId: data.slideId,
                    payload: data.payload,
                  }),
                );
              }
            } else if (type === 'SEND_REACTION') {
              const state = roomStates.get(cleanCode);
              if (state?.hostWs?.readyState === 1) {
                state.hostWs.send(
                  JSON.stringify({
                    type: 'REACTION',
                    reactionType: data.reactionType || 'thumbsUp',
                  }),
                );
              }
            }
          } catch (err) {
            console.error('Relay error:', err);
          }
        });

        ws.on('close', () => {
          if (boundRoom && rooms.has(boundRoom)) {
            rooms.get(boundRoom).delete(ws);
            if (isHost) {
              broadcastToRoom(boundRoom, { type: 'HOST_DISCONNECTED' });
              roomStates.delete(boundRoom);
            } else {
              updateParticipantCount(boundRoom);
            }
            if (rooms.get(boundRoom).size === 0) {
              rooms.delete(boundRoom);
            }
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), thoughtmeterRelayPlugin()],
  base: './',
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) by default
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
  define: {
    __DEV_LAN_IP__: JSON.stringify(getLanIp()),
  },
});
