# Claude-s-challenge-

**Wega's Challenge: The Idol** is a fan remake made for **PC** (mouse and keyboard, in the browser). It also plays in VR
(Meta Quest browser) and on phones and tablets.

```
index.html          the whole game (Three.js r160 from jsDelivr, everything else inline)
wega-music.js       the music pack (Lap 1 + Lap 2 songs as base64 MP3 + the WegaMusic player)
wega-music-lap3.js  Lap 3 song add-on ("Pillar John's Revenge"); optional, Lap 3 falls back to a sped-up Lap 2 song
wega-music-lap4.js  Lap 4 song add-on ("DIVE"); optional, Lap 4 falls back to a sped-up Lap 3 song
wega-music-lap5.js  Lap 5 song add-on ("I made it better"); optional, Lap 5 falls back to a sped-up Lap 4 song
wega-music-boss.js  WEGA FACE's boss theme (Pizza Tower: "Unexpectancy", parts 1-3); optional, the fight falls back to the Lap 5 song
wega-music-chase5.js  the Lap 5 chase song ("Forget Me Not"); optional, the chase falls back to a sped-up Lap 5 song
wega-music-rory.js  RORY'S CHALLENGE's song ("RORY'S CHALLENGE"); needed for that game mode (the whole run is synced to it)
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
- **WEGA FACE is server-side too:** it starts for everyone when Forget Me Not ends. The server holds its phase, its
  health, the seed its attacks come from and the gauntlet's queue, so every player sees the same attacks at the same
  moment, and each hit anyone lands counts for everybody. Hits only land as fast as the server allows, so the fight
  lasts at least 10 minutes whether 1 or 10 people play. Nobody can escape until it's down; rejoin mid-fight and you
  land on the arena (or a balcony during the gauntlet).
- If you die, you watch your killer's death scene and then **spectate** the others until the run moves on (next
  lap, the chase, or WEGA FACE's next phase). **QUIT TO LOBBY** leaves the run.

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
  glasses, ice crown, sweatband, the rainbow halo, the **chaos crown** and the **OMNI crown**. Crowns, halos and
  the other magic hats glow and sparkle (the rainbow halo and OMNI crown cycle through every colour).
- **Moves** (animation packs): every pack has its **own idle, run and jump** (a rising and a falling pose), and
  everyone squashes a little on landing. Classic and Swagger to start with; the rest are unlocked with achievements
  or bought in the shop. A few examples: Swagger folds its arms and nods to a beat, then throws a peace sign in the
  air; Ninja Run stands in a hand-sign stance and does a **tucked front flip**; Bouncy hops on the spot and does a
  **star jump**; Robot does a ticking robot dance; Float **meditates in mid-air** and glides; Moonwalk strikes the
  hat-and-toes pose with a kick; Spin goes airplane when it runs and ballerina-spins in the air; Hype does the splits
  in mid-air; Headspin **cartwheels**; Penguin belly-flops; Superhero flies up fist-first and braces for a hero
  landing; T-Pose spins.
- **Effect:** a trail, aura or wings (from the shop). Fire swells and burns out, the rainbow trail is a ribbon,
  sparkles twinkle as they spiral round you, lightning strikes in bolts, glitch pixels flicker and bubbles wobble
  up and pop.
- Every avatar part is glossy toy plastic now: a soft rim of light round its edges and a highlight on top.
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
| **WEGA FACE SLAYER** | Beat WEGA FACE and escape | **OMNI crown** (a gold crown set with a piece of every character) |
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
| RORY'S CHALLENGE | Beat RORY'S CHALLENGE | Rory blue colour |
| BEAT THE BEAT | Beat RORY'S CHALLENGE before its song ends | Electric blue colour |
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

## Game modes

The lobby menu has a **GAME MODE** button that opens the **GAME MODES** page. Online, **only the lobby owner can
pick** (everyone else sees what's picked and who picks it); offline it's your own choice, and it's saved.

- **WEGA'S CHALLENGE** (classic): lap after lap, the idol, the chase and WEGA FACE.
- **RORY'S CHALLENGE** (endurance): one huge map, one song, no laps.

Difficulty and challenges (the lobby page) apply to both.

### RORY'S CHALLENGE

An endurance run on **one huge map** (a 14 x 14 grid of platforms, about three times the area of a lap, lit up in
blue) with **500+ Lil' Guys** to collect:

| CHILL | NORMAL | HARD | WEGA MODE |
|---|---|---|---|
| 500 | 550 | 600 | 650 |

**The whole run is synced to its song** (RORY'S CHALLENGE, 145 BPM, 4:38). A 3-2-1-GO count-in lands on the
song's first beat, and from then on everything happens on the beat: the walkways pulse with the kick, a spectrum of
light round the world dances to the song, and **each part of the song brings its own enemies** (they land on
the beat, and each part is announced as it starts):

| Part | Bars | What comes |
|---|---|---|
| THE BLUE HOUR | 0-7 | nothing yet: start collecting |
| SEARCHLIGHTS | 8-15 | sweeping lasers with the hi-hats |
| THE BASS DROPS | 16-31 | Rory (his footsteps on the beat), the Screamer |
| THE GLITCH | 32-47 | the Glitch Guy, more lasers |
| FIREFALL | 48-63 | fire lands on the beat, Wega's head |
| THE DEEP END | 64-79 | the Diver lands on the downbeat, a pixel flood |
| BREAKDOWN | 80-86 | the lights die, your Shadow and the jellyfish, **walkways fall away** |
| SOMETHING IS COMING | 87-95 | the build-up: **sky bridges rise**, Wega shows up and watches |
| THE DROP | 96-127 | everyone at once: lasers, Wega, the Screamer, the Diver, fire, Rory |
| THE STORM | 128-151 | a pixel flood on every phrase, Wega, the Glitch Guy, fire; **the drop's bridges fall** |
| THE FINAL STRETCH | 152-159 | laser gates to jump on the beat; **more walkways fall** |
| THE LAST 8 BARS | 160-167 | a bar countdown, **new bridges rise** |
| OVERTIME | after the song | Shoebench, plus lasers, the Screamer and Rory |

**The map changes with the song.** Every part has its own shade of blue (sky, fog, lights and the neon edges), the
drop and the last 8 bars snap in with a flash, and whole groups of walkways **flash a warning for two bars, then
fall away** (or rise up out of the void) on the downbeat. The route-finding enemies follow the map as it changes.
If the ground you were last safe on is gone, a fall puts you on the nearest platform instead.

**The timer is the song.** The HUD shows the song's time left and a timeline of its parts. Collect every Lil'
Guy and an exit opens in the far corner: reach it to win. **If the song ends first, Shoebench spawns** and comes
for you, the song's last part loops as **OVERTIME** and the timer counts up how far past it you are (the stage
stays blue, with a red alarm flare on every bar). You can still win in overtime, if Shoebench doesn't get you.

It's very hard on purpose: 550 Lil' Guys in 4:38 is a sprint the whole way (your top speed is the highest in the
game), and HARD / WEGA MODE bring the enemies faster and more often. Beating it pays a big Lil' Guy payout (more
if you beat the song) and unlocks **RORY'S CHALLENGE**; beating it before the song ends also unlocks **BEAT THE
BEAT**. Your best time is saved on the GAME MODES page.

**Online**, everyone plays the same map on **one song clock** (the server keeps it, so everyone hears the same bar
at the same time, and late joiners drop in where the song is). Lil' Guys anyone collects are gone for everyone. If
you go down you spectate and **come back when the song moves on to its next part** (in overtime: every 8 bars).
If everyone goes down, the song starts over from the top. **Offline**, going down gives you **START OVER**.

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
WEGA FACE, and everything is multiplied by your challenges. Your wallet shows on the main menu and the win screen.

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

Every lap has its own world:
**Lap 1 is the NEON VOID** (a glowing grid floor, a starfield and wireframe monoliths floating round the maze, pulsing
to the beat), **Lap 2 the INFERNO** (volcanoes erupting on the horizon, lava geysers), **Lap 3 WEGA'S REVENGE**
(forked lightning striking out of a blood storm, red rain), **Lap 4 THE DEEP** and **Lap 5 HELLFIRE** (red and fire:
lava veins in the walkways, rings of fire, burning obsidian, fire tornadoes and meteors under a burning sky).

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
  the lap he dives twice in a row. Glowing **jellyfish** drift over the walkways (touching one zaps you); they
  never drift over a Lil' Guy (they're placed away from them and turn back before they reach one). The deep has a kelp forest, branching coral, light shafts from the surface, schools of fish, caustics rippling over the
  walkways and a huge leviathan swimming past in the dark.
- **Lap 5: THE FINAL LAP.** "I made it better" plays, the maze turns to **hellfire** (red and fire, no rainbow:
  glowing lava veins in the walkways, embers off every edge, rings of fire, fire tornadoes and meteors) and
  **everyone is back, enraged** (tinted red, faster, nastier): Wega hunting you overhead with his lasers, fireballs
  and floods, the Diver plunging at you, Wega's glitch head, Rory, the Screamers, the lasers, the Glitch Guy and Shoebench
  (the jellyfish stay in Lap 4).
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
| Lap 5 | **FORGET ME NOT** | as long as the song | an **RGB** world (rainbow neon, a colour-cycling vortex sky); **WEGA, DESTROYER OF WORLDS** hunts you for the whole song; it ends on **WEGA FACE's arena** |

The collapse also starts closer behind you and moves faster each tier, and the chase plays that lap's song sped up.
In a shared run, the run's lap decides the chase for everyone, and the collapse runs on the server's clock.

**URIO chases you in every chase.** He comes running down the route after you, leaping the gaps, leaving
afterimages, his eyes burning red. He's a bit slower than your top speed (how much slower depends on the
difficulty), so keep your speed up. A hit costs 30 and shoves you, then he drops back.

### The Lap 5 chase: FORGET ME NOT

**Forget Me Not** plays and the chase lasts exactly as long as the song: the route is built so the collapse (at your
difficulty's speed) needs the whole song to reach the arena. Wega becomes **WEGA, DESTROYER OF WORLDS**: a god of
light in every colour with a halo, horns, six rainbow wings and two giant floating hands (think Asriel). Every
attack is telegraphed:
- **Star Blazing:** big stars fall onto rainbow rings on the route ahead and burst into small stars that skim the
  floor. Get out of the ring, then jump the small stars.
- **Chaos Saber:** a hand swings a blade of light across the walkway at shin height where a stripe flashes. Jump it.
- **Shocker Breaker:** lightning strikes a line of flashing circles down the route.
- **Hand Slam:** both hands slam onto rings ahead and shockwaves roll out.
- **Galacta Blazing:** a rain of small stars over the route ahead. Weave through.
- **Hyper Goner** (near the end of the song): his face swells into a gaping maw behind you and drags you back
  towards it, spitting stars. Run against the pull.

**Hearts** float over the walkway every 120 m or so (+30 health each), so even WEGA MODE (no regen) can make it
through the whole song. When the song ends he dissolves into light... and WEGA FACE takes the exit.

### WEGA FACE

The boss at the end of the Lap 5 chase, inspired by Pizza Tower's Pizzaface. When Forget Me Not ends, **WEGA
FACE** (Wega's giant flying head) rises over the arena in front of the exit and seals it. The fight lasts **at least
10 minutes however many people play** (the server paces it: while the boss is shielded, nothing hurts it):

1. **WEGA FACE** flies round the arena: it swoops through you, dives jaw-first (CHOMP), spits pixel fire, sweeps its
   eye lasers, drops Lil' Guy bombs and circles the arena spitting. **Golden Lil' Guys** appear on the arena: grab
   one and it rockets into the face. Enough rockets crack it open...
2. ...and **WEGA MAN** bursts out of the cracked face: ground pounds, dashing punches, thrown face shards, spin
   cyclones and mini heads. After a pound or a crashing dash he's **dizzy**: run into him to **BONK** him.
3. **THE GAUNTLET:** WEGA MAN takes his throne and **every player, one at a time, 1v1s a random character** in the
   ring (Rory, Shoebench, the Screamer, the Diver, the Glitch Guy, Urio, your Shadow or Wega's glitch head) while
   everyone else **watches from the balconies** until it's their turn. Grab the cores to beat your opponent. Win at
   least one duel and WEGA FACE is down (lose them all and the gauntlet starts over).

**The music follows the fight.** "Unexpectancy" plays one part at a time: phase 1 loops **part 1** for as long as
it lasts, the next phase crossfades into **part 2** and loops it, then **part 3** for the gauntlet, and the **finale**
when WEGA FACE goes down. It's synced to the fight's clock, so online everyone hears the same part at the same time.

Every hit you land (a rocket, a bonk, a duel core) also gives you **+25 health**, so the fight can be won on every
difficulty. Beating it pays **+500 Lil' Guys** and unlocks **WEGA FACE SLAYER**. The HUD's top bar shows its health (one
segment per hit), the phase, and when it's shielded.

## Going down

Every character that can kill you has its **own death scene**: Rory sprints at you out of the dark and grabs you
with his gloves, the Screamer stops dead in your face and red cracks run across your view, Shoebench comes down on
you, Urio walks into a spotlight, laughs and lunges, Wega rises and fires his eye lasers, the Diver plunges in front
of you and the water rises, the jellyfish close in and all zap at once, your Shadow walks into you, the Glitch Guy
breaks the world into pixels, the flood crashes over you, the Destroyer's hands clap, WEGA FACE chomps and WEGA MAN
punches. Then the title comes up (jump skips once the hit has landed).

**Online, you then spectate:** you can't come back until the run moves on (the next lap, the chase, or WEGA FACE's
next phase), or until everyone is down and the stage starts over. Use **< >** to watch someone else. If everyone
goes down in a chase or the boss fight, everyone spectates for 12 seconds (riding along over the collapse) before it
starts over. You always come back with full health.

**Going down in a chase on your own** works the same way: you watch the chase go on without you for 10 seconds,
then it starts over (on WEGA FACE's arena, the phase starts over). Going down in a lap on your own still gives you
the death screen with **RETRY**.

## Sounds you can read

Every caption at the bottom of the screen has its own sound effect, made in the browser: **[ WEGA LAUGHS ]** is a
deep, echoing, distorted laugh, **[ URIO LAUGHS ]** a warbling slowed-down cackle, **[ RORY'S FOOTSTEPS ]**,
**[ THE SCREAMER SCREAMS ]**, **[ WEGA FACE CACKLES ]**, **[ CHOMP ]**, **[ THUNDER ]**, alarms, glitches, crowds and
more, placed in 3D where they happen.

## The HUD

A speed dial (it turns red past 55 s/s), a card with your Lil' Guys left (RUN! in a chase, FIGHT! against WEGA
FACE) and your health in ten cells, all in the lap's colour. The bar on top is the lap timer, the chase's progress
(you, Urio, the collapse eating the route, the exit), Forget Me Not's time left, or the boss's health.

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

Host this folder over **HTTPS** (GitHub Pages, Netlify drop, itch.io HTML upload) and open `index.html` in your
browser, then **CLICK TO PLAY**. For VR, open it in the Quest browser and press **ENTER VR** (WebXR will not start
from `file://`).
The game still runs if `wega-music.js` is missing (just without music).

