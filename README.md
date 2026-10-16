# Claude-s-challenge-

**Wega's Challenge: The Idol (VR)** is a WebXR fan remake for the Meta Quest 3S browser. It also plays on desktop with mouse and keyboard.

```
index.html      the whole game (Three.js r160 from jsDelivr, everything else inline)
wega-music.js   the music pack (both songs as base64 MP3 + the WegaMusic player)
```

## Play

Host this folder over **HTTPS** (GitHub Pages, Netlify drop, itch.io HTML upload) and open `index.html`
in the Quest browser, then press **ENTER VR**. WebXR will not start from `file://`.
The game still runs if `wega-music.js` is missing (just without music).

## Controls

| Quest | Action |
|---|---|
| Left stick | Move (speed builds up the longer you run) |
| Right stick | Snap turn (or smooth turn in Settings) |
| A / X | Jump |
| Left stick click | Toggle sprint lock |
| Grip | Grab the idol |
| Trigger | Click menu buttons with the laser |
| B / Y | Pause (hold 1 s to recentre) |

Desktop: WASD move, mouse look (click to lock the pointer), Space jump, E grab, Shift sprint lock,
Esc or P pause, M mute. Aim the crosshair at a menu button and click.

## Debug

Open `index.html?debug`: keys `1`–`5` jump to Lap 1 / Lap 2 / Idol Chamber / Escape / Win.
`window.WEGA_DEBUG` has `skipToLap2()`, `skipToIdol()`, `skipToEscape()`, `win()`, `godMode(bool)`, `setLeft(n)`.
Runs that use debug helpers don't save a best time.
