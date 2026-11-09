
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ======================================================
// MARS: THE NEW FRONTIER
// HEPHAESTUS — MINING & MINERAL REFINING
// Standalone 3D architecture | Levels 1–10
// ======================================================

const C = {
  steel: "#53646c",
  frame: "#35444b",
  white: "#d7d9d2",
  metal: "#87959a",
  concrete: "#77736d",
  copper: "#bc8051",
  yellow: "#d4a34c",
  dark: "#252c30",
  ore: "#9d624a",
  oreLight: "#c28a63",
  glass: "#65b4c4",
  warning: "#e4b35b",
};

function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  r = [0, 0, 0],
  color = C.steel,
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={color}
        metalness={0.55}
        roughness={0.43}
      />
    </mesh>
  );
}

function Beam({ a, b, radius = 0.06, color = C.metal }) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const vector = end.clone().sub(start);
  const length = vector.length();

  if (length < 0.0001) return null;

  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    vector.normalize()
  );

  return (
    <mesh position={midpoint.toArray()} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial
        color={color}
        metalness={0.72}
        roughness={0.35}
      />
    </mesh>
  );
}

function Pipe({ points, color = C.copper, radius = 0.08 }) {
  return (
    <group>
      {points.slice(1).map((p, i) => (
        <Beam
          key={i}
          a={points[i]}
          b={p}
          radius={radius}
          color={color}
        />
      ))}
    </group>
  );
}

function Light({ p = [0, 0, 0] }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[0.11, 10, 8]} />
      <meshStandardMaterial
        color={C.warning}
        emissive={C.warning}
        emissiveIntensity={1.3}
      />
    </mesh>
  );
}

// ------------------------------------------------------
// INDUSTRIAL EXCAVATOR
// ------------------------------------------------------

function Excavator({ p = [0, 0, 0], scale = 1 }) {
  const arm = useRef();
  const turret = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (arm.current) {
      arm.current.rotation.z = -0.25 + Math.sin(t * 0.65) * 0.18;
    }

    if (turret.current) {
      turret.current.rotation.y = Math.sin(t * 0.25) * 0.25;
    }
  });

  return (
    <group position={p} scale={scale}>
      {/* Tracked undercarriage */}
      <Box
        p={[0, 0.42, 0]}
        s={[3.2, 0.6, 2.3]}
        color={C.frame}
      />

      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            p={[0, 0.35, side * 1.12]}
            s={[3.4, 0.7, 0.65]}
            color={C.dark}
          />

          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              position={[-1.25 + i * 0.5, 0.35, side * 1.48]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.23, 0.23, 0.08, 12]} />
              <meshStandardMaterial
                color={C.metal}
                metalness={0.75}
              />
            </mesh>
          ))}
        </group>
      ))}

      <group ref={turret} position={[0, 0.9, 0]}>
        <Box
          p={[-0.25, 0.55, 0]}
          s={[2.2, 1.15, 1.9]}
          color={C.yellow}
        />

        <Box
          p={[-0.65, 1.2, -0.4]}
          s={[1.05, 1.05, 1]}
          color={C.white}
        />

        <Box
          p={[-0.65, 1.3, -0.94]}
          s={[0.78, 0.65, 0.08]}
          color={C.glass}
        />

        {/* Pivoting excavator boom */}
        <group ref={arm} position={[0.75, 0.8, 0]}>
          <Beam
            a={[0, 0, 0]}
            b={[2.4, 2.3, 0]}
            radius={0.22}
            color={C.yellow}
          />

          <Beam
            a={[0.1, -0.18, 0.3]}
            b={[1.75, 1.8, 0.3]}
            radius={0.075}
            color={C.metal}
          />

          <Beam
            a={[2.4, 2.3, 0]}
            b={[4.1, 0.65, 0]}
            radius={0.17}
            color={C.yellow}
          />

          <Beam
            a={[2.1, 2.5, 0.25]}
            b={[3.55, 1.1, 0.25]}
            radius={0.07}
            color={C.metal}
          />

          {/* Multi-piece excavator bucket */}
          <group position={[4.3, 0.35, 0]}>
            <Box
              p={[0.1, -0.25, 0]}
              s={[1.05, 0.55, 1.5]}
              color={C.steel}
            />

            <Box
              p={[0.65, -0.08, 0]}
              s={[0.12, 0.75, 1.55]}
              color={C.frame}
            />

            {Array.from({ length: 5 }, (_, i) => (
              <mesh
                key={i}
                position={[0.75, -0.5, -0.58 + i * 0.29]}
                rotation={[0, 0, -Math.PI / 2]}
              >
                <coneGeometry args={[0.12, 0.38, 5]} />
                <meshStandardMaterial
                  color={C.metal}
                  metalness={0.75}
                />
              </mesh>
            ))}
          </group>
        </group>

        <Light p={[-1.3, 1.05, 0.8]} />
      </group>
    </group>
  );
}

