
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ======================================================
// MARS: THE NEW FRONTIER
// PROMETHEUS — RESEARCH & DEVELOPMENT COMPLEX
// Levels 1–10 | Standalone architecture
// ======================================================

const P = {
  hull: "#d5dedf",
  steel: "#657b84",
  frame: "#344b56",
  dark: "#1b303b",
  glass: "#68b6cf",
  glow: "#69e0ef",
  amber: "#e7ad56",
  base: "#676a68",
  copper: "#bd8966",
  soil: "#a86c52",
  foliage: "#6f9d75",
  white: "#eff4ed",
};

function Box({
  at = [0, 0, 0],
  size = [1, 1, 1],
  color = P.steel,
  rotation = [0, 0, 0],
}) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.48}
        roughness={0.43}
      />
    </mesh>
  );
}

function Bar({ a, b, radius = 0.05, color = P.steel }) {
  const start = new THREE.Vector3(...a);
  const delta = new THREE.Vector3(...b).sub(start);
  const length = delta.length();

  if (length < 0.0001) return null;

  const middle = start.addScaledVector(delta, 0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.normalize()
  );

  return (
    <mesh position={middle.toArray()} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.35}
      />
    </mesh>
  );
}

function Glow({
  at = [0, 0, 0],
  color = P.glow,
  radius = 0.09,
}) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[radius, 10, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.4}
      />
    </mesh>
  );
}

function Foundation({ width, depth }) {
  return (
    <>
      <Box
        at={[0, 0.12, 0]}
        size={[width + 0.8, 0.24, depth + 0.8]}
        color={P.base}
      />
      <Box
        at={[0, 0.26, 0]}
        size={[width + 0.4, 0.08, depth + 0.4]}
        color={P.frame}
      />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          at={[s * (width / 2 + 0.25), 0.28, 0]}
          size={[0.12, 0.08, depth + 0.6]}
          color={P.amber}
        />
      ))}
    </>
  );
}

// ------------------------------------------------------
// RESEARCH LABORATORY
// ------------------------------------------------------

function Laboratory({
  at = [0, 0, 0],
  width = 6,
  depth = 4.5,
  height = 3.1,
  floors = 1,
}) {
  return (
    <group position={at}>
      <Foundation width={width} depth={depth} />

      <Box
        at={[0, height / 2 + 0.32, 0]}
        size={[width, height, depth]}
        color={P.hull}
      />

      <Box
        at={[0, height + 0.4, 0]}
        size={[width + 0.45, 0.22, depth + 0.45]}
        color={P.frame}
      />

      {Array.from({ length: floors }, (_, floor) => {
        const y = 1.6 + floor * (height / floors);

        return (
          <group key={floor}>
            {Array.from({ length: 5 }, (_, i) => {
              const x = -width / 2 + (i + 0.5) * width / 5;

              return (
                <group key={i}>
                  <Box
                    at={[x, Math.min(y, height - 0.15), depth / 2 + 0.05]}
                    size={[width / 6, 0.65, 0.09]}
                    color={P.glass}
                  />
                  <Box
                    at={[x, Math.min(y, height - 0.15), -depth / 2 - 0.05]}
                    size={[width / 6, 0.65, 0.09]}
                    color={P.glass}
                  />
                </group>
              );
            })}
          </group>
        );
      })}

      {[-1, 1].map((s) => (
        <group key={s}>
          <Box
            at={[s * (width / 2 - 0.15), height / 2 + 0.35, 0]}
            size={[0.14, height + 0.1, depth + 0.2]}
            color={P.steel}
          />
          <Box
            at={[s * (width / 2 - 0.6), height + 0.65, -depth / 4]}
            size={[0.75, 0.4, 1.3]}
            color={P.dark}
          />
        </group>
      ))}

      <Box
        at={[0, 1.2, depth / 2 + 0.09]}
        size={[1.35, 1.85, 0.16]}
        color={P.frame}
      />

      <Box
        at={[0, 1.75, depth / 2 + 0.2]}
        size={[0.8, 0.55, 0.05]}
        color={P.glass}
      />

      <Box
        at={[0, height + 0.72, 0]}
        size={[1.7, 0.45, 1.3]}
        color={P.steel}
      />

      <Glow at={[0, height + 1.02, 0]} />
    </group>
  );
}

// ------------------------------------------------------
// ROTATING RADAR DISH
// ------------------------------------------------------

