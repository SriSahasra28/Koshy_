const Redis = require('ioredis');
const WebSocket = require('ws');

// Create TWO separate Redis clients - one for subscribe (blocking), one for queries
const redisSub = new Redis();  // used for pub/sub subscriptions
const redisClient = new Redis(); // available for other queries

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store connected WebSocket clients
const clients = new Set();

// Broadcast a message to all connected clients
function broadcast(payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(str);
      } catch (err) {
        console.error('WebSocket send failed:', err);
        clients.delete(client);
      }
    }
  }
}

// Handle WebSocket connection
wss.on('connection', (ws) => {
  console.log('[WS] New client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    clients.delete(ws);
  });
});

// Subscribe to both Redis channels
redisSub.subscribe('alerts', 'ohlc_live', (err, count) => {
  if (err) {
    console.error('[Redis] Failed to subscribe:', err);
  } else {
    console.log(`[Redis] Subscribed to ${count} channel(s): alerts, ohlc_live`);
  }
});

// Route messages by channel
redisSub.on('message', (channel, message) => {
  try {
    if (channel === 'alerts') {
      // Wrap alert messages so the client can identify them
      let parsed;
      try { parsed = JSON.parse(message); } catch { parsed = message; }
      broadcast(JSON.stringify({ type: 'alert', data: parsed }));
    } else if (channel === 'ohlc_live') {
      // ohlc_live messages already have type:'ohlc_live' set by Python
      broadcast(message);
    }
  } catch (err) {
    console.error('[Redis] Error handling message:', err);
  }
});

redisSub.on('error', (err) => {
  console.error('[Redis] Client error:', err);
});

console.log('[WS] WebSocket server running on ws://localhost:8080');