// ------------------------------------------------------
// ANIMATED ORE CONVEYOR
// ------------------------------------------------------

function Conveyor({
  p = [0, 0, 0],
  length = 7,
  elevated = false,
}) {
  const ore = useRef();
  const oreCount = 12;

  useFrame(({ clock }) => {
    if (!ore.current) return;

    const dummy = new THREE.Object3D();
    const t = clock.elapsedTime * 0.9;

    for (let i = 0; i < oreCount; i++) {
      const z =
        (((i / oreCount) * length + t) % length) -
        length / 2;

      dummy.position.set(0, 0.28, z);
      dummy.rotation.set(i * 0.7, i * 1.1, 0);
      dummy.scale.setScalar(0.17 + (i % 3) * 0.05);
      dummy.updateMatrix();
      ore.current.setMatrixAt(i, dummy.matrix);
    }

    ore.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={p}>
      <group rotation={[elevated ? -0.16 : 0, 0, 0]}>
        <Box
          p={[0, 0, 0]}
          s={[1.5, 0.18, length]}
          color={C.dark}
        />

        {[-1, 1].map((side) => (
          <Box
            key={side}
            p={[side * 0.78, 0.15, 0]}
            s={[0.12, 0.45, length]}
            color={C.steel}
          />
        ))}

        {Array.from({ length: Math.ceil(length) }, (_, i) => (
          <Box
            key={i}
            p={[0, -0.11, -length / 2 + i + 0.5]}
            s={[1.45, 0.12, 0.1]}
            color={C.metal}
          />
        ))}

        <instancedMesh
          ref={ore}
          args={[undefined, undefined, oreCount]}
          frustumCulled={false}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={C.ore}
            roughness={0.95}
          />
        </instancedMesh>
      </group>

      {[-1, 1].map((side) =>
        [-1, 1].map((end) => (
          <Beam
            key={`${side}-${end}`}
            a={[side * 0.6, -0.1, end * (length / 2 - 0.5)]}
            b={[side * 0.6, -1.35, end * (length / 2 - 0.5)]}
            radius={0.08}
          />
        ))
      )}
    </group>
  );
}

// ------------------------------------------------------
// ORE CRUSHER
// ------------------------------------------------------

function Crusher({ p = [0, 0, 0] }) {
  const rotor = useRef();

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.z += delta * 1.1;
  });

  return (
    <group position={p}>
      <Box
        p={[0, 0.18, 0]}
        s={[4.4, 0.36, 4.2]}
        color={C.concrete}
      />

      <Box
        p={[0, 1.5, 0]}
        s={[3.2, 2.4, 3]}
        color={C.steel}
      />

      <Box
        p={[0, 2.9, 0]}
        s={[3.7, 0.45, 3.5]}
        color={C.yellow}
      />

      <Box
        p={[0, 3.5, 0]}
        s={[2.6, 0.9, 2.6]}
        color={C.frame}
      />

      <group ref={rotor} position={[1.72, 1.7, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.65, 0.12, 10, 24]} />
          <meshStandardMaterial
            color={C.copper}
            metalness={0.8}
          />
        </mesh>

        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI * 2) / 6;
          return (
            <Beam
              key={i}
              a={[0, 0, 0]}
              b={[0, Math.cos(a) * 0.6, Math.sin(a) * 0.6]}
              radius={0.06}
            />
          );
        })}
      </group>

      {Array.from({ length: 7 }, (_, i) => (
        <Box
          key={i}
          p={[-1.25 + i * 0.42, 1.5, 1.54]}
          s={[0.12, 1.5, 0.08]}
          color={C.metal}
        />
      ))}

      <Light p={[1.5, 3.1, 1.5]} />
    </group>
  );
}

// ------------------------------------------------------
// ORE STORAGE SILOS
// ------------------------------------------------------