function Radar({ at = [0, 0, 0], large = false }) {
  const rotating = useRef();

  useFrame((_, dt) => {
    if (rotating.current) {
      rotating.current.rotation.y += dt * 0.18;
    }
  });

  const size = large ? 1.9 : 1.25;

  return (
    <group position={at}>
      <Foundation width={2.8} depth={2.8} />

      <Box
        at={[0, 1.1, 0]}
        size={[0.8, 1.7, 0.8]}
        color={P.frame}
      />

      <group ref={rotating} position={[0, 2.2, 0]}>
        <Bar
          a={[0, -0.15, 0]}
          b={[0, 0.6, 0]}
          radius={0.13}
        />

        <group rotation={[0.42, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <sphereGeometry
              args={[
                size,
                22,
                10,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.43,
              ]}
            />
            <meshStandardMaterial
              color={P.hull}
              side={THREE.DoubleSide}
              metalness={0.48}
              roughness={0.46}
            />
          </mesh>

          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 0.97, 0.06, 8, 32]} />
            <meshStandardMaterial color={P.frame} />
          </mesh>

          <Bar
            a={[0, 0, 0]}
            b={[0, 0, size * 0.7]}
            radius={0.05}
            color={P.copper}
          />

          <Glow
            at={[0, 0, size * 0.75]}
            color={P.amber}
          />
        </group>
      </group>
    </group>
  );
}

// ------------------------------------------------------
// SCIENTIFIC TELESCOPE
// ------------------------------------------------------

function Telescope({ at = [0, 0, 0] }) {
  const swivel = useRef();

  useFrame(({ clock }) => {
    if (swivel.current) {
      swivel.current.rotation.y =
        Math.sin(clock.elapsedTime * 0.13) * 0.22;
    }
  });

  return (
    <group position={at}>
      <Foundation width={4} depth={4} />

      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.5, 2.2, 18]} />
        <meshStandardMaterial color={P.hull} metalness={0.45} />
      </mesh>

      <group ref={swivel} position={[0, 2.5, 0]}>
        <group rotation={[0.55, 0, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.72, 0.88, 2.8, 20]} />
            <meshStandardMaterial
              color={P.frame}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>

          <mesh position={[0, 2.65, 0]}>
            <cylinderGeometry args={[0.78, 0.78, 0.18, 20]} />
            <meshStandardMaterial
              color={P.glass}
              metalness={0.35}
              roughness={0.2}
            />
          </mesh>

          {[0.3, 1.3, 2.2].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[0.9, 0.9, 0.13, 20]} />
              <meshStandardMaterial color={P.steel} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ------------------------------------------------------
// ENVIRONMENTAL / BIOSCIENCE DOME
// ------------------------------------------------------

function ResearchDome({
  at = [0, 0, 0],
  radius = 3.2,
  hydroponics = false,
}) {
  const count = hydroponics ? 12 : 7;

  return (
    <group position={at}>
      <Foundation
        width={radius * 2.2}
        depth={radius * 2.2}
      />

      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.32, 28]} />
        <meshStandardMaterial color={P.frame} metalness={0.6} />
      </mesh>

      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry
          args={[
            radius,
            24,
            12,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ]}
        />
        <meshPhysicalMaterial
          color={P.glass}
          transparent
          opacity={0.31}
          roughness={0.18}
          metalness={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry
          args={[
            radius + 0.025,
            12,
            7,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ]}
        />
        <meshStandardMaterial
          color={P.steel}
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>

      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = radius * 0.56;

        return (
          <group
            key={i}
            position={[
              Math.cos(a) * r,
              0,
              Math.sin(a) * r,
            ]}
          >
            <Box
              at={[0, 0.58, 0]}
              size={[0.75, 0.3, 1.15]}
              color={P.white}
            />

            <Box
              at={[0, 0.8, 0]}
              size={[0.6, 0.14, 0.95]}
              color={P.soil}
            />

            {hydroponics ? (
              Array.from({ length: 3 }, (_, j) => (
                <mesh
                  key={j}
                  position={[-0.2 + j * 0.2, 1.1, 0]}
                >
                  <coneGeometry args={[0.14, 0.55, 6]} />
                  <meshStandardMaterial color={P.foliage} />
                </mesh>
              ))
            ) : (
              <Glow at={[0, 1.05, 0]} />
            )}
          </group>
        );
      })}

      <Box
        at={[0, 1.05, radius - 0.12]}
        size={[1.5, 1.8, 0.55]}
        color={P.hull}
      />

      <Box
        at={[0, 1.25, radius + 0.2]}
        size={[0.8, 0.7, 0.08]}
        color={P.glass}
      />
    </group>
  );
}

