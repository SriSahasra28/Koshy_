/**
 * Minimal Redis publisher for the Node server (uses ioredis — matches ws-server.js).
 * Only used for publish() calls (e.g. new_symbol events).
 * The Python side (tick_zerodha.py) subscribes via Redis pub/sub.
 */
const Redis = require('ioredis');

// A dedicated publisher client (separate from ws-server's subscriber)
const redisPublisher = new Redis();

redisPublisher.on('error', (err) => {
    console.error('[Redis Publisher] Error:', err.message);
});

/**
 * Publish a message to a Redis channel.
 * @param {string} channel
 * @param {string} message
 * @returns {Promise<number>} number of subscribers that received the message
 */
async function publish(channel, message) {
    return redisPublisher.publish(channel, message);
}

module.exports = { publish };
