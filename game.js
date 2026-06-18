const cyclePieces = [
  {
    id: "fish-waste",
    label: "Fish Waste",
    icon: "🐟",
    formula: "Waste",
    info: "Fish release ammonia through their gills and waste. Uneaten food also breaks down and adds ammonia to the water.",
    target: "zone-fish-waste"
  },
  {
    id: "ammonia",
    label: "Ammonia",
    icon: "NH₃",
    formula: "NH₃ / NH₄⁺",
    info: "Ammonia is toxic to fish at high levels. In a healthy aquaponic system, bacteria quickly begin converting it.",
    target: "zone-ammonia"
  },
  {
    id: "nitrosomonas",
    label: "Nitrosomonas",
    icon: "🦠",
    formula: "Bacteria 1",
    info: "Nitrosomonas bacteria convert ammonia into nitrite. This is the first step of nitrification.",
    target: "zone-nitrosomonas"
  },
  {
    id: "nitrite",
    label: "Nitrite",
    icon: "NO₂⁻",
    formula: "NO₂⁻",
    info: "Nitrite is still harmful to fish, but it is an important middle form between ammonia and nitrate.",
    target: "zone-nitrite"
  },
  {
    id: "nitrobacter",
    label: "Nitrobacter",
    icon: "🧫",
    formula: "Bacteria 2",
    info: "Nitrobacter and related bacteria convert nitrite into nitrate, a safer form plants can absorb.",
    target: "zone-nitrobacter"
  },
  {
    id: "nitrate",
    label: "Nitrate",
    icon: "NO₃⁻",
    formula: "NO₃⁻",
    info: "Nitrate is the main plant-available nitrogen form in aquaponics. Plants use it for growth.",
    target: "zone-nitrate"
  },
  {
    id: "plant-uptake",
    label: "Plant Uptake",
    icon: "🌱",
    formula: "Roots",
    info: "Plants absorb nitrate through their roots and use it to build leaves, proteins, and chlorophyll.",
    target: "zone-plant-uptake"
  },
  {
    id: "clean-water",
    label: "Clean Water Return",
    icon: "💧",
    formula: "Return",
    info: "After bacteria and plants remove excess nitrogen, cleaner water returns to the fish side of the system.",
    target: "zone-clean-water"
  }
];

const dropZones = [
  // Fish silhouettes — top centre
  { id: "zone-fish-waste",     label: "Fish Waste",    x: 25, y:  3, w: 34, h: 22, clip: "ellipse(46% 44% at 50% 55%)" },
  // Left bare tree — above water line (distinctive bare branches)
  { id: "zone-ammonia",        label: "Ammonia",       x:  4, y: 14, w: 22, h: 24, clip: "ellipse(45% 44% at 52% 50%)" },
  // Left tree trunk descending into water
  { id: "zone-nitrosomonas",   label: "Nitrosomonas",  x:  3, y: 37, w: 28, h: 22, clip: "ellipse(46% 45% at 52% 50%)" },
  // Centre underwater — aqua bowl with tree base
  { id: "zone-nitrite",        label: "Nitrite",       x: 32, y: 44, w: 32, h: 22, clip: "ellipse(46% 44% at 50% 50%)" },
  // Right coral stem going into water
  { id: "zone-nitrobacter",    label: "Nitrobacter",   x: 65, y: 37, w: 28, h: 22, clip: "ellipse(46% 45% at 48% 50%)" },
  // Orange coral fronds — top right (vivid orange, very recognisable)
  { id: "zone-nitrate",        label: "Nitrate",       x: 63, y:  5, w: 29, h: 30, clip: "ellipse(44% 46% at 50% 52%)" },
  // Root system — bottom
  { id: "zone-plant-uptake",   label: "Plant Uptake",  x: 13, y: 73, w: 72, h: 23, clip: "ellipse(49% 45% at 50% 50%)" },
  // Water-surface reflection strip — centre, between left and right columns
  { id: "zone-clean-water",    label: "Clean Water",   x: 28, y: 27, w: 34, h: 11, clip: "ellipse(47% 43% at 50% 50%)" }
];

const BOARD_W = 1023, BOARD_H = 1537;

const piecesRoot = document.querySelector("#pieces");
const zonesRoot = document.querySelector("#zones");
const infoPanel = document.querySelector("#infoPanel");
const scoreText = document.querySelector("#scoreText");
const resetBtn = document.querySelector("#resetBtn");
const completeDialog = document.querySelector("#completeDialog");
const playAgainBtn = document.querySelector("#playAgainBtn");

