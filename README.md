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
wega-music-endless0.js ... wega-music-endless5.js  ENDLESS's songs (Endless, then Endless 1-5: a new one every 10 floors)
wega-music-eshop.js  the theme of MR. GREEN'S SHOP in ENDLESS
                    (the ENDLESS songs aren't in index.html: the game loads each one only when a run needs it and
                    drops it again afterwards, so they cost nothing until you play ENDLESS; without them it's silent)
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
| GOING UP | Reach floor 10 in ENDLESS | Green Guy colour |
| SKYSCRAPER | Reach floor 25 in ENDLESS | Skyscraper colour |
| **FLOOR 50** | Reach floor 50 in ENDLESS | **Green Guy buddy hat + Floor 50 gold colour** |
| BIG SPENDER | Spend 300 Green Guys at Mr. Green's in one ENDLESS run | Toxic colour |
| ICE SKATER | Clear 3 icy floors in one ENDLESS run | Glacier colour |
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
- **ENDLESS**: floor after floor of small maps full of Green Guys, until you go down.

Difficulty and challenges (the lobby page) apply to all three.

### RORY'S CHALLENGE

An endurance run on **one huge map** (a 14 x 14 grid of platforms, about three times the area of a lap, lit up in
blue) with **500+ Lil' Guys** to collect:

| CHILL | NORMAL | HARD | WEGA MODE |
|---|---|---|---|
| 500 | 550 | 600 | 650 |

**The whole run is synced to its song** (RORY'S CHALLENGE, 145 BPM, 4:38). A 3-2-1-GO count-in lands on the
song's first beat, and from then on everything happens on the beat: the walkways pulse with the kick, a spectrum of
light round the world dances to the song, and **each part of the song brings its own enemies** (they land on
the beat, and each part is announced as it starts).

**RORY'S CHALLENGE has its own cast.** None of the laps' characters come here, except **Rory** (his footsteps land
on the beat) and **Shoebench** when the song runs out. The others all live on the music:

| Enemy | What it does | How to beat it |
|---|---|---|
| **THE NOTES** | A flock of glowing music notes (♪ ♫) that hop at you, one hop a beat, each aimed at where you'll be half a beat later (15 damage, the note pops) | Keep moving and they fall behind; don't run into the flock |
| **THE SUBWOOFER** | A floating speaker that slams on the kick: a shockwave rolls out along the floor under it (15). It pulls its cone back the beat before | Jump the wave |
| **THE BIG ONE** | In the storm the Subwoofer charges up for a bar (with a 3-2-1 countdown) and lets go on the downbeat: a wave through the whole map that meets you on whatever floor you're on (25) | Jump on the one! |
| **THE EQUALIZER** | Walls of EQ bars across the walkways (they also dance to the song). On their beats they shoot up, far too high to jump (20 and a shove back) | Cross when they drop; they breathe in just before they jump |
| **THE CONDUCTOR** | A giant in the sky with wild white hair, conducting the song (his baton traces the 4/4 pattern). Half a bar ahead he marks numbered circles where you're heading; the next bar lightning strikes them on beats 1, 2, 3, 4 (20) | Step round them, or brake and let the beat pass (jumping won't help) |
| **THE RECORDS** | Spinning vinyl that grinds along the walkways after you at shin height, surging forward on every beat and scratching (20) | Jump over them |
| **THE HUSH** | In the breakdown's dark: shadows with a finger to their lips that drift at you. The closer one gets, the more the music dies away and the dark closes in round your view (25) | If the music fades, run. The beat coming back chases them off |

| Part | Bars | What comes |
|---|---|---|
| THE BLUE HOUR | 0-7 | nothing yet: start collecting |
| THE NOTES | 8-15 | the first flocks of notes |
| THE BASS DROPS | 16-31 | the Subwoofer (slamming on the one) and Rory |
| THE EQUALIZER | 32-47 | EQ walls on the walkways round you, more notes, Rory |
| THE CONDUCTOR | 48-63 | the Conductor rises and strikes every two bars; a few EQ walls; Rory |
| SCRATCH | 64-79 | the Records drop onto the walkways; the Subwoofer comes back; Rory |
| BREAKDOWN | 80-86 | the lights die and the band walks off: the Hush comes, **walkways fall away** |
| SOMETHING IS COMING | 87-95 | the build-up: **sky bridges rise**, the Conductor returns, the notes gather |
| THE DROP | 96-127 | everyone at once: the Subwoofer on 1 and 3, the Conductor, Records, Notes, EQ walls, Rory |
| THE STORM | 128-151 | THE BIG ONE on every phrase (jump on the one!), the Conductor, Records, Notes; **the drop's bridges fall** |
| THE FINAL STRETCH | 152-159 | EQ walls everywhere, all on 1 and 3 (cross on the off-beat); **more walkways fall** |
| THE LAST 8 BARS | 160-167 | a bar countdown, the Conductor every bar, the Subwoofer, Records, Rory; **new bridges rise** |
| OVERTIME | after the song | Shoebench, plus the Subwoofer, Notes, Records and Rory |

CHILL spaces them out and sends fewer; HARD and WEGA MODE send more, more often, and quicker. Every one of them has
its own sound (and caption), its own death scene and a page in the character guide.

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

### ENDLESS

How high can you go? Every **floor** is a **fresh small map** (5 x 5 platforms) full of **Green Guys**: grab every
one and a **beacon** lights up; reach it and you go **up a floor** to a brand new map. It never ends: the run is
over when you go down. The **floor counter** is at the top of the HUD (with the world's name, a bar of how many
you've got, the enemies on this floor and when the next shop is).

**Green Guys** are ENDLESS's collectibles (instead of Lil' Guys): little bright green beans with big eyes, a smile,
nub arms and feet and a sprout on top. They're also the run's money (the counter by the HUD's top bar).

| Floors | Map | Green Guys | Song |
|---|---|---|---|
| 1-10 | 5 x 5 | 40 | Endless |
| 11-20 | 6 x 6 | 52 | Endless 1 |
| 21-30 | 7 x 7 | 64 | Endless 2 |
| 31-40 | 8 x 8 | 76 | Endless 3 |
| 41-50 | 9 x 9 | 88 | Endless 4 |
| 51-60 | 10 x 10 | 100 | Endless 5 |
| 61+ | 10 x 10 | 100 (the most) | Endless 1-5 again, round and round |

**It gets harder as you climb:** every 10 floors the map grows and there are more Green Guys, and every floor the
enemies get a little quicker and come more often (all the way to floor 51); from floor 11 on there are more of
them too.

**The enemies.** ENDLESS has its own ten (no characters from the laps). Every floor brings **one random enemy**,
and **every 5 floors one more stays for good** (so floor 5 has two, floor 10 three, and so on; never the same one
twice). The HUD's top bar shows who's here.

| Enemy | What it does | How to beat it |
|---|---|---|
| **THE MIMIC** | Looks just like a Green Guy, but its eyes flash red now and then. Get close and it splits open into two jaws full of teeth, a tongue lolls out, six spider legs unfold and it scuttles at you (25) | Watch the eyes before you grab |
| **THE STATUE** | A weeping stone angel (robe in folds, feathered wings, hands over its face) that only moves when you're not looking at it, and then fast (you hear the stone grind). Look back when it's close and it's reaching for you, claws out, fangs bared (30) | Keep it on screen |
| **BOING** | A striped rubber ball with a cartoon face (big blinking eyes, angry brows, little kicking feet) that bounces after you; its shadow shows where it lands, and its toothy mouth opens wide as it comes down (20) | Be somewhere else |
| **THE WEAVER** | Big hairy spiders with a glowing skull on their backs, eight jointed legs, eight red eyes and snapping fangs, hanging over the walkways; they drop on you (15). Webs on the floor slow you right down | Look up; go round the webs |
| **THE SENTRIES** | Tripod turrets with an armoured, bloodshot eye: the shutters blink, the eye tracks you, a lens ring glows and spins as it beeps faster and faster, then fires an orb (15) | Dodge the orbs |
| **THE BURROWER** | A giant drill-nosed mole in a miner's hard hat (its lamp shines), digging under the walkways at you: the floor cracks in a ring, then it bursts up, drill spinning and claws flailing (25) | Get out of the ring (or jump) |
| **THE SWARM** | A cloud of striped hornets (wings a blur) round their queen, who's twice their size and wears a little crown; inside it you get stung over and over (5 a sting) | It's slower than you: keep running |
| **THE BOULDER** | A huge cracked boulder with lava glowing through its cracks, moss on top and an angry face carved in it, rolling along the walkways at you (40) | Too big to jump: take another way, or step aside |
| **THE VACUUM** | A little black hole (a swirling disc of hot gas, a bright ring, rocks circling in) that drifts after you and pulls you in; touch it and it spits you out (20) | Run against it |
| **THE THIEF** | A raccoon burglar (mask, striped jumper, beanie, ringed tail) that runs up and steals your Green Guys, then runs off with its swag bag glowing (with nothing to steal it bonks you, 10) | Catch it to get them back (+3) |

Each one has its own sound (and caption), its own death scene and a page in the character guide.

**Ten worlds.** Every floor has a world: its walkways (colours and a pattern of their own), its sky, what's far
below, the landmarks and scenery round the map (lots of it moving), the platforms' own dressing, two layers of
weather, fog, light and its own background sound. Floor 1 is NEON NIGHT, **floor 2 is the ice**, then the rest come
round in a shuffled order (never the same world twice in a row).

| World | Walkways | Sky / below | Landmarks and scenery | The platforms | Weather, sound |
|---|---|---|---|---|---|
| NEON NIGHT | dark, with a glowing neon grid | synthwave sun and grid over a neon grid | a city skyline all round (every window lit, neon on the roofs), searchlights sweeping the sky, huge neon rings turning overhead, wireframe pyramids | neon strips and glowing discs underneath | dust and drifting neon bits; a low synth hum |
| **FROZEN PEAKS** | **ice: you slide** (you speed up and slow down slowly) | aurora over a frozen sea | snowy mountains all round, a big pale moon, ice arches in the sea, glowing ice pillars, ice spikes, icicles in the air | snow overhanging the edges, icicles underneath | snow and glitter; wind, ice creaking |
| MAGMA FORGE | dark rock with glowing veins | red storm clouds over **lava (it burns)** | a volcano smoking and throwing lava bombs, floating rocks pouring lavafalls, obsidian spires | lava dripping off them, rock spikes underneath | embers and ash; a rumble, crackling |
| TOXIC SWAMP | dark, with green ooze creeping over it | green haze over acid | giant glowing mushrooms, toxic barrels bobbing in the acid, rusty pipes pouring ooze, bubbles rising | moss on the edges, slime dripping, little glowing mushrooms | spores and bubbles; bubbling |
| CANDY CLOUDS | pink and white candy stripes | pastel sky over clouds | lollipops, candy canes, frosted donuts turning in the air, a giant cake with a cherry, cotton-candy clouds, gumdrops | frosting dripping off the edges, gumdrops | sprinkles and sugar motes; music-box twinkles |
| DESERT DUSK | rippled sand | a huge low sun over dunes | pyramids (one with a glowing golden cap), obelisks, an oasis with palms, cacti, mesas, tumbleweeds rolling by | sandstone pillars underneath, sand piles | blowing sand and dust motes; wind gusts |
| DEEP SPACE | black, glittering with stars | stars and planets over the void | banded planets with glowing atmospheres, a turning space station, an asteroid belt, satellites, nebulae, shooting stars | thrusters glowing underneath, blinking lights | star dust; a deep drone, radio beeps |
| THUNDERSTORM | steel plates and rivets | **lightning** over a dark sea | lightning striking the sea, a lighthouse sweeping its beam, wind turbines turning hard, storm clouds, lightning rods | steel struts underneath, blinking hazard lights | rain and mist; rain and wind |
| JUNGLE RUINS | old stone with moss and cracks | sun through the canopy over water | giant trees, a step pyramid with glowing eyes in its doorway and torches, waterfalls, totem heads, broken columns | moss on the edges, vines hanging down | fireflies and pollen; birds and insects |
| CRYSTAL CAVERN | shimmering violet crystal | glowing crystal far below | a cavern roof of crystal-tipped stalactites, a giant gem turning high above, rings of crystals circling, crystal clusters | crystals growing underneath and at the corners | sparkles and glints; chimes and a hum |

**YOUR BAG.** Everything you buy (or find) goes in your **bag**: 6 slots along the bottom of the HUD, each holding a
stack of one item. **Every item is temporary**: you use it when you want and it lasts a few seconds (or happens
there and then), then it's gone. Above the bag the HUD shows what's working on you and how long it has left.

| | Use the one you picked | Pick the next one | Use slot 1-6 |
|---|---|---|---|
| PC | **E** | **Q** or the mouse wheel | **1-6** |
| Quest (VR) | right grip | left grip | |
| Phone / tablet | **USE ITEM** (or GRAB) | **▸** | |

You start with a HEART. **A gift box is hidden on every floor** (the same platform for everyone): grab it for a free
random item (if your bag is full you get 15 Green Guys instead).

| Item | What it does | A slot holds |
|---|---|---|
| HEART | Heals 50 health (you can use it in the shop too) | 5 |
| REGEN POTION | Heals 6 health a second for 12 s | 3 |
| IRON SKIN | You take half damage for 20 s | 3 |
| BUBBLE SHIELD | Blocks the next hit (it pops after 40 s) | 3 |
| SPEED BOOTS | 30% faster for 15 s | 5 |
| SPRING SHOES | Jump 45% higher for 20 s | 5 |
| WINGS | A double jump for 25 s | 3 |
| FEATHER | You fall slowly (glide over gaps) for 15 s | 3 |
| MAGNET | Pulls in Green Guys from 8 m for 15 s | 3 |
| RADAR | An arrow to the nearest Green Guy for 25 s | 3 |
| LUCKY CLOVER | Every Green Guy counts double for 20 s | 3 |
| TIME STOP | Every enemy freezes for 6 s | 3 |
| SHOCKWAVE | Blasts the enemies off you and stuns them for 3 s | 3 |
| SUPER STAR | Invincible for 8 s (enemies that touch you get blasted) | 2 |
| 1-UP | Works by itself: keep it in your bag and if you go down it brings you back with half health | 2 |

Using the same timed item again adds its time (up to double).

**MR. GREEN'S SHOP.** After every 5th floor (5, 10, 15...) you go to Mr. Green's shop (with its own song): a little
island floating in a sunset sky, sky lanterns drifting up round it. Mr. Green himself (a big Green Guy in a top hat,
monocle, bow tie, waistcoat and a curly moustache) stands on a crate behind his market stall: a green-and-white
striped awning, shelves of potions and jars, a till that shows your Green Guys, a bell and a jar full of Green
Guys, string lights and a neon OPEN sign. He waves when you arrive, follows you with his eyes, chats (speech
bubbles), hops when you buy something and droops when you can't afford it.

Every item sits on its own **glowing pedestal** round the plaza with its price tag: **walk up to one and press E**
(GRAB on a phone, grip in VR) to buy it, or use the big menu board in front of the stall (click a card to see it,
click again or BUY to buy it). Everything goes in your bag. **One item each visit is half price** (it has a
spotlight on it, the same one for everyone), and the **MYSTERY BOX** gives you a random item. Prices go up a little
the higher you are. Then **NEXT FLOOR**.

**Floor 50** unlocks the **FLOOR 50** achievement (and its Green Guy buddy hat). Your best floor is saved on the
GAME MODES page and the main menu. At the end you get a Lil' Guy payout for the lobby shop (more the higher you got).

**Online**, everyone plays the same floors (same map, world and enemies) and Green Guys anyone grabs are gone for
everyone; each player keeps their own Green Guy wallet and items. When anyone reaches the beacon, **everyone goes up**.
At the shop everyone presses **READY** (or the shop closes after 45 s). If you go down you spectate and **come back
on the next floor**; if everyone goes down, it's game over for the run. **Offline**, going down ends the run
(unless there's a 1-UP in your bag). Each player has their own bag.

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

Every character that can kill you has its **own death scene** (RORY'S CHALLENGE's cast too: the notes close in a
hop a beat and hit a sour chord, the Subwoofer pulls its cone back and blows you away, an EQ wall slams into you, the
Conductor raises his baton and brings the lightning down, a record on its edge slices through, the Hush puts a finger
to its lips and the music dies; and ENDLESS's ten: a Green Guy's eyes flash red and it chomps, the Statue gets closer
every time the lights flicker, Boing's shadow spreads round your feet, the Weaver drops on its thread and webs over
your eyes, a Sentry beeps faster and fires, the Burrower bursts up through the cracks, the Swarm closes in, the
Boulder rolls out of the dark, the Vacuum pulls everything in and the Thief bonks you and runs off laughing): Rory sprints at you out of the dark and grabs you
with his gloves, the Screamer stops dead in your face and red cracks run across your view, Shoebench comes down on
you, Urio walks into a spotlight, laughs and lunges, Wega rises and fires his eye lasers, the Diver plunges in front
of you and the water rises, the jellyfish close in and all zap at once, your Shadow walks into you, the Glitch Guy
breaks the world into pixels, the flood crashes over you, the Destroyer's hands clap, WEGA FACE chomps and WEGA MAN
punches. Then the title comes up (jump skips once the hit has landed).

**Online, you then spectate:** you can't come back until the run moves on (the next lap, the chase, WEGA FACE's
next phase or ENDLESS's next floor), or until everyone is down and the stage starts over. Use **< >** to watch someone else. If everyone
goes down in a chase or the boss fight, everyone spectates for 12 seconds (riding along over the collapse) before it
starts over. You always come back with full health.

**Going down in a chase on your own** works the same way: you watch the chase go on without you for 10 seconds,
then it starts over (on WEGA FACE's arena, the phase starts over). Going down in a lap on your own still gives you
the death screen with **RETRY**.

## Sounds you can read

Every caption at the bottom of the screen has its own sound effect, made in the browser: **[ WEGA LAUGHS ]** is a
deep, echoing, distorted laugh, **[ URIO LAUGHS ]** a warbling slowed-down cackle, **[ RORY'S FOOTSTEPS ]**,
**[ THE SCREAMER SCREAMS ]**, **[ WEGA FACE CACKLES ]**, **[ CHOMP ]**, **[ THUNDER ]**, alarms, glitches, crowds and
more, placed in 3D where they happen. RORY'S CHALLENGE's cast has its own: **[ NOTES CHIME ]** (a tinkle on every
hop), **[ BASS THUMPS ]**, **[ THE CONDUCTOR TAPS HIS BATON ]**, **[ RECORD SCRATCH ]**, **[ SHHHHH... ]** and more.

## The HUD

A speed dial (it turns red past 55 s/s), a card with your Lil' Guys left (RUN! in a chase, FIGHT! against WEGA
FACE) and your health in ten cells, all in the lap's colour. The bar on top is the lap timer, the chase's progress
(you, Urio, the collapse eating the route, the exit), Forget Me Not's time left, or the boss's health. In ENDLESS
it's in the world's colour, the card counts Green Guys left, and the top shows the floor and its world, how many
you've got, who's on this floor, your Green Guy wallet, when the next shop is, your shield and whether the floor's
gift box is still out there. Under the card is your bag (6 slots) and what's working on you right now.

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
| E | Grab the idol (ENDLESS: use the item you picked in your bag; in the shop, buy what's on the pedestal next to you) |
| Q / mouse wheel / 1-6 | ENDLESS: pick the next item in your bag / use slot 1-6 |
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
| Grip | Grab the idol (ENDLESS: right grip uses the item you picked, left grip picks the next; in the shop, buys) |
| Trigger | Click menu buttons with the laser |
| B / Y | Pause (hold 1 s to recentre) |

Phone / tablet: tap **TAP TO PLAY** (it goes full screen and asks for landscape). Left stick moves, drag the
right side of the screen to look, tap the 3D menu buttons, and use the JUMP / GRAB / SPRINT / pause buttons (in
ENDLESS also USE ITEM and ▸ for your bag).
The full-screen button is in the top-right corner.

## Debug

Open `index.html?debug`: keys `1`–`9` jump to Lap 1 / Lap 2 / Idol Chamber / Escape / Win / Lap 3 / Lap 4 / Lap 5 /
RORY'S CHALLENGE, and `0` starts ENDLESS.
`window.WEGA_DEBUG` has `skipToLap2()`, `skipToLap3()`, `skipToLap4()`, `skipToLap5()`, `skipToIdol()`, `skipToEscape()`, `win()`, `godMode(bool)`,
`setLeft(n)`, `spawnShoebench()`, `skipToChase5(seconds)`, `skipToBoss(phase)`, `bossAge(seconds)`, `bossHit()` and
`die(killer)` (plays that character's death scene). For RORY'S CHALLENGE: `skipToRory(seconds)` starts it at that
point of the song, `rorySeek(seconds)` jumps the song (offline) and `roryTime()` shows the song clock, the music's
position and the current part. For ENDLESS: `skipToFloor(n, seed)` starts a run on floor `n`, `endlessShop()`
opens Mr. Green's shop, `giveGreen(n)` adds Green Guys to your wallet, `giveItem(id, n)` puts items in your bag
and `endlessState()` shows the floor, world, enemies, wallet, bag, what's working on you and the song.
Runs that use debug helpers don't save a best time. Add `?offline` to play without connecting to any server.
