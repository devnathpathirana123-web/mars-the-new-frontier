import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { MapControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";

import DetailedHabitatModel from "./buildings/HabitatModel";
import DetailedGreenhouseModel from "./buildings/GreenhouseModel";
import DetailedSolarModel from "./buildings/SolarModel";
import DetailedWaterModel from "./buildings/WaterModel";
import DetailedMineModel from "./buildings/MineModel";
import DetailedResearchModel from "./buildings/ResearchModel";
import CompactBuildingModel from "./buildings/shared/CompactBuildingModel";

import {
  CATALOG,
  TECHNOLOGIES,
  freshGame,
  validateSave,
  output,
  energyCost,
  upgradeCost,
  canAfford,
  simulateSol,
  calculateSatisfaction,
  dispatchColony,
  getColonyReport,
} from "../game/colony";
import { terrainProfile } from "../game/networks";
import ColonyOperations from "./ColonyOperations";
import Infrastructure from "./Infrastructure";
import "./MarsWorld.css";

// =====================================================
// MARS: THE NEW FRONTIER
// PHASE 6 — COLONY INFRASTRUCTURE
// =====================================================

const SAVE_KEY = "mars-new-frontier-save-v2";
const SAVE_VERSION = 3;

const SOL_DURATION = 5000;
const GRID = 8;

// Each building reserves a square construction plot.
const BUILDING_PLOT = 7.5;

// =====================================================
// TERRITORY EXPANSION
// =====================================================

const EXPANSION_MILESTONES = [
  {
    population: 0,
    width: 80,
    title: "Pioneer Outpost",
  },
  {
    population: 500,
    width: 120,
    title: "Growing Settlement",
  },
  {
    population: 1500,
    width: 170,
    title: "Martian Town",
  },
  {
    population: 5000,
    width: 240,
    title: "Major Colony",
  },
];

function territoryFor(population) {
  return [...EXPANSION_MILESTONES]
    .reverse()
    .find((tier) => population >= tier.population);
}

// =====================================================
// CONSTRUCTION COLLISION SYSTEM
// =====================================================

function footprintCollision(buildings, x, z, ignoreId = null) {
  return buildings.some((building) => {
    if (building.id === ignoreId) {
      return false;
    }

    const overlapX = Math.abs(building.x - x) < BUILDING_PLOT;

    const overlapZ = Math.abs(building.z - z) < BUILDING_PLOT;

    return overlapX && overlapZ;
  });
}

function insideTerritory(x, z, population) {
  const territory = territoryFor(population);
  const half = territory.width / 2;
  const margin = BUILDING_PLOT / 2;

  return Math.abs(x) + margin <= half && Math.abs(z) + margin <= half;
}

// =====================================================
// CITIZEN SATISFACTION FRAMEWORK
// =====================================================

function loadSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw);
    const validated = validateSave(data);
    if (validated && data.version === 2) {
      try {
        if (!localStorage.getItem(SAVE_KEY + "-legacy-backup"))
          localStorage.setItem(SAVE_KEY + "-legacy-backup", raw);
        localStorage.setItem(SAVE_KEY, JSON.stringify(validated));
      } catch {
        /* Loading remains available when storage is full. */
      }
    }
    return validated;
  } catch (error) {
    console.warn("Unable to load Mars colony:", error);
    return null;
  }
}

function saveGame(game) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...game,
        version: SAVE_VERSION,
      }),
    );

    return true;
  } catch (error) {
    console.error("Unable to save Mars colony:", error);
    return false;
  }
}

function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;

  return n - Math.floor(n);
}

// =====================================================
// SMOOTH PROCEDURAL NOISE
// =====================================================

function noise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);

  const fx = x - ix;
  const fz = z - iz;

  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);

  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), u),
    THREE.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u),
    v,
  );
}

// =====================================================
// TERRAIN HEIGHT GENERATION
// =====================================================

function terrainHeight(x, z) {
  const distance = Math.hypot(x, z);

  // Preserve a relatively flat starting settlement.
  const wilderness = THREE.MathUtils.smoothstep(distance, 20, 65);

  let elevation = 0;
  let amplitude = 10;
  let frequency = 0.02;

  // Multiple noise layers create natural terrain.
  for (let i = 0; i < 5; i++) {
    elevation += (noise(x * frequency, z * frequency) * 2 - 1) * amplitude;

    amplitude *= 0.5;
    frequency *= 2;
  }

  // Elevated ridges and mountainous formations.
  const ridges =
    Math.pow(1 - Math.abs(noise(x * 0.018 + 12, z * 0.018 - 5) * 2 - 1), 3) * 8;

  let height = (elevation + ridges - 3) * wilderness;

  // Martian impact craters.
  const craters = [
    [-55, -40, 25, 6],
    [65, 45, 30, 8],
    [-80, 75, 20, 5],
    [85, -75, 28, 7],
  ];

  for (const [cx, cz, radius, depth] of craters) {
    const t = Math.hypot(x - cx, z - cz) / radius;

    // Depression in the crater center.
    height -= depth * Math.exp(-Math.pow(t / 0.72, 4));

    // Raised crater rim.
    height += depth * 0.4 * Math.exp(-Math.pow((t - 1) / 0.14, 2));
  }

  return height;
}

// =====================================================
// TERRAIN MESH
// =====================================================

