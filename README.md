# Claude-s-challenge-

**Wega's Challenge: The Idol (VR)** is a WebXR fan remake for the Meta Quest 3S browser. It also plays on desktop with mouse and keyboard.

```
index.html          the whole game (Three.js r160 from jsDelivr, everything else inline)
wega-music.js       the music pack (Lap 1 + Lap 2 songs as base64 MP3 + the WegaMusic player)
wega-music-lap3.js  Lap 3 song add-on ("Pillar John's Revenge"); optional, Lap 3 falls back to a sped-up Lap 2 song
wega-music-lap4.js  Lap 4 song add-on ("DIVE", the last-lap song); optional, Lap 4 falls back to a sped-up Lap 3 song
wega-relay.json     optional: which multiplayer server to use (empty = free public relays)
server/             the multiplayer server (Node 20+): hosts the game, relays player data and runs the shared runs
render.yaml         one-click deploy of server/ on Render
```

## Multiplayer

Press **ONLINE** in the lobby to see the server list (WEGA-1 to WEGA-6, up to 12 players each). The game
joins the busiest server that isn't full. You see other players' avatars and name tags in the lobby and in
whichever level you are both in.

Everyone on a server plays **one shared run**:
- **The lobby owner:** the first player to join a server owns its lobby (shown on the main menu and the **LOBBY**
  page, with a ★ in the player list). Only the owner can **START** and change the lobby settings (difficulty and
  how many laps the portals go up to). Everyone else's START button says WAITING… If the owner leaves, the
  player who joined next becomes the owner.
- **START** starts the run for everyone on the server who is in the lobby (or on the win / game-over screen).
  If a run is already going, the button says **JOIN RUN** (for anyone) and drops you in where it is.
- **Lil' Guys are shared:** when anyone collects one, it's gone for everybody, and the counter is the same for all.
- When the last one is collected, everyone gets the same beacon. Whoever takes the **lap portal** takes the whole
  run to the next lap (cutscene for everyone); whoever reaches the **beacon** brings everyone to the Idol Chamber.
- The Lap 2-4 **timer is shared** (with the +3 s bonuses), and so is Shoebench when it runs out.
- The owner's **difficulty applies to everyone** in the run (Lil' Guy count, timers, how hostile the characters are).
- Whoever **grabs the idol** starts the collapse for everyone; each player has to reach the exit.
- If you die, **REJOIN RUN** puts you back where the run is now. **QUIT TO LOBBY** leaves the run.

The server keeps track of the run (`server/authority.js`). On the free public relays there is no server, so the
player with the lowest id hosts the run instead, and it is handed to the next player if they leave. If nobody
answers at all, START just starts a normal solo run. Only your name, avatar, position and run progress are shared.

Which server the game connects to, in order:
1. `?relay=wss://...` in the page URL
2. the `relays` listed in `wega-relay.json`
3. free public relays (EMQX, HiveMQ, Mosquitto test brokers). These need no setup, but they are shared
   public services with no uptime guarantee, and anyone can read what's sent through them.

### Running your own server (more reliable)

```
cd server
npm install
npm start          # http://localhost:8080 serves the game and the relay
```

To host it for free on Render: New > Blueprint > select this repo (it uses `render.yaml`). Open the game at
the Render URL and it uses that server automatically. To keep playing from GitHub Pages instead, put
`wss://<your-service>.onrender.com/mqtt` in `wega-relay.json`. Free Render services sleep when idle, so the
first connection after a while can take up to a minute (the game keeps retrying).

## Your name

Press **NAME** in the lobby and type your own name (up to 16 letters, numbers, spaces and `' ! . -`): use the
on-screen keyboard (laser in VR, tap on a phone) or just type on a real keyboard, then **DONE** (Enter). **RANDOM**
cycles the preset names and **NEW #** rolls a new player number. Rude names are refused. Your name is saved in the
browser and shows on your name tag, in the server list and on the escape screen.

## Avatar

Press **AVATAR** in the lobby:
- **Outfit:** suit, tuxedo, hoodie, tracksuit, knight armour, spacesuit, lab coat, overalls or the
  **I HATE RORY** shirt. Unlockable: inferno, diver suit and the golden suit.
- **Colour** and **tie / trim colour**
- **Head:** fishbowl, blocky, Lil' Guy, robot, pumpkin, TV, cat, alien, skull, ghost, frog or **kurimanju** (the
  chestnut bun itself, with a `:3` face). Unlockable: diver helmet.
