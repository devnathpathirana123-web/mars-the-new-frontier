
import { useEffect, useRef, useState } from "react";
import "./App.css";

const SIZE = 24;
const TILE_W = 64;
const TILE_H = 32;
const SAVE_KEY = "mars-new-frontier-save-v1";

const BUILDINGS = {
  habitat: {
    name: "Habitat",
    icon: "⌂",
    cost: { metal: 30, energy: 10 },
    description: "Provides housing for 8 colonists.",
  },
  solar: {
    name: "Solar Array",
    icon: "☼",
    cost: { metal: 20 },
    description: "Generates 18 energy per day.",
  },
  extractor: {
    name: "Water Extractor",
    icon: "♧",
    cost: { metal: 35, energy: 10 },
    description: "Extracts 12 water per day.",
  },
  greenhouse: {
    name: "Greenhouse",
    icon: "♨",
    cost: { metal: 25, water: 10, energy: 10 },
    description: "Produces 10 food per day.",
  },
  mine: {
    name: "Mining Facility",
    icon: "◆",
    cost: { metal: 40, energy: 15 },
    description: "Produces 8 metal per day.",
  },
  research: {
    name: "Research Lab",
    icon: "⌬",
    cost: { metal: 35, energy: 20 },
    description: "Produces 5 research per day.",
  },
};

const INITIAL_RESOURCES = {
  metal: 180,
  energy: 100,
  water: 100,
  food: 100,
  research: 0,
};

function makeTerrain() {
  return Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => {
      const noise =
        Math.sin(x * 0.43) * 0.45 +
        Math.cos(y * 0.37) * 0.35 +
        Math.sin((x + y) * 0.21) * 0.2;

      return {
        height: Math.round((noise + 1) * 3),
        roughness: Math.abs(noise),
      };
    })
  );
}

function rotateTile(x, y, rotation) {
  if (rotation === 1) return [SIZE - 1 - y, x];
  if (rotation === 2) return [SIZE - 1 - x, SIZE - 1 - y];
  if (rotation === 3) return [y, SIZE - 1 - x];
  return [x, y];
}

function inverseRotateTile(x, y, rotation) {
  if (rotation === 1) return [y, SIZE - 1 - x];
  if (rotation === 2) return [SIZE - 1 - x, SIZE - 1 - y];
  if (rotation === 3) return [SIZE - 1 - y, x];
  return [x, y];
}

function createInitialGame() {
  return {
    resources: { ...INITIAL_RESOURCES },
    buildings: [
      { id: 1, type: "habitat", x: 12, y: 12 },
    ],
    day: 1,
    population: 8,
  };
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    console.warn("Could not load saved colony.");
  }
  return createInitialGame();
}

export default function App() {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.85 });

  const [terrain] = useState(makeTerrain);
  const [game, setGame] = useState(loadGame);
  const [selectedBuilding, setSelectedBuilding] = useState("solar");
  const [selectedTile, setSelectedTile] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState("Colony systems online.");
  const [paused, setPaused] = useState(false);

  const buildings = game.buildings;

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (!rect.width || !rect.height) return;

    if (
      canvas.width !== Math.round(rect.width * dpr) ||
      canvas.height !== Math.round(rect.height * dpr)
    ) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = "#171719";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const camera = cameraRef.current;
    const centerX = rect.width / 2 + camera.x;
    const centerY = rect.height / 2 + camera.y;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw terrain from back to front.
    for (let sum = 0; sum <= (SIZE - 1) * 2; sum++) {
      for (let x = 0; x < SIZE; x++) {
        const y = sum - x;
        if (y < 0 || y >= SIZE) continue;

        const [rx, ry] = rotateTile(x, y, rotation);
        const tile = terrain[y][x];

        const px = (rx - ry) * TILE_W / 2;
        const py = (rx + ry) * TILE_H / 2 - tile.height * 2;

        const shade = Math.round(105 + tile.roughness * 35);
        const selected =
          selectedTile?.x === x && selectedTile?.y === y;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + TILE_W / 2, py + TILE_H / 2);
        ctx.lineTo(px, py + TILE_H);
        ctx.lineTo(px - TILE_W / 2, py + TILE_H / 2);
        ctx.closePath();

        ctx.fillStyle = selected
          ? "#e6a45b"
          : `rgb(${shade + 30}, ${Math.round(shade * 0.48)}, ${Math.round(shade * 0.36)})`;

        ctx.fill();
        ctx.strokeStyle = "rgba(25, 20, 19, 0.38)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const building = buildings.find(
          (b) => b.x === x && b.y === y
        );

        if (building) {
          const info = BUILDINGS[building.type];

          ctx.fillStyle = "#302923";
          ctx.beginPath();
          ctx.ellipse(
            px,
            py + TILE_H * 0.48,
            17,
            8,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          ctx.fillStyle =
            building.type === "habitat" ? "#b8d4dc" :
            building.type === "solar" ? "#d8a94e" :
            building.type === "greenhouse" ? "#8dbb8a" :
            building.type === "research" ? "#9f9ad5" :
            building.type === "extractor" ? "#6ca9b6" :
            "#c28a65";

          ctx.beginPath();
          ctx.moveTo(px, py + 1);
          ctx.lineTo(px + 14, py + 8);
          ctx.lineTo(px, py + 16);
          ctx.lineTo(px - 14, py + 8);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#e9e5df";
          ctx.font = "bold 17px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(info.icon, px, py + 7);
        }
      }
    }

    ctx.restore();

    // Camera and map information.
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("PROTOTYPE TERRAIN · NOT NASA MEASURED DATA", 18, rect.height - 18);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    draw();

    return () => observer.disconnect();
  });

  useEffect(() => {
    draw();
  }, [game, selectedTile, rotation, terrain]);

  
