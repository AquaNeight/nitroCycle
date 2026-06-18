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
  // Positions tuned for the portrait aquaponic ecosystem illustration.
  // Adjust x/y/w/h (% of image) after visual testing.
  { id: "zone-fish-waste",     label: "Fish Waste",    x: 28, y:  5, w: 16, h: 14 },
  { id: "zone-ammonia",        label: "Ammonia",       x: 10, y: 32, w: 15, h: 11 },
  { id: "zone-nitrosomonas",   label: "Nitrosomonas",  x: 10, y: 47, w: 15, h: 12 },
  { id: "zone-nitrite",        label: "Nitrite",       x: 38, y: 59, w: 14, h: 11 },
  { id: "zone-nitrobacter",    label: "Nitrobacter",   x: 63, y: 47, w: 15, h: 12 },
  { id: "zone-nitrate",        label: "Nitrate",       x: 60, y: 68, w: 14, h: 11 },
  { id: "zone-plant-uptake",   label: "Plant Uptake",  x: 70, y: 10, w: 16, h: 14 },
  { id: "zone-clean-water",    label: "Clean Water",   x: 64, y: 32, w: 15, h: 11 }
];

const piecesRoot = document.querySelector("#pieces");
const zonesRoot = document.querySelector("#zones");
const infoPanel = document.querySelector("#infoPanel");
const scoreText = document.querySelector("#scoreText");
const resetBtn = document.querySelector("#resetBtn");
const completeDialog = document.querySelector("#completeDialog");
const playAgainBtn = document.querySelector("#playAgainBtn");

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
      style="left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%"
      aria-label="${zone.label} drop zone"
    ></div>
  `).join("");
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
    state.placed.add(piece.id);
    updateScore();
  } else {
    piecesRoot.appendChild(pieceEl);
    setTryAgain(piece);
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
  piecesRoot.appendChild(pieceEl);

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
renderZones();
updateScore();