- **Hat:** Wega cap, top hat, crown, party hat, halo, **tin pot** (a saucepan with its handle sticking out) or
  **kurimanju** (the shiny golden-brown chestnut bun with its pale base, `:3` face and rosy cheeks). Unlockable:
  Lil' Guy buddy, idol hat, devil horns, hard hat, shoe hat and the **golden hat** (it gives off sparkles).
- **Moves** (animation packs): how your avatar runs, jumps and idles. Classic and Swagger to start with; Ninja Run,
  Bouncy, Robot, Zombie, Disco and Float are unlocked with achievements.
- the fish in your fishbowl

Locked items are skipped until you earn them (the page says how many are left; the trophy wall says what unlocks
what). Earned items show in gold. A turntable shows the result, the lobby mirror
shows you wearing it, your first-person body uses your colours, and other players see it online (moves included).
Your choice is saved in the browser.

## Achievements

Each achievement unlocks a cosmetic. See them on the **trophy wall** in the lobby (the right-hand kiosk); a gold
banner and a toast tell you when you unlock one, and other players online see it too.

| Achievement | How | Unlocks |
|---|---|---|
| FIRST STEPS | Clear Lap 1 | Lil' Guy buddy hat |
| ESCAPE ARTIST | Escape with the idol | Idol hat |
| INFERNO | Clear Lap 2 | Inferno outfit |
| WEGA'S REVENGE | Clear Lap 3 | Devil horns |
| THE LAST LAP | Clear Lap 4 | Diver suit + diver helmet |
| SPEED DEMON | Hit 80 s/s | Ninja Run moves |
| HOPPER | Jump 500 times | Bouncy moves |
| COLLECTOR | Collect 1,000 Lil' Guys | Robot moves |
| BACK FROM THE DEAD | Get wiped out 10 times | Zombie moves |
| TEAM PLAYER | Escape in a shared run with someone else | Disco moves |
| UNTOUCHABLE | Clear a lap without getting hit | Float moves |
| SHOEBENCH SURVIVOR | Clear a lap after Shoebench came for you | Shoe hat |
| HARD MODE | Escape on HARD or WEGA MODE | Hard hat |
| **WEGA MASTER** | Clear all 4 laps and escape on WEGA MODE | **Golden hat (with sparkles) + golden suit** |

Achievements are saved in the browser. Runs that use the debug helpers don't count.

## The lobby

The lobby is bigger now: a wider floor with pillars, speaker stacks that pulse to the music, play blocks to climb,
a **jump pad** that launches you into the air, a golden idol trophy on top of the climb and Lil' Guys floating
around the edge.
- **Character guide** (left kiosk): every enemy and hazard with its sprite, where it shows up and how to beat it.
  Flip through the pages with the arrows.
- **Trophy wall** (right kiosk): your achievements, their progress and what they unlock.

## Laps

- **Lap 1:** collect all 207 Lil' Guys (run through them, jump over them or grab them). At 0 left, a beacon appears (go to the Idol Chamber) and a
  **LAP 2 portal** opens at the start. The portal is optional.
- **Lap 2 (Inferno)**, **Lap 3 (Wega's Revenge)** and **Lap 4 (The Last Lap)** are timed. If the timer hits 0:00,
  **Shoebench** comes flying after you; keep moving and finish the lap, because if it touches you it's game over.
  Each lap ends with a beacon plus the next lap's portal (Lap 4 ends with just the beacon).
- **Lap 3: Wega hunts you.** A giant glitching Wega face floats over the maze in front of you for the whole lap
  and attacks on a rhythm that gets faster as the Lil' Guys run out:
  - **Glare:** a red stripe flashes across your walkway, then his eye lasers sweep along it. Don't be on it.
  - **Cage** (late in the lap): two stripes, one ahead and one behind. Stop between them.
  - **Pixel barrage:** he spits fireballs along the path you're running. Change course.
  - **Summon:** he sends Rory straight at you (or makes the Glitch Guy strike right away).
  - **Roar** (from the middle of the lap): a pixel flood rolls out from under him. Jump it.
- **Lap 4: the Diver.** Deep-sea lap with the "DIVE" music. A hulking diver in a brass helmet leaps into the sky,
  a red ring marks where he'll land (where you're heading), then he plunges down. Get out of the ring, then
  **jump the shockwave** that rolls out from the impact, and don't bump into him while he stands there. Late in
  the lap he dives twice in a row. Glowing **jellyfish** drift over the walkways (touching one zaps you). The deep
  has a kelp forest, branching coral, light shafts from the surface, schools of fish, caustics rippling over the
  walkways and a huge leviathan swimming past in the dark.
