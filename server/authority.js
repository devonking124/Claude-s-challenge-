/* global module */
// =====================================================================================
// SHARED RUNS — the authority for one server room (WEGA-1 ... WEGA-6).
// It owns the run everyone on that server plays together: which stage the run is at,
// which Lil' Guys have been collected (one collect counts for everyone), the lap 2-5 timer,
// who grabbed the idol, the chase clock (everyone's collapse follows it; the Lap 5 chase lasts exactly
// as long as its song), the WEGA FACE boss at the end of the Lap 5 chase (its phases, health, the seed its
// attacks are drawn from and the 1v1 duel queue), who is dead (spectating until the next lap / chase /
// boss phase; if everyone is down the stage restarts), and who escaped. It also owns the lobby: the first
// player to join is the owner (the next earliest takes over if they leave), and only the owner can START
// and change the lobby settings (game mode, difficulty, how many laps, run modifiers). The game modes: CLASSIC (the
// laps, the chase, WEGA FACE), RORY'S CHALLENGE (one huge map, 500+ Lil' Guys, the whole run on its song's
// clock: the timer is the song, anyone who is down is back at the song's next section, Shoebench when it ends) and
// ENDLESS (floor after floor of small maps full of Green Guys: the beacon takes everyone to the next floor, every 5th
// floor ends in the shop, anyone who is down is back on the next floor, and when everyone is down the run is over).
// The real server
// (server/server.js) runs one per room; on a public relay the game itself runs one in the player with the
// lowest id (and hands it over if they leave). Plain JS, no dependencies: the same file is inlined into index.html.
//
// Clients publish requests on  wega-idol-vr/v1/s/<ROOM>/req  and heartbeats on .../hi,
// the authority publishes the room snapshot on  .../auth  (on every change + once a second).
// =====================================================================================
const WegaShared = (() => {
  const TOTAL = 207, LAP_TOTAL = 330;     // Lil' Guys per lap (the owner's difficulty can ask for more)
  const MAX_TOTAL = 720;                  // ...and in RORY'S CHALLENGE (500+)
  const MAX_LAP = 5;
  const MODES = ['classic', 'rory', 'endless'];      // the game modes the lobby owner picks from
  // RORY'S CHALLENGE (stage 'rory', then 'roryexit' once every Lil' Guy is in): the song starts RORY_LEAD s after
  // START (the count-in) and the timer ends with its last bar; then Shoebench. RORY_SECTIONS: where the song's
  // sections start (s into it); anyone who is down comes back when it moves on to the next one (in overtime: every 8 bars).
  const RORY_LAP = 6, RORY_LEAD = 4.2, RORY_LEN = 278.28, RORY_BAR = 240 / 145;
  const RORY_SECTIONS = [0.21, 13.45, 26.69, 53.17, 79.66, 106.14, 132.62, 144.21, 159.10, 212.07, 251.79, 265.04];
  function rorySection(t) {
    if (t < RORY_SECTIONS[0]) return -1;
    if (t >= RORY_LEN) return RORY_SECTIONS.length + Math.floor((t - RORY_LEN) / (RORY_BAR * 8));
    let i = 0; while (i + 1 < RORY_SECTIONS.length && t >= RORY_SECTIONS[i + 1]) i++;
    return i;
  }
  // ENDLESS (stage 'endless', then 'endexit' once every Green Guy on the floor is in, then the next floor; after every
  // SHOP_EVERY-th floor 'eshop': everyone shops at once, SHOP_TIME s at most, or until everyone is READY). Its lap code
  // is END_LAP; the floor is fl. Green Guys: 40 a floor, 12 more every 10 floors, 100 at most (the map grows with them).
  const END_LAP = 7, SHOP_EVERY = 5, SHOP_TIME = 45;
  const endGreen = (fl) => Math.min(100, 40 + 12 * Math.floor((Math.max(1, fl) - 1) / 10));
  const MOD_MAX = 0xffff;                 // run modifier bits (the game decides what each one does)
  const DIFFS = ['chill', 'normal', 'hard', 'wega'];
  const BONUS = 3, BONUS_EVERY = 25;      // laps 2-4: +3 s on the shared timer every 25 collected
  const CUT_DELAY = 4.2;        // the lap cutscene plays before the lap timer matters
  const RUNNER_TIMEOUT = 12000; // ms without a heartbeat -> no longer in the run / on the server
  const WIPE_WAIT = 12;         // s: everyone down in a chase / the boss fight -> everyone spectates this long, then it starts over
  const EMPTY_RESET = 15000;    // ms with nobody left in the run -> back to idle
  const FINISH_AFTER_WIN = 90000, ESCAPE_MAX = 240000, ESCAPE_MAX_BOSS = 3600000, DONE_HOLD = 4000;
  // the Lap 5 chase lasts exactly as long as FORGET ME NOT (wega-music-chase5.js): then WEGA FACE takes the exit
  const CHASE5_LEN = 194.3;
  // WEGA FACE: phase 1 (the flying face) and phase 2 (WEGA MAN) can't go down before their minimum time, however
  // many players hit them; phase 3 is a 1v1 duel for every player in turn. Together: at least 10 minutes.
  const BOSS_MIN = [0, 245, 215];         // seconds (after the phase intro)
  const BOSS_INTRO = [0, 8, 10, 0];       // the phase's entrance (no hits yet)
  const BOSS_HITS = [0, 12, 10, 6];       // hits to win a phase (phase 3: hits to win one duel)
  const DUEL_MIN = 40, DUEL_POOL = 150, DUEL_GAP = 6, DUEL_INTRO = 4;
  const DUEL_CHARS = 8;                   // rory, shoebench, screamer, diver, glitch, urio, shadow, wegahead
  const NAME_MAX = 16;
  // a tiny filter so names shown to other players stay friendly
  const BLOCK = ['FUCK', 'SHIT', 'CUNT', 'NIGG', 'FAGG', 'BITCH', 'WHORE', 'SLUT', 'RAPE', 'NAZI', 'HITLER', 'PENIS', 'VAGINA', 'PUSSY', 'COCK', 'DICK', 'PORN', 'RETARD', 'TWAT', 'WANK', 'ASSHOLE', 'KYS'];

  function cleanName(s) {
    return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9 '!.-]/g, '').replace(/\s+/g, ' ').replace(/^ /, '').slice(0, NAME_MAX);
  }
  function nameAllowed(s) {
    const t = String(s).replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E').replace(/4/g, 'A').replace(/5/g, 'S').replace(/7/g, 'T').replace(/[^A-Z]/g, '');
    return !BLOCK.some((w) => t.includes(w));
  }
  // "NAME #12" from a request / heartbeat
  function label(n, k) {
    let name = cleanName(n).trim();
    if (!name || !nameAllowed(name)) name = 'PLAYER';
    return Number.isInteger(k) && k >= 0 && k < 100 ? name + ' #' + k : name;
  }
  const okId = (i) => typeof i === 'string' && i.length > 0 && i.length <= 16;
  function clampNum(v, lo, hi, def) { return typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; }
  // a stable hash in [0, 1) so every client (and the authority) draws the same thing from the same seed
  function hash01(a, b, c = 0) {
    let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b) ^ Math.imul((c | 0) + 0x27d4eb2f, 0xc2b2ae35)) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }

  // ---------------- WEGA FACE: the boss at the end of the Lap 5 chase (pure logic, times in ms) ----------------
  // p 1: WEGA FACE flies round the arena; p 2: WEGA MAN bursts out of it; p 3: every player 1v1s a random
  // character in turn while the others watch; p 4: down (the exit is free). A hit is one core / bonk / duel core.
  // The boss can only take hits as fast as its minimum time allows (allowed()), so more players never make it
  // shorter. Offline the game runs the same class for its solo fight.
  class Boss {
    constructor(seed, now, ids) { this.seed = seed | 0; this.round = 0; this.q = []; this.di = 0; this.dw = 0; this.dt0 = 0; this.setPhase(1, now, ids); }
    setPhase(p, now, ids) {
      this.p = p; this.t0 = now; this.bm = BOSS_HITS[Math.min(3, p)] || 0; this.bh = this.bm;
      if (p === 3) { this.round++; this.q = (ids || []).slice(0, 16); this.di = 0; this.dw = 0; this.dt0 = now + DUEL_GAP * 1000; }
    }
    // a duel's minimum: phase 3 as a whole always takes at least DUEL_POOL seconds, however many duels it has
    // (or however fast the earlier ones ended), and every duel at least DUEL_MIN
    duelMin() { const spent = (this.dt0 - this.t0) / 1000 + DUEL_INTRO; return Math.max(DUEL_MIN, (DUEL_POOL - spent) / Math.max(1, this.q.length - this.di)); }
    duelist() { return this.p === 3 && this.di < this.q.length ? this.q[this.di] : ''; }
    dc() { return Math.floor(hash01(this.seed, 700 + this.round * 31 + this.di, 5) * DUEL_CHARS); }
    // seconds into the phase's hits (after its intro); phase 3: into the current duel (negative during the break)
    age(now) { return this.p === 3 ? (now - this.dt0) / 1000 - DUEL_INTRO : (now - this.t0) / 1000 - BOSS_INTRO[this.p]; }
    allowed(now) {
      const a = this.age(now); if (a < 0) return 0;
      const min = this.p === 3 ? this.duelMin() : BOSS_MIN[this.p];
      return Math.min(this.bm, 1 + Math.floor((this.bm - 1) * a / min));
    }
    // a hit: returns '' (refused), 'hit', 'phase' (the next phase starts), 'duel' (a duel was won), 'down'
    hit(p, c, who, now, ids) {
      if (this.p !== p || p > 3 || c !== this.bm - this.bh || this.bm - this.bh >= this.allowed(now)) return '';
      if (p === 3 && who !== this.duelist()) return '';
      this.bh--;
      if (this.bh > 0) return 'hit';
      if (p < 3) { this.setPhase(p + 1, now, ids); return 'phase'; }
      this.dw++;
      return this.nextDuel(now, ids) || 'duel';
    }
    // the current duel is over (won, lost or the duelist left): next one, or the end of the queue
    nextDuel(now, ids) {
      this.di++; this.bh = this.bm; this.dt0 = now + DUEL_GAP * 1000;
      if (this.di < this.q.length) return '';
      if (this.dw > 0) { this.p = 4; return 'down'; }
      this.setPhase(3, now, ids); return 'again';      // nobody won a duel: every player gets another go
    }
    restartPhase(now, ids) { if (this.p <= 2) { this.t0 = now; this.bh = this.bm; } else if (this.p === 3) this.setPhase(3, now, ids); }
    snap(now) {
      const s = { bp: this.p, bh: this.bh, bm: this.bm, bs: this.seed, ba: Math.round((now - this.t0) / 100) / 10 };
      if (this.p === 3) { s.dq = this.q.slice(); s.di = this.di; s.dw = this.dw; s.dr = this.round; s.dc = this.dc(); s.da = Math.round((now - this.dt0) / 100) / 10; }
      return s;
    }
    static from(s, now) {
      const b = new Boss(s.bs | 0, now, []);
      b.p = clampNum(s.bp | 0, 1, 4, 1); b.bm = BOSS_HITS[Math.min(3, b.p)] || 0; b.bh = clampNum(s.bh | 0, 0, b.bm, b.bm);
      b.t0 = now - clampNum(s.ba, 0, 1e6, 0) * 1000;
      if (b.p === 3 && Array.isArray(s.dq)) {
        b.q = s.dq.filter(okId).slice(0, 16); b.di = clampNum(s.di | 0, 0, 16, 0); b.dw = clampNum(s.dw | 0, 0, 16, 0); b.round = clampNum(s.dr | 0, 0, 1e6, 1);
        b.dt0 = now - clampNum(s.da, -60, 1e6, 0) * 1000;
      }
      return b;
    }
  }

  class Room {
    // publish(text): send a snapshot on the room's /auth topic. now(): milliseconds.
    constructor(name, o = {}) {
      this.name = name; this.src = o.src || 'srv';
      this.publish = o.publish || (() => {}); this.now = o.now || (() => Date.now());
      // everyone on this server, in the order they joined: id -> { t: last heartbeat, n: name }
      this.present = new Map();
      this.owner = ''; this.ld = 'normal'; this.ml = MAX_LAP; this.lm = 0; this.gm = 'classic';     // lobby: owner + settings (+ modifier bits, game mode)
      this.sq = 0; this.ev = [0, '', '', ''];
      this.dirty = false; this.lastPub = -1e9;
      this.reset(0);
    }
    reset(run) {
      this.ph = 'idle'; this.run = run; this.st = ''; this.lap = 0;
      this.tot = TOTAL; this.bits = new Uint8Array(Math.ceil(MAX_TOTAL / 8)); this.left = TOTAL; this.lapCount = 0;
      this.tEnd = 0; this.shoe = false; this.d = 'normal'; this.rml = MAX_LAP; this.md = 0; this.times = [0, 0, 150, 120, 105, 120];
      this.by = ''; this.gr = ''; this.runners = new Map(); this.startT = this.now(); this.escT = 0; this.winT = 0; this.doneT = 0; this.emptyT = 0;
      this.boss = null; this.bs = 0; this.lv = 0; this.wipeAt = 0;
      this.rgm = 'classic'; this.rT0 = 0; this.rsec = -1;      // the run's game mode; RORY'S CHALLENGE: when its clock started
      this.fl = 0; this.shopEnd = 0; this.ready = new Set();   // ENDLESS: the floor, the shop's deadline, who's done shopping
    }
    event(kind, who, id, extra) { this.ev = [this.ev[0] + 1, kind, who, id || '']; if (extra != null) this.ev.push(extra); }
    changed() { this.sq++; this.dirty = true; }
    runner(id, who) {
      let r = this.runners.get(id);
      if (!r) { r = { n: who, t: 0, won: false, dead: false }; this.runners.set(id, r); }
      r.t = this.now(); if (who) r.n = who;
      return r;
    }
    // everyone who is down comes back (a new lap, the chase, a boss phase, a duel, or a wipe)
    revive() { for (const r of this.runners.values()) r.dead = false; this.lv++; this.wipeAt = 0; }
    ids() { return [...this.runners.keys()]; }
    // someone is on the server (keeps their place in the join order)
    touch(id, who) {
      const p = this.present.get(id);
      if (p) { p.t = this.now(); if (who) p.n = who; return true; }
      if (this.present.size > 64) return false;
      this.present.set(id, { t: this.now(), n: who || 'PLAYER' });
      this.pickOwner();
      return true;
    }
    // the owner is whoever has been here the longest
    pickOwner() {
      const first = this.present.keys().next().value || '';
      if (first !== this.owner) {
        const had = !!this.owner; this.owner = first;
        if (first && had) this.event('owner', this.present.get(first).n, first);
        this.changed();
      }
    }
    ownerName() { const p = this.present.get(this.owner); return p ? p.n : ''; }
    // a lap: fresh Lil' Guys, and (laps 2-5) a fresh shared timer
    startLap(n, delay) {
      this.lap = n; this.st = 'lap' + n;
      this.bits.fill(0); this.left = this.tot; this.lapCount = 0; this.shoe = false;
      this.tEnd = n >= 2 ? this.now() + ((this.times[n] || 120) + delay) * 1000 : 0;
      this.revive();
    }
    // RORY'S CHALLENGE from the top: fresh Lil' Guys, the song (and so the timer) from the count-in
    startRory() {
      const now = this.now();
      this.lap = RORY_LAP; this.st = 'rory';
      this.bits.fill(0); this.left = this.tot; this.lapCount = 0; this.shoe = false; this.escT = 0;
      this.rT0 = now; this.rsec = -1; this.tEnd = now + (RORY_LEAD + RORY_LEN) * 1000;
    }
    roryAge() { return (this.now() - this.rT0) / 1000; }
    // ENDLESS: floor n (a fresh map: its Green Guys, everyone who is down is back)
    startFloor(n) {
      this.fl = n; this.lap = END_LAP; this.st = 'endless'; this.tot = endGreen(n);
      this.bits.fill(0); this.left = this.tot; this.lapCount = 0; this.shopEnd = 0; this.ready = new Set();
      this.revive();
    }
    // ...and through its beacon: the next floor, or the shop first
    nextFloor(who, id) {
      if (this.fl % SHOP_EVERY === 0 && this.st !== 'eshop') { this.st = 'eshop'; this.shopEnd = this.now() + SHOP_TIME * 1000; this.ready = new Set(); this.revive(); this.event('shop', who, id, this.fl); }
      else { this.startFloor(this.fl + 1); this.event('floor', who, id, this.fl); }
      this.changed();
    }
    // the stage everyone collects Lil' Guys on right now
    collecting() { return this.st === 'lap' + this.lap || this.st === 'rory' || this.st === 'endless'; }
    has(i) { return (this.bits[i >> 3] >> (i & 7)) & 1; }
    // WEGA FACE takes the exit: the Lap 5 chase's song is over
    startBoss(who, id) {
      const now = this.now();
      this.st = 'boss'; this.bs = Math.floor(Math.random() * 2147483646) + 1;
      this.boss = new Boss(this.bs, now, this.ids());
      this.revive();
      this.event('boss', who || '', id || '');
    }
    bossResult(res, who, id) {
      if (!res) return;
      if (res === 'hit') this.event('core', who, id, this.boss.bh);
      else if (res === 'phase') { this.revive(); this.event('phase', who, id, this.boss.p); }
      else if (res === 'duel') { this.revive(); this.event('duelwon', who, id, this.boss.di); }
      else if (res === 'again') { this.revive(); this.event('duelsagain', who, id); }
      else if (res === 'down') { this.revive(); this.st = 'freed'; this.event('bossdown', who, id); }
    }
    // everyone in the run is down: the stage starts over (Lil' Guys you already got stay got)
    // (in a chase or the boss fight everyone spectates for WIPE_WAIT first: see wipeNow)
    checkWipe() {
      if (this.ph !== 'run' || !this.runners.size || this.wipeAt) return;
      for (const r of this.runners.values()) if (!r.dead) return;
      if (this.rgm === 'endless') { this.st = 'done'; this.doneT = this.now(); this.event('over', '', '', this.fl); this.changed(); return; }   // ENDLESS: game over
      if (this.st === 'escape' || this.st === 'boss') { this.wipeAt = this.now() + WIPE_WAIT * 1000; this.event('wipewait', '', '', this.st); this.changed(); return; }
      this.wipeNow();
    }
    wipeNow() {
      const now = this.now(); this.wipeAt = 0;
      if (/^(lap|beacon)[1-5]$/.test(this.st)) { if (this.lap >= 2) { this.tEnd = now + ((this.times[this.lap] || 120) + CUT_DELAY) * 1000; this.shoe = false; } }
      else if (this.st === 'escape') this.escT = now;
      else if (this.st === 'boss' && this.boss) this.boss.restartPhase(now, this.ids());
      else if (this.st === 'rory' || this.st === 'roryexit') this.startRory();      // an endurance run: from the top
      else if (this.st !== 'chamber' && this.st !== 'freed') return;
      this.revive(); this.event('wipe', '', '', this.st);
      this.changed();
    }

    // heartbeat from any player on this server: { i, n, k, r }
    hello(m) {
      if (!m || !okId(m.i)) return;
      if (!this.touch(m.i, label(m.n, m.k))) return;
      if (this.ph !== 'run') return;
      if (m.r === this.run) { const fresh = !this.runners.has(m.i); this.runner(m.i, label(m.n, m.k)); if (fresh) this.changed(); }
      else if (this.runners.has(m.i)) { this.runners.delete(m.i); this.changed(); }
    }
    // a request from a player: { i, n, k(num), q(kind), run, lap, ... }
    handle(m) {
      if (!m || !okId(m.i) || typeof m.q !== 'string') return;
      const who = label(m.n, m.k), now = this.now();
      this.touch(m.i, who);
      const live = this.ph === 'run', mine = live && m.run === this.run, owner = m.i === this.owner;
      switch (m.q) {
        case 'cfg':                 // lobby settings: owner only
          if (!owner) return;
          if (MODES.includes(m.gm)) this.gm = m.gm;
          if (DIFFS.includes(m.ld)) this.ld = m.ld;
          if (Number.isInteger(m.ml) && m.ml >= 1 && m.ml <= MAX_LAP) this.ml = m.ml;
          if (Number.isInteger(m.lm) && m.lm >= 0 && m.lm <= MOD_MAX) this.lm = m.lm;
          this.changed();
          return;
        case 'start': {
          if (live && this.st !== 'done') { this.runner(m.i, who); this.changed(); return; }   // already going: you just join it
          if (!owner) return;                                                                   // only the owner starts runs
          this.reset(Math.floor(Math.random() * 2147483646) + 1);
          this.ph = 'run'; this.by = who; this.d = this.ld; this.rml = this.ml; this.md = this.lm; this.rgm = this.gm;
          const rory = this.rgm === 'rory';
          this.tot = Math.round(clampNum(m.tot, 50, rory ? MAX_TOTAL : LAP_TOTAL, rory ? 550 : TOTAL));
          this.times = [0, 0, clampNum(m.t2, 50, 400, 150), clampNum(m.t3, 50, 400, 120), clampNum(m.t4, 50, 400, 105), clampNum(m.t5, 50, 400, 120)];
          if (rory) { this.startRory(); this.revive(); } else if (this.rgm === 'endless') this.startFloor(1); else this.startLap(1, 0);
          this.startT = now;
          this.runner(m.i, who);
          this.event('start', who, m.i); this.changed();
          return;
        }
        case 'col': {
          if (!mine || m.lap !== this.lap || !this.collecting() || !Array.isArray(m.ix)) return;
          if (this.rgm === 'endless' && m.fl !== this.fl) return;                // (from a floor that's gone)
          this.runner(m.i, who);
          let got = 0;
          for (let k = 0; k < m.ix.length && k < 64; k++) {
            const i = m.ix[k];
            if (!Number.isInteger(i) || i < 0 || i >= this.tot || this.has(i)) continue;
            this.bits[i >> 3] |= 1 << (i & 7); this.left--; this.lapCount++; got++;
            // laps 2-5: +3 s now and then (RORY'S CHALLENGE: never - its timer is the song)
            if (this.lap >= 2 && this.lap <= MAX_LAP && !this.shoe && this.lapCount % BONUS_EVERY === 0) this.tEnd += BONUS * 1000;
          }
          if (!got) return;
          if (this.left <= 0) {
            this.left = 0;
            if (this.st === 'rory') { this.st = 'roryexit'; this.escT = now; } else if (this.st === 'endless') this.st = 'endexit'; else this.st = 'beacon' + this.lap;
            this.event('clear', who, m.i);
          }
          this.changed();
          return;
        }
        case 'portal':
          if (!mine || this.st !== 'beacon' + this.lap || this.lap >= this.rml || m.lap !== this.lap) return;
          this.runner(m.i, who);
          this.startLap(this.lap + 1, CUT_DELAY);
          this.event('portal', who, m.i, this.lap); this.changed();
          return;
        case 'floor':               // ENDLESS: someone went through the floor's beacon
          if (!mine || this.st !== 'endexit' || m.fl !== this.fl) return;
          this.runner(m.i, who);
          this.nextFloor(who, m.i);
          return;
        case 'ready': {             // ENDLESS: done shopping (when everyone is, the next floor starts)
          if (!mine || this.st !== 'eshop' || m.fl !== this.fl) return;
          this.runner(m.i, who); this.ready.add(m.i);
          if ([...this.runners.keys()].every((id) => this.ready.has(id))) this.nextFloor(who, m.i); else this.changed();
          return;
        }
        case 'beacon':
          if (!mine || !this.st.startsWith('beacon') || m.lap !== this.lap) return;
          this.runner(m.i, who);
          this.st = 'chamber'; this.tEnd = 0;
          this.event('beacon', who, m.i); this.changed();
          return;
        case 'grab':
          if (!mine || this.st !== 'chamber') return;
          this.runner(m.i, who);
          this.st = 'escape'; this.gr = who; this.escT = now; this.revive();
          this.event('grab', who, m.i); this.changed();
          return;
        case 'core': {              // a hit on WEGA FACE / WEGA MAN / your duel opponent (each counts once)
          if (!mine || this.st !== 'boss' || !this.boss || !Number.isInteger(m.c) || !Number.isInteger(m.p)) return;
          const r = this.runner(m.i, who); if (r.dead) return;
          this.bossResult(this.boss.hit(m.p, m.c, m.i, now, this.ids()), who, m.i);
          this.changed();
          return;
        }
        case 'dead': {              // you're down: you watch until the next lap / the chase / the next boss phase
          if (!mine || !/^(lap|beacon)[1-5]$|^chamber$|^escape$|^boss$|^rory$|^roryexit$|^endless$|^endexit$/.test(this.st)) return;
          const r = this.runner(m.i, who); if (r.dead) return;
          r.dead = true; this.event('dead', who, m.i, typeof m.by === 'string' ? m.by.slice(0, 12) : '');
          // a duelist who goes down loses the duel: the next player is up
          if (this.st === 'boss' && this.boss && this.boss.duelist() === m.i) { const res = this.boss.nextDuel(now, this.ids()); this.revive(); if (res) this.bossResult(res, who, m.i); else this.event('duellost', who, m.i, this.boss.di); }
          this.checkWipe(); this.changed();
          return;
        }
        case 'win': {              // escaped (or reached RORY'S CHALLENGE's exit)
          if (!mine || (this.st !== 'escape' && this.st !== 'freed' && this.st !== 'done' && this.st !== 'roryexit')) return;
          if (this.lap >= MAX_LAP && this.st === 'escape') return;          // Lap 5: WEGA FACE has the exit until it's beaten
          const r = this.runner(m.i, who);
          if (r.won) return;
          r.won = true; if (!this.winT) this.winT = now;
          this.event('win', who, m.i, clampNum(m.t, 0, 36000, 0));
          this.checkDone(); this.changed();
          return;
        }
        case 'leave':
          if (mine && this.runners.delete(m.i)) { this.dropDuelist(m.i); this.checkWipe(); this.checkDone(); this.changed(); }
          return;
        default:
      }
    }
    // the current duelist left the run: their duel is over
    dropDuelist(id) {
      if (this.st !== 'boss' || !this.boss || this.boss.duelist() !== id) return;
      const res = this.boss.nextDuel(this.now(), this.ids()); this.revive();
      if (res) this.bossResult(res, '', id); else this.event('duellost', '', id, this.boss.di);
    }
    checkDone() {
      if (this.st !== 'escape' && this.st !== 'boss' && this.st !== 'freed' && this.st !== 'roryexit') return;
      let all = this.runners.size > 0;
      for (const r of this.runners.values()) if (!r.won) all = false;
      const max = this.lap >= MAX_LAP ? ESCAPE_MAX_BOSS : ESCAPE_MAX;
      if ((this.st !== 'boss' && (all || (this.winT && this.now() - this.winT > FINISH_AFTER_WIN))) || this.now() - this.escT > max) { this.st = 'done'; this.doneT = this.now(); }
    }
    // call a few times a second
    tick() {
      const now = this.now();
      // the host itself was frozen (a busy phone, a hidden tab): nobody else went quiet, so don't expire anyone
      if (this.lastTick && now - this.lastTick > 2500) {
        for (const p of this.present.values()) p.t = now;
        for (const r of this.runners.values()) r.t = now;
        if (this.emptyT) this.emptyT = now;
      }
      this.lastTick = now;
      let gone = false;
      for (const [id, p] of this.present) if (now - p.t > RUNNER_TIMEOUT) { this.present.delete(id); gone = true; }
      if (gone) this.pickOwner();
      if (this.ph === 'run') {
        for (const [id, r] of this.runners) if (now - r.t > RUNNER_TIMEOUT) { this.runners.delete(id); this.dropDuelist(id); this.checkWipe(); this.changed(); }
        if (!this.runners.size) {
          if (!this.emptyT) this.emptyT = now;
          else if (now - this.emptyT > EMPTY_RESET) { this.ph = 'idle'; this.st = ''; this.changed(); }
        } else this.emptyT = 0;
        if ((/^(lap|beacon)[2-5]$/.test(this.st) || this.st === 'rory' || this.st === 'roryexit') && !this.shoe && now >= this.tEnd) { this.shoe = true; this.event('shoe', '', ''); this.changed(); }
        // RORY'S CHALLENGE: whoever is down is back as the song moves on to its next section
        if (this.st === 'rory' || this.st === 'roryexit') {
          const sec = rorySection(this.roryAge() - RORY_LEAD);
          if (sec !== this.rsec) {
            const was = this.rsec; this.rsec = sec;
            if (was >= 0 && [...this.runners.values()].some((r) => r.dead)) { this.revive(); this.event('section', '', '', sec); this.changed(); }
          }
        }
        // everyone has been down for a while: the chase / the boss phase starts over
        if (this.wipeAt && now >= this.wipeAt) this.wipeNow();
        // ENDLESS: the shop closes (whoever isn't READY yet comes along anyway); someone who left can't hold it up
        if (this.st === 'eshop' && (now >= this.shopEnd || (this.runners.size && [...this.runners.keys()].every((id) => this.ready.has(id))))) this.nextFloor('', '');
        // the Lap 5 chase's song is over: WEGA FACE
        if (this.st === 'escape' && this.lap >= MAX_LAP && now - this.escT >= CHASE5_LEN * 1000) { this.startBoss(); this.changed(); }
        // the duelist whose turn it is has left the run: skip them
        if (this.st === 'boss' && this.boss && this.boss.p === 3 && this.boss.duelist() && !this.runners.has(this.boss.duelist())) { this.dropDuelist(this.boss.duelist()); this.changed(); }
        const was = this.st;
        this.checkDone(); if (this.st !== was) this.changed();
        if (this.st === 'done' && now - this.doneT > DONE_HOLD) { this.ph = 'idle'; this.changed(); }
      }
      // publish on change (at most ~10/s) and once a second while anyone is here
      if ((this.dirty && now - this.lastPub >= 90) || (this.present.size && now - this.lastPub >= 1000)) {
        this.dirty = false; this.lastPub = now;
        this.publish(JSON.stringify(this.snapshot()));
      }
    }
    snapshot() {
      const now = this.now(), names = [], dl = [];
      for (const [id, r] of this.runners) { if (names.length < 6) names.push(r.n); if (dl.length < 16) dl.push([id, r.n, r.dead ? 1 : 0]); }
      const here = [];
      for (const p of this.present.values()) if (here.length < 8) here.push(p.n);
      let hex = '';
      const nb = Math.ceil(this.tot / 8);
      for (let i = 0; i < nb; i++) hex += this.bits[i].toString(16).padStart(2, '0');
      const s = {
        v: 1, a: this.src, sq: this.sq, ph: this.ph, run: this.run, st: this.st, lap: this.lap, c: hex, left: this.left, tot: this.tot,
        tl: this.tEnd ? Math.round(Math.max(0, this.tEnd - now) / 100) / 10 : 0, shoe: this.shoe ? 1 : 0,
        d: this.d, rml: this.rml, md: this.md, t2: this.times[2], t3: this.times[3], t4: this.times[4], t5: this.times[5], by: this.by, gr: this.gr, nr: this.runners.size, rn: names,
        ow: this.owner, on: this.ownerName(), ld: this.ld, ml: this.ml, lm: this.lm, gm: this.gm, hp: here,
        ag: Math.round((now - this.startT) / 100) / 10, e: this.ev,
        ea: this.escT ? Math.round((now - this.escT) / 100) / 10 : 0,             // the chase clock
        lv: this.lv, dl, ww: this.wipeAt ? Math.round(Math.max(0, this.wipeAt - now) / 100) / 10 : 0,
      };
      if (this.boss) Object.assign(s, this.boss.snap(now));
      if (this.rgm === 'rory') { s.rgm = 'rory'; s.ra = Math.round((now - this.rT0) / 100) / 10; }   // the song's clock
      if (this.rgm === 'endless') {                                                                  // the floor (+ the shop)
        s.rgm = 'endless'; s.fl = this.fl;
        if (this.st === 'eshop') { s.sl = Math.round(Math.max(0, this.shopEnd - now) / 100) / 10; s.rd = [...this.ready].filter((id) => this.runners.has(id)).slice(0, 16); }
      }
      return s;
    }
    // take over from a snapshot (a new host after the old one left): the lobby owner and settings,
    // and the run if one is going
    load(s) {
      if (!s || s.v !== 1) return;
      if (okId(s.ow)) { this.present.set(s.ow, { t: this.now(), n: String(s.on || 'PLAYER').slice(0, 24) }); this.owner = s.ow; }
      if (DIFFS.includes(s.ld)) this.ld = s.ld;
      if (Number.isInteger(s.ml) && s.ml >= 1 && s.ml <= MAX_LAP) this.ml = s.ml;
      if (Number.isInteger(s.lm) && s.lm >= 0 && s.lm <= MOD_MAX) this.lm = s.lm;
      if (MODES.includes(s.gm)) this.gm = s.gm;
      if (Array.isArray(s.e)) this.ev = s.e.slice(0, 5);
      this.sq = (s.sq | 0) + 1; this.dirty = true;
      if (s.ph !== 'run' || !Number.isInteger(s.run)) return;
      this.reset(s.run);
      this.rgm = s.rgm === 'rory' || s.rgm === 'endless' ? s.rgm : 'classic';
      this.ph = 'run'; this.st = String(s.st || 'lap1'); this.lap = clampNum(s.lap | 0, 1, this.rgm === 'rory' ? RORY_LAP : this.rgm === 'endless' ? END_LAP : MAX_LAP, 1);
      if (this.rgm === 'endless') {
        this.fl = clampNum(s.fl | 0, 1, 9999, 1);
        if (this.st === 'eshop') { this.shopEnd = this.now() + clampNum(s.sl, 0, SHOP_TIME, SHOP_TIME) * 1000; if (Array.isArray(s.rd)) for (const id of s.rd) if (okId(id)) this.ready.add(id); }
      }
      if (this.rgm === 'rory') { this.rT0 = this.now() - clampNum(s.ra, 0, 1e6, 0) * 1000; this.rsec = rorySection(this.roryAge() - RORY_LEAD); }
      this.tot = Math.round(clampNum(s.tot, 50, MAX_TOTAL, TOTAL)); this.left = Math.round(clampNum(s.left, 0, this.tot, this.tot));
      if (typeof s.c === 'string') for (let i = 0; i < Math.ceil(this.tot / 8); i++) this.bits[i] = parseInt(s.c.substr(i * 2, 2), 16) || 0;
      this.lapCount = this.tot - this.left; this.shoe = !!s.shoe;
      this.tEnd = s.tl > 0 ? this.now() + s.tl * 1000 : (this.lap >= 2 ? this.now() : 0);
      this.d = DIFFS.includes(s.d) ? s.d : 'normal'; this.rml = clampNum(s.rml | 0, 1, MAX_LAP, MAX_LAP);
      this.md = Number.isInteger(s.md) && s.md >= 0 && s.md <= MOD_MAX ? s.md : 0;
      this.times = [0, 0, clampNum(s.t2, 50, 400, 150), clampNum(s.t3, 50, 400, 120), clampNum(s.t4, 50, 400, 105), clampNum(s.t5, 50, 400, 120)];
      this.by = String(s.by || ''); this.gr = String(s.gr || ''); this.startT = this.now() - clampNum(s.ag, 0, 1e6, 0) * 1000;
      if (this.st === 'escape' || this.st === 'boss' || this.st === 'freed' || this.st === 'done' || this.st === 'roryexit') this.escT = this.now() - clampNum(s.ea, 0, 1e6, 0) * 1000;
      this.lv = clampNum(s.lv | 0, 0, 1e9, 0);
      if (s.ww > 0) this.wipeAt = this.now() + clampNum(s.ww, 0, WIPE_WAIT, 0) * 1000;
      if (Array.isArray(s.dl)) for (const d of s.dl) if (Array.isArray(d) && okId(d[0])) this.runners.set(d[0], { n: String(d[1] || 'PLAYER').slice(0, 24), t: this.now(), won: false, dead: !!d[2] });
      if (Number.isInteger(s.bp) && s.bp > 0 && Number.isInteger(s.bs)) { this.boss = Boss.from(s, this.now()); this.bs = s.bs; }
      if (this.st === 'done') this.doneT = this.now();
    }
  }

  return { Room, Boss, hash01, cleanName, nameAllowed, label, TOTAL, MAX_TOTAL, MAX_LAP, NAME_MAX, CHASE5_LEN, BOSS_MIN, BOSS_INTRO, BOSS_HITS, DUEL_GAP, DUEL_INTRO, DUEL_CHARS, WIPE_WAIT,
    MODES, RORY_LAP, RORY_LEAD, RORY_LEN, RORY_SECTIONS, rorySection, END_LAP, SHOP_EVERY, SHOP_TIME, endGreen };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = WegaShared;