function Silo({
  p = [0, 0, 0],
  height = 5,
  radius = 1.25,
}) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.18, 0]}
        s={[radius * 2.5, 0.36, radius * 2.5]}
        color={C.concrete}
      />

      <mesh position={[0, height / 2 + 0.4, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 20]} />
        <meshStandardMaterial
          color={C.white}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>

      {[0.8, height / 2, height].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry
            args={[radius + 0.07, radius + 0.07, 0.15, 20]}
          />
          <meshStandardMaterial color={C.steel} metalness={0.7} />
        </mesh>
      ))}

      <mesh position={[0, height + 0.65, 0]}>
        <coneGeometry args={[radius + 0.1, 0.9, 20]} />
        <meshStandardMaterial color={C.frame} metalness={0.65} />
      </mesh>

      <Pipe
        points={[
          [0, height + 1, 0],
          [0, height + 1.5, 0],
          [radius + 0.7, height + 1.5, 0],
        ]}
        radius={0.09}
      />

      {Array.from({ length: 10 }, (_, i) => (
        <Box
          key={i}
          p={[radius + 0.13, 0.7 + i * (height / 10), 0]}
          s={[0.4, 0.045, 0.85]}
          color={C.metal}
        />
      ))}
    </group>
  );
}

// ------------------------------------------------------
// MINERAL REFINERY
// ------------------------------------------------------

function Refinery({ p = [0, 0, 0], advanced = false }) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.2, 0]}
        s={[8.5, 0.4, 6.5]}
        color={C.concrete}
      />

      <Box
        p={[0, 2.1, 0]}
        s={[7.5, 3.4, 5.5]}
        color={C.white}
      />

      <Box
        p={[0, 3.9, 0]}
        s={[8, 0.25, 6]}
        color={C.frame}
      />

      {Array.from({ length: 7 }, (_, i) => (
        <group key={i}>
          <Box
            p={[-3 + i, 2.5, 2.81]}
            s={[0.72, 0.85, 0.08]}
            color={C.glass}
          />

          <Box
            p={[-3 + i, 1.25, 2.83]}
            s={[0.75, 0.55, 0.12]}
            color={C.steel}
          />

          {Array.from({ length: 4 }, (_, j) => (
            <Box
              key={j}
              p={[-3 + i, 1.07 + j * 0.13, 2.91]}
              s={[0.55, 0.035, 0.04]}
              color={C.metal}
            />
          ))}
        </group>
      ))}

      <Box
        p={[0, 1.35, 2.92]}
        s={[1.4, 2.2, 0.12]}
        color={C.dark}
      />

      <Box
        p={[0, 2.15, 3.0]}
        s={[0.85, 0.4, 0.06]}
        color={C.glass}
      />

      {/* Industrial roof equipment */}
      {[-2.5, 0, 2.5].map((x) => (
        <group key={x}>
          <Box
            p={[x, 4.35, -0.8]}
            s={[1.5, 0.7, 1.7]}
            color={C.steel}
          />

          {Array.from({ length: 6 }, (_, i) => (
            <Box
              key={i}
              p={[x - 0.55 + i * 0.22, 4.75, -0.8]}
              s={[0.08, 0.35, 1.4]}
              color={C.metal}
            />
          ))}
        </group>
      ))}

      <Pipe
        points={[
          [-3.9, 0.8, -2],
          [-4.5, 0.8, -2],
          [-4.5, 3.5, -2],
          [-3.1, 3.5, -2],
        ]}
        radius={0.14}
      />

      {advanced && (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh
                position={[side * 2.7, 5.2, 1]}
                castShadow
              >
                <cylinderGeometry args={[0.6, 0.6, 2.5, 16]} />
                <meshStandardMaterial
                  color={C.steel}
                  metalness={0.6}
                />
              </mesh>

              <Pipe
                points={[
                  [side * 2.7, 6.5, 1],
                  [side * 2.7, 7, 1],
                  [side * 3.5, 7, 1],
                ]}
                radius={0.08}
              />
            </group>
          ))}
        </>
      )}
    </group>
  );
}

// ------------------------------------------------------
// INDUSTRIAL GANTRY CRANE
// ------------------------------------------------------

