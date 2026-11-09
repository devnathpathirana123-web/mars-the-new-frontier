
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// ==================================================
// MARS: THE NEW FRONTIER
// PHASE 3 — WATER EXTRACTION
// ==================================================

const SOL_DURATION = 5000;
const GRID_SIZE = 8;
const MAX_ENERGY = 300;
const MAX_WATER = 500;

const BUILDINGS = [
  {
    id: "habitat",
    name: "Habitat",
    icon: "⌂",
    description: "Residential module. Consumes 6 energy per Sol.",
    status: "AVAILABLE",
    cost: { metal: 55, energy: 12 },
    radius: 8,
  },
  {
    id: "solar",
    name: "Solar Array",
    icon: "☀",
    description: "Generates 24 energy per Sol.",
    status: "AVAILABLE",
    cost: { metal: 40, energy: 8 },
    radius: 13,
  },
  {
    id: "extractor",
    name: "Water Extractor",
    icon: "◉",
    description: "Produces 15 water. Consumes 8 energy per Sol.",
    status: "AVAILABLE",
    cost: { metal: 45, energy: 10 },
    radius: 10,
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    icon: "♧",
    description: "Produces food for the settlement.",
    status: "COMING SOON",
  },
  {
    id: "mine",
    name: "Mining Facility",
    icon: "◇",
    description: "Extracts metals from Martian deposits.",
    status: "COMING SOON",
  },
  {
    id: "research",
    name: "Research Lab",
    icon: "✧",
    description: "Develops advanced colony technology.",
    status: "COMING SOON",
  },
];

const INITIAL_RESOURCES = {
  metal: 180,
  energy: 100,
  water: 100,
  food: 100,
};

const initialBuildings = [
  {
    id: 1,
    type: "habitat",
    position: [0, terrainHeight(0, 0), 0],
  },
];

// ==================================================
// TERRAIN
// ==================================================

function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.07) * 0.45 +
    Math.cos(z * 0.06) * 0.35 +
    Math.sin((x + z) * 0.035) * 0.25 -
    0.35
  );
}