function Terrain({ onHover, onPlace }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(320, 320, 180, 180);

    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = [];

    const dark = new THREE.Color("#623a2b");
    const middle = new THREE.Color("#a76043");
    const light = new THREE.Color("#cb9470");

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = terrainHeight(x, z);

      positions.setY(i, y);

      const color = middle.clone();

      if (y < 0) {
        color.lerp(dark, THREE.MathUtils.clamp(-y / 12, 0, 1));
      } else {
        color.lerp(light, THREE.MathUtils.clamp(y / 18, 0, 1));
      }

      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    geo.computeVertexNormals();

    return geo;
  }, []);

  // Release GPU resources when unmounted.
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  // ===================================================
  // PROCEDURAL ROCK DISTRIBUTION
  // ===================================================

  const rocks = useMemo(() => {
    const items = [];

    for (let i = 0; i < 220; i++) {
      const x = (hash(i, 17) - 0.5) * 290;

      const z = (hash(i, 39) - 0.5) * 290;

      // Keep the starting area clear.
      if (Math.hypot(x, z) < 24) {
        continue;
      }

      items.push({
        id: i,
        x,
        z,
        size: 0.3 + hash(i, 71) * 1.3,
      });
    }

    return items;
  }, []);

  // ===================================================
  // RENDER MARTIAN SURFACE
  // ===================================================

  return (
    <group>
      <mesh
        geometry={geometry}
        receiveShadow
        onPointerMove={(event) => {
          event.stopPropagation();

          onHover(event.point.x, event.point.z);
        }}
        onClick={(event) => {
          event.stopPropagation();
          // Ignore clicks caused by camera dragging.
          if (event.delta > 5) {
            return;
          }

          onPlace(event.point.x, event.point.z);
        }}
      >
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>

      {rocks.map((rock) => (
        <mesh
          key={rock.id}
          position={[
            rock.x,
            terrainHeight(rock.x, rock.z) + rock.size * 0.25,
            rock.z,
          ]}
          scale={[rock.size, rock.size * 0.65, rock.size * 0.8]}
          rotation={[0.2, rock.id, 0.1]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />

          <meshStandardMaterial
            color={rock.id % 3 === 0 ? "#684638" : "#89604a"}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================
// PHASE 6 — BUILDING ARCHITECTURE
// =====================================================

const MODELS = {
  habitat: DetailedHabitatModel,
  solar: DetailedSolarModel,
  extractor: DetailedWaterModel,
  greenhouse: DetailedGreenhouseModel,
  mine: DetailedMineModel,
  research: DetailedResearchModel,
};

// =====================================================
// COMPACT BUILDING FITTING SYSTEM
// =====================================================

// =====================================================
// BUILDING RENDERER
// =====================================================

function Building({ building, selected, onSelect, status }) {
  const Model = MODELS[building.type];

  if (!Model) {
    return null;
  }

  const groundHeight = terrainHeight(building.x, building.z);

  return (
    <group
      position={[building.x, groundHeight, building.z]}

      onClick={(event) => {
        event.stopPropagation();

        if (event.delta > 5) {
          return;
        }

        onSelect(building.id);
      }}
    >
      {/* Selected building indicator */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
          <ringGeometry args={[3.58, 3.7, 64]} />
          <meshBasicMaterial color="#ffcc88" side={THREE.DoubleSide} />
        </mesh>
      )}

      {status && (
        <mesh position={[2.8, 0.65, 2.8]} raycast={() => {}}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial
            color={status.operating ? "#73e2a6" : "#e89b5f"}
            emissive={status.operating ? "#73e2a6" : "#e89b5f"}
            emissiveIntensity={0.65}
          />
        </mesh>
      )}
      {selected && (
        <Html position={[0, 5.8, 0]} center style={{ pointerEvents: "none" }}>
          <div className="mars-building-label">
            {CATALOG[building.type].name} #{building.id} · L{building.level}
            <small>{status?.reason ?? "Selected"}</small>
          </div>
        </Html>
      )}
      {/* Detailed compact architecture */}
      <CompactBuildingModel
        Model={Model}
        plotSize={BUILDING_PLOT}
        animated={status?.operating ?? false}
        level={building.level}
      />

      {/* Invisible interaction volume */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[7, 5, 7]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// =====================================================
// CONSTRUCTION PLACEMENT PREVIEW
// =====================================================

function GhostBuilding({ type, validPlacement }) {
  const group = useRef(null);
  const Model = MODELS[type];

  useEffect(() => {
    const root = group.current;
    if (!root) return;
    const clones = [];
    root.traverse((object) => {
      if (!object.isMesh) return;
      // Preview geometry must never steal clicks from the terrain.
      object.raycast = () => {};
      const original = object.material;
      const makeGhost = (material) => {
        const copy = material.clone();
        copy.transparent = true;
        copy.opacity = 0.38;
        copy.depthWrite = false;
        copy.side = THREE.DoubleSide;
        if (copy.color) {
          copy.color.lerp(
            new THREE.Color(validPlacement ? "#78ffca" : "#ff7777"),
            0.45,
          );
        }
        clones.push(copy);
        return copy;
      };
      object.material = Array.isArray(original)
        ? original.map(makeGhost)
        : makeGhost(original);
    });
    return () => clones.forEach((material) => material.dispose());
  }, [type, validPlacement]);

  if (!Model) return null;
  return (
    <group ref={group}>
      <CompactBuildingModel
        Model={Model}
        level={1}
        plotSize={BUILDING_PLOT}
        animated={false}
      />
    </group>
  );
}

function PlacementPreview({ cursor, validPlacement, type }) {
  if (!cursor) return null;
  return (
    <group position={[cursor[0], cursor[1] + 0.15, cursor[2]]}>
      <mesh raycast={() => {}} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BUILDING_PLOT, BUILDING_PLOT]} />
        <meshBasicMaterial
          color={validPlacement ? "#7cf0b7" : "#ff7777"}
          transparent
          opacity={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        raycast={() => {}}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
      >
        <planeGeometry args={[BUILDING_PLOT, BUILDING_PLOT]} />
        <meshBasicMaterial
          color={validPlacement ? "#86ffcb" : "#ff6666"}
          wireframe
          transparent
          opacity={0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <GhostBuilding
        key={`${type}-${validPlacement}`}
        type={type}
        validPlacement={validPlacement}
      />
    </group>
  );
}

// =====================================================
// PHASE 6 — FREE STRATEGY CAMERA
// =====================================================

function FreeCameraControls() {
  const controls = useRef(null);
  const { camera } = useThree();

  const pressedKeys = useRef(new Set());

  const initialPosition = useMemo(() => new THREE.Vector3(35, 45, 55), []);

  const initialTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        event.target?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if ("wasdqer".includes(key) && key.length === 1) {
        pressedKeys.current.add(key);
      }
    };

    const onKeyUp = (event) => {
      pressedKeys.current.delete(event.key.toLowerCase());
    };

    const onBlur = () => {
      pressedKeys.current.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);

      window.removeEventListener("keyup", onKeyUp);

      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useFrame((_, delta) => {
    const control = controls.current;

    if (!control) {
      return;
    }

    const keys = pressedKeys.current;

    // Reset camera.
    if (keys.has("r")) {
      camera.position.copy(initialPosition);
      control.target.copy(initialTarget);
      control.update();

      keys.delete("r");
      return;
    }

    const speed = 30 * delta;

    const forward = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const movement = new THREE.Vector3();

    if (keys.has("w")) {
      movement.add(forward);
    }

    if (keys.has("s")) {
      movement.sub(forward);
    }

    if (keys.has("d")) {
      movement.add(right);
    }

    if (keys.has("a")) {
      movement.sub(right);
    }

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(speed);

      camera.position.add(movement);
      control.target.add(movement);
    }

    // Rotate around the current camera target,
    // not the fixed map center.
    const rotationSpeed = 1.2 * delta;

    if (keys.has("q")) {
      control.setAzimuthalAngle(control.getAzimuthalAngle() - rotationSpeed);
    }

    if (keys.has("e")) {
      control.setAzimuthalAngle(control.getAzimuthalAngle() + rotationSpeed);
    }

    control.update();
  });

  return (
    <MapControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableRotate
      enableZoom
      screenSpacePanning
      minDistance={5}
      maxDistance={180}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.05}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  );
}

// =====================================================
// TERRITORY BORDER VISUALIZATION
// =====================================================

function TerritoryBoundary({ population }) {
  const territory = territoryFor(population);
  const half = territory.width / 2;

  const points = useMemo(() => {
    const divisions = 48;
    const result = [];

    // Follow terrain elevation along each edge.
    const corners = [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
      [-half, -half],
    ];

    for (let side = 0; side < 4; side++) {
      const [ax, az] = corners[side];
      const [bx, bz] = corners[side + 1];

      for (let i = 0; i <= divisions; i++) {
        const t = i / divisions;

        const x = THREE.MathUtils.lerp(ax, bx, t);

        const z = THREE.MathUtils.lerp(az, bz, t);

        result.push(new THREE.Vector3(x, terrainHeight(x, z) + 0.3, z));
      }
    }

    return result;
  }, [half]);

  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points],
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <group>
      <lineLoop geometry={geometry}>
        <lineBasicMaterial color="#f5b66c" transparent opacity={0.85} />
      </lineLoop>

      {/* Territory corner markers */}
      {[
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ].map(([x, z], index) => (
        <mesh key={index} position={[x, terrainHeight(x, z) + 0.8, z]}>
          <cylinderGeometry args={[0.35, 0.5, 1.6, 8]} />

          <meshStandardMaterial
            color="#f5b66c"
            emissive="#a34c20"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// =====================================================
// PHASE 6 — MAIN 3D WORLD
// =====================================================

function snapToGrid(value) {
  return Math.round(value / GRID) * GRID;
}

function MarsScene({
  game,
  selectedId,
  placementMode,
  onSelectBuilding,
  onPlaceBuilding,
  onHoverChange,
  networkMode,
  networkSource,
  report,
}) {
  const storm = report?.weather?.kind === "storm";
  const dust = report?.weather?.kind === "dust";
  const sky = storm ? "#4f382b" : dust ? "#302018" : "#120e0d";
  const [hoveredPosition, setHoveredPosition] = useState(null);

  const dragStart = useRef(null);
  const wasDragging = useRef(false);

  // ---------------------------------------------------
  // PREVENT ACCIDENTAL CONSTRUCTION WHILE DRAGGING
  // ---------------------------------------------------

  useEffect(() => {
    const onPointerDown = (event) => {
      if (event.button !== 0) return;

      dragStart.current = {
        x: event.clientX,
        y: event.clientY,
      };

      wasDragging.current = false;
    };

    const onPointerMove = (event) => {
      if (!dragStart.current) return;

      const dx = event.clientX - dragStart.current.x;

      const dy = event.clientY - dragStart.current.y;

      if (Math.hypot(dx, dy) > 5) {
        wasDragging.current = true;
      }
    };

    const onPointerUp = () => {
      dragStart.current = null;
    };

    window.addEventListener("pointerdown", onPointerDown);

    window.addEventListener("pointermove", onPointerMove);

    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);

      window.removeEventListener("pointermove", onPointerMove);

      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // ---------------------------------------------------
  // PLACEMENT VALIDATION
  // ---------------------------------------------------

  const placementValid = useMemo(() => {
    if (!hoveredPosition || !placementMode) return false;
    return placementFeedback(
      game,
      placementMode,
      hoveredPosition[0],
      hoveredPosition[2],
    ).valid;
  }, [hoveredPosition, placementMode, game]);

  const handleHover = (x, z) => {
    if (!placementMode) {
      return;
    }

    const snappedX = snapToGrid(x);
    const snappedZ = snapToGrid(z);

    const position = [snappedX, terrainHeight(snappedX, snappedZ), snappedZ];

    setHoveredPosition(position);

    if (onHoverChange) {
      onHoverChange(position);
    }
  };

  const handlePlace = (x, z) => {
    if (!placementMode || wasDragging.current) {
      return;
    }

    const snappedX = snapToGrid(x);
    const snappedZ = snapToGrid(z);

    if (!insideTerritory(snappedX, snappedZ, game.colony.population)) {
      return;
    }

    if (footprintCollision(game.buildings, snappedX, snappedZ)) {
      return;
    }

    onPlaceBuilding(snappedX, snappedZ);
  };

  return (
    <Canvas
      shadows
      camera={{
        position: [35, 45, 55],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "#120e0d",
      }}
    >
      {/* MARTIAN ATMOSPHERE */}
      <color attach="background" args={[sky]} />

      <fog attach="fog" args={[sky, storm ? 35 : 90, storm ? 135 : 310]} />

      <ambientLight intensity={storm ? 0.65 : 0.75} />

      <hemisphereLight args={["#ffe3bd", "#432a22", 1.2]} />

      <directionalLight
        position={[70, 110, 35]}
        intensity={storm ? 0.9 : 2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Stars radius={250} depth={80} count={1500} factor={3} fade />

      {/* FREE CAMERA */}
      <FreeCameraControls />

      {/* MARS SURFACE */}
      <Terrain onHover={handleHover} onPlace={handlePlace} />

      {/* EXPANDABLE TERRITORY */}
      <TerritoryBoundary population={game.colony.population} />

      <Infrastructure
        game={game}
        heightAt={terrainHeight}
        activeKind={networkMode}
        report={report}
      />
      {/* EXISTING BUILDINGS */}
      {game.buildings.map((building) => (
        <Building
          key={building.id}
          building={building}
          status={report?.buildings?.find((b) => b.id === building.id)}
          selected={selectedId === building.id || networkSource === building.id}
          onSelect={onSelectBuilding}
        />
      ))}

      {/* CONSTRUCTION PREVIEW */}
      {placementMode && hoveredPosition && (
        <PlacementPreview
          type={placementMode}
          cursor={hoveredPosition}
          validPlacement={placementValid}
        />
      )}
    </Canvas>
  );
}

// =====================================================
// PHASE 6 — MAIN GAME STATE AND ACTIONS
// =====================================================

function useMarsGame() {
  const [game, setGame] = useState(loadSavedGame);
  const [selectedId, setSelectedId] = useState(null);
  const [placementMode, setPlacementMode] = useState(null);
  const [networkMode, setNetworkMode] = useState(null);
  const [networkSource, setNetworkSource] = useState(null);
  const [notification, setNotification] = useState("");
  const [saveError, setSaveError] = useState("");
  const [activePanel, setActivePanel] = useState("operations");
  const gameRef = useRef(game);
  const commit = useCallback((next) => {
    gameRef.current = next;
    setGame(next);
    setSaveError(
      saveGame(next)
        ? ""
        : "Autosave failed. Export your colony before closing this page.",
    );
  }, []);
  const dispatch = useCallback(
    (action, silent = false) => {
      if (!gameRef.current) return;
      const result = dispatchColony(gameRef.current, action);
      if (result.game !== gameRef.current) commit(result.game);
      if (!silent && result.message) setNotification(result.message);
      return result;
    },
    [commit],
  );
  const hasGame = Boolean(game);
  useEffect(() => {
    if (!hasGame) return;
    const timer = window.setInterval(() => {
      if (gameRef.current && !gameRef.current.paused)
        dispatch({ type: "advance" }, true);
    }, SOL_DURATION);
    return () => window.clearInterval(timer);
  }, [hasGame, dispatch]);
  const cancelModes = useCallback(() => {
    setPlacementMode(null);
    setNetworkMode(null);
    setNetworkSource(null);
  }, []);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") cancelModes();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelModes]);
  const startGame = (mode) => {
    if (!["survival", "sandbox"].includes(mode)) return;
    commit(freshGame(mode));
    cancelModes();
    setSelectedId(null);
    setActivePanel("operations");
    setNotification(
      "Colony initialized and paused. Follow Mission in Operations to build your first connected settlement.",
    );
  };
  const chooseNetwork = (kind) => {
    setNetworkMode(kind);
    setNetworkSource(null);
    setPlacementMode(null);
    setActivePanel("operations");
  };
  const selectBuilding = (id) => {
    setSelectedId(id);
    setPlacementMode(null);
    if (networkMode) {
      if (networkSource === null) {
        setNetworkSource(id);
        setNotification(
          "Now select the destination building. Escape cancels linking.",
        );
      } else {
        dispatch({
          type: "connect",
          kind: networkMode,
          from: networkSource,
          to: id,
        });
        setNetworkSource(null);
      }
      return;
    }
    setActivePanel("inspect");
  };
  const placeBuilding = (x, z) => {
    const result = dispatch({
      type: "place",
      buildingType: placementMode,
      x,
      z,
    });
    if (result?.game !== game && result?.game) setPlacementMode(null);
  };
  const resetColony = () => {
    if (
      game &&
      window.confirm(
        "Reset this colony? Export a backup first if you want to keep it.",
      )
    )
      startGame(game.mode);
  };
  const report = useMemo(() => (game ? getColonyReport(game) : null), [game]);
  return {
    game,
    selectedId,
    selectedBuilding: game?.buildings.find((b) => b.id === selectedId) ?? null,
    placementMode,
    networkMode,
    networkSource,
    notification,
    saveError,
    activePanel,
    report,
    satisfaction: game ? calculateSatisfaction(game) : null,
    territory: game ? territoryFor(game.colony.population) : null,
    housingCapacity: report?.housing ?? 0,
    startGame,
    placeBuilding,
    selectBuilding,
    upgradeBuilding: (id) => dispatch({ type: "upgrade", id }),
    unlockTechnology: (id) => dispatch({ type: "research", id }),
    togglePause: () => dispatch({ type: "pause" }),
    advanceSol: () => dispatch({ type: "advance" }),
    toggleSandboxSurvival: () => dispatch({ type: "sandboxSurvival" }),
    resetColony,
    dispatch,
    setPlacementMode,
    setSelectedId,
    setActivePanel,
    setNotification,
    chooseNetwork,
    cancelModes,
  };
}

function placementFeedback(game, type, x, z) {
  const result = dispatchColony(game, {
    type: "place",
    buildingType: type,
    x,
    z,
  });
  return {
    valid: result.game !== game,
    reason: result.game !== game ? "Ready to build" : result.message,
  };
}
function PlotReadout({ game, type, position }) {
  const [x, , z] = position;
  const site = terrainProfile(x, z);
  const feedback = placementFeedback(game, type, x, z);
  return (
    <div className="mars-plot-readout" role="status">
      <strong>
        {CATALOG[type].name} · {x}, {z}
      </strong>
      <span style={{ color: feedback.valid ? "#b2dfc0" : "#ffb199" }}>
        {feedback.reason}
      </span>
      <small>
        Ice yield ×{site.ice.toFixed(2)} · Ore yield ×{site.ore.toFixed(2)}
      </small>
    </div>
  );
}

const UI = {
  root: {
    display: "flex",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: "#0a0e14",
    color: "#edf1f5",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  sidebar: {
    width: 340,
    minWidth: 340,
    height: "100%",
    overflowY: "auto",
    background: "#101720",
    borderRight: "1px solid #26313d",
    padding: 20,
    boxSizing: "border-box",
  },

  world: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    height: "100%",
  },

  heading: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#e8a879",
    marginBottom: 12,
  },

  card: {
    background: "#18222e",
    border: "1px solid #2a3846",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  button: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    marginBottom: 8,
    border: "1px solid #384a5b",
    borderRadius: 9,
    background: "#263849",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 700,
  },

  small: {
    fontSize: 12,
    color: "#9baaba",
  },
};

// =====================================================
// RESOURCE DISPLAY
// =====================================================

function ResourceBar({ resources }) {
  const items = [
    ["metal", "METAL", "◇"],
    ["energy", "ENERGY", "⚡"],
    ["water", "WATER", "◉"],
    ["food", "FOOD", "♧"],
    ["research", "RESEARCH", "✧"],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
      }}
    >
      {items.map(([key, label, symbol]) => (
        <div
          key={key}
          style={{
            background: "#18222e",
            border: "1px solid #2a3846",
            borderRadius: 9,
            padding: 10,
          }}
        >
          <div style={UI.small}>
            {symbol} {label}
          </div>

          <strong style={{ fontSize: 19 }}>
            {Math.floor(resources[key]).toLocaleString()}
          </strong>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// BUILDING CATALOGUE
// =====================================================

function BuildingCatalogue({ game, placementMode, onChoose }) {
  return (
    <div>
      {Object.entries(CATALOG).map(([type, config]) => {
        const active = placementMode === type;

        const affordable = canAfford(
          game.resources,
          config.cost,
          game.mode === "sandbox",
        );

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChoose(active ? null : type)}
            style={{
              ...UI.button,
              borderColor: active ? "#e8a879" : "#384a5b",
              background: active ? "#4b352b" : "#263849",
              opacity: affordable ? 1 : 0.55,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {config.icon} {config.name}
              </span>

              <span style={UI.small}>LVL {config.max} MAX</span>
            </div>

            <div
              style={{
                ...UI.small,
                marginTop: 6,
              }}
            >
              {Object.entries(config.cost)
                .map(([resource, amount]) => `${amount} ${resource}`)
                .join(" · ")}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// SELECTED BUILDING INSPECTOR
// =====================================================

function BuildingInspector({ building, game, onUpgrade }) {
  if (!building) {
    return (
      <div style={UI.card}>
        <p style={UI.small}>
          Select a building on the map to inspect its production and upgrade
          options.
        </p>
      </div>
    );
  }

  const config = CATALOG[building.type];
  const maximum = building.level >= config.max;

  const cost = maximum ? null : upgradeCost(building);

  const affordable =
    maximum || canAfford(game.resources, cost, game.mode === "sandbox");

  const production = output(building, game.technologies);

  return (
    <div style={UI.card}>
      <div style={UI.heading}>BUILDING INSPECTOR</div>

      <h3 style={{ margin: "0 0 8px" }}>
        {config.icon} {config.name}
      </h3>

      <p style={UI.small}>
        Level {building.level} / {config.max}
      </p>

      <p style={UI.small}>Potential output / capacity: {production}</p>

      <p style={UI.small}>Energy demand: {energyCost(building)}</p>

      <div style={{ ...UI.small, lineHeight: 1.6, marginBottom: 10 }}>
        <strong>
          {getColonyReport(game).byBuilding?.[building.id]?.reason ??
            "Check Operations for utility and staffing status"}
        </strong>
        {!maximum && (
          <div>
            Next level:{" "}
            {output(
              { ...building, level: building.level + 1 },
              game.technologies,
            )}{" "}
            potential output / capacity ·{" "}
            {energyCost({ ...building, level: building.level + 1 })} energy /
            sol
          </div>
        )}
      </div>
      <p style={UI.small}>
        Location: {building.x}, {building.z}
      </p>

      {maximum ? (
        <strong style={{ color: "#89dfb2" }}>MAXIMUM LEVEL REACHED</strong>
      ) : (
        <>
          <div
            style={{
              ...UI.small,
              marginBottom: 12,
            }}
          >
            Upgrade cost:{" "}
            {Object.entries(cost)
              .filter(([, amount]) => amount > 0)
              .map(([resource, amount]) => `${amount} ${resource}`)
              .join(" · ")}
          </div>

          <button
            type="button"
            style={{
              ...UI.button,
              opacity: affordable ? 1 : 0.5,
            }}
            disabled={!affordable}
            onClick={() => onUpgrade(building.id)}
          >
            UPGRADE TO LEVEL {building.level + 1}
          </button>
        </>
      )}
    </div>
  );
}

// =====================================================
// RESEARCH PANEL
// =====================================================

function ResearchPanel({ game, onResearch }) {
  return (
    <div>
      {TECHNOLOGIES.map((technology) => {
        const unlocked = game.technologies[technology.id];

        const affordable =
          game.mode === "sandbox" || game.resources.research >= technology.cost;

        return (
          <div key={technology.id} style={UI.card}>
            <strong>{technology.name}</strong>

            <p style={UI.small}>{technology.description}</p>

            <p style={UI.small}>Research cost: {technology.cost}</p>

            <button
              type="button"
              style={{
                ...UI.button,
                opacity: unlocked || !affordable ? 0.55 : 1,
              }}
              disabled={unlocked || !affordable}
              onClick={() => onResearch(technology.id)}
            >
              {unlocked ? "RESEARCHED" : "UNLOCK TECHNOLOGY"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// COLONY STATUS
// =====================================================

function ColonyStatus({ game, housingCapacity, territory }) {
  return (
    <div style={UI.card}>
      <div style={UI.heading}>COLONY STATUS</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div>
          <div style={UI.small}>POPULATION</div>
          <strong>{game.colony.population}</strong>
        </div>

        <div>
          <div style={UI.small}>HOUSING</div>
          <strong>{housingCapacity}</strong>
        </div>

        <div>
          <div style={UI.small}>HEALTH</div>
          <strong>{game.colony.health}%</strong>
        </div>

        <div>
          <div style={UI.small}>MARTIAN SOL</div>
          <strong>{game.sol}</strong>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #2a3846",
          marginTop: 14,
          paddingTop: 12,
        }}
      >
        <div style={UI.small}>TERRITORY: {territory.title}</div>

        <strong>
          {territory.width} × {territory.width}
        </strong>

        <div
          style={{
            ...UI.small,
            marginTop: 5,
          }}
        >
          {game.buildings.length} buildings constructed
        </div>
      </div>
    </div>
  );
}

// =====================================================
// NET PRODUCTION — PROJECTED RESOURCE CHANGE PER SOL
// =====================================================

function NetProductionPanel({ game }) {
  const active = game.mode !== "sandbox" || game.sandboxSurvival;
  const net = useMemo(() => {
    if (!active) return null;
    const projected = simulateSol(game);
    return Object.fromEntries(
      ["metal", "energy", "water", "food", "research"].map((key) => [
        key,
        projected.resources[key] - game.resources[key],
      ]),
    );
  }, [game, active]);

  const items = [
    ["metal", "◇", "METAL"],
    ["energy", "⚡", "ENERGY"],
    ["water", "◉", "WATER"],
    ["food", "♧", "FOOD"],
    ["research", "✧", "RESEARCH"],
  ];

  return (
    <div style={UI.card}>
      <div style={UI.heading}>NET PRODUCTION / SOL</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {items.map(([key, symbol, label]) => {
          const value = net?.[key] ?? 0;
          const color = !active
            ? "#9baaba"
            : value > 0
              ? "#83dfb0"
              : value < 0
                ? "#ef8585"
                : "#c5d0da";
          return (
            <div
              key={key}
              style={{
                background: "#111b26",
                border: "1px solid #2a3846",
                borderRadius: 9,
                padding: "10px 12px",
              }}
            >
              <div style={{ ...UI.small, fontSize: 10 }}>
                {symbol} {label}
              </div>
              <strong style={{ color, fontSize: 18 }}>
                {!active
                  ? "OFF"
                  : `${value > 0 ? "+" : ""}${value.toLocaleString()}`}
              </strong>
            </div>
          );
        })}
      </div>
      <p
        style={{ ...UI.small, marginBottom: 0, marginTop: 10, lineHeight: 1.5 }}
      >
        {!active
          ? "Sandbox survival is off; resource production and consumption are disabled."
          : "Projected change next sol, after production, building energy use, citizen consumption and storage limits."}
      </p>
    </div>
  );
}

// =====================================================
// PHASE 6 — CITIZEN SATISFACTION DASHBOARD
// =====================================================

function SatisfactionDashboard({ satisfaction }) {
  if (!satisfaction) {
    return null;
  }

  const getColor = (value) => {
    if (value >= 80) return "#83dfb0";
    if (value >= 50) return "#f1c27d";
    return "#ef8585";
  };

  return (
    <div style={UI.card}>
      <div style={UI.heading}>CITIZEN SATISFACTION</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <div style={UI.small}>OVERALL SATISFACTION</div>

          <strong
            style={{
              fontSize: 32,
              color: getColor(satisfaction.overall),
            }}
          >
            {satisfaction.overall}%
          </strong>
        </div>

        <div
          style={{
            color: "#9baaba",
            fontSize: 11,
            textAlign: "right",
          }}
        >
          COLONY
          <div>WELLBEING INDEX</div>
        </div>
      </div>

      {satisfaction.indicators.map((indicator) => (
        <div key={indicator.id} style={{ marginBottom: 15 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 7,
            }}
          >
            <span>{indicator.label}</span>

            <strong>
              {indicator.implemented ? `${indicator.value}%` : "PLANNED"}
            </strong>
          </div>

          <div
            style={{
              height: 7,
              borderRadius: 10,
              background: "#2b3947",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: indicator.implemented ? `${indicator.value}%` : "0%",
                background: indicator.implemented
                  ? getColor(indicator.value)
                  : "#607080",
                borderRadius: 10,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ))}

      <p
        style={{
          ...UI.small,
          lineHeight: 1.6,
          marginBottom: 0,
        }}
      >
        Satisfaction reflects housing, supplied essentials, reliable power,
        health, and morale. Manage healthcare and recreation in Operations →
        Crew.
      </p>
    </div>
  );
}

// =====================================================
// PHASE 6 — GAME INTERFACE
// =====================================================

export default function MarsWorld() {
  const {
    game,
    selectedId,
    selectedBuilding,
    placementMode,
    notification,
    saveError,
    networkMode,
    networkSource,
    dispatch,
    chooseNetwork,
    cancelModes,
    report,
    activePanel,

    satisfaction,
    territory,
    housingCapacity,

    startGame,
    placeBuilding,
    selectBuilding,
    upgradeBuilding,
    unlockTechnology,

    togglePause,
    advanceSol,
    toggleSandboxSurvival,
    resetColony,

    setPlacementMode,
    setSelectedId,
    setActivePanel,
    setNotification,
  } = useMarsGame();

  const [hoveredPlot, setHoveredPlot] = useState(null);

  // ===================================================
  // NEW GAME SCREEN
  // ===================================================

  if (!game) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0b1018, #261710)",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Inter, sans-serif",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            padding: 36,
            background: "#141d28",
            border: "1px solid #3b4651",
            borderRadius: 20,
          }}
        >
          <div style={UI.heading}>MARS COLONIZATION PROGRAM</div>

          <h1
            style={{
              fontSize: 38,
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            MARS:
            <br />
            THE NEW FRONTIER
          </h1>

          <p
            style={{
              color: "#9baaba",
              lineHeight: 1.7,
              marginBottom: 30,
            }}
          >
            Establish a permanent human settlement on Mars. Develop
            infrastructure, manage resources, research technologies, and expand
            your colony across the planet.
          </p>

          <button
            type="button"
            style={UI.button}
            onClick={() => startGame("survival")}
          >
            START SURVIVAL COLONY
          </button>

          <button
            type="button"
            style={{
              ...UI.button,
              background: "#453126",
            }}
            onClick={() => startGame("sandbox")}
          >
            START SANDBOX COLONY
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN PLAYABLE INTERFACE
  // ===================================================

  return (
    <div style={UI.root} className="mars-shell">
      {/* LEFT SIDEBAR */}
      <aside style={UI.sidebar} className="mars-sidebar">
        <div style={UI.heading}>MARS COLONIZATION PROGRAM</div>

        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 24,
            letterSpacing: -0.8,
          }}
        >
          THE NEW FRONTIER
        </h2>

        <p
          style={{
            ...UI.small,
            marginBottom: 24,
          }}
        >
          {game.mode.toUpperCase()} MODE
          {" · "}
          SOL {game.sol}
        </p>

        <ResourceBar resources={game.resources} />

        <div style={{ height: 20 }} />

        <ColonyStatus
          game={game}
          housingCapacity={housingCapacity}
          territory={territory}
        />

        {/* NAVIGATION */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 6,
            marginBottom: 18,
          }}
        >
          {[
            ["build", "BUILD"],
            ["inspect", "INSPECT"],
            ["research", "RESEARCH"],
            ["citizens", "CITIZENS"],
            ["operations", "OPERATIONS"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActivePanel(id)}
              style={{
                ...UI.button,
                marginBottom: 0,
                textAlign: "center",
                padding: "10px 4px",
                fontSize: 11,
                background: activePanel === id ? "#67432f" : "#263849",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {saveError && (
          <div role="alert" style={{ ...UI.card, color: "#ffb89b" }}>
            {saveError}
          </div>
        )}
        {activePanel === "operations" && (
          <ColonyOperations
            game={game}
            dispatch={dispatch}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setPlacementMode(null);
            }}
            networkMode={networkMode}
            onNetworkMode={chooseNetwork}
          />
        )}
        {/* CONSTRUCTION */}
        {activePanel === "build" && (
          <>
            <div style={UI.heading}>CONSTRUCTION CATALOGUE</div>

            <BuildingCatalogue
              game={game}
              placementMode={placementMode}
              onChoose={(type) => {
                chooseNetwork(null);
                setActivePanel("build");
                setPlacementMode(type);
                setSelectedId(null);
              }}
            />

            {placementMode && (
              <div style={UI.card}>
                <strong>PLACING: {CATALOG[placementMode].name}</strong>

                <p style={UI.small}>
                  Click a green plot to build. Escape cancels. Compare ice and
                  ore yields before choosing a site.
                </p>

                <button type="button" style={UI.button} onClick={cancelModes}>
                  CANCEL CONSTRUCTION
                </button>
              </div>
            )}
          </>
        )}

        {/* BUILDING INSPECTION */}
        {activePanel === "inspect" && (
          <BuildingInspector
            building={selectedBuilding}
            game={game}
            onUpgrade={upgradeBuilding}
          />
        )}

        {/* TECHNOLOGY RESEARCH */}
        {activePanel === "research" && (
          <>
            <div style={UI.heading}>TECHNOLOGY DEVELOPMENT</div>

            <ResearchPanel game={game} onResearch={unlockTechnology} />
          </>
        )}

        {/* CITIZEN SATISFACTION + NET PRODUCTION */}
        {activePanel === "citizens" && (
          <>
            <NetProductionPanel game={game} />
            <SatisfactionDashboard satisfaction={satisfaction} />
          </>
        )}

        <button
          type="button"
          style={{ ...UI.button, fontSize: 11 }}
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(game, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `mars-colony-sol-${game.sol}.json`;
            a.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          EXPORT COLONY BACKUP
        </button>
        {/* SIMULATION CONTROLS */}
        <div
          style={{
            marginTop: 24,
            borderTop: "1px solid #2a3846",
            paddingTop: 20,
          }}
        >
          <div style={UI.heading}>SIMULATION CONTROL</div>

          <button type="button" style={UI.button} onClick={advanceSol}>
            ADVANCE ONE SOL
          </button>

          <button type="button" style={UI.button} onClick={togglePause}>
            {game.paused ? "RESUME SIMULATION" : "PAUSE SIMULATION"}
          </button>

          {game.mode === "sandbox" && (
            <button
              type="button"
              style={UI.button}
              onClick={toggleSandboxSurvival}
            >
              SURVIVAL SYSTEMS: {game.sandboxSurvival ? "ON" : "OFF"}
            </button>
          )}

          <button
            type="button"
            style={{
              ...UI.button,
              background: "#42282b",
              borderColor: "#704449",
            }}
            onClick={resetColony}
          >
            RESET COLONY
          </button>
        </div>
      </aside>

      {/* 3D WORLD */}
      <main style={UI.world} className="mars-world">
        <MarsScene
          game={game}
          selectedId={selectedId}
          placementMode={placementMode}
          onSelectBuilding={selectBuilding}
          onPlaceBuilding={placeBuilding}
          onHoverChange={setHoveredPlot}
          networkMode={networkMode}
          networkSource={networkSource}
          report={report}
        />
        {placementMode && hoveredPlot && (
          <PlotReadout
            game={game}
            type={placementMode}
            position={hoveredPlot}
          />
        )}
        {networkMode && (
          <div className="mars-link-hint" role="status">
            {networkMode.toUpperCase()} LINK ·{" "}
            {networkSource === null
              ? "Select a source building"
              : `From #${networkSource}: select a destination`}
            <button onClick={cancelModes}>Cancel</button>
          </div>
        )}

        {/* TOP STATUS OVERLAY */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            padding: "12px 16px",
            background: "rgba(12,18,26,0.88)",
            border: "1px solid #354350",
            borderRadius: 12,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#e8a879",
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            MARS SURFACE OPERATIONS
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#c5d0da",
            }}
          >
            {territory.title} · {territory.width} × {territory.width}
            <div
              style={{
                marginTop: 6,
                color: report.weather?.kind === "storm" ? "#ffb16e" : "#89d9c7",
              }}
            >
              {report.weather?.label ?? "Weather monitoring"} ·{" "}
              {game.paused ? "PAUSED" : "LIVE"}
            </div>
          </div>
        </div>

        {/* CAMERA HELP */}
        <div
          style={{
            position: "absolute",
            right: 18,
            bottom: 18,
            padding: "12px 16px",
            background: "rgba(12,18,26,0.88)",
            border: "1px solid #354350",
            borderRadius: 12,
            fontSize: 11,
            lineHeight: 1.8,
            color: "#c5d0da",
            pointerEvents: "none",
          }}
        >
          LEFT DRAG — PAN
          <br />
          RIGHT DRAG — ROTATE
          <br />
          SCROLL — ZOOM
          <br />
          WASD — MOVE
          <br />
          Q / E — ROTATE
          <br />R — RESET CAMERA
        </div>

        {/* NOTIFICATIONS */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              maxWidth: 320,
              padding: "13px 18px",
              borderRadius: 10,
              background: "#263849",
              border: "1px solid #e8a879",
              color: "#fff",
              fontSize: 13,
              boxShadow: "0 10px 35px #0007",
            }}
          >
            {notification}

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotification("")}
              style={{
                marginLeft: 12,
                background: "none",
                border: "none",
                color: "#e8a879",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
