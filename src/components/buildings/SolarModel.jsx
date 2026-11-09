
import { useMemo } from "react";
import * as THREE from "three";

// ======================================================
// MARS: THE NEW FRONTIER
// SOLAR MEGAPLEX — LEVELS 1 THROUGH 10
//
// Visual architecture only.
// Existing production, upgrades and saves stay intact.
// ======================================================

const C = {
  foundation: "#555c60",
  concrete: "#8a8880",
  white: "#dce3e2",
  metal: "#899ba4",
  steel: "#435760",
  dark: "#1c303a",
  blue: "#153b65",
  cell: "#205b91",
  copper: "#c88d59",
  cable: "#30383d",
  glass: "#6eb8c9",
  light: "#9de7ed",
  warning: "#d6a354",
};

function Block({
  position = [0, 0, 0],
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  color = C.metal,
  emissive,
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.58}
        roughness={0.4}
        emissive={emissive || "#000000"}
        emissiveIntensity={emissive ? 0.55 : 0}
      />
    </mesh>
  );
}

function Rod({
  from,
  to,
  radius = 0.055,
  color = C.metal,
}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const length = direction.length();

  if (length < 0.00001) return null;

  const middle = a.clone().add(b).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  return (
    <mesh
      position={middle.toArray()}
      quaternion={quaternion}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial
        color={color}
        metalness={0.75}
        roughness={0.32}
      />
    </mesh>
  );
}

function Pipe({ points, radius = 0.07, color = C.copper }) {
  return (
    <group>
      {points.slice(1).map((p, i) => (
        <Rod
          key={i}
          from={points[i]}
          to={p}
          radius={radius}
          color={color}
        />
      ))}
    </group>
  );
}

function Tank({
  position = [0, 0, 0],
  height = 1.8,
  radius = 0.45,
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2 + 0.2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial
          color={C.white}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {[0.35, height / 2 + 0.2, height + 0.05].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry
            args={[radius + 0.04, radius + 0.04, 0.1, 16]}
          />
          <meshStandardMaterial color={C.steel} metalness={0.8} />
        </mesh>
      ))}

      <Pipe
        points={[
          [0, height + 0.2, 0],
          [0, height + 0.5, 0],
          [radius + 0.35, height + 0.5, 0],
        ]}
        radius={0.055}
      />
    </group>
  );
}

// ------------------------------------------------------
// PHOTOVOLTAIC MODULE
// ------------------------------------------------------

function PhotovoltaicSurface({
  width = 3.8,
  height = 2.25,
  columns = 10,
  rows = 6,
}) {
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  const matrices = useMemo(() => {
    const result = [];
    const dummy = new THREE.Object3D();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        dummy.position.set(
          -width / 2 + (col + 0.5) * cellWidth,
          -height / 2 + (row + 0.5) * cellHeight,
          0.047
        );

        dummy.scale.set(
          cellWidth * 0.92,
          cellHeight * 0.9,
          0.012
        );

        dummy.updateMatrix();
        result.push(dummy.matrix.clone());
      }
    }

    return result;
  }, [width, height, columns, rows, cellWidth, cellHeight]);

  return (
    <group>
      <Block
        position={[0, 0, -0.055]}
        size={[width + 0.14, height + 0.14, 0.11]}
        color={C.steel}
      />

      <Block
        position={[0, 0, 0.012]}
        size={[width, height, 0.025]}
        color={C.blue}
      />

      <instancedMesh
        args={[undefined, undefined, matrices.length]}
        castShadow={false}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={C.cell}
          metalness={0.65}
          roughness={0.26}
        />
        {/*
          Set all cell transforms through the instanceMatrix.
          This keeps one draw call for the solar cells.
        */}
        <primitive
          object={(() => {
            const attribute = new THREE.InstancedBufferAttribute(
              new Float32Array(
                matrices.flatMap((m) => Array.from(m.elements))
              ),
              16
            );
            return attribute;
          })()}
          attach="instanceMatrix"
        />
      </instancedMesh>

      {[-1, 1].map((side) => (
        <Block
          key={side}
          position={[side * width / 2, 0, 0.09]}
          size={[0.055, height + 0.16, 0.07]}
          color={C.metal}
        />
      ))}

      <Block
        position={[0, 0, 0.09]}
        size={[width + 0.16, 0.045, 0.07]}
        color={C.metal}
      />

      <Block
        position={[0, 0, -0.2]}
        size={[width * 0.75, 0.08, 0.12]}
        color={C.metal}
      />
    </group>
  );
}

