/**
 * RoomService - Realtime Synchronization Engine
 *
 * Connects the Presenter (laptop) and Attendees (mobile phones).
 * - On Local LAN: Uses Vite's zero-config WebSocket relay (/thoughtmeter-relay).
 * - On Production / GitHub Pages: Uses secure cloud WebSocket endpoint.
 */

function getRelayUrl() {
  if (typeof window === 'undefined') return '';

  const isHttps = window.location.protocol === 'https:';
  const wsProtocol = isHttps ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;

  // Local development / LAN Wi-Fi (e.g. 10.0.98.77 or localhost)
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);

  if (isLocal) {
    return `${wsProtocol}//${window.location.host}/thoughtmeter-relay`;
  }

  // Production fallback for GitHub Pages (or custom WebSocket relay endpoint)
  const customCloud = import.meta.env.VITE_REALTIME_WS_URL;
  if (customCloud) return customCloud;

  // Default to standard origin relay if reverse-proxied, else local
  return `${wsProtocol}//${window.location.host}/thoughtmeter-relay`;
}

/**
 * Presenter (Host) Session
 * Broadcasts active slide, questions, choices; receives live audience votes and reactions.
 */
export function createHostSession(roomCode, initialSlide, deckTitle) {
  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const url = getRelayUrl();
  let ws = null;
  let isClosed = false;

  const voteListeners = new Set();
  const reactionListeners = new Set();
  const countListeners = new Set();

  function connect() {
    if (isClosed || !url) return;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'HOST_ROOM',
            roomCode: cleanCode,
            deckTitle: deckTitle || 'Presentation',
            slide: initialSlide || null,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_VOTE') {
            for (const fn of voteListeners) fn(data);
          } else if (data.type === 'REACTION') {
            for (const fn of reactionListeners) fn(data.reactionType || 'thumbsUp');
          } else if (data.type === 'PARTICIPANT_COUNT') {
            for (const fn of countListeners) fn(data.count || 0);
          }
        } catch (err) {
          console.error('Failed to parse host message:', err);
        }
      };

      ws.onerror = () => {
        // Suppress noisy console errors during network switches
      };

      ws.onclose = () => {
        if (!isClosed) {
          setTimeout(connect, 2000);
        }
      };
    } catch (err) {
      console.error('Host connection error:', err);
    }
  }

  connect();

  return {
    updateSlide(slide, title) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'UPDATE_SLIDE',
            roomCode: cleanCode,
            slide,
            deckTitle: title || deckTitle,
          }),
        );
      }
    },
    onVote(fn) {
      voteListeners.add(fn);
      return () => voteListeners.delete(fn);
    },
    onReaction(fn) {
      reactionListeners.add(fn);
      return () => reactionListeners.delete(fn);
    },
    onParticipantCount(fn) {
      countListeners.add(fn);
      return () => countListeners.delete(fn);
    },
    close() {
      isClosed = true;
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close error
        }
      }
      voteListeners.clear();
      reactionListeners.clear();
      countListeners.clear();
    },
  };
}

/**
 * Audience (Participant) Session
 * Connects mobile attendees to the presenter's active slide.
 */
export function joinParticipantSession(roomCode) {
  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const url = getRelayUrl();
  let ws = null;
  let isClosed = false;

  const slideListeners = new Set();
  const disconnectListeners = new Set();

  function connect() {
    if (isClosed || !url) return;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: cleanCode,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ROOM_STATE' || data.type === 'SLIDE_CHANGE') {
            for (const fn of slideListeners) {
              fn({
                slide: data.slide,
                deckTitle: data.deckTitle,
              });
            }
          } else if (data.type === 'HOST_DISCONNECTED') {
            for (const fn of disconnectListeners) fn();
          }
        } catch (err) {
          console.error('Failed to parse participant message:', err);
        }
      };

      ws.onerror = () => {
        // Suppress noisy network errors
      };

      ws.onclose = () => {
        if (!isClosed) {
          setTimeout(connect, 2000);
        }
      };
    } catch (err) {
      console.error('Participant connection error:', err);
    }
  }

  connect();

  return {
    onSlideChange(fn) {
      slideListeners.add(fn);
      return () => slideListeners.delete(fn);
    },
    onHostDisconnected(fn) {
      disconnectListeners.add(fn);
      return () => disconnectListeners.delete(fn);
    },
    submitVote(slideId, payload) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'SUBMIT_VOTE',
            roomCode: cleanCode,
            slideId,
            payload,
          }),
        );
      }
    },
    sendReaction(reactionType = 'thumbsUp') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'SEND_REACTION',
            roomCode: cleanCode,
            reactionType,
          }),
        );
      }
    },
    close() {
      isClosed = true;
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close error
        }
      }
      slideListeners.clear();
      disconnectListeners.clear();
    },
  };
}
