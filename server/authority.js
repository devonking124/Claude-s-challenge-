/* global module */
// =====================================================================================
// SHARED RUNS — the authority for one server room (WEGA-1 ... WEGA-6).
// It owns the run everyone on that server plays together: which stage the run is at,
// which Lil' Guys have been collected (one collect counts for everyone), the lap 2-5 timer,
// who grabbed the idol, the chase clock (everyone's collapse follows it), OMNIWEGA's health at the
// end of the Lap 5 chase (and the seed its attacks are drawn from), who escaped. It also owns the lobby: the first player to join is the
// owner (the next earliest takes over if they leave), and only the owner can START and change
// the lobby settings (difficulty, how many laps, run modifiers). The real server (server/server.js) runs one
// per room; on a public relay the game itself runs one in the player with the lowest id (and
// hands it over if they leave). Plain JS, no dependencies: the same file is inlined into index.html.
//
// Clients publish requests on  wega-idol-vr/v1/s/<ROOM>/req  and heartbeats on .../hi,
// the authority publishes the room snapshot on  .../auth  (on every change + once a second).
// =====================================================================================
const WegaShared = (() => {
  const TOTAL = 207, MAX_TOTAL = 330;     // Lil' Guys per lap (the owner's difficulty can ask for more)
  const MAX_LAP = 5;
  const MOD_MAX = 0xffff;                 // run modifier bits (the game decides what each one does)
  const DIFFS = ['chill', 'normal', 'hard', 'wega'];
  const BONUS = 3, BONUS_EVERY = 25;      // laps 2-4: +3 s on the shared timer every 25 collected
  const CUT_DELAY = 4.2;        // the lap cutscene plays before the lap timer matters
  const RUNNER_TIMEOUT = 12000; // ms without a heartbeat -> no longer in the run / on the server
  const HELLO_GRACE = 6000;     // a new host waits this long for everyone's heartbeat (they come every 3 s)
  const EMPTY_RESET = 15000;    // ms with nobody left in the run -> back to idle
  const FINISH_AFTER_WIN = 90000, ESCAPE_MAX = 240000, ESCAPE_MAX_BOSS = 600000, DONE_HOLD = 4000;
  const BOSS_HP = 6, BOSS_HP_PER = 2, BOSS_HP_MAX = 14;  // OMNIWEGA: cores to break (more with more players)
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

  class Room {
    // publish(text): send a snapshot on the room's /auth topic. now(): milliseconds.
    constructor(name, o = {}) {
      this.name = name; this.src = o.src || 'srv';
      this.publish = o.publish || (() => {}); this.now = o.now || (() => Date.now());
      // everyone on this server, in the order they joined: id -> { t: last heartbeat, n: name }
      this.present = new Map();
      this.owner = ''; this.ld = 'normal'; this.ml = MAX_LAP; this.lm = 0;     // lobby: owner + settings (+ modifier bits)
      this.sq = 0; this.ev = [0, '', '', ''];
      this.dirty = false; this.lastPub = -1e9;
      this.reset(0);
    }
    reset(run) {
      this.ph = 'idle'; this.run = run; this.st = ''; this.lap = 0;
      this.tot = TOTAL; this.bits = new Uint8Array(Math.ceil(MAX_TOTAL / 8)); this.left = TOTAL; this.lapCount = 0;
      this.tEnd = 0; this.shoe = false; this.d = 'normal'; this.rml = MAX_LAP; this.md = 0; this.times = [0, 0, 150, 120, 105, 120];
      this.by = ''; this.gr = ''; this.runners = new Map(); this.startT = this.now(); this.escT = 0; this.winT = 0; this.doneT = 0; this.emptyT = 0;
      this.bm = 0; this.bh = 0; this.bs = 0; this.bossT = 0;
    }
    event(kind, who, id, extra) { this.ev = [this.ev[0] + 1, kind, who, id || '']; if (extra != null) this.ev.push(extra); }
    changed() { this.sq++; this.dirty = true; }
    runner(id, who) {
      let r = this.runners.get(id);
      if (!r) { r = { n: who, t: 0, won: false }; this.runners.set(id, r); }
      r.t = this.now(); if (who) r.n = who;
      return r;
    }
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
    // a lap: fresh Lil' Guys, and (laps 2-4) a fresh shared timer
    startLap(n, delay) {
      this.lap = n; this.st = 'lap' + n;
      this.bits.fill(0); this.left = this.tot; this.lapCount = 0; this.shoe = false;
      this.tEnd = n >= 2 ? this.now() + ((this.times[n] || 120) + delay) * 1000 : 0;
    }
    has(i) { return (this.bits[i >> 3] >> (i & 7)) & 1; }

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
          if (DIFFS.includes(m.ld)) this.ld = m.ld;
          if (Number.isInteger(m.ml) && m.ml >= 1 && m.ml <= MAX_LAP) this.ml = m.ml;
          if (Number.isInteger(m.lm) && m.lm >= 0 && m.lm <= MOD_MAX) this.lm = m.lm;
          this.changed();
          return;
        case 'start': {
          if (live && this.st !== 'done') { this.runner(m.i, who); this.changed(); return; }   // already going: you just join it
          if (!owner) return;                                                                   // only the owner starts runs
          this.reset(Math.floor(Math.random() * 2147483646) + 1);
          this.ph = 'run'; this.by = who; this.d = this.ld; this.rml = this.ml; this.md = this.lm;
          this.tot = Math.round(clampNum(m.tot, 50, MAX_TOTAL, TOTAL));
          this.times = [0, 0, clampNum(m.t2, 50, 400, 150), clampNum(m.t3, 50, 400, 120), clampNum(m.t4, 50, 400, 105), clampNum(m.t5, 50, 400, 120)];
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
            if (!Number.isInteger(i) || i < 0 || i >= this.tot || this.has(i)) continue;
            this.bits[i >> 3] |= 1 << (i & 7); this.left--; this.lapCount++; got++;
            if (this.lap >= 2 && !this.shoe && this.lapCount % BONUS_EVERY === 0) this.tEnd += BONUS * 1000;
          }
          if (!got) return;
          if (this.left <= 0) { this.left = 0; this.st = 'beacon' + this.lap; this.event('clear', who, m.i); }
          this.changed();
          return;
        }
        case 'portal':
          if (!mine || this.st !== 'beacon' + this.lap || this.lap >= this.rml || m.lap !== this.lap) return;
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
        case 'hand':                // Lap 5 chase: someone reached the arena and OMNIWEGA grabs the exit
          if (!mine || this.st !== 'escape' || this.lap < MAX_LAP) return;
          this.runner(m.i, who);
          this.st = 'boss'; this.bossT = now; this.bs = Math.floor(Math.random() * 2147483646) + 1;
          this.bm = Math.min(BOSS_HP_MAX, BOSS_HP + BOSS_HP_PER * Math.max(0, this.runners.size - 1)); this.bh = this.bm;
          this.event('hand', who, m.i); this.changed();
          return;
        case 'core':                // a core grabbed in the arena: OMNIWEGA takes a hit (each core counts once)
          if (!mine || this.st !== 'boss' || m.c !== this.bm - this.bh) return;
          this.runner(m.i, who);
          this.bh--; this.event('core', who, m.i, this.bh);
          if (this.bh <= 0) { this.bh = 0; this.st = 'freed'; this.event('bossdown', who, m.i); }
          this.changed();
          return;
        case 'out': {               // knocked out of the chase while others still run it: they spectate now
          if (!mine || (this.st !== 'escape' && this.st !== 'boss' && this.st !== 'freed')) return;
          const r = this.runner(m.i, who);
          if (r.won || r.out) return;
          r.out = true; this.event('out', who, m.i);
          this.checkDone(); this.changed();
          return;
        }
        case 'win': {
          if (!mine || (this.st !== 'escape' && this.st !== 'freed' && this.st !== 'done')) return;
          if (this.lap >= MAX_LAP && this.st === 'escape') return;          // Lap 5: OMNIWEGA has the exit until it's beaten
          const r = this.runner(m.i, who);
          if (r.won || r.out) return;
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
      if (this.st !== 'escape' && this.st !== 'boss' && this.st !== 'freed') return;
      // everyone has escaped or been knocked out (spectating): nobody is left running. (Just after taking over
      // as host only the runners in the snapshot are known: wait for everyone's heartbeat first.)
      let all = this.runners.size > 0 && !(this.graceT > this.now());
      for (const r of this.runners.values()) if (!r.won && !r.out) all = false;
      const max = this.lap >= MAX_LAP ? ESCAPE_MAX_BOSS : ESCAPE_MAX;
      if (all || (this.st !== 'boss' && this.winT && this.now() - this.winT > FINISH_AFTER_WIN) || this.now() - this.escT > max) { this.st = 'done'; this.doneT = this.now(); }
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
        for (const [id, r] of this.runners) if (now - r.t > RUNNER_TIMEOUT) { this.runners.delete(id); this.changed(); }
        if (!this.runners.size) {
          if (!this.emptyT) this.emptyT = now;
          else if (now - this.emptyT > EMPTY_RESET) { this.ph = 'idle'; this.st = ''; this.changed(); }
        } else this.emptyT = 0;
        if (/^(lap|beacon)[2-5]$/.test(this.st) && !this.shoe && now >= this.tEnd) { this.shoe = true; this.event('shoe', '', ''); this.changed(); }
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
      const now = this.now(), names = [], rw = [], ro = [];
      for (const r of this.runners.values()) if (names.length < 6) names.push(r.n);
      // who already escaped / got knocked out of the chase (so a new host keeps it)
      for (const [id, r] of this.runners) { if (r.won && rw.length < 12) rw.push(id); else if (r.out && ro.length < 12) ro.push(id); }
      const here = [];
      for (const p of this.present.values()) if (here.length < 8) here.push(p.n);
      let hex = '';
      const nb = Math.ceil(this.tot / 8);
      for (let i = 0; i < nb; i++) hex += this.bits[i].toString(16).padStart(2, '0');
      return {
        v: 1, a: this.src, sq: this.sq, ph: this.ph, run: this.run, st: this.st, lap: this.lap, c: hex, left: this.left, tot: this.tot,
        tl: this.tEnd ? Math.round(Math.max(0, this.tEnd - now) / 100) / 10 : 0, shoe: this.shoe ? 1 : 0,
        d: this.d, rml: this.rml, md: this.md, t2: this.times[2], t3: this.times[3], t4: this.times[4], t5: this.times[5], by: this.by, gr: this.gr, nr: this.runners.size, rn: names,
        ow: this.owner, on: this.ownerName(), ld: this.ld, ml: this.ml, lm: this.lm, hp: here,
        ag: Math.round((now - this.startT) / 100) / 10, e: this.ev,
        ea: this.escT ? Math.round((now - this.escT) / 100) / 10 : 0,             // the chase clock
        bm: this.bm, bh: this.bh, bs: this.bs, ba: this.bossT ? Math.round((now - this.bossT) / 100) / 10 : 0,
        rw, ro,
      };
    }
    // take over from a snapshot (a new host after the old one left): the lobby owner and settings,
    // and the run if one is going
    load(s) {
      if (!s || s.v !== 1) return;
      if (okId(s.ow)) { this.present.set(s.ow, { t: this.now(), n: String(s.on || 'PLAYER').slice(0, 24) }); this.owner = s.ow; }
      if (DIFFS.includes(s.ld)) this.ld = s.ld;
      if (Number.isInteger(s.ml) && s.ml >= 1 && s.ml <= MAX_LAP) this.ml = s.ml;
      if (Number.isInteger(s.lm) && s.lm >= 0 && s.lm <= MOD_MAX) this.lm = s.lm;
      if (Array.isArray(s.e)) this.ev = s.e.slice(0, 5);
      this.sq = (s.sq | 0) + 1; this.dirty = true;
      if (s.ph !== 'run' || !Number.isInteger(s.run)) return;
      this.reset(s.run);
      this.ph = 'run'; this.st = String(s.st || 'lap1'); this.lap = clampNum(s.lap | 0, 1, MAX_LAP, 1);
      this.tot = Math.round(clampNum(s.tot, 50, MAX_TOTAL, TOTAL)); this.left = Math.round(clampNum(s.left, 0, this.tot, this.tot));
      if (typeof s.c === 'string') for (let i = 0; i < Math.ceil(this.tot / 8); i++) this.bits[i] = parseInt(s.c.substr(i * 2, 2), 16) || 0;
      this.lapCount = this.tot - this.left; this.shoe = !!s.shoe;
      this.tEnd = s.tl > 0 ? this.now() + s.tl * 1000 : (this.lap >= 2 ? this.now() : 0);
      this.d = DIFFS.includes(s.d) ? s.d : 'normal'; this.rml = clampNum(s.rml | 0, 1, MAX_LAP, MAX_LAP);
      this.md = Number.isInteger(s.md) && s.md >= 0 && s.md <= MOD_MAX ? s.md : 0;
      this.times = [0, 0, clampNum(s.t2, 50, 400, 150), clampNum(s.t3, 50, 400, 120), clampNum(s.t4, 50, 400, 105), clampNum(s.t5, 50, 400, 120)];
      this.by = String(s.by || ''); this.gr = String(s.gr || ''); this.startT = this.now() - clampNum(s.ag, 0, 1e6, 0) * 1000;
      if (this.st === 'escape' || this.st === 'boss' || this.st === 'freed' || this.st === 'done') this.escT = this.now() - clampNum(s.ea, 0, 1e6, 0) * 1000;
      if (Number.isInteger(s.bm) && s.bm > 0) { this.bm = clampNum(s.bm, 1, BOSS_HP_MAX, BOSS_HP); this.bh = clampNum(s.bh | 0, 0, this.bm, this.bm); this.bs = s.bs | 0; this.bossT = this.now() - clampNum(s.ba, 0, 1e6, 0) * 1000; }
      if (this.st === 'done') this.doneT = this.now();
      for (const [list, k] of [[s.rw, 'won'], [s.ro, 'out']]) if (Array.isArray(list)) for (const id of list.slice(0, 12)) if (okId(id)) this.runner(id, '')[k] = true;
      this.graceT = this.now() + HELLO_GRACE;
    }
  }

  return { Room, cleanName, nameAllowed, label, TOTAL, MAX_TOTAL, MAX_LAP, NAME_MAX };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = WegaShared;