// ------------------------------------------------------
// MECHANICAL TRACKING ASSEMBLY
// ------------------------------------------------------

function SolarTracker({
  position = [0, 0, 0],
  advanced = false,
  tilt = -0.34,
}) {
  return (
    <group position={position}>
      <Block
        position={[0, 0.14, 0]}
        size={[1.55, 0.28, 1.5]}
        color={C.concrete}
      />

      <Block
        position={[0, 0.38, 0]}
        size={[1.15, 0.28, 1.1]}
        color={C.steel}
      />

      <Rod
        from={[0, 0.45, 0]}
        to={[0, 2.05, 0]}
        radius={0.16}
        color={C.metal}
      />

      <mesh position={[0, 2.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.29, 0.29, 0.72, 12]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} />
      </mesh>

      <group position={[0, 2.25, 0]} rotation={[tilt, 0, 0]}>
        <Rod
          from={[-1.7, 0, -0.16]}
          to={[1.7, 0, -0.16]}
          radius={0.075}
        />

        {[-1.3, 1.3].map((x) => (
          <Rod
            key={x}
            from={[x, -0.95, -0.18]}
            to={[x, 0.95, -0.18]}
            radius={0.055}
          />
        ))}

        <PhotovoltaicSurface
          width={advanced ? 4.5 : 3.8}
          height={advanced ? 2.55 : 2.25}
          columns={advanced ? 12 : 10}
          rows={6}
        />
      </group>

      {/* Actuator and electrical control box */}
      <Rod
        from={[0.45, 0.85, 0.35]}
        to={[0.45, 1.9, 0.6]}
        radius={0.085}
        color={C.copper}
      />

      <Block
        position={[0.65, 0.85, 0]}
        size={[0.55, 0.62, 0.48]}
        color={C.white}
      />

      <Block
        position={[0.94, 0.9, 0]}
        size={[0.025, 0.24, 0.22]}
        color={C.glass}
      />

      <Pipe
        points={[
          [0.65, 0.58, 0],
          [0.65, 0.34, 0],
          [1.15, 0.34, 0],
        ]}
        radius={0.035}
        color={C.cable}
      />
    </group>
  );
}

// ------------------------------------------------------
// INVERTER AND TRANSFORMER STATION
// ------------------------------------------------------

function InverterStation({
  position = [0, 0, 0],
  advanced = false,
}) {
  return (
    <group position={position}>
      <Block
        position={[0, 0.18, 0]}
        size={[3.6, 0.35, 2.7]}
        color={C.concrete}
      />

      <Block
        position={[0, 1.15, 0]}
        size={[3.05, 1.65, 2.15]}
        color={C.white}
      />

      <Block
        position={[0, 2.08, 0]}
        size={[3.35, 0.2, 2.4]}
        color={C.steel}
      />

      {[-1.05, -0.35, 0.35, 1.05].map((x, i) => (
        <group key={i}>
          <Block
            position={[x, 1.3, 1.095]}
            size={[0.55, 1.1, 0.07]}
            color={C.steel}
          />

          {Array.from({ length: 5 }, (_, j) => (
            <Block
              key={j}
              position={[x, 0.94 + j * 0.17, 1.14]}
              size={[0.4, 0.035, 0.045]}
              color={C.metal}
            />
          ))}
        </group>
      ))}

      <Block
        position={[0, 1.65, 1.16]}
        size={[0.65, 0.25, 0.055]}
        color={C.glass}
      />

      <Pipe
        points={[
          [-1.2, 0.4, -1.2],
          [-1.2, 0.4, -1.75],
          [1.2, 0.4, -1.75],
        ]}
        radius={0.095}
        color={C.copper}
      />

      {advanced && (
        <>
          <Tank position={[2.15, 0, -0.55]} height={1.5} />
          <Tank position={[2.15, 0, 0.75]} height={1.5} />

          <Block
            position={[0, 2.45, 0]}
            size={[1.1, 0.55, 1.2]}
            color={C.dark}
          />

          {[-0.35, 0, 0.35].map((x) => (
            <Block
              key={x}
              position={[x, 2.77, 0]}
              size={[0.2, 0.08, 0.85]}
              color={C.metal}
            />
          ))}
        </>
      )}
    </group>
  );
}

