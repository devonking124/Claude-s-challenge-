# Claude-s-challenge-

**Wega's Challenge: The Idol (VR)** is a WebXR fan remake for the Meta Quest 3S browser. It also plays on desktop with mouse and keyboard.

```
index.html          the whole game (Three.js r160 from jsDelivr, everything else inline)
wega-music.js       the music pack (Lap 1 + Lap 2 songs as base64 MP3 + the WegaMusic player)
wega-music-lap3.js  Lap 3 song add-on ("Pillar John's Revenge"); optional, Lap 3 falls back to a sped-up Lap 2 song
wega-relay.json     optional: which multiplayer server to use (empty = free public relays)
server/             the multiplayer server (Node 20+): hosts the game, relays player data and runs the shared runs
render.yaml         one-click deploy of server/ on Render
```

## Multiplayer

Press **ONLINE** in the lobby to see the server list (WEGA-1 to WEGA-6, up to 12 players each). The game
joins the busiest server that isn't full. You see other players' avatars and name tags in the lobby and in
whichever level you are both in.

Everyone on a server plays **one shared run**:
- **START** starts the run for everyone on the server who is in the lobby (or on the win / game-over screen).
  If a run is already going, the button says **JOIN RUN** and drops you in where it is.
- **Lil' Guys are shared:** when anyone collects one, it's gone for everybody, and the counter is the same for all.
- When the last one is collected, everyone gets the same beacon. Whoever takes the **lap portal** takes the whole
  run to the next lap (cutscene for everyone); whoever reaches the **beacon** brings everyone to the Idol Chamber.
- The Lap 2 / Lap 3 **timer is shared** (with the +3 s bonuses), and so is Shoebench when it runs out.
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

Press **AVATAR** in the lobby: suit colour, tie / trim colour, head (fishbowl, blocky, Lil' Guy, robot,
pumpkin), hat (Wega cap, top hat, crown, party hat, halo) and the fish in your fishbowl. A turntable shows the
result, the lobby mirror shows you wearing it, your first-person body uses your colours, and other players
see it online. Your choice is saved in the browser.

## Laps

- **Lap 1:** collect all 207 Lil' Guys (run through them, jump over them or grab them). At 0 left, a beacon appears (go to the Idol Chamber) and a
  **LAP 2 portal** opens at the start. The portal is optional.
- **Lap 2 (Inferno)** and **Lap 3 (Wega's Revenge)** are timed. If the timer hits 0:00, **Shoebench** comes
  flying after you; keep moving and finish the lap, because if it touches you it's game over.
  Lap 2 ends with a beacon plus a LAP 3 portal; Lap 3 ends with the beacon.

## Edge guard

Walking, sprinting, sliding or getting shoved can't take you off a ledge into the void: you stop at the edge
(or slide along it). Jumping off is still up to you, and dropping down onto a lower platform still works.
Turn it off in **SETTINGS > EDGE GUARD**.

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

Open `index.html?debug`: keys `1`–`6` jump to Lap 1 / Lap 2 / Idol Chamber / Escape / Win / Lap 3.
`window.WEGA_DEBUG` has `skipToLap2()`, `skipToLap3()`, `skipToIdol()`, `skipToEscape()`, `win()`, `godMode(bool)`,
`setLeft(n)` and `spawnShoebench()`.
Runs that use debug helpers don't save a best time. Add `?offline` to play without connecting to any server.