- **Wega's eye lasers are dodgeable.** He holds still while he fires, so the beams never follow you. Only the
  burning spot where they hit the floor hurts: step off the stripe, or jump over the spot as it sweeps past.
- **Each lap raises the speed cap** (Lap 1: 66 s/s, Lap 2: 71, Lap 3: 76, Lap 4: 82; the chase uses the cap of
  the lap you came from).

## The chase

Grabbing the idol starts the collapse: the path falls away behind you and you run for the white door. **The lap
you reached the idol from decides the chase.** Each later lap adds another stretch of route, a new look, a faster
collapse and more hazards:

| From | Chase | Length | What's new |
|---|---|---|---|
| Lap 1 | RUN FOR YOUR LIFE | about 330 m | laser gates, two Screamer dashes, a Rory ambush |
| Lap 2 | THE INFERNO CHASE | about 450 m | orange neon over a lava sea, fireballs rain onto the walkway ahead, longer gaps |
| Lap 3 | WEGA'S REVENGE CHASE | about 580 m | blood storm; Wega follows you, sweeping his eye lasers across the walkway right where you're about to be (jump the burning spot) and spitting fireballs round the corners ahead; a second Rory ambush; more X gates |
| Lap 4 | THE DEEP CHASE | about 710 m | the deep sea; the Diver keeps plunging onto the walkway just ahead of you (keep running, and jump his shockwave as he lands); a third Rory ambush; a double hurdle; 3 m gaps |

The collapse also starts closer behind you and moves faster each tier, and the chase plays that lap's song sped up.
In a shared run, the run's lap decides the chase for everyone.

## Difficulty

| | Lil' Guys a lap | Characters |
|---|---|---|
| CHILL | 207 | calm, less damage, longer timers |
| NORMAL | 207 | |
| **HARD** | **260** | hostile: shorter warnings, more lasers and fireballs, Rory chases longer and faster, more damage |
| WEGA MODE | **300** | ruthless: all of HARD and more, no health regen, the Diver re-aims mid-dive |

Online, the lobby owner picks the difficulty for everyone; offline it's your own setting.

## Edge guard

Walking, sprinting, sliding or getting shoved can't take you off a ledge into the void: you stop at the edge
(or slide along it). Jumping off is still up to you, and dropping down onto a lower platform still works.
Turn it off in **SETTINGS > EDGE GUARD**.

Spamming jump can no longer throw you into the void either: a hop that would come down over nothing is caught at
the edge, and landing on the top edge of a wall or a staircase puts you on top of it instead of bouncing you off.
If you jump too early before a gap, the guard catches you at the lip, and your next jump from there keeps your
run-up, so you can still make it across.

## Play

Host this folder over **HTTPS** (GitHub Pages, Netlify drop, itch.io HTML upload) and open `index.html`
in the Quest browser, then press **ENTER VR**. WebXR will not start from `file://`.
The game still runs if `wega-music.js` is missing (just without music).

## Controls

| Quest | Action |
|---|---|
| Left stick | Move (speed builds up the longer you run) |
| Right stick | Snap turn (or smooth turn in Settings) |
| A / X | Jump (hold it to keep hopping) |
| Left stick click | Toggle sprint lock |
| Grip | Grab the idol |
| Trigger | Click menu buttons with the laser |
| B / Y | Pause (hold 1 s to recentre) |

Desktop: WASD move, mouse look (click to lock the pointer), Space jump (hold to keep hopping), E grab, Shift sprint lock,
Esc or P pause, M mute, F full screen. Aim the crosshair at a menu button and click.

Phone / tablet: tap **TAP TO PLAY** (it goes full screen and asks for landscape). Left stick moves, drag the
right side of the screen to look, tap the 3D menu buttons, and use the JUMP / GRAB / SPRINT / pause buttons.
The full-screen button is in the top-right corner.

## Debug

Open `index.html?debug`: keys `1`–`7` jump to Lap 1 / Lap 2 / Idol Chamber / Escape / Win / Lap 3 / Lap 4.
`window.WEGA_DEBUG` has `skipToLap2()`, `skipToLap3()`, `skipToLap4()`, `skipToIdol()`, `skipToEscape()`, `win()`, `godMode(bool)`,
`setLeft(n)` and `spawnShoebench()`.
Runs that use debug helpers don't save a best time. Add `?offline` to play without connecting to any server.