// ── Audio (Web Audio API — no files needed) ───────────────────────────────
let audioCtx = null;
function ac() { return audioCtx || (audioCtx = new (window.AudioContext || window.webkitAudioContext)()); }
function note(freq, t, dur, type = 'sine', vol = 0.22) {
  const ctx = ac(), o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime + t);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
  o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + dur + 0.05);
}
function playCorrect() { note(523,0,.12); note(659,.1,.12); note(784,.2,.22); }
function playWrong()   { note(180,0,.15,'sawtooth',.12); note(155,.12,.2,'sawtooth',.08); }
function playComplete(){ [523,659,784,1047,784,1047].forEach((f,i) => note(f, i*.13, .25)); }

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

// ── Zone image backgrounds (grey-to-colour reveal) ────────────────────────
function sizeZoneBackgrounds() {
  const board = document.querySelector('#board');
  const W = board.offsetWidth, H = board.offsetHeight;
  if (!W || !H) return;
  document.querySelectorAll('.zone').forEach(el => {
    const z = dropZones.find(d => d.id === el.dataset.zoneId);
    if (!z) return;
    el.style.backgroundImage    = 'url(assets/board.webp)';
    el.style.backgroundSize     = `${W}px ${H}px`;
    el.style.backgroundPosition = `-${z.x / 100 * W}px -${z.y / 100 * H}px`;
  });
}

const state = {
  placed: new Set(),
  dragging: null,
  offsetX: 0,
  offsetY: 0
};

function renderPieces() {
  piecesRoot.innerHTML = cyclePieces.map(piece => `
    <button class="piece" data-piece-id="${piece.id}" type="button" aria-label="Drag ${piece.label}">
      <span class="icon">${piece.icon}</span>
      <span>
        <strong>${piece.label}</strong>
        <span>${piece.formula}</span>
      </span>
    </button>
  `).join("");
}

function renderZones() {
  zonesRoot.innerHTML = dropZones.map(zone => `
    <div
      class="zone"
      data-zone-id="${zone.id}"
      style="left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%;clip-path:${zone.clip}"
      aria-label="${zone.label} drop zone"
    ></div>
  `).join("");
  sizeZoneBackgrounds();
}

function updateTrayThumbnails() {
  document.querySelectorAll('.piece[data-piece-id]').forEach(pieceEl => {
    const p = cyclePieces.find(x => x.id === pieceEl.dataset.pieceId);
    if (!p) return;
    const z = dropZones.find(x => x.id === p.target);
    if (!z) return;
    const iconEl = pieceEl.querySelector('.icon');
    if (!iconEl) return;

    const iW = iconEl.offsetWidth || 48;
    const iH = iconEl.offsetHeight || 42;
    const zoneNatW = z.w / 100 * BOARD_W;
    const zoneNatH = z.h / 100 * BOARD_H;
    const scale = Math.min(iW / zoneNatW, iH / zoneNatH) * 0.9;

    const bgW = Math.round(BOARD_W * scale);
    const bgH = Math.round(BOARD_H * scale);
    const bgX = Math.round(-z.x / 100 * BOARD_W * scale + (iW - zoneNatW * scale) / 2);
    const bgY = Math.round(-z.y / 100 * BOARD_H * scale + (iH - zoneNatH * scale) / 2);

    iconEl.style.backgroundImage = 'url(assets/board.webp)';
    iconEl.style.backgroundSize = `${bgW}px ${bgH}px`;
    iconEl.style.backgroundPosition = `${bgX}px ${bgY}px`;
    iconEl.style.backgroundRepeat = 'no-repeat';
    iconEl.style.clipPath = z.clip;
    iconEl.style.filter = 'grayscale(1) brightness(0.7)';
    iconEl.textContent = '';
  });
}

function setInfo(piece, status = "correct") {
  infoPanel.className = `info-panel ${status}`;
  if (!piece) return;

  infoPanel.innerHTML = `
    <p class="info-kicker">${status === "correct" ? "Correct placement" : "Try again"}</p>
    <h2>${piece.label}${piece.formula ? ` <small>${piece.formula}</small>` : ""}</h2>
    <p>${piece.info}</p>
  `;
}

