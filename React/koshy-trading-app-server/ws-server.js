const Redis = require('ioredis');
const WebSocket = require('ws');

// Create a new Redis client
const redis = new Redis(); // defaults to localhost:6379

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 }); // Listening on port 8080

// Store connected WebSocket clients
const clients = new Set();

// Handle WebSocket connection
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Subscribe to the 'alerts' channel
redis.subscribe('alerts', (err, count) => {
  if (err) {
    console.error('Failed to subscribe:', err);
  } else {
    console.log(`Subscribed to ${count} channel(s). Listening for 'alerts'...`);
  }
});

// Handle incoming messages from the 'alerts' channel
redis.on('message', (channel, message) => {
  console.log(`Received message from channel ${channel}:`, message);

  // Notify all connected WebSocket clients
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      console.log('sent message');
    }
  }
});

// Handle Redis client errors
redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

console.log('WebSocket server is running on ws://localhost:8080');
