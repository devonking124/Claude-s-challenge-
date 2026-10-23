'use strict';
// Wega's Challenge: The Idol - multiplayer server.
// Serves the game files, runs an MQTT-over-WebSocket relay at /mqtt that only carries the
// game's own topics, and runs the shared run for each server room (WEGA-1 ... WEGA-6): START
// starts it for everyone in the room, and every Lil' Guy collected counts for everyone.
// Runs anywhere with Node 20+ (Render, Fly.io, Railway, a VPS, your PC).
//   npm install && npm start          -> http://localhost:8080
// The game asks this server for /wega-relay.json and connects to it automatically.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, createWebSocketStream } = require('ws');
const { Aedes } = require('aedes');
const WegaShared = require('./authority.js');

const PORT = Number(process.env.PORT) || 8080;
const ROOT = path.resolve(process.env.GAME_DIR || path.join(__dirname, '..'));
const NS = 'wega-idol-vr/';            // the only topic prefix this relay carries
const MAX_CLIENTS = Number(process.env.MAX_CLIENTS) || 300;
const MAX_PAYLOAD = 2048;              // bytes per message
const MAX_MSGS_PER_SEC = 40;           // per client
const ROOMS = ['WEGA-1', 'WEGA-2', 'WEGA-3', 'WEGA-4', 'WEGA-5', 'WEGA-6'];
const ROOM_NS = 'wega-idol-vr/v1/s/';
const FILES = {
  '/index.html': 'text/html; charset=utf-8',
  '/wega-music.js': 'text/javascript; charset=utf-8',
  '/wega-music-lap3.js': 'text/javascript; charset=utf-8',
  '/wega-music-lap4.js': 'text/javascript; charset=utf-8',
  '/wega-music-lap5.js': 'text/javascript; charset=utf-8',
  '/wega-music-chase5.js': 'text/javascript; charset=utf-8',
  '/wega-music-boss.js': 'text/javascript; charset=utf-8',
  '/README.md': 'text/markdown; charset=utf-8',
};

async function main() {
  const broker = await Aedes.createBroker({ id: 'wega-relay' });
  const rate = new Map();
  broker.authorizePublish = (client, packet, cb) => {
    if (!packet.topic.startsWith(NS) || packet.retain || packet.payload.length > MAX_PAYLOAD) return cb(new Error('denied'));
    // only this server speaks for the shared runs: a player's own /auth goes nowhere (an error would disconnect them)
    if (client && packet.topic.endsWith('/auth')) packet.topic = NS + 'dropped';
    if (client) {
      const now = Date.now();
      let r = rate.get(client.id);
      if (!r || now - r.t >= 1000) { r = { t: now, n: 0 }; rate.set(client.id, r); }
      if (++r.n > MAX_MSGS_PER_SEC) return cb(new Error('rate limited'));
    }
    cb(null);
  };
  broker.authorizeSubscribe = (client, sub, cb) => cb(null, sub.topic.startsWith(NS) ? sub : null);
  broker.on('clientDisconnect', (c) => rate.delete(c.id));

  // ---- shared runs: one authority per room ----
  const rooms = new Map();
  for (const name of ROOMS) {
    rooms.set(name, new WegaShared.Room(name, {
      src: 'srv', now: () => Date.now(),
      publish: (text) => broker.publish({ cmd: 'publish', topic: ROOM_NS + name + '/auth', payload: Buffer.from(text), qos: 0, retain: false }, () => {}),
    }));
  }
  const feed = (kind) => (packet, done) => {
    try {
      const room = rooms.get(packet.topic.split('/')[3]);
      if (room && packet.payload.length <= MAX_PAYLOAD) {
        const msg = JSON.parse(packet.payload.toString('utf8'));
        if (kind === 'req') room.handle(msg); else room.hello(msg);
      }
    } catch (e) { /* bad message: ignore */ }
    done();
  };
  broker.subscribe(ROOM_NS + '+/req', feed('req'), () => {});
  broker.subscribe(ROOM_NS + '+/hi', feed('hi'), () => {});
  const ticker = setInterval(() => { for (const r of rooms.values()) r.tick(); }, 100);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = url.pathname === '/' ? '/index.html' : url.pathname;
    if (p === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok'); return; }
    if (p === '/wega-relay.json') {
      // point the game at this server's own relay (works behind https proxies too)
      const proto = String(req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim();
      const body = JSON.stringify({ relays: [`${proto === 'https' ? 'wss' : 'ws'}://${req.headers.host}/mqtt`], name: 'own server' });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(body); return;
    }
    const type = FILES[p];
    if (!type || req.method !== 'GET') { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
    fs.readFile(path.join(ROOT, p), (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': p.startsWith('/wega-music') ? 'public, max-age=86400' : 'no-cache' });
      res.end(data);
    });
  });

  const wss = new WebSocketServer({
    server, path: '/mqtt', maxPayload: 4096,
    handleProtocols: (protocols) => (protocols.has('mqtt') ? 'mqtt' : false),
  });
  wss.on('connection', (ws, req) => {
    if (wss.clients.size > MAX_CLIENTS) { ws.close(1013, 'server full'); return; }
    const stream = createWebSocketStream(ws);
    stream.on('error', () => {});
    broker.handle(stream, req);
  });

  server.listen(PORT, () => console.log(`Wega's Challenge server: http://localhost:${PORT}  (relay at /mqtt, game files from ${ROOT})`));
  const stop = () => { clearInterval(ticker); wss.close(); broker.close(() => server.close(() => process.exit(0))); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
main().catch((e) => { console.error(e); process.exit(1); });