function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function MarsGround({ onPlace, onHover }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 300, 160, 160);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = [];

    const low = new THREE.Color("#6d3527");
    const mid = new THREE.Color("#a65a3c");
    const high = new THREE.Color("#c88a60");

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = terrainHeight(x, z);

      positions.setY(i, y);

      const color = new THREE.Color();

      if (y < -0.3) {
        color.copy(low).lerp(
          mid,
          THREE.MathUtils.clamp((y + 1) / 0.7, 0, 1)
        );
      } else {
        color.copy(mid).lerp(
          high,
          THREE.MathUtils.clamp((y + 0.3) / 1.3, 0, 1)
        );
      }

      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const rocks = useMemo(() => {
    const result = [];

    for (let i = 0; i < 110; i++) {
      const x = Math.sin(i * 127.1) * 80;
      const z = Math.cos(i * 73.7) * 80;

      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

      result.push({
        id: i,
        position: [x, terrainHeight(x, z) + 0.15, z],
        scale: 0.25 + ((i * 17) % 10) * 0.07,
        rotation: i * 1.3,
      });
    }

    return result;
  }, []);

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
          onPlace(event.point.x, event.point.z);
        }}
      >
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>

      {rocks.map((rock) => (
        <mesh
          key={rock.id}
          position={rock.position}
          scale={rock.scale}
          rotation={[0.2, rock.rotation, 0.1]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#754534" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ==================================================
// HABITAT MODEL
// ==================================================

function Habitat({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[6.4, 0.35, 4.4]} />
        <meshStandardMaterial
          color="#4a4d50"
          metalness={0.65}
          roughness={0.5}
        />
      </mesh>

      <mesh
        position={[0, 1.9, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[1.55, 1.55, 5.2, 32]} />
        <meshStandardMaterial
          color="#d5d8d7"
          metalness={0.65}
          roughness={0.32}
        />
      </mesh>

      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 1.9, 0]} castShadow>
          <sphereGeometry args={[1.55, 24, 16]} />
          <meshStandardMaterial
            color="#b9bfc0"
            metalness={0.65}
            roughness={0.38}
          />
        </mesh>
      ))}

      {[-1.9, 0, 1.9].map((x) => (
        <mesh
          key={x}
          position={[x, 1.9, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <torusGeometry args={[1.57, 0.12, 12, 40]} />
          <meshStandardMaterial
            color="#60696e"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
      ))}

      {[-1.6, 0, 1.6].map((x) => (
        <group key={x}>
          {[1, -1].map((side) => (
            <mesh
              key={side}
              position={[x, 2.35, side * 1.43]}
            >
              <boxGeometry args={[0.85, 0.52, 0.09]} />
              <meshStandardMaterial
                color="#122c42"
                emissive="#17436a"
                emissiveIntensity={0.35}
                metalness={0.7}
                roughness={0.18}
              />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, 1.35, 1.75]} castShadow>
        <boxGeometry args={[1.5, 1.85, 0.75]} />
        <meshStandardMaterial
          color="#737d83"
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0, 1.35, 2.15]}>
        <boxGeometry args={[0.9, 1.4, 0.08]} />
        <meshStandardMaterial color="#263d4b" metalness={0.6} />
      </mesh>

      {[-2.2, 2.2].map((x) =>
        [-1.5, 1.5].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.55, z]}
            castShadow
          >
            <boxGeometry args={[0.35, 1.1, 0.35]} />
            <meshStandardMaterial color="#535a5e" />
          </mesh>
        ))
      )}

      <mesh position={[1.1, 3.5, 0]} castShadow>
        <boxGeometry args={[1.2, 0.3, 0.8]} />
        <meshStandardMaterial color="#59636a" metalness={0.7} />
      </mesh>

      <mesh position={[-1.4, 3.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#c2c8c9" />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[0, 1.1, side * 3.2]}>
          <mesh rotation={[-0.12 * side, 0, 0]} castShadow>
            <boxGeometry args={[3.8, 0.12, 1.5]} />
            <meshStandardMaterial
              color="#153c62"
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>

          {[-1.2, 0, 1.2].map((x) => (
            <mesh
              key={x}
              position={[x, 0.08, 0]}
              rotation={[-0.12 * side, 0, 0]}
            >
              <boxGeometry args={[0.035, 0.025, 1.5]} />
              <meshBasicMaterial color="#8ca9bd" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ==================================================
// SOLAR ARRAY MODEL
// ==================================================

function SolarArray({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[3.4, 0.5, 3.4]} />
        <meshStandardMaterial
          color="#4b5155"
          metalness={0.7}
          roughness={0.45}
        />
      </mesh>

      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.5, 1.2, 1.5]} />
        <meshStandardMaterial
          color="#a5abad"
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.3, 1.75, 0]}>
          <mesh rotation={[0, 0, side * -0.12]} castShadow>
            <boxGeometry args={[5.5, 0.14, 3.8]} />
            <meshStandardMaterial
              color="#0c3156"
              metalness={0.65}
              roughness={0.2}
            />
          </mesh>

          {[-2, -1, 0, 1, 2].map((x) => (
            <mesh
              key={x}
              position={[x, 0.09, 0]}
              rotation={[0, 0, side * -0.12]}
            >
              <boxGeometry args={[0.04, 0.025, 3.8]} />
              <meshBasicMaterial color="#7896ae" />
            </mesh>
          ))}

          {[-1, 0, 1].map((z) => (
            <mesh
              key={z}
              position={[0, 0.1, z * 1.1]}
              rotation={[0, 0, side * -0.12]}
            >
              <boxGeometry args={[5.5, 0.025, 0.04]} />
              <meshBasicMaterial color="#7896ae" />
            </mesh>
          ))}

          <mesh position={[0, -0.8, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 1.6, 12]} />
            <meshStandardMaterial color="#777f82" />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[1.2, 0.7, 1.2]} />
        <meshStandardMaterial
          color="#e2a15b"
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      <mesh position={[0, 2.85, -1.1]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 1.8, 10]} />
        <meshStandardMaterial color="#b5babb" />
      </mesh>

      <mesh position={[0, 3.75, -1.1]} rotation={[0.3, 0, 0]}>
        <sphereGeometry
          args={[0.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color="#c3c6c5"
          metalness={0.8}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ==================================================
// NEW: WATER EXTRACTOR MODEL
// ==================================================

function WaterExtractor({ position }) {
  return (
    <group position={position}>
      {/* Reinforced concrete foundation */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 0.45, 6.5]} />
        <meshStandardMaterial
          color="#545b5f"
          metalness={0.45}
          roughness={0.75}
        />
      </mesh>

      {/* Industrial machinery housing */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[4.5, 2.2, 3.7]} />
        <meshStandardMaterial
          color="#a5adae"
          metalness={0.72}
          roughness={0.4}
        />
      </mesh>

      {/* Upper service roof */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <boxGeometry args={[4.9, 0.25, 4.1]} />
        <meshStandardMaterial
          color="#3c474d"
          metalness={0.8}
          roughness={0.35}
        />
      </mesh>

      {/* Control compartment */}
      <mesh position={[0, 1.35, 1.9]}>
        <boxGeometry args={[1.8, 1.3, 0.15]} />
        <meshStandardMaterial
          color="#172f42"
          emissive="#12364b"
          emissiveIntensity={0.35}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Water storage tanks */}
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[x, 3.35, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.65, 0.65, 1.5, 24]} />
            <meshStandardMaterial
              color="#77a9b9"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.65, 20, 12]} />
            <meshStandardMaterial
              color="#a8cbd2"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          {[-0.5, 0.5].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.66, 0.07, 8, 24]} />
              <meshStandardMaterial
                color="#445a63"
                metalness={0.85}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Drill assembly */}
      <group position={[-2.8, 0, -1]}>
        <mesh position={[0, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.23, 4.5, 16]} />
          <meshStandardMaterial
            color="#8d989d"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 4.75, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.3, 0.65, 16]} />
          <meshStandardMaterial
            color="#d29a55"
            metalness={0.65}
          />
        </mesh>

        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.75, 0.75, 0.5, 16]} />
          <meshStandardMaterial
            color="#4c5559"
            metalness={0.75}
          />
        </mesh>
      </group>

      {/* Pipework */}
      <mesh
        position={[2.55, 1.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.24, 0.24, 5.2, 16]} />
        <meshStandardMaterial
          color="#5d91a5"
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      <mesh
        position={[2.55, 1.2, -2.5]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.24, 0.24, 2.2, 16]} />
        <meshStandardMaterial
          color="#5d91a5"
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Warning light */}
      <mesh position={[2, 3.1, 1.4]}>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial
          color="#ffb54a"
          emissive="#ff9c29"
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Equipment vents */}
      {[-1, 0, 1].map((x) => (
        <mesh key={x} position={[x, 1.4, -1.91]}>
          <boxGeometry args={[0.55, 1.1, 0.08]} />
          <meshStandardMaterial
            color="#283a43"
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// ==================================================
// CONSTRUCTION MARKER
// ==================================================

function PlacementMarker({ position, valid }) {
  if (!position) return null;

  const color = valid ? "#62e5b0" : "#ff6868";

  return (
    <group position={position}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
      >
        <ringGeometry args={[2.5, 2.8, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.075, 0]}
      >
        <circleGeometry args={[2.5, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ==================================================
// WORLD SCENE
// ==================================================

function WorldScene({
  buildings,
  placementMode,
  hoveredPosition,
  validPlacement,
  onPlace,
  onHover,
}) {
  return (
    <>
      <color attach="background" args={["#171719"]} />
      <fog attach="fog" args={["#8e5540", 65, 190]} />

      <ambientLight intensity={0.65} />

      <directionalLight
        position={[35, 50, 20]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <MarsGround onPlace={onPlace} onHover={onHover} />

      {buildings.map((building) => {
        if (building.type === "solar") {
          return (
            <SolarArray
              key={building.id}
              position={building.position}
            />
          );
        }

        if (building.type === "extractor") {
          return (
            <WaterExtractor
              key={building.id}
              position={building.position}
            />
          );
        }

        return (
          <Habitat
            key={building.id}
            position={building.position}
          />
        );
      })}

      {placementMode && (
        <PlacementMarker
          position={hoveredPosition}
          valid={validPlacement}
        />
      )}

      <ContactShadows
        position={[0, -0.2, 0]}
        opacity={0.35}
        scale={80}
        blur={2.5}
        far={15}
      />

      <Stars
        radius={180}
        depth={50}
        count={2500}
        factor={4}
        fade
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={7}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}

// ==================================================
// ECONOMY
// ==================================================

function getProduction(buildings) {
  const habitats = buildings.filter(
    (building) => building.type === "habitat"
  ).length;

  const solar = buildings.filter(
    (building) => building.type === "solar"
  ).length;

  const extractors = buildings.filter(
    (building) => building.type === "extractor"
  ).length;

  return {
    energy: solar * 24 - habitats * 6 - extractors * 8,
    water: extractors * 15,
  };
}

function advanceEconomy(resources, production, extractorCount) {
  const energyBefore = resources.energy;
  const energyAfter = Math.max(
    0,
    Math.min(MAX_ENERGY, energyBefore + production.energy)
  );

  // Extractors operate only if the colony can meet the
  // energy demand for this Sol. Solar output is available
  // during the same Sol.
  const operatingEnergy =
    energyBefore + production.energy >= 0;

  const waterProduced = operatingEnergy
    ? extractorCount * 15
    : 0;

  return {
    ...resources,
    energy: energyAfter,
    water: Math.min(MAX_WATER, resources.water + waterProduced),
  };
}

function canAfford(resources, cost) {
  return Object.entries(cost).every(
    ([resource, amount]) => resources[resource] >= amount
  );
}

function hasCollision(buildings, type, x, z) {
  const newBuilding = BUILDINGS.find(
    (building) => building.id === type
  );

  const newRadius = newBuilding?.radius ?? 8;

  return buildings.some((building) => {
    const dx = building.position[0] - x;
    const dz = building.position[2] - z;

    const existing = BUILDINGS.find(
      (item) => item.id === building.type
    );

    const existingRadius = existing?.radius ?? 8;

    return (
      Math.sqrt(dx * dx + dz * dz) <
      Math.max(newRadius, existingRadius)
    );
  });
}

// ==================================================
// UI STYLES
// ==================================================

const panelStyle = {
  background: "rgba(18, 23, 28, 0.94)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  color: "#e9ecee",
  backdropFilter: "blur(16px)",
  boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
};

const labelStyle = {
  color: "#9aa6ad",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 2,
};

// ==================================================
// MAIN APPLICATION
// ==================================================

export default function MarsWorld() {
  const [buildings, setBuildings] = useState(initialBuildings);

  const [resources, setResources] = useState({
    ...INITIAL_RESOURCES,
  });

  const [sol, setSol] = useState(1);
  const [paused, setPaused] = useState(false);
  const [selectedBuilding, setSelectedBuilding] =
    useState("habitat");
  const [placementMode, setPlacementMode] = useState(false);
  const [hoveredPosition, setHoveredPosition] = useState(null);

  const [message, setMessage] = useState(
    "Colony initialized. Water extraction systems available."
  );

  const selectedBuildingData = BUILDINGS.find(
    (building) => building.id === selectedBuilding
  );

  const counts = useMemo(() => {
    return {
      habitat: buildings.filter((b) => b.type === "habitat").length,
      solar: buildings.filter((b) => b.type === "solar").length,
      extractor: buildings.filter((b) => b.type === "extractor").length,
    };
  }, [buildings]);

  const production = useMemo(
    () => getProduction(buildings),
    [buildings]
  );

  const validPlacement =
    hoveredPosition !== null &&
    !hasCollision(
      buildings,
      selectedBuilding,
      hoveredPosition[0],
      hoveredPosition[2]
    );

  // ----------------------------------------------
  // AUTOMATIC SOL CYCLE
  // ----------------------------------------------

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setSol((previous) => previous + 1);

      setResources((previous) =>
        advanceEconomy(
          previous,
          production,
          counts.extractor
        )
      );
    }, SOL_DURATION);

    return () => clearInterval(interval);
  }, [paused, production, counts.extractor]);

  // ----------------------------------------------
  // CONSTRUCTION SELECTION
  // ----------------------------------------------

  function chooseBuilding(building) {
    if (building.status !== "AVAILABLE") return;

    if (!canAfford(resources, building.cost)) {
      setMessage(
        `Insufficient resources to construct ${building.name}.`
      );
      return;
    }

    setSelectedBuilding(building.id);
    setPlacementMode(true);
    setHoveredPosition(null);

    setMessage(
      `Placing ${building.name}. Click an available location on Mars.`
    );
  }

  // ----------------------------------------------
  // PLACEMENT
  // ----------------------------------------------

  function handleHover(x, z) {
    if (!placementMode) return;

    const snappedX = snapToGrid(x);
    const snappedZ = snapToGrid(z);

    setHoveredPosition([
      snappedX,
      terrainHeight(snappedX, snappedZ),
      snappedZ,
    ]);
  }

  function handlePlace(x, z) {
    if (!placementMode || !selectedBuildingData) return;

    const snappedX = snapToGrid(x);
    const snappedZ = snapToGrid(z);

    if (
      hasCollision(
        buildings,
        selectedBuilding,
        snappedX,
        snappedZ
      )
    ) {
      setMessage(
        "Construction blocked: too close to another structure."
      );
      return;
    }

    const cost = selectedBuildingData.cost;

    if (!canAfford(resources, cost)) {
      setMessage("Construction blocked: insufficient resources.");
      setPlacementMode(false);
      setHoveredPosition(null);
      return;
    }

    setResources((previous) => ({
      ...previous,
      metal: previous.metal - (cost.metal || 0),
      energy: previous.energy - (cost.energy || 0),
    }));

    setBuildings((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        type: selectedBuilding,
        position: [
          snappedX,
          terrainHeight(snappedX, snappedZ),
          snappedZ,
        ],
      },
    ]);

    setPlacementMode(false);
    setHoveredPosition(null);

    setMessage(
      `${selectedBuildingData.name} successfully constructed.`
    );
  }

  // ----------------------------------------------
  // MANUAL SOL
  // ----------------------------------------------

  function advanceSol() {
    setSol((previous) => previous + 1);

    setResources((previous) =>
      advanceEconomy(
        previous,
        production,
        counts.extractor
      )
    );

    setMessage("One Martian Sol completed.");
  }

  const resourceItems = [
    { key: "metal", label: "METAL", icon: "◇", color: "#d1a786" },
    { key: "energy", label: "ENERGY", icon: "⚡", color: "#eac26a" },
    { key: "water", label: "WATER", icon: "◉", color: "#79c5e9" },
    { key: "food", label: "FOOD", icon: "♧", color: "#9bd7a0" },
  ];

  const projectedEnergy = resources.energy + production.energy;
  const extractorsOperational =
    counts.extractor > 0 && projectedEnergy >= 0;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#171719",
        fontFamily:
          "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* 3D WORLD */}
      <Canvas
        shadows
        camera={{
          position: [22, 16, 22],
          fov: 45,
          near: 0.1,
          far: 500,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <WorldScene
          buildings={buildings}
          placementMode={placementMode}
          hoveredPosition={hoveredPosition}
          validPlacement={validPlacement}
          onPlace={handlePlace}
          onHover={handleHover}
        />
      </Canvas>

      {/* BRANDING */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#f1a16c",
            letterSpacing: 3,
            fontWeight: 800,
            marginBottom: 7,
          }}
        >
          MARS COLONIZATION PROGRAM
        </div>

        <div
          style={{
            color: "#ffffff",
            fontSize: 25,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          THE NEW FRONTIER
        </div>

        <div
          style={{
            color: "#aeb7bc",
            fontSize: 11,
            marginTop: 7,
            letterSpacing: 1.5,
          }}
        >
          COLONY OPERATIONS / SECTOR 01
        </div>
      </div>

      {/* RESOURCE HUD */}
      <div
        style={{
          ...panelStyle,
          position: "absolute",
          top: 22,
          right: 22,
          width: 295,
          padding: 18,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 17,
          }}
        >
          <span style={labelStyle}>COLONY RESOURCES</span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#f1b07a",
            }}
          >
            SOL {String(sol).padStart(3, "0")}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {resourceItems.map((item) => (
            <div
              key={item.key}
              style={{
                background: "rgba(255,255,255,0.045)",
                borderRadius: 9,
                padding: 11,
              }}
            >
              <div
                style={{
                  ...labelStyle,
                  fontSize: 9,
                  letterSpacing: 1.3,
                }}
              >
                <span style={{ color: item.color }}>
                  {item.icon}{" "}
                </span>
                {item.label}
              </div>

              <div
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  marginTop: 5,
                  color: "#f4f5f5",
                }}
              >
                {resources[item.key]}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginTop: 14,
            paddingTop: 13,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ ...labelStyle, letterSpacing: 1 }}>
            POWER / SOL
          </span>

          <span
            style={{
              fontWeight: 800,
              color:
                production.energy >= 0 ? "#72d7aa" : "#ff9b8d",
            }}
          >
            {production.energy > 0 ? "+" : ""}
            {production.energy}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 11,
          }}
        >
          <span style={{ ...labelStyle, letterSpacing: 1 }}>
            WATER / SOL
          </span>

          <span
            style={{
              fontWeight: 800,
              color: extractorsOperational
                ? "#79c5e9"
                : "#9aa6ad",
            }}
          >
            +
            {extractorsOperational
              ? production.water
              : 0}
          </span>
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#9aa6ad",
            marginTop: 13,
            lineHeight: 1.7,
          }}
        >
          {counts.habitat} HABITATS · {counts.solar} SOLAR ARRAYS
          <div>{counts.extractor} WATER EXTRACTORS</div>
        </div>

        {counts.extractor > 0 && (
          <div
            style={{
              marginTop: 10,
              fontSize: 10,
              color: extractorsOperational
                ? "#72d7aa"
                : "#ff9b8d",
            }}
          >
            ● WATER SYSTEMS{" "}
            {extractorsOperational ? "OPERATIONAL" : "POWER LIMITED"}
          </div>
        )}
      </div>

      {/* CONSTRUCTION PANEL */}
      <div
        style={{
          ...panelStyle,
          position: "absolute",
          left: 24,
          bottom: 24,
          width: 300,
          maxHeight: "65vh",
          overflowY: "auto",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <div style={{ ...labelStyle, marginBottom: 14 }}>
          01 / CONSTRUCTION
        </div>

        {BUILDINGS.map((building) => {
          const available = building.status === "AVAILABLE";
          const affordable =
            available && canAfford(resources, building.cost);
          const active =
            placementMode && selectedBuilding === building.id;

          return (
            <button
              key={building.id}
              onClick={() => chooseBuilding(building)}
              disabled={!available}
              style={{
                width: "100%",
                display: "flex",
                gap: 12,
                alignItems: "center",
                textAlign: "left",
                background: active
                  ? "rgba(240,158,104,0.17)"
                  : "rgba(255,255,255,0.035)",
                border: active
                  ? "1px solid #d88b5e"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 9,
                color: available ? "#eef0f1" : "#747d83",
                padding: 12,
                marginBottom: 8,
                cursor: available ? "pointer" : "not-allowed",
                opacity: available ? 1 : 0.55,
              }}
            >
              <span
                style={{
                  fontSize: 23,
                  width: 29,
                  color: "#e6a270",
                }}
              >
                {building.icon}
              </span>

              <span style={{ flex: 1 }}>
                <strong
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  {building.name}
                </strong>

                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    lineHeight: 1.5,
                    color: "#9ba5aa",
                  }}
                >
                  {building.description}
                </span>

                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    marginTop: 6,
                    color: !available
                      ? "#777f83"
                      : affordable
                      ? "#e9b58e"
                      : "#ff9289",
                  }}
                >
                  {available
                    ? `${building.cost.metal} METAL · ${building.cost.energy} ENERGY`
                    : "COMING SOON"}
                </span>
              </span>
            </button>
          );
        })}

        {placementMode && (
          <button
            onClick={() => {
              setPlacementMode(false);
              setHoveredPosition(null);
              setMessage("Construction cancelled.");
            }}
            style={{
              width: "100%",
              padding: 11,
              marginTop: 5,
              background: "rgba(255,100,100,0.1)",
              color: "#ffaaa3",
              border: "1px solid rgba(255,120,120,0.25)",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            CANCEL CONSTRUCTION
          </button>
        )}
      </div>

      {/* SIMULATION CONTROLS */}
      <div
        style={{
          ...panelStyle,
          position: "absolute",
          right: 22,
          bottom: 24,
          width: 250,
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <div style={{ ...labelStyle, marginBottom: 12 }}>
          02 / SIMULATION
        </div>

        <button
          onClick={advanceSol}
          style={{
            width: "100%",
            padding: 12,
            background: "#c98257",
            color: "#16191b",
            border: "none",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          ADVANCE ONE SOL →
        </button>

        <button
          onClick={() => setPaused((previous) => !previous)}
          style={{
            width: "100%",
            padding: 11,
            marginTop: 8,
            background: "rgba(255,255,255,0.06)",
            color: "#e4e8ea",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {paused ? "RESUME SIMULATION" : "PAUSE SIMULATION"}
        </button>

        <div
          style={{
            fontSize: 10,
            color: "#9ba6ad",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {paused
            ? "SIMULATION PAUSED"
            : "AUTO-ADVANCE EVERY 5 SECONDS"}
        </div>
      </div>

      {/* STATUS BAR */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 26,
          transform: "translateX(-50%)",
          ...panelStyle,
          padding: "12px 18px",
          fontSize: 11,
          color: "#c8d1d4",
          textAlign: "center",
          maxWidth: 360,
          pointerEvents: "none",
        }}
      >
        <span style={{ color: "#f0a16d" }}>● </span>
        {message}
      </div>
    </div>
  );
}