## Controls

| PC | Action |
|---|---|
| WASD / arrow keys | Move (speed builds up the longer you run) |
| Mouse | Look (click the game to lock the pointer) |
| Space | Jump (hold it to keep hopping) |
| E | Grab the idol |
| Shift | Sprint lock |
| Esc / P | Pause |
| M / F | Mute / full screen |
| Click | Press the menu button under the crosshair |

The HUD is part of the screen (it stays put however fast you turn), and glitchy mouse jumps from the browser are
filtered out so the view never snaps round.

**PC settings** (main menu or pause menu > SETTINGS): mouse sensitivity, invert mouse Y, field of view (60°-100°),
graphics (LOW / MEDIUM / HIGH render resolution), screen shake, reduce flashing, music and sound volume,
difficulty, captions, edge guard and an FPS counter. The VR-only settings (turning, comfort vignette, seated mode,
hands) show up when you're in VR.

| Quest (VR) | Action |
|---|---|
| Left stick | Move |
| Right stick | Snap turn (or smooth turn in Settings) |
| A / X | Jump |
| Left stick click | Toggle sprint lock |
| Grip | Grab the idol |
| Trigger | Click menu buttons with the laser |
| B / Y | Pause (hold 1 s to recentre) |

Phone / tablet: tap **TAP TO PLAY** (it goes full screen and asks for landscape). Left stick moves, drag the
right side of the screen to look, tap the 3D menu buttons, and use the JUMP / GRAB / SPRINT / pause buttons.
The full-screen button is in the top-right corner.

## Debug

Open `index.html?debug`: keys `1`–`9` jump to Lap 1 / Lap 2 / Idol Chamber / Escape / Win / Lap 3 / Lap 4 / Lap 5 /
RORY'S CHALLENGE.
`window.WEGA_DEBUG` has `skipToLap2()`, `skipToLap3()`, `skipToLap4()`, `skipToLap5()`, `skipToIdol()`, `skipToEscape()`, `win()`, `godMode(bool)`,
`setLeft(n)`, `spawnShoebench()`, `skipToChase5(seconds)`, `skipToBoss(phase)`, `bossAge(seconds)`, `bossHit()` and
`die(killer)` (plays that character's death scene). For RORY'S CHALLENGE: `skipToRory(seconds)` starts it at that
point of the song, `rorySeek(seconds)` jumps the song (offline) and `roryTime()` shows the song clock, the music's
position and the current part.
Runs that use debug helpers don't save a best time. Add `?offline` to play without connecting to any server.