// ------------------------------------------------------
// ANIMATED ROBOTIC RESEARCH ARM
// ------------------------------------------------------

function RobotArm({ at = [0, 0, 0] }) {
  const shoulder = useRef();

  useFrame(({ clock }) => {
    if (shoulder.current) {
      shoulder.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.8) * 0.3;
    }
  });

  return (
    <group position={at}>
      <Box
        at={[0, 0.2, 0]}
        size={[1.7, 0.4, 1.6]}
        color={P.frame}
      />

      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 0.75, 12]} />
        <meshStandardMaterial color={P.steel} />
      </mesh>

      <group ref={shoulder} position={[0, 1.05, 0]}>
        <Bar
          a={[0, 0, 0]}
          b={[0.65, 1.45, 0]}
          radius={0.15}
          color={P.white}
        />

        <Bar
          a={[0.65, 1.45, 0]}
          b={[1.45, 0.85, 0]}
          radius={0.12}
          color={P.steel}
        />

        <Box
          at={[1.45, 0.75, 0]}
          size={[0.45, 0.35, 0.45]}
          color={P.frame}
        />

        <Bar
          a={[1.4, 0.6, -0.15]}
          b={[1.6, 0.25, -0.22]}
          radius={0.035}
          color={P.copper}
        />

        <Bar
          a={[1.4, 0.6, 0.15]}
          b={[1.6, 0.25, 0.22]}
          radius={0.035}
          color={P.copper}
        />
      </group>
    </group>
  );
}

// ------------------------------------------------------
// COMMUNICATIONS TOWER
// ------------------------------------------------------

function CommunicationsTower({
  at = [0, 0, 0],
  height = 9,
}) {
  return (
    <group position={at}>
      <Foundation width={3.5} depth={3.5} />

      {[-1, 1].map((s) =>
        [-1, 1].map((z) => (
          <Bar
            key={`${s}-${z}`}
            a={[s * 1.1, 0.4, z * 1.1]}
            b={[s * 0.16, height, z * 0.16]}
            radius={0.09}
            color={P.frame}
          />
        ))
      )}

      {Array.from({ length: 7 }, (_, i) => {
        const y = 0.8 + (i * (height - 1.2)) / 7;
        const w = 1.1 - i * 0.12;

        return (
          <group key={i}>
            <Bar
              a={[-w, y, -w]}
              b={[w, y, -w]}
              radius={0.045}
            />
            <Bar
              a={[-w, y, w]}
              b={[w, y, w]}
              radius={0.045}
            />
            <Bar
              a={[-w, y, -w]}
              b={[-w, y, w]}
              radius={0.045}
            />
            <Bar
              a={[w, y, -w]}
              b={[w, y, w]}
              radius={0.045}
            />
            <Bar
              a={[-w, y, -w]}
              b={[w - 0.12, y + 0.7, -w + 0.12]}
              radius={0.03}
            />
          </group>
        );
      })}

      <Bar
        a={[0, height, 0]}
        b={[0, height + 1.8, 0]}
        radius={0.055}
      />

      <Glow
        at={[0, height + 1.9, 0]}
        color={P.amber}
      />

      <Box
        at={[0.5, height - 0.5, 0]}
        size={[1.3, 0.3, 0.25]}
        color={P.glass}
      />
    </group>
  );
}

// ------------------------------------------------------
// RESEARCH WING
// ------------------------------------------------------

function ResearchWing({
  at = [0, 0, 0],
  tier = 1,
}) {
  return (
    <group position={at}>
      <Laboratory
        width={tier > 1 ? 8 : 6}
        depth={5}
        height={tier > 1 ? 4.6 : 3.1}
        floors={tier > 1 ? 2 : 1}
      />

      <RobotArm at={[3.5, 0, 0]} />

      <Box
        at={[-3.2, 0.65, 0]}
        size={[0.9, 0.9, 1.1]}
        color={P.frame}
      />

      <Glow at={[-3.2, 1.2, 0]} />
    </group>
  );
}

// ------------------------------------------------------
// EXTERNAL UTILITY CONNECTIONS
// ------------------------------------------------------