// ------------------------------------------------------
// ENERGY STORAGE
// ------------------------------------------------------

function BatteryVault({
  position = [0, 0, 0],
  modules = 4,
}) {
  return (
    <group position={position}>
      <Block
        position={[0, 0.15, 0]}
        size={[4.4, 0.3, 3.5]}
        color={C.concrete}
      />

      <Block
        position={[0, 1.5, 0]}
        size={[4.1, 2.6, 3.1]}
        color={C.white}
      />

      <Block
        position={[0, 2.88, 0]}
        size={[4.35, 0.2, 3.35]}
        color={C.steel}
      />

      {Array.from({ length: modules }, (_, i) => {
        const x = -1.45 + (i * 2.9) / Math.max(1, modules - 1);

        return (
          <group key={i}>
            <Block
              position={[x, 1.48, 1.62]}
              size={[0.65, 1.85, 0.12]}
              color={C.dark}
            />

            <Block
              position={[x, 2.03, 1.7]}
              size={[0.38, 0.2, 0.04]}
              color={C.glass}
              emissive={C.glass}
            />

            {Array.from({ length: 4 }, (_, j) => (
              <Block
                key={j}
                position={[x, 1.42 - j * 0.23, 1.7]}
                size={[0.4, 0.055, 0.045]}
                color={C.metal}
              />
            ))}
          </group>
        );
      })}

      <Pipe
        points={[
          [-1.9, 0.45, -1.7],
          [1.9, 0.45, -1.7],
          [1.9, 0.45, -2.1],
        ]}
        radius={0.12}
        color={C.cable}
      />
    </group>
  );
}

// ------------------------------------------------------
// CENTRAL GRID CONTROL BUILDING
// ------------------------------------------------------

