# Nitrogen Cycle Puzzle

A static interactive aquaponics nitrogen-cycle puzzle.

## What it does

Students drag nitrogen-cycle pieces onto the correct parts of the board image. When a piece is placed correctly, it locks into the image and an information panel appears under the board.

The visual board stays mostly clean. The instructional text lives in the interactive layer.

## Files

- `index.html` — page structure
- `style.css` — layout and game visuals
- `game.js` — drag/drop puzzle logic and cycle data
- `assets/board.png` — board image placeholder

## Run locally

Open `index.html` in a browser.

For GitHub Pages, place this folder in a repo and enable Pages for the branch/folder.

## Tuning drop zones

Edit the `dropZones` array in `game.js`.

Coordinates are percentages:

```js
{ id: "zone-ammonia", x: 18, y: 47, w: 11, h: 11 }
```

This means:
- `x`: left position
- `y`: top position
- `w`: width
- `h`: height

## Next upgrades

- Add audio feedback
- Add hint mode
- Add teacher dashboard
- Add quiz mode after completion
- Swap in a clean text-free board image