function setTryAgain(piece) {
  infoPanel.className = "info-panel try-again";
  infoPanel.innerHTML = `
    <p class="info-kicker">Try again</p>
    <h2>${piece.label}</h2>
    <p>That piece belongs somewhere else in the nitrogen cycle. Follow the conversion path: waste → ammonia → nitrite → nitrate → plant uptake → cleaner return water.</p>
  `;
}

function updateScore() {
  scoreText.textContent = `${state.placed.size} / ${cyclePieces.length} placed`;
  if (state.placed.size === cyclePieces.length) {
    playComplete();
    setTimeout(() => completeDialog.showModal(), 350);
  }
}

function findZoneUnderPoint(x, y) {
  return [...document.querySelectorAll(".zone")].find(zone => {
    const rect = zone.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  });
}

function clearZoneStates() {
  document.querySelectorAll(".zone").forEach(zone => zone.classList.remove("hot", "wrong"));
}

function startDrag(event) {
  const pieceEl = event.target.closest(".piece");
  if (!pieceEl || pieceEl.classList.contains("locked")) return;

  const rect = pieceEl.getBoundingClientRect();
  state.dragging = pieceEl;
  state.offsetX = event.clientX - rect.left;
  state.offsetY = event.clientY - rect.top;

  pieceEl.classList.add("dragging");
  pieceEl.style.left = `${rect.left}px`;
  pieceEl.style.top = `${rect.top}px`;

  document.body.appendChild(pieceEl);
  pieceEl.setPointerCapture?.(event.pointerId);
}

function moveDrag(event) {
  if (!state.dragging) return;

  state.dragging.style.left = `${event.clientX - state.offsetX}px`;
  state.dragging.style.top = `${event.clientY - state.offsetY}px`;

  clearZoneStates();
  const zone = findZoneUnderPoint(event.clientX, event.clientY);
  if (zone) zone.classList.add("hot");
}

function endDrag(event) {
  if (!state.dragging) return;

  const pieceEl = state.dragging;
  const pieceId = pieceEl.dataset.pieceId;
  const piece = cyclePieces.find(item => item.id === pieceId);
  const zone = findZoneUnderPoint(event.clientX, event.clientY);

  pieceEl.classList.remove("dragging");
  pieceEl.style.left = "";
  pieceEl.style.top = "";

  if (zone && piece.target === zone.dataset.zoneId) {
    lockPiece(pieceEl, piece, zone);
    setInfo(piece, "correct");
    playCorrect();
    speak(`${piece.label}. ${piece.info}`);
    state.placed.add(piece.id);
    updateScore();
  } else {
    piecesRoot.appendChild(pieceEl);
    setTryAgain(piece);
    playWrong();
    if (zone) {
      zone.classList.add("wrong");
      setTimeout(() => zone.classList.remove("wrong"), 450);
    }
  }

  clearZoneStates();
  state.dragging = null;
}

function lockPiece(pieceEl, piece, zone) {
  pieceEl.classList.add("locked");
  pieceEl.disabled = true;
  const iconEl = pieceEl.querySelector('.icon');
  if (iconEl) iconEl.style.filter = 'none';
  piecesRoot.appendChild(pieceEl);

  zone.classList.add("solved");

  const token = document.createElement("button");
  token.className = "placed-token";
  token.type = "button";
  token.textContent = piece.icon;
  token.title = piece.label;
  token.addEventListener("click", () => setInfo(piece, "correct"));
  zone.appendChild(token);
}

function resetGame() {
  state.placed.clear();
  completeDialog.close();
  renderPieces();
  updateTrayThumbnails();
  renderZones();
  updateScore();
  infoPanel.className = "info-panel";
  infoPanel.innerHTML = `
    <p class="info-kicker">Drop a piece into the correct place</p>
    <h2>Cycle information appears here</h2>
    <p>Drag a puzzle piece from the tray and drop it onto the matching area of the nitrogen cycle diagram.</p>
  `;
}

document.addEventListener("pointerdown", startDrag);
document.addEventListener("pointermove", moveDrag);
document.addEventListener("pointerup", endDrag);
resetBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

renderPieces();
updateTrayThumbnails();
renderZones();
updateScore();

const boardImg = document.querySelector('#board img');
if (boardImg.complete) sizeZoneBackgrounds();
else boardImg.addEventListener('load', sizeZoneBackgrounds);
new ResizeObserver(sizeZoneBackgrounds).observe(document.querySelector('#board'));
