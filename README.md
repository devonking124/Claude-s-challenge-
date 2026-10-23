# Claude-s-challenge-

**Wega's Challenge: The Idol (VR)** is a WebXR fan remake for the Meta Quest 3S browser. It also plays on desktop with mouse and keyboard.

```
index.html          the whole game (Three.js r160 from jsDelivr, everything else inline)
wega-music.js       the music pack (Lap 1 + Lap 2 songs as base64 MP3 + the WegaMusic player)
wega-music-lap3.js  Lap 3 song add-on ("Pillar John's Revenge"); optional, Lap 3 falls back to a sped-up Lap 2 song
wega-music-lap4.js  Lap 4 song add-on ("DIVE"); optional, Lap 4 falls back to a sped-up Lap 3 song
wega-music-lap5.js  Lap 5 song add-on ("I made it better"); optional, Lap 5 falls back to a sped-up Lap 4 song
wega-music-boss.js  OMNIWEGA's boss theme (Pizza Tower's "Unexpectancy" Parts 1-3, one per phase); optional, the fight keeps the Lap 5 song
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
  page, with a ★ in the player list). Only the owner can **START** and change the lobby settings (difficulty,
  how many laps the portals go up to, and the **challenges and modifiers**). Everyone else's START button says WAITING… If the
  owner leaves, the player who joined next becomes the owner.
- **START** starts the run for everyone on the server who is in the lobby (or on the win / game-over screen).
  If a run is already going, the button says **JOIN RUN** (for anyone) and drops you in where it is.
- **Lil' Guys are shared:** when anyone collects one, it's gone for everybody, and the counter is the same for all.
- When the last one is collected, everyone gets the same beacon. Whoever takes the **lap portal** takes the whole
  run to the next lap (cutscene for everyone); whoever reaches the **beacon** brings everyone to the Idol Chamber.
- The Lap 2-5 **timer is shared** (with the +3 s bonuses), and so is Shoebench when it runs out.
- The owner's **difficulty applies to everyone** in the run (Lil' Guy count, timers, how hostile the characters are).
- Whoever **grabs the idol** starts the collapse for everyone; each player has to reach the exit.
- **The chase is server-side:** the collapse runs on the server's clock, so the path falls away at the same spot
  for everyone. Anyone still back at the start when it's grabbed is pulled up to the idol's dais, and a player who
  rejoins mid-chase lands just ahead of the collapse.
- **OMNIWEGA is server-side too:** the first player to get to the middle of its arena sets it off for everyone. The server holds its
  health and the seed its attacks come from, so every player sees the same attacks at the same moment, and each
  core anyone grabs hurts it once for everybody. It gets 2 more cores per extra player (up to 14). Nobody can
  escape until it's down; rejoin mid-fight and you land on the arena.
- If you die, **REJOIN RUN** puts you back where the run is now (at full health). **QUIT TO LOBBY** leaves the run.
- **Die in the chase while someone else is still running it and you're out:** you **spectate** the players still
  running (a camera behind them; look around with the mouse or your head, **NEXT PLAYER** or JUMP switches who you
  watch), OMNIWEGA included. You can't rejoin that chase (JOIN RUN from the lobby puts you back to spectating).
  When the run ends (everyone escaped or got knocked out) you go back to the lobby. If you were the last one
  running, you get the normal death screen and can rejoin.

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
  **I HATE RORY** shirt. Unlockable: inferno, diver suit, golden suit, **glitch suit** and the **neon suit** (its
  seams glow in your trim colour, even in the dark).
- **Colour** and **tie / trim colour**. Unlockable: neon green, chrome, lava and ice.
- **Head:** fishbowl, blocky, Lil' Guy, robot, pumpkin, TV, cat, alien, skull, ghost, frog or **kurimanju** (the
  chestnut bun itself, with a `:3` face). Unlockable: diver helmet and the golden Lil' Guy.
- **Hat:** Wega cap, top hat, crown, party hat, halo, **tin pot** (a saucepan with its handle sticking out) or
  **kurimanju** (the shiny golden-brown chestnut bun with its pale base, `:3` face and rosy cheeks). Unlockable:
  Lil' Guy buddy, idol hat, devil horns, hard hat, shoe hat, the **golden hat** (it gives off sparkles), flame
  crown, storm cloud (with its own lightning bolt), snorkel mask, propeller cap (the propeller spins), nerd
  glasses, ice crown, sweatband, the rainbow halo, the **chaos crown** and the **OMNI crown**.
- **Moves** (animation packs): how your avatar runs, jumps and idles. Classic and Swagger to start with; Ninja Run,
  Bouncy, Robot, Zombie, Disco, Float, Moonwalk, Spin (twirls when you stand still) and Hype (fist pumps) are
  unlocked with achievements.
- **Effect:** a trail, aura or wings (from the shop).
- the fish in your fishbowl

Lots more (hats, outfits, heads, moves, colours and effects) are in the **Lil' Guy shop**.

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
| THE DEEP | Clear Lap 4 | Diver suit + diver helmet |
| **THE FINAL LAP** | Clear Lap 5 | **Chaos crown** |
| SPEED DEMON | Hit 80 s/s | Ninja Run moves |
| HOPPER | Jump 500 times | Bouncy moves |
| COLLECTOR | Collect 1,000 Lil' Guys | Robot moves |
| BACK FROM THE DEAD | Get wiped out 10 times | Zombie moves |
| TEAM PLAYER | Escape in a shared run with someone else | Disco moves |
| UNTOUCHABLE | Clear a lap without getting hit | Float moves |
| SHOEBENCH SURVIVOR | Clear a lap after Shoebench came for you | Shoe hat |
| HARD MODE | Escape on HARD or WEGA MODE | Hard hat |
| **WEGA MASTER** | Clear all 5 laps and escape on WEGA MODE | **Golden hat (with sparkles) + golden suit** |
| INFERNO RUNNER | Escape the Inferno Chase (grab the idol after Lap 2) | Flame crown + lava colour |
| STORM CHASER | Escape Wega's Revenge Chase (after Lap 3) | Storm cloud hat |
| DEEP DIVER | Escape the Deep Chase (after Lap 4) | Snorkel mask + ice colour |
| **OMNIWEGA SLAYER** | Beat OMNIWEGA and escape | **OMNI crown** (Wega's helmet ring with glowing red eyes) |
| FLAWLESS ESCAPE | Escape without getting hit during the chase | Spin moves |
| SPEEDRUNNER | Escape in under 5:00 with no modifiers (challenges are fine) | Chrome colour |
| MOD SQUAD | Escape with 3 or more challenges on | Glitch suit |
| ONE AND DONE | Escape with ONE HIT on | Ice crown |
| NIGHT RUNNER | Escape with LIGHTS OUT on | Neon suit |
| MOONWALKER | Clear a lap with LOW GRAVITY on | Moonwalk moves |
| RORY WRANGLER | Clear a lap with RORY RAMPAGE on | Neon green colour |
| FREQUENT FLYER | Ride the lobby jump pad 25 times | Propeller cap |
| BOOKWORM | Read every page of the character guide | Nerd glasses |
| PARTY OF FOUR | Play a shared run with 3 or more other players | Hype moves |
| HOARDER | Collect 5,000 Lil' Guys | Golden Lil' Guy head |
| MARATHON | Run 42.2 km in total | Sweatband |
| COMPLETIONIST | Unlock every other achievement | Rainbow halo |

Achievements are saved in the browser. Runs that use the debug helpers don't count.

## The lobby

The lobby is bigger now: a wider floor with pillars, speaker stacks that pulse to the music, play blocks to climb,
a **jump pad** that launches you into the air, a golden idol trophy on top of the climb and Lil' Guys floating
around the edge.
- **Character guide** (left kiosk): every enemy and hazard with its sprite, where it shows up and how to beat it.
  Flip through the pages with the arrows.
- **Trophy wall** (right kiosk): your achievements, their progress and what they unlock.
- **Lil' Guy shop** (the green kiosk with the mannequin): spend your Lil' Guys on cosmetics.
- **No invisible walls:** the railing round the edge stops you, but it's only a metre high, so you can hop over it
  (and fall off; you land back in the lobby, no damage).

## Challenges and modifiers

**LOBBY > CHALLENGES + MODS** switches on extra rules for the next run. Online, only the lobby owner can change them
and they apply to everyone on the server; they lock in when the run starts. Offline they're your own.

**Challenges** make the run harder and pay more Lil' Guys for the shop (the bonuses add up). The first time you
escape with a challenge on, you get a one-time **+500** for clearing it (it's marked CLEARED after that).

| Challenge | What it does | Pays |
|---|---|---|
| ONE HIT | Any hit knocks you out (falling too) | +100% |
| RORY RAMPAGE | Rory comes back almost as soon as he's gone, faster, and chases for longer | +50% |
| ON THE CLOCK | Lap 2-5 timers are 40% shorter | +50% |
| LASER PARTY | Lasers from the start of Lap 1, three more at a time, back sooner; faster laser gates in the chase | +40% |
| LIGHTS OUT | Thick darkness and dim lights everywhere but the lobby | +40% |
| TURBO COLLAPSE | The chase starts closer behind you and falls away faster | +40% |
| NO REGEN | Your health never comes back | +30% |

**Modifiers** just change the game (they don't pay extra, and a run with one doesn't set a best time):

| Modifier | What it does |
|---|---|
| LOW GRAVITY | Floaty, much higher jumps (about 1.7 m instead of 1.1 m) |
| SPEED RUSH | Your speed cap goes up 30%; Rory, Shoebench and the chase collapse speed up 20% |

## The Lil' Guy shop

Every Lil' Guy you collect goes into your wallet (it started with every Lil' Guy you've ever collected). You also
earn a bonus for each lap you clear (40 × the lap), for escaping (150 + 100 × the chase tier), +500 for beating
OMNIWEGA, and everything is multiplied by your challenges. Your wallet shows on the main menu and the win screen.

The shop is in the lobby: pick a category, pick an item and the mannequin tries it on with the rest of your
outfit, then press its price to buy it (or **EQUIP** if you own it). Bought items are also in the AVATAR page.

| Category | Items |
|---|---|
| Hats | wizard hat, viking helmet, pirate hat, **UFO** (a flying saucer hovers over you, lights blinking), headphones (the cups glow in your trim colour), cyber visor, chef hat, ninja band (its tails fly behind you), antennae |
| Outfits | samurai armour, **galaxy suit** (glowing stars), pixel suit, **lava suit** (glowing cracks in black rock), royal robe |
| Heads | **Wega head**, **Rory head**, monitor (a glowing `:3` on a CRT), glowing pumpkin, crystal |
| Moves | floss, **headspin**, penguin, superhero, T-pose |
| Colours | hot pink, void, mint, sunset |
| Effects | big head, fire trail, rainbow trail, sparkle aura, lightning aura, glitch trail, bubble trail, **angel wings**, **demon wings** (they flap when you run), tiny |

Prices go from 250 to 2,500 Lil' Guys. Other players see what you wear (effects included).

## Laps

- **Lap 1:** collect all 207 Lil' Guys (run through them, jump over them or grab them). At 0 left, a beacon appears (go to the Idol Chamber) and a
  **LAP 2 portal** opens at the start. The portal is optional.
- **Lap 2 (Inferno)**, **Lap 3 (Wega's Revenge)**, **Lap 4 (The Deep)** and **Lap 5 (The Final Lap)** are timed. If the timer hits 0:00,
  **Shoebench** comes flying after you; keep moving and finish the lap, because if it touches you it's game over.
  Each lap ends with a beacon plus the next lap's portal (Lap 5 ends with just the beacon).
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
- **Lap 5: THE FINAL LAP.** "I made it better" plays, the maze turns into a black-and-magenta chaos circuit (glowing
  circuit lines, every edge glowing and cycling colours, spinning rings and shards in a red vortex sky) and
  **everyone is back, enraged** (tinted red, faster, nastier): Wega hunting you overhead with his lasers, fireballs
  and floods, the Diver plunging at you, the jellyfish, Wega's glitch head, Rory, the Screamers, the lasers, the Glitch Guy and Shoebench.
  A new character joins them:
  - **THE SHADOW:** a pitch-black copy of you that walks your exact footsteps a few seconds behind. Keep moving:
    stop or double back and it catches you (20 damage), then it drops back again. It gets closer as the lap goes on.
- **Wega's eye lasers are dodgeable.** He holds still while he fires, so the beams never follow you. Only the
  burning spot where they hit the floor hurts: step off the stripe, or jump over the spot as it sweeps past.
- **Each lap raises the speed cap** (Lap 1: 66 s/s, Lap 2: 71, Lap 3: 76, Lap 4: 82, Lap 5: 88; the chase uses the cap
  of the lap you came from).

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
| Lap 5 | THE FINAL CHASE | about 740 m | the red vortex; Wega **and** the Diver both after you, fireballs raining down, everything enraged, the fastest collapse; it ends on **OMNIWEGA's arena** |

The collapse also starts closer behind you and moves faster each tier, and the chase plays that lap's song sped up.
In a shared run, the run's lap decides the chase for everyone, and the collapse runs on the server's clock.

### OMNIWEGA

At the end of the Lap 5 chase the walkway opens onto a huge round arena with the white door on its far side. Just
as you're about to reach it, **a giant purple hand swoops down, grabs the door and lifts it out of reach**, and
**OMNIWEGA** rises out of the abyss behind the arena to Pizza Tower's final boss theme: every character fused into
one creature. Wega's glitching face inside the Diver's brass helmet, Rory bodies and glitch panels bursting out of
its chest, Screamers on its shoulders, Shoebench on its belly, a ring of Lil' Guys spinning round its head as a
crown, jellyfish drifting round its waist, the Diver's brass fist on one arm and the purple hand on the other.
The collapse stops at the arena's edge (the arena never falls), but the door stays shut until it's beaten.

It attacks with every character's moves, one after another, faster as the fight goes on:
- **Wega's eyes:** two red stripes flash on the arena, then its eye lasers burn along them. Get off the stripes.
- **Diver fist:** red rings mark three spots; the brass fist slams each one and a shockwave rolls out. Get out of
  the rings, then jump the shockwaves.
- **Rory stampede:** three purple lanes, then three Rorys charge down them. Stand between the lanes.
- **Screamers:** two red lanes at angles, then Screamers dash down them.
- **Pixel barrage:** fireballs rain onto marked spots all over the arena.
- **Pixel flood:** a yellow wave rolls across the whole arena. Jump it.

**Glowing cores** appear on the arena one at a time (a golden beam of light marks each). Run into a core to grab it:
every core hurts OMNIWEGA (its health bar shows how many are left). Break them all and it explodes, the hand drops
the door back where it was, OMNIWEGA sinks into the abyss and the exit is free. Beating it pays **+500 Lil' Guys**
and unlocks **OMNIWEGA SLAYER**. If you die, RETRY puts you back on the arena with the cores you already broke.

The music follows the fight: "Unexpectancy, Part 1" while it has most of its health, Part 2 once a third of the cores
are gone ("OMNIWEGA IS GETTING ANGRY!") and Part 3 for the last third ("OMNIWEGA IS FURIOUS!"). Each part is cut to
a section that loops seamlessly.

## Difficulty

| | Lil' Guys a lap | Characters |
|---|---|---|
| CHILL | 207 | calm, less damage, longer timers |
| NORMAL | 207 | |
| **HARD** | **260** | hostile: shorter warnings, more lasers and fireballs, Rory chases longer and faster, more damage |
| WEGA MODE | **300** | ruthless: all of HARD and more, no health regen, the Diver re-aims mid-dive |

Online, the lobby owner picks the difficulty for everyone; offline it's your own setting.

## No invisible walls

Nothing invisible stops you any more: you can walk, run or jump off any ledge (a fall costs some health, 20 on
NORMAL, and puts you back on the last safe spot). Jumps are never blocked in mid-air, and the lobby's edge is its
visible railing.

Spamming jump still can't throw you sideways into the void: landing on the top edge of a wall or a staircase puts
you on top of it instead of bouncing you off.

**Edge guard** is now an opt-in assist (**SETTINGS > EDGE GUARD**, off by default): with it on, walking, sliding or
getting shoved can't take you off a ledge (you slide along the edge instead); jumping is still up to you. If it
stops you at a gap's lip, a jump from there keeps your run-up, so you can still make it across.

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

Open `index.html?debug`: keys `1`–`8` jump to Lap 1 / Lap 2 / Idol Chamber / Escape / Win / Lap 3 / Lap 4 / Lap 5.
`window.WEGA_DEBUG` has `skipToLap2()`, `skipToLap3()`, `skipToLap4()`, `skipToLap5()`, `skipToIdol()`, `skipToEscape()`, `win()`, `godMode(bool)`,
`setLeft(n)` and `spawnShoebench()`.
Runs that use debug helpers don't save a best time. Add `?offline` to play without connecting to any server.
