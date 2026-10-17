/* global module */
// =====================================================================================
// SHARED RUNS — the authority for one server room (WEGA-1 ... WEGA-6).
// It owns the run everyone on that server plays together: which stage the run is at,
// which Lil' Guys have been collected (one collect counts for everyone), the lap 2/3 timer,
// who grabbed the idol, who escaped. The real server (server/server.js) runs one per room;
// on a public relay the game itself runs one in the player with the lowest id (and hands it
// over if they leave). Plain JS, no dependencies: the same file is inlined into index.html.
//
// Clients publish requests on  wega-idol-vr/v1/s/<ROOM>/req  and heartbeats on .../hi,
// the authority publishes the run snapshot on  .../auth  (on every change + once a second).
// =====================================================================================
const WegaShared = (() => {
  const TOTAL = 207;            // Lil' Guys per lap
  const BONUS = 3, BONUS_EVERY = 25;      // laps 2+3: +3 s on the shared timer every 25 collected
  const CUT_DELAY = 4.2;        // the "WEGA IS ENRAGED" cutscene plays before the lap timer matters
  const RUNNER_TIMEOUT = 12000; // ms without a heartbeat -> no longer in the run
  const EMPTY_RESET = 15000;    // ms with nobody left in the run -> back to idle
  const FINISH_AFTER_WIN = 90000, ESCAPE_MAX = 240000, DONE_HOLD = 4000;
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

  class Room {
    // publish(text): send a snapshot on the room's /auth topic. now(): milliseconds.
    constructor(name, o = {}) {
      this.name = name; this.src = o.src || 'srv';
      this.publish = o.publish || (() => {}); this.now = o.now || (() => Date.now());
      this.present = new Map();     // id -> last heartbeat time (anyone on this server)
      this.sq = 0; this.ev = [0, '', '', ''];
      this.dirty = false; this.lastPub = -1e9;
      this.reset(0);
    }
    reset(run) {
      this.ph = 'idle'; this.run = run; this.st = ''; this.lap = 0;
      this.bits = new Uint8Array(Math.ceil(TOTAL / 8)); this.left = TOTAL; this.lapCount = 0;
      this.tEnd = 0; this.shoe = false; this.d = 'normal'; this.t2 = 150; this.t3 = 120;
      this.by = ''; this.gr = ''; this.runners = new Map(); this.startT = this.now(); this.escT = 0; this.winT = 0; this.doneT = 0; this.emptyT = 0;
    }
    event(kind, who, id, extra) { this.ev = [this.ev[0] + 1, kind, who, id || '']; if (extra != null) this.ev.push(extra); }
    changed() { this.sq++; this.dirty = true; }
    runner(id, who) {
      let r = this.runners.get(id);
      if (!r) { r = { n: who, t: 0, won: false }; this.runners.set(id, r); }
      r.t = this.now(); if (who) r.n = who;
      return r;
    }
    // a lap: fresh Lil' Guys, and (laps 2+3) a fresh shared timer
    startLap(n, delay) {
      this.lap = n; this.st = 'lap' + n;
      this.bits.fill(0); this.left = TOTAL; this.lapCount = 0; this.shoe = false;
      this.tEnd = n >= 2 ? this.now() + ((n === 2 ? this.t2 : this.t3) + delay) * 1000 : 0;
    }
    has(i) { return (this.bits[i >> 3] >> (i & 7)) & 1; }

    // heartbeat from any player on this server: { i, n, k, r }
    hello(m) {
      if (!m || !okId(m.i)) return;
      if (!this.present.has(m.i) && this.present.size > 64) return;
      this.present.set(m.i, this.now());
      if (this.ph !== 'run') return;
      if (m.r === this.run) { const fresh = !this.runners.has(m.i); this.runner(m.i, label(m.n, m.k)); if (fresh) this.changed(); }
      else if (this.runners.has(m.i)) { this.runners.delete(m.i); this.changed(); }
    }
    // a request from a player: { i, n, k(num), q(kind), run, lap, ... }
    handle(m) {
      if (!m || !okId(m.i) || typeof m.q !== 'string') return;
      const who = label(m.n, m.k), now = this.now();
      this.present.set(m.i, now);
      const live = this.ph === 'run', mine = live && m.run === this.run;
      switch (m.q) {
        case 'start': {
          if (live && this.st !== 'done') { this.runner(m.i, who); this.changed(); return; }   // already going: you just join it
          this.reset(Math.floor(Math.random() * 2147483646) + 1);
          this.ph = 'run'; this.by = who;
          const d = typeof m.d === 'string' ? m.d.slice(0, 8) : 'normal';
          this.d = d; this.t2 = clampNum(m.t2, 60, 400, 150); this.t3 = clampNum(m.t3, 60, 400, 120);
          this.startLap(1, 0); this.startT = now;
          this.runner(m.i, who);
          this.event('start', who, m.i); this.changed();
          return;
        }
        case 'col': {
          if (!mine || m.lap !== this.lap || this.st !== 'lap' + this.lap || !Array.isArray(m.ix)) return;
          this.runner(m.i, who);
          let got = 0;
          for (let k = 0; k < m.ix.length && k < 64; k++) {
            const i = m.ix[k];
            if (!Number.isInteger(i) || i < 0 || i >= TOTAL || this.has(i)) continue;
            this.bits[i >> 3] |= 1 << (i & 7); this.left--; this.lapCount++; got++;
            if (this.lap >= 2 && !this.shoe && this.lapCount % BONUS_EVERY === 0) this.tEnd += BONUS * 1000;
          }
          if (!got) return;
          if (this.left <= 0) { this.left = 0; this.st = 'beacon' + this.lap; this.event('clear', who, m.i); }
          this.changed();
          return;
        }
        case 'portal':
          if (!mine || this.st !== 'beacon' + this.lap || this.lap >= 3 || m.lap !== this.lap) return;
          this.runner(m.i, who);
          this.startLap(this.lap + 1, CUT_DELAY);
          this.event('portal', who, m.i, this.lap); this.changed();
          return;
        case 'beacon':
          if (!mine || !this.st.startsWith('beacon') || m.lap !== this.lap) return;
          this.runner(m.i, who);
          this.st = 'chamber'; this.tEnd = 0;
          this.event('beacon', who, m.i); this.changed();
          return;
        case 'grab':
          if (!mine || this.st !== 'chamber') return;
          this.runner(m.i, who);
          this.st = 'escape'; this.gr = who; this.escT = now;
          this.event('grab', who, m.i); this.changed();
          return;
        case 'win': {
          if (!mine || (this.st !== 'escape' && this.st !== 'done')) return;
          const r = this.runner(m.i, who);
          if (r.won) return;
          r.won = true; if (!this.winT) this.winT = now;
          this.event('win', who, m.i, clampNum(m.t, 0, 36000, 0));
          this.checkDone(); this.changed();
          return;
        }
        case 'leave':
          if (mine && this.runners.delete(m.i)) { this.checkDone(); this.changed(); }
          return;
        default:
      }
    }
    checkDone() {
      if (this.st !== 'escape') return;
      let all = this.runners.size > 0;
      for (const r of this.runners.values()) if (!r.won) all = false;
      if (all || (this.winT && this.now() - this.winT > FINISH_AFTER_WIN) || this.now() - this.escT > ESCAPE_MAX) { this.st = 'done'; this.doneT = this.now(); }
    }
    // call a few times a second
    tick() {
      const now = this.now();
      for (const [id, t] of this.present) if (now - t > RUNNER_TIMEOUT) this.present.delete(id);
      if (this.ph === 'run') {
        for (const [id, r] of this.runners) if (now - r.t > RUNNER_TIMEOUT) { this.runners.delete(id); this.changed(); }
        if (!this.runners.size) {
          if (!this.emptyT) this.emptyT = now;
          else if (now - this.emptyT > EMPTY_RESET) { this.ph = 'idle'; this.st = ''; this.changed(); }
        } else this.emptyT = 0;
        if ((this.st === 'lap2' || this.st === 'lap3' || this.st === 'beacon2' || this.st === 'beacon3') && !this.shoe && now >= this.tEnd) { this.shoe = true; this.event('shoe', '', ''); this.changed(); }
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
      const now = this.now(), names = [];
      for (const r of this.runners.values()) if (names.length < 6) names.push(r.n);
      let hex = '';
      for (let i = 0; i < this.bits.length; i++) hex += this.bits[i].toString(16).padStart(2, '0');
      return {
        v: 1, a: this.src, sq: this.sq, ph: this.ph, run: this.run, st: this.st, lap: this.lap, c: hex, left: this.left,
        tl: this.tEnd ? Math.round(Math.max(0, this.tEnd - now) / 100) / 10 : 0, shoe: this.shoe ? 1 : 0,
        d: this.d, t2: this.t2, t3: this.t3, by: this.by, gr: this.gr, nr: this.runners.size, rn: names,
        ag: Math.round((now - this.startT) / 100) / 10, e: this.ev,
      };
    }
    // take over a run from a snapshot (a new host after the old one left)
    load(s) {
      if (!s || s.v !== 1 || s.ph !== 'run' || !Number.isInteger(s.run)) return;
      this.reset(s.run);
      this.ph = 'run'; this.st = String(s.st || 'lap1'); this.lap = s.lap | 0 || 1; this.left = clampNum(s.left, 0, TOTAL, TOTAL);
      if (typeof s.c === 'string') for (let i = 0; i < this.bits.length; i++) this.bits[i] = parseInt(s.c.substr(i * 2, 2), 16) || 0;
      this.lapCount = TOTAL - this.left; this.shoe = !!s.shoe;
      this.tEnd = s.tl > 0 ? this.now() + s.tl * 1000 : (this.lap >= 2 ? this.now() : 0);
      this.d = s.d || 'normal'; this.t2 = clampNum(s.t2, 60, 400, 150); this.t3 = clampNum(s.t3, 60, 400, 120);
      this.by = String(s.by || ''); this.gr = String(s.gr || ''); this.startT = this.now() - clampNum(s.ag, 0, 1e6, 0) * 1000;
      if (this.st === 'escape' || this.st === 'done') this.escT = this.now();
      if (this.st === 'done') this.doneT = this.now();
      this.sq = (s.sq | 0) + 1; if (Array.isArray(s.e)) this.ev = s.e.slice(0, 5);
      this.dirty = true;
    }
  }
  function clampNum(v, lo, hi, def) { return typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; }

  return { Room, cleanName, nameAllowed, label, TOTAL, NAME_MAX };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = WegaShared;