function GridControl({ position = [0, 0, 0], level = 7 }) {
  return (
    <group position={position}>
      <Block
        position={[0, 0.2, 0]}
        size={[7.5, 0.4, 5.5]}
        color={C.concrete}
      />

      <Block
        position={[0, 1.7, 0]}
        size={[6.6, 2.7, 4.6]}
        color={C.white}
      />

      <Block
        position={[0, 3.12, 0]}
        size={[7, 0.22, 5]}
        color={C.steel}
      />

      <Block
        position={[0, 4.1, -0.35]}
        size={[4.8, 1.8, 3.2]}
        color={C.steel}
      />

      {Array.from({ length: 7 }, (_, i) => (
        <group key={i}>
          <Block
            position={[-2.75 + i * 0.92, 2.1, 2.35]}
            size={[0.72, 0.8, 0.09]}
            color={C.glass}
          />

          <Block
            position={[-2.05 + i * 0.68, 4.25, 1.3]}
            size={[0.52, 0.65, 0.09]}
            color={C.glass}
          />
        </group>
      ))}

      <Block
        position={[0, 1.4, 2.43]}
        size={[1.5, 2.1, 0.14]}
        color={C.dark}
      />

      <Block
        position={[0, 2.1, 2.52]}
        size={[0.85, 0.4, 0.05]}
        color={C.glass}
      />

      <Rod
        from={[0, 5, -0.35]}
        to={[0, level >= 10 ? 8.8 : 7.2, -0.35]}
        radius={0.075}
        color={C.metal}
      />

      {[-1, 1].map((side) => (
        <Rod
          key={side}
          from={[0, 6.3, -0.35]}
          to={[side * 1.1, 5.15, -0.35]}
          radius={0.035}
        />
      ))}

      <mesh position={[0, level >= 10 ? 8.8 : 7.2, -0.35]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial
          color={C.warning}
          emissive={C.warning}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------
// SOLAR DISTRICT
// ------------------------------------------------------

function SolarDistrict({
  position = [0, 0, 0],
  columns = 3,
  rows = 2,
  advanced = false,
  spacing = 5.4,
}) {
  const width = columns * spacing;
  const depth = rows * spacing;

  return (
    <group position={position}>
      {/* Industrial perimeter and cable infrastructure */}
      <Block
        position={[0, 0.08, 0]}
        size={[width + 1.8, 0.16, depth + 1.8]}
        color={C.foundation}
      />

      <Block
        position={[0, 0.17, 0]}
        size={[width + 1.4, 0.04, depth + 1.4]}
        color={C.concrete}
      />

      {Array.from({ length: columns }, (_, col) =>
        Array.from({ length: rows }, (_, row) => {
          const x = (col - (columns - 1) / 2) * spacing;
          const z = (row - (rows - 1) / 2) * spacing;

          return (
            <SolarTracker
              key={`${col}-${row}`}
              position={[x, 0.2, z]}
              advanced={advanced}
              tilt={-0.28 - ((col + row) % 3) * 0.08}
            />
          );
        })
      )}

      {/* Buried-cable route visualized as a surface conduit */}
      <Pipe
        points={[
          [-width / 2, 0.24, depth / 2 + 0.3],
          [width / 2, 0.24, depth / 2 + 0.3],
        ]}
        radius={0.095}
        color={C.cable}
      />

      {Array.from({ length: columns }, (_, col) => {
        const x = (col - (columns - 1) / 2) * spacing;

        return (
          <Pipe
            key={col}
            points={[
              [x, 0.24, -depth / 2 + spacing / 2],
              [x, 0.24, depth / 2 + 0.3],
            ]}
            radius={0.04}
            color={C.copper}
          />
        );
      })}

      <Block
        position={[width / 2 + 0.3, 0.62, depth / 2 + 0.3]}
        size={[0.7, 1.05, 0.6]}
        color={C.white}
      />

      <Block
        position={[width / 2 + 0.66, 0.75, depth / 2 + 0.3]}
        size={[0.04, 0.25, 0.3]}
        color={C.glass}
      />
    </group>
  );
}

// ------------------------------------------------------
// INDUSTRIAL DISTRIBUTION EQUIPMENT
// ------------------------------------------------------

function Substation({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Block
        position={[0, 0.14, 0]}
        size={[5.5, 0.28, 4.2]}
        color={C.concrete}
      />

      {[-1.35, 0, 1.35].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Block
            position={[0, 1.15, 0]}
            size={[0.85, 1.55, 1.45]}
            color={C.steel}
          />

          {[-0.38, 0.38].map((z) => (
            <group key={z}>
              <Rod
                from={[0, 1.9, z]}
                to={[0, 3.25, z]}
                radius={0.11}
                color={C.ceramic || C.white}
              />

              {[2.3, 2.65, 3].map((y) => (
                <mesh key={y} position={[0, y, z]}>
                  <cylinderGeometry args={[0.24, 0.24, 0.1, 10]} />
                  <meshStandardMaterial
                    color={C.white}
                    metalness={0.25}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}

      <Pipe
        points={[
          [-2, 3.45, -0.38],
          [2, 3.45, -0.38],
        ]}
        radius={0.05}
        color={C.copper}
      />

      {[-2.5, 2.5].map((x) => (
        <Rod
          key={x}
          from={[x, 0.2, -1.85]}
          to={[x, 2.1, -1.85]}
          radius={0.07}
        />
      ))}
    </group>
  );
}

// ------------------------------------------------------
// FINAL LEVEL 1–10 SOLAR MEGAPLEX
// ------------------------------------------------------

export default function SolarModel({ level = 1 }) {
  const L = Math.max(1, Math.min(10, Math.floor(level)));

  const districtCount =
    L <= 2 ? 1 :
    L <= 4 ? 2 :
    L <= 6 ? 3 :
    L <= 8 ? 4 : 6;

  const columns =
    L <= 2 ? 2 :
    L <= 4 ? 3 :
    L <= 6 ? 4 : 5;

  const rows =
    L <= 2 ? 1 :
    L <= 4 ? 2 :
    L <= 7 ? 3 : 4;

  const districtWidth = columns * 5.4 + 1.8;
  const districtDepth = rows * 5.4 + 1.8;

  const districtPositions = useMemo(() => {
    const positions = [];

    for (let i = 0; i < districtCount; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);

      positions.push([
        (col - 1) * (districtWidth + 5),
        0,
        row * (districtDepth + 7),
      ]);
    }

    return positions;
  }, [districtCount, districtWidth, districtDepth]);

  return (
    <group>
      {/* Main photovoltaic generation districts */}
      {districtPositions.map((p, i) => (
        <SolarDistrict
          key={i}
          position={p}
          columns={columns}
          rows={rows}
          advanced={L >= 5}
        />
      ))}

      {/* Central conversion station */}
      <InverterStation
        position={[0, 0, -districtDepth / 2 - 5]}
        advanced={L >= 4}
      />

      {/* Battery-storage facilities */}
      {L >= 3 && (
        <BatteryVault
          position={[5.5, 0, -districtDepth / 2 - 5]}
          modules={L >= 7 ? 5 : 4}
        />
      )}

      {L >= 5 && (
        <BatteryVault
          position={[-5.5, 0, -districtDepth / 2 - 5]}
          modules={5}
        />
      )}

      {/* Grid distribution and transformer infrastructure */}
      {L >= 4 && (
        <Substation
          position={[0, 0, -districtDepth / 2 - 12]}
        />
      )}

      {/* Advanced central operations campus */}
      {L >= 7 && (
        <GridControl
          position={[0, 0, -districtDepth / 2 - 21]}
          level={L}
        />
      )}

      {/* High-capacity utility facilities */}
      {L >= 8 && (
        <>
          <InverterStation
            position={[
              districtWidth + 4,
              0,
              -districtDepth / 2 - 5,
            ]}
            advanced
          />

          <BatteryVault
            position={[
              districtWidth + 4,
              0,
              -districtDepth / 2 - 11,
            ]}
            modules={5}
          />
        </>
      )}

      {/* Level 9–10 expanded power-storage campus */}
      {L >= 9 && (
        <>
          <BatteryVault
            position={[
              -districtWidth - 4,
              0,
              -districtDepth / 2 - 5,
            ]}
            modules={5}
          />

          <Substation
            position={[
              -districtWidth - 4,
              0,
              -districtDepth / 2 - 12,
            ]}
          />
        </>
      )}

      {/* High-capacity energy trunk */}
      {L >= 6 && (
        <Pipe
          points={[
            [-districtWidth - 6, 0.28, -districtDepth / 2 - 1],
            [districtWidth + 6, 0.28, -districtDepth / 2 - 1],
          ]}
          radius={0.15}
          color={C.cable}
        />
      )}

      {/* Level 10: additional high-capacity transformers */}
      {L === 10 && (
        <>
          <Substation
            position={[
              districtWidth + 4,
              0,
              -districtDepth / 2 - 19,
            ]}
          />

          <Tank
            position={[
              districtWidth + 8,
              0,
              -districtDepth / 2 - 11,
            ]}
            height={3.2}
            radius={0.8}
          />

          <Tank
            position={[
              -districtWidth - 8,
              0,
              -districtDepth / 2 - 11,
            ]}
            height={3.2}
            radius={0.8}
          />
        </>
      )}
    </group>
  );
}