function screenToTile(clientX, clientY) {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const camera = cameraRef.current;

  const sx =
    (clientX - rect.left - rect.width / 2 - camera.x) /
    camera.zoom;

  const sy =
    (clientY - rect.top - rect.height / 2 - camera.y) /
    camera.zoom;

  let bestTile = null;
  let bestDistance = Infinity;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [rx, ry] = rotateTile(x, y, rotation);
      const tile = terrain[y][x];

      const px = (rx - ry) * TILE_W / 2;
      const py =
        (rx + ry) * TILE_H / 2 - tile.height * 2;

      const dx = sx - px;
      const dy = sy - (py + TILE_H / 2);

      const insideDiamond =
        Math.abs(dx) / (TILE_W / 2) +
        Math.abs(dy) / (TILE_H / 2) <= 1;

      if (!insideDiamond) continue;

      const distance = dx * dx + dy * dy;

      if (distance < bestDistance) {
        bestDistance = distance;
        bestTile = { x, y };
      }
    }
  }

  return bestTile;
}

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      cameraX: cameraRef.current.x,
      cameraY: cameraRef.current.y,
      moved: false,
    };
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;

    const drag = dragRef.current;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    if (Math.abs(dx) + Math.abs(dy) > 5) {
      drag.moved = true;
    }

    if (drag.moved) {
      cameraRef.current.x = drag.cameraX + dx;
      cameraRef.current.y = drag.cameraY + dy;
      draw();
    }
  }

  function handlePointerUp() {
    suppressClickRef.current = Boolean(dragRef.current?.moved);
    dragRef.current = null;
  }

  function handleCanvasClick(event) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const tile = screenToTile(event.clientX, event.clientY);
    if (!tile) return;

    const existing = buildings.find(
      (b) => b.x === tile.x && b.y === tile.y
    );

    if (existing) {
      setSelectedTile(tile);
      setMessage(`${BUILDINGS[existing.type].name} selected.`);
      return;
    }

    const definition = BUILDINGS[selectedBuilding];

    const canAfford = Object.entries(definition.cost).every(
      ([resource, cost]) => game.resources[resource] >= cost
    );

    if (!canAfford) {
      setMessage("Insufficient resources for construction.");
      return;
    }

    setGame((previous) => ({
      ...previous,
      resources: Object.fromEntries(
        Object.entries(previous.resources).map(([key, value]) => [
          key,
          value - (definition.cost[key] || 0),
        ])
      ),
      buildings: [
        ...previous.buildings,
        {
          id: Date.now(),
          type: selectedBuilding,
          x: tile.x,
          y: tile.y,
        },
      ],
    }));

    setSelectedTile(tile);
    setMessage(`${definition.name} constructed.`);
  }

  function advanceDay() {
    if (paused) return;

    setGame((previous) => {
      const count = (type) =>
        previous.buildings.filter((b) => b.type === type).length;

      const next = { ...previous.resources };

      next.energy += count("solar") * 18;
      next.water += count("extractor") * 12;
      next.food += count("greenhouse") * 10;
      next.metal += count("mine") * 8;
      next.research += count("research") * 5;

      // Basic colony consumption.
      next.food -= Math.ceil(previous.population * 0.5);
      next.water -= Math.ceil(previous.population * 0.25);
      next.energy -= count("habitat") * 2;

      for (const resource of Object.keys(next)) {
        next[resource] = Math.max(0, Math.min(9999, next[resource]));
      }

      return {
        ...previous,
        resources: next,
        day: previous.day + 1,
      };
    });

    setMessage(`Day ${game.day + 1} simulation complete.`);
  }

  function changeZoom(amount) {
    cameraRef.current.zoom = Math.max(
      0.45,
      Math.min(1.8, cameraRef.current.zoom + amount)
    );
    draw();
  }

  function resetCamera() {
    cameraRef.current = { x: 0, y: 0, zoom: 0.85 };
    setRotation(0);
    draw();
  }

  function resetColony() {
    if (!window.confirm("Start a new colony? Your current save will be replaced.")) {
      return;
    }

    setGame(createInitialGame());
    setSelectedTile(null);
    setMessage("New colony initialized.");
  }

  const resourceIcons = {
    metal: "◆",
    energy: "ϟ",
    water: "◈",
    food: "✣",
    research: "⌬",
  };

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-title">MARS</div>
            <div className="brand-subtitle">THE NEW FRONTIER</div>
          </div>
        </div>

        <div className="mission-status">
          <span className="status-dot" />
          COLONY ONLINE
        </div>

        <div className="day-counter">
          <span>MISSION DAY</span>
          <strong>{game.day.toString().padStart(3, "0")}</strong>
        </div>
      </header>

      <section className="resource-bar">
        {Object.entries(game.resources).map(([key, value]) => (
          <div className="resource" key={key}>
            <span className="resource-icon">{resourceIcons[key]}</span>
            <div>
              <small>{key.toUpperCase()}</small>
              <strong>{Math.floor(value)}</strong>
            </div>
          </div>
        ))}
        <div className="resource population">
          <span className="resource-icon">♙</span>
          <div>
            <small>POPULATION</small>
            <strong>{game.population}</strong>
          </div>
        </div>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="panel-heading">
            <span>01 / CONSTRUCTION</span>
            <small>BUILD MENU</small>
          </div>

          <p className="panel-description">
            Select a structure, then click an empty tile to construct it.
          </p>

          <div className="building-list">
            {Object.entries(BUILDINGS).map(([key, item]) => (
              <button
                key={key}
                className={`building-option ${selectedBuilding === key ? "active" : ""}`}
                onClick={() => {
                  setSelectedBuilding(key);
                  setMessage(`${item.name} selected for construction.`);
                }}
              >
                <span className="building-icon">{item.icon}</span>
                <span className="building-info">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                  <small className="cost">
                    {Object.entries(item.cost)
                      .map(([resource, amount]) => `${amount} ${resource}`)
                      .join(" · ")}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <div className="sidebar-bottom">
            <div className="panel-heading">02 / SIMULATION</div>
            <button className="primary-button" onClick={advanceDay}>
              ADVANCE ONE DAY <span>→</span>
            </button>
            <button
              className="secondary-button"
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? "RESUME SIMULATION" : "PAUSE SIMULATION"}
            </button>
            <button className="text-button" onClick={resetColony}>
              RESET COLONY
            </button>
          </div>
        </aside>

        <section className="map-panel">
          <div className="map-label">
            <span>ARES PLANITIA</span>
            <small>SECTOR 01 · COLONY SITE</small>
          </div>

          <canvas
            ref={canvasRef}
            className="mars-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleCanvasClick}
          />

          <div className="map-controls">
            <button onClick={() => changeZoom(0.12)}>+</button>
            <button onClick={() => changeZoom(-0.12)}>−</button>
            <button onClick={() => setRotation((r) => (r + 1) % 4)}>
              ↻
            </button>
            <button onClick={resetCamera}>⌖</button>
          </div>

          <div className="map-footer">
            <span>CAMERA: ISOMETRIC</span>
            <span>DRAG TO PAN · SCROLL NOT REQUIRED</span>
          </div>
        </section>

        <aside className="inspector">
          <div className="panel-heading">
            <span>03 / MISSION CONTROL</span>
          </div>

          <div className="inspector-card">
            <small>COLONY STATUS</small>
            <h2>Operational</h2>
            <p>Initial settlement established. Expand infrastructure to support long-term survival.</p>
          </div>

          <div className="inspector-section">
            <small>SELECTED STRUCTURE</small>
            {selectedTile ? (
              <>
                <h3>
                  {BUILDINGS[
                    buildings.find(
                      (b) =>
                        b.x === selectedTile.x &&
                        b.y === selectedTile.y
                    )?.type
                  ]?.name || "Terrain tile"}
                </h3>
                <p>Grid position: {selectedTile.x}, {selectedTile.y}</p>
              </>
            ) : (
              <p>Select a structure on the map to inspect it.</p>
            )}
          </div>

          <div className="inspector-section">
            <small>COLONY MESSAGE</small>
            <p className="message">{message}</p>
          </div>

          <div className="inspector-section">
            <small>CONSTRUCTION COUNT</small>
            <h3>{buildings.length}</h3>
            <p>Structures currently deployed</p>
          </div>

          <div className="inspector-note">
            <strong>PROTOTYPE BUILD</strong>
            <p>Terrain is procedurally generated. Real Mars data integration is planned for Phase 2.</p>
          </div>
        </aside>
      </section>

      <footer className="footer">
        <span>MARS: THE NEW FRONTIER</span>
        <span>LOCAL PROTOTYPE · PHASE 1</span>
        <span>COLONY SIMULATION SYSTEM</span>
      </footer>
    </main>
  );
}
