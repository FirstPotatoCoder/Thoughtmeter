import mqtt from 'mqtt';

/**
 * RoomService - Realtime Synchronization Engine
 *
 * Connects the Presenter (laptop) and Attendees (mobile phones).
 * - On Local LAN: Uses Vite's zero-config WebSocket relay (/thoughtmeter-relay).
 * - On Cloud (Vercel, GitHub Pages, etc.): Uses MQTT over Secure WebSockets (WSS).
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const CLOUD_BROKER_URL =
  env.VITE_MQTT_BROKER_URL || 'wss://broker.emqx.io:8084/mqtt';
const CLOUD_USERNAME = env.VITE_MQTT_USERNAME || undefined;
const CLOUD_PASSWORD = env.VITE_MQTT_PASSWORD || undefined;
const CLOUD_TOPIC_PREFIX =
  env.VITE_MQTT_TOPIC_PREFIX || 'thoughtmeter';

export function isLocalEnvironment() {
  if (typeof window === 'undefined') return true;
  if (env.VITE_FORCE_CLOUD_REALTIME === 'true') return false;

  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)
  );
}

function getLocalRelayUrl() {
  if (typeof window === 'undefined') return '';
  const isHttps = window.location.protocol === 'https:';
  const wsProtocol = isHttps ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}/thoughtmeter-relay`;
}

/* =========================================================================
 * 1. LOCAL LAN WEBSOCKET RELAY SESSIONS (Zero-config for localhost & Wi-Fi)
 * ========================================================================= */