function UtilityLink({ a, b }) {
  return (
    <group>
      <Bar
        a={a}
        b={b}
        radius={0.14}
        color={P.frame}
      />

      <Bar
        a={[a[0], a[1] + 0.22, a[2]]}
        b={[b[0], b[1] + 0.22, b[2]]}
        radius={0.065}
        color={P.copper}
      />

      <Bar
        a={[a[0], a[1] - 0.22, a[2]]}
        b={[b[0], b[1] - 0.22, b[2]]}
        radius={0.065}
        color={P.glass}
      />
    </group>
  );
}

// ======================================================
// MASTER ARCHITECTURE — LEVELS 1 THROUGH 10
// ======================================================

export default function ResearchModel({ level = 1 }) {
  const L = Math.max(
    1,
    Math.min(10, Math.floor(Number(level) || 1))
  );

  return (
    <group>
      {/* LEVEL 1: Pioneer research laboratory */}
      <ResearchWing
        at={[0, 0, 0]}
        tier={L >= 4 ? 2 : 1}
      />

      <Radar
        at={[7, 0, 0]}
        large={L >= 5}
      />

      {/* LEVEL 2: Astronomical observation */}
      {L >= 2 && (
        <Telescope at={[-8, 0, 0]} />
      )}

      {/* LEVEL 3: Planetary analysis wing */}
      {L >= 3 && (
        <>
          <ResearchWing
            at={[0, 0, -10]}
            tier={1}
          />

          <UtilityLink
            a={[0, 0.8, -2.5]}
            b={[0, 0.8, -7.5]}
          />
        </>
      )}

      {/* LEVEL 4: Environmental testing dome */}
      {L >= 4 && (
        <ResearchDome
          at={[11, 0, -10]}
          radius={3}
        />
      )}

      {/* LEVEL 5: Advanced communications */}
      {L >= 5 && (
        <>
          <CommunicationsTower
            at={[-12, 0, -11]}
            height={9}
          />

          <ResearchWing
            at={[-12, 0, -20]}
            tier={2}
          />
        </>
      )}

      {/* LEVEL 6: Bioscience research dome */}
      {L >= 6 && (
        <>
          <ResearchDome
            at={[11, 0, -22]}
            radius={3.6}
            hydroponics
          />

          <UtilityLink
            a={[11, 0.75, -13.3]}
            b={[11, 0.75, -18.2]}
          />
        </>
      )}

      {/* LEVEL 7: Central research institute */}
      {L >= 7 && (
        <>
          <Laboratory
            at={[0, 0, -24]}
            width={10}
            depth={7}
            height={6.4}
            floors={2}
          />

          <RobotArm at={[6, 0, -25]} />
          <RobotArm at={[-6, 0, -25]} />

          <UtilityLink
            a={[0, 0.8, -12.5]}
            b={[0, 0.8, -20.5]}
          />
        </>
      )}

      {/* LEVEL 8: Observatory expansion */}
      {L >= 8 && (
        <>
          <Telescope at={[-12, 0, -32]} />
          <Telescope at={[-5, 0, -37]} />

          <Radar
            at={[12, 0, -34]}
            large
          />
        </>
      )}

      {/* LEVEL 9: Industrial science campus */}
      {L >= 9 && (
        <>
          <ResearchWing
            at={[-13, 0, -44]}
            tier={2}
          />

          <ResearchWing
            at={[0, 0, -44]}
            tier={2}
          />

          <ResearchWing
            at={[13, 0, -44]}
            tier={2}
          />

          <UtilityLink
            a={[-13, 0.8, -39]}
            b={[13, 0.8, -39]}
          />
        </>
      )}

      {/* LEVEL 10: Scientific arcology */}
      {L >= 10 && (
        <>
          <Laboratory
            at={[0, 0, -59]}
            width={15}
            depth={10}
            height={9}
            floors={3}
          />

          <ResearchDome
            at={[-13, 0, -59]}
            radius={4.3}
            hydroponics
          />

          <ResearchDome
            at={[13, 0, -59]}
            radius={4.3}
          />

          <CommunicationsTower
            at={[0, 0, -73]}
            height={15}
          />

          <UtilityLink
            a={[0, 0.8, -46.5]}
            b={[0, 0.8, -54]}
          />

          <UtilityLink
            a={[-9, 0.8, -59]}
            b={[9, 0.8, -59]}
          />
        </>
      )}
    </group>
  );
}