function GantryCrane({ p = [0, 0, 0] }) {
  const trolley = useRef();

  useFrame(({ clock }) => {
    if (trolley.current) {
      trolley.current.position.x =
        Math.sin(clock.elapsedTime * 0.35) * 2;
    }
  });

  return (
    <group position={p}>
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-1, 1].map((end) => (
            <Beam
              key={end}
              a={[side * 4, 0, end * 2]}
              b={[side * 4, 6.5, end * 2]}
              radius={0.14}
              color={C.yellow}
            />
          ))}

          <Beam
            a={[side * 4, 6.5, -2]}
            b={[side * 4, 6.5, 2]}
            radius={0.14}
            color={C.yellow}
          />
        </group>
      ))}

      <Box
        p={[0, 6.6, 0]}
        s={[9.5, 0.55, 0.9]}
        color={C.yellow}
      />

      {Array.from({ length: 9 }, (_, i) => (
        <Beam
          key={i}
          a={[-4.3 + i * 1.075, 6.85, 0]}
          b={[-3.75 + i * 1.075, 7.45, 0]}
          radius={0.045}
        />
      ))}

      <Beam
        a={[-4.3, 7.45, 0]}
        b={[4.3, 7.45, 0]}
        radius={0.065}
      />

      <group ref={trolley} position={[0, 6.3, 0]}>
        <Box
          p={[0, 0, 0]}
          s={[1.2, 0.55, 1.1]}
          color={C.frame}
        />

        <Beam
          a={[0, -0.3, 0]}
          b={[0, -3.3, 0]}
          radius={0.045}
          color={C.dark}
        />

        <mesh position={[0, -3.4, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.28, 0.075, 8, 14, Math.PI * 1.6]} />
          <meshStandardMaterial
            color={C.copper}
            metalness={0.8}
          />
        </mesh>
      </group>

      <Light p={[4.4, 6.6, 0]} />
    </group>
  );
}

// ------------------------------------------------------
// MINING DISTRICT
// ------------------------------------------------------

function MiningDistrict({ p = [0, 0, 0], level = 1 }) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.1, 0]}
        s={[17, 0.2, 16]}
        color={C.concrete}
      />

      <Excavator p={[-4.5, 0.2, -3]} scale={0.85} />

      <Crusher p={[3.7, 0.2, -3]} />

      <Conveyor
        p={[0, 1.65, 3.5]}
        length={7}
        elevated
      />

      <Silo
        p={[4.6, 0, 4.2]}
        height={level >= 6 ? 5.5 : 4}
      />

      {level >= 4 && (
        <Excavator
          p={[-4.5, 0.2, 4]}
          scale={0.9}
        />
      )}

      {level >= 7 && (
        <Silo
          p={[1.5, 0, 5.5]}
          height={6}
          radius={1.1}
        />
      )}

      {level >= 9 && (
        <GantryCrane p={[0, 0, -1]} />
      )}

      <Pipe
        points={[
          [-7.5, 0.4, 7],
          [7.5, 0.4, 7],
        ]}
        radius={0.11}
        color={C.dark}
      />
    </group>
  );
}

// ------------------------------------------------------
// LEVEL 1–10 MASTER ARCHITECTURE
// ------------------------------------------------------

export default function MineModel({ level = 1 }) {
  const L = Math.max(1, Math.min(10, Math.floor(level)));

  const districtCount =
    L <= 2 ? 1 :
    L <= 4 ? 2 :
    L <= 6 ? 3 :
    L <= 8 ? 4 : 6;

  const positions = Array.from({ length: districtCount }, (_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);

    return [(col - 1) * 21, 0, row * 21];
  });

  return (
    <group>
      {positions.map((p, i) => (
        <MiningDistrict
          key={i}
          p={p}
          level={L}
        />
      ))}

      {/* Central processing infrastructure */}
      <Refinery
        p={[0, 0, -15]}
        advanced={L >= 5}
      />

      {L >= 4 && (
        <Refinery
          p={[12, 0, -15]}
          advanced={L >= 6}
        />
      )}

      {L >= 6 && (
        <Refinery
          p={[-12, 0, -15]}
          advanced
        />
      )}

      {/* Heavy industrial ore storage */}
      {L >= 5 && (
        <>
          <Silo p={[6, 0, -24]} height={7} radius={1.6} />
          <Silo p={[-6, 0, -24]} height={7} radius={1.6} />
        </>
      )}

      {/* Industrial loading and transport */}
      {L >= 7 && (
        <GantryCrane p={[0, 0, -26]} />
      )}

      {L >= 8 && (
        <Conveyor
          p={[0, 2.3, -8]}
          length={12}
          elevated
        />
      )}

      {/* Megaplex expansion */}
      {L >= 9 && (
        <>
          <Refinery p={[0, 0, -37]} advanced />
          <Silo p={[9, 0, -37]} height={8} radius={1.8} />
          <Silo p={[-9, 0, -37]} height={8} radius={1.8} />
        </>
      )}

      {L === 10 && (
        <>
          <GantryCrane p={[0, 0, -46]} />
          <Crusher p={[13, 0, -36]} />
          <Crusher p={[-13, 0, -36]} />

          <Pipe
            points={[
              [-17, 0.5, -31],
              [17, 0.5, -31],
            ]}
            radius={0.2}
            color={C.copper}
          />
        </>
      )}
    </group>
  );
}