function createLocalHostSession(roomCode, initialSlide, deckTitle) {
  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const url = getLocalRelayUrl();
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
        // Suppress noisy network errors during reconnects
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

function joinLocalParticipantSession(roomCode) {
  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const url = getLocalRelayUrl();
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

/* =========================================================================
 * 2. CLOUD MQTT OVER SECURE WEBSOCKETS (Vercel, GitHub Pages, Production)
 * ========================================================================= */

function createCloudHostSession(roomCode, initialSlide, deckTitle) {
  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const prefix = CLOUD_TOPIC_PREFIX;
  const stateTopic = `${prefix}/${cleanCode}/state`;
  const voteTopic = `${prefix}/${cleanCode}/votes`;
  const reactionTopic = `${prefix}/${cleanCode}/reactions`;
  const presenceTopic = `${prefix}/${cleanCode}/presence/+`;
  const controlTopic = `${prefix}/${cleanCode}/control`;

  const voteListeners = new Set();
  const reactionListeners = new Set();
  const countListeners = new Set();
  const activeParticipants = new Set();

  let client = null;
  let currentSlideRef = initialSlide;
  let currentTitleRef = deckTitle || 'Presentation';

  const clientId = `host_${Math.random().toString(16).slice(2, 10)}`;

  try {
    client = mqtt.connect(CLOUD_BROKER_URL, {
      clientId,
      username: CLOUD_USERNAME,
      password: CLOUD_PASSWORD,
      keepalive: 30,
      reconnectPeriod: 2000,
      clean: true,
    });

    client.on('connect', () => {
      client.subscribe([voteTopic, reactionTopic, presenceTopic], (err) => {
        if (!err && currentSlideRef) {
          client.publish(
            stateTopic,
            JSON.stringify({
              slide: currentSlideRef,
              deckTitle: currentTitleRef,
              updatedAt: Date.now(),
            }),
            { retain: true, qos: 1 },
          );
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());

        if (topic === voteTopic) {
          for (const fn of voteListeners) fn(payload);
        } else if (topic === reactionTopic) {
          for (const fn of reactionListeners) fn(payload.reactionType || 'thumbsUp');
        } else if (topic.startsWith(`${prefix}/${cleanCode}/presence/`)) {
          const participantId = topic.split('/').pop();
          if (payload.status === 'online') {
            activeParticipants.add(participantId);
          } else {
            activeParticipants.delete(participantId);
          }
          for (const fn of countListeners) fn(activeParticipants.size);
        }
      } catch {
        // ignore parse error
      }
    });

    client.on('error', () => {
      // Suppress noisy network errors
    });
  } catch (err) {
    console.error('Cloud host connection error:', err);
  }

  return {
    updateSlide(slide, title) {
      currentSlideRef = slide;
      if (title) currentTitleRef = title;

      if (client && client.connected) {
        client.publish(
          stateTopic,
          JSON.stringify({
            slide,
            deckTitle: currentTitleRef,
            updatedAt: Date.now(),
          }),
          { retain: true, qos: 1 },
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
      if (client) {
        try {
          client.publish(controlTopic, JSON.stringify({ type: 'HOST_DISCONNECTED' }), { qos: 1 });
          client.publish(stateTopic, '', { retain: true });
          client.end(true);
        } catch {
          // Ignore error on close
        }
      }
      voteListeners.clear();
      reactionListeners.clear();
      countListeners.clear();
    },
  };
}

function joinCloudParticipantSession(roomCode) {
  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const prefix = CLOUD_TOPIC_PREFIX;
  const stateTopic = `${prefix}/${cleanCode}/state`;
  const voteTopic = `${prefix}/${cleanCode}/votes`;
  const reactionTopic = `${prefix}/${cleanCode}/reactions`;
  const controlTopic = `${prefix}/${cleanCode}/control`;

  const participantId = `p_${Math.random().toString(16).slice(2, 10)}`;
  const myPresenceTopic = `${prefix}/${cleanCode}/presence/${participantId}`;

  const slideListeners = new Set();
  const disconnectListeners = new Set();

  let client = null;

  try {
    client = mqtt.connect(CLOUD_BROKER_URL, {
      clientId: participantId,
      username: CLOUD_USERNAME,
      password: CLOUD_PASSWORD,
      keepalive: 30,
      reconnectPeriod: 2000,
      clean: true,
      will: {
        topic: myPresenceTopic,
        payload: JSON.stringify({ status: 'offline' }),
        qos: 1,
        retain: false,
      },
    });

    client.on('connect', () => {
      client.publish(myPresenceTopic, JSON.stringify({ status: 'online' }), { qos: 1 });
      client.subscribe([stateTopic, controlTopic]);
    });

    client.on('message', (topic, message) => {
      try {
        const raw = message.toString();
        if (!raw) return;
        const data = JSON.parse(raw);

        if (topic === stateTopic) {
          if (data.slide) {
            for (const fn of slideListeners) {
              fn({
                slide: data.slide,
                deckTitle: data.deckTitle,
              });
            }
          }
        } else if (topic === controlTopic) {
          if (data.type === 'HOST_DISCONNECTED') {
            for (const fn of disconnectListeners) fn();
          }
        }
      } catch {
        // ignore parse error
      }
    });

    client.on('error', () => {
      // Suppress noisy network errors
    });
  } catch (err) {
    console.error('Cloud participant connection error:', err);
  }

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
      if (client && client.connected) {
        client.publish(
          voteTopic,
          JSON.stringify({
            slideId,
            payload,
            participantId,
          }),
          { qos: 1 },
        );
      }
    },
    sendReaction(reactionType = 'thumbsUp') {
      if (client && client.connected) {
        client.publish(
          reactionTopic,
          JSON.stringify({
            reactionType,
            participantId,
          }),
          { qos: 0 },
        );
      }
    },
    close() {
      if (client) {
        try {
          client.publish(myPresenceTopic, JSON.stringify({ status: 'offline' }), { qos: 1 });
          client.end(true);
        } catch {
          // Ignore error on close
        }
      }
      slideListeners.clear();
      disconnectListeners.clear();
    },
  };
}

/* =========================================================================
 * 3. UNIFIED PUBLIC API (Auto-switches between LAN WebSocket & Cloud MQTT)
 * ========================================================================= */

export function createHostSession(roomCode, initialSlide, deckTitle) {
  if (isLocalEnvironment()) {
    return createLocalHostSession(roomCode, initialSlide, deckTitle);
  }
  return createCloudHostSession(roomCode, initialSlide, deckTitle);
}

export function joinParticipantSession(roomCode) {
  if (isLocalEnvironment()) {
    return joinLocalParticipantSession(roomCode);
  }
  return joinCloudParticipantSession(roomCode);
}
