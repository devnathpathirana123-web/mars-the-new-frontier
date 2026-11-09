
import { useMemo } from "react";
import * as THREE from "three";

// MARS: THE NEW FRONTIER
// Detailed procedural habitat architecture
// Designed for 15 upgrade levels.

const COLORS = {
  shell: "#d5d2c7",
  shellLight: "#ece9df",
  ceramic: "#c4b9a5",
  frame: "#78858a",
  dark: "#35464e",
  glass: "#244d64",
  glassLight: "#6babbc",
  pipe: "#b5a79a",
  orange: "#db8854",
  foundation: "#50575b",
  rubber: "#30383b",
};

function Part({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [1, 1, 1],
  color = COLORS.shell,
  metalness = 0.35,
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
        metalness={metalness}
        roughness={0.48}
      />
    </mesh>
  );
}

function Tube({
  a,
  b,
  radius = 0.07,
  color = COLORS.pipe,
  segments = 10,
}) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);

  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  return (
    <mesh
      position={midpoint.toArray()}
      quaternion={rotation}
      castShadow
    >
      <cylinderGeometry
        args={[radius, radius, direction.length(), segments]}
      />
      <meshStandardMaterial
        color={color}
        metalness={0.65}
        roughness={0.35}
      />
    </mesh>
  );
}

function Ring({
  radius = 1.25,
  thickness = 0.07,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = COLORS.frame,
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <torusGeometry args={[radius, thickness, 8, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.65}
        roughness={0.4}
      />
    </mesh>
  );
}

function Window({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.65,
  height = 0.42,
}) {
  return (
    <group position={position} rotation={rotation}>
      <Part
        size={[width + 0.16, height + 0.16, 0.12]}
        color={COLORS.dark}
      />
      <Part
        position={[0, 0, 0.075]}
        size={[width, height, 0.035]}
        color={COLORS.glass}
        metalness={0.65}
      />
      <Part
        position={[0, 0, 0.1]}
        size={[0.035, height, 0.02]}
        color={COLORS.frame}
      />
      <Part
        position={[0, 0, 0.105]}
        size={[width * 0.75, 0.025, 0.02]}
        color={COLORS.glassLight}
      />
    </group>
  );
}

function Foundation({ width = 5, depth = 5 }) {
  return (
    <group>
      <Part
        position={[0, 0.12, 0]}
        size={[width, 0.24, depth]}
        color={COLORS.foundation}
      />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <group
            key={`${x}-${z}`}
            position={[
              (x * width) / 2.3,
              0.42,
              (z * depth) / 2.3,
            ]}
          >
            <Part
              size={[0.28, 0.65, 0.28]}
              color={COLORS.frame}
            />
            <Part
              position={[0, -0.28, 0]}
              size={[0.65, 0.1, 0.65]}
              color={COLORS.rubber}
            />
          </group>
        ))
      )}
    </group>
  );
}

function PressureTank({
  position = [0, 0, 0],
  scale = 1,
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.34, 0.34, 1.6, 16]} />
        <meshStandardMaterial
          color={COLORS.shellLight}
          metalness={0.55}
          roughness={0.38}
        />
      </mesh>
      {[-0.58, 0.58].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.12, 16]} />
          <meshStandardMaterial color={COLORS.frame} />
        </mesh>
      ))}
      <Tube
        a={[0, 0.85, 0]}
        b={[0.45, 0.85, 0]}
        radius={0.06}
        color={COLORS.orange}
      />
    </group>
  );
}

function Antenna({ position = [0, 0, 0], height = 2 }) {
  return (
    <group position={position}>
      <Tube a={[0, 0, 0]} b={[0, height, 0]} radius={0.045} />
      <Tube
        a={[-0.35, height * 0.72, 0]}
        b={[0.35, height * 0.72, 0]}
        radius={0.025}
      />
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[0.13, 12, 8]} />
        <meshStandardMaterial
          color={COLORS.orange}
          emissive="#9b4e22"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function Airlock({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <Part
        position={[0, 1.12, 0]}
        size={[1.35, 2.15, 0.65]}
        color={COLORS.frame}
      />
      <Part
        position={[0, 1.12, 0.38]}
        size={[1.05, 1.85, 0.1]}
        color={COLORS.shellLight}
      />
      <Part
        position={[0, 1.2, 0.45]}
        size={[0.55, 0.48, 0.04]}
        color={COLORS.glass}
      />
      <Part
        position={[0.42, 0.85, 0.47]}
        size={[0.07, 0.32, 0.07]}
        color={COLORS.orange}
      />
      <Part
        position={[0, 0.12, 0.6]}
        size={[1.6, 0.16, 0.9]}
        color={COLORS.foundation}
      />
    </group>
  );
}

function CylinderModule({
  position = [0, 0, 0],
  length = 4,
  radius = 1.15,
  windows = true,
}) {
  return (
    <group position={position}>
      <mesh
        position={[0, radius + 0.35, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius, radius, length, 32]} />
        <meshStandardMaterial
          color={COLORS.shell}
          metalness={0.3}
          roughness={0.62}
        />
      </mesh>

      {Array.from(
        { length: Math.max(3, Math.ceil(length / 0.65)) },
        (_, i) => {
          const x =
            -length / 2 +
            (i * length) /
              Math.max(2, Math.ceil(length / 0.65) - 1);

          return (
            <Ring
              key={i}
              position={[x, radius + 0.35, 0]}
              rotation={[0, Math.PI / 2, 0]}
              radius={radius + 0.035}
              thickness={0.045}
            />
          );
        }
      )}

      {[-1, 1].map((side) => (
        <group key={side}>
          <Tube
            a={[-length / 2, 0.45, side * (radius + 0.12)]}
            b={[length / 2, 0.45, side * (radius + 0.12)]}
            radius={0.07}
            color={COLORS.orange}
          />
          <Tube
            a={[-length / 2, 0.72, side * (radius + 0.08)]}
            b={[length / 2, 0.72, side * (radius + 0.08)]}
            radius={0.045}
          />
        </group>
      ))}

      {windows &&
        [-1, 0, 1].map((i) => (
          <Window
            key={i}
            position={[
              i * Math.min(1.05, length / 3.5),
              radius + 0.55,
              radius + 0.015,
            ]}
            width={0.52}
          />
        ))}

      <Foundation width={length + 0.3} depth={radius * 2.5} />
    </group>
  );
}

function InflatableModule({
  position = [0, 0, 0],
  radius = 1.7,
}) {
  return (
    <group position={position}>
      <mesh position={[0, radius * 0.72, 0]} castShadow>
        <sphereGeometry args={[radius, 32, 20]} />
        <meshStandardMaterial
          color={COLORS.ceramic}
          roughness={0.88}
        />
      </mesh>

      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <Ring
            key={i}
            position={[0, radius * 0.72, 0]}
            rotation={[0, angle, 0]}
            radius={radius + 0.025}
            thickness={0.025}
            color={COLORS.frame}
          />
        );
      })}

      <Ring
        position={[0, radius * 0.72, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={radius + 0.025}
      />

      <Foundation width={radius * 2.2} depth={radius * 2.2} />
    </group>
  );
}

function GeodesicDome({
  position = [0, 0, 0],
  radius = 3,
}) {
  const edges = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(radius, 2);
    const wire = new THREE.EdgesGeometry(geometry, 10);
    geometry.dispose();
    return wire;
  }, [radius]);

  return (
    <group position={position}>
      <mesh position={[0, radius * 0.4, 0]} castShadow>
        <sphereGeometry
          args={[radius, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color={COLORS.shellLight}
          metalness={0.22}
          roughness={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments
        geometry={edges}
        position={[0, radius * 0.4, 0]}
      >
        <lineBasicMaterial color={COLORS.frame} />
      </lineSegments>

      <mesh position={[0, radius * 0.4, 0]}>
        <sphereGeometry args={[radius * 0.97, 24, 16]} />
        <meshStandardMaterial
          color={COLORS.glass}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.32, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.55, 40]} />
        <meshStandardMaterial color={COLORS.foundation} />
      </mesh>

      <Antenna
        position={[0, radius * 1.38, 0]}
        height={1.1}
      />
    </group>
  );
}

function UtilityNetwork({ size = 4, advanced = false }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Tube
            a={[-size, 0.45, side * 2.4]}
            b={[size, 0.45, side * 2.4]}
            radius={advanced ? 0.11 : 0.075}
            color={COLORS.orange}
          />
          <Tube
            a={[-size, 0.7, side * 2.65]}
            b={[size, 0.7, side * 2.65]}
            radius={0.055}
          />
          {[-size + 1, 0, size - 1].map((x) => (
            <group key={x}>
              <Tube
                a={[x, 0.25, side * 2.4]}
                b={[x, 0.85, side * 2.4]}
                radius={0.045}
              />
              <Part
                position={[x, 0.4, side * 2.4]}
                size={[0.3, 0.16, 0.3]}
                color={COLORS.frame}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function ServiceEquipment({ advanced = false }) {
  return (
    <group>
      <PressureTank position={[-2.5, 1.1, -2.6]} scale={0.8} />
      <PressureTank position={[-1.65, 1.1, -2.6]} scale={0.8} />
      <Part
        position={[2.5, 0.9, -2.6]}
        size={[1.1, 1.5, 0.9]}
        color={COLORS.frame}
      />
      <Part
        position={[2.5, 1.72, -2.6]}
        size={[1.25, 0.12, 1.05]}
        color={COLORS.shellLight}
      />
      <Tube
        a={[-2.5, 1.9, -2.6]}
        b={[-2.5, 2.2, -1.5]}
        color={COLORS.orange}
      />
      {advanced && (
        <>
          <PressureTank position={[3.4, 1.2, 2.7]} />
          <Antenna position={[3.1, 1.5, -2.5]} height={2.5} />
          <Part
            position={[-3.4, 1.1, 2.7]}
            size={[1.2, 1.7, 1]}
            color={COLORS.dark}
          />
          {Array.from({ length: 5 }, (_, i) => (
            <Part
              key={i}
              position={[-3.4, 0.55 + i * 0.22, 3.22]}
              size={[0.9, 0.065, 0.05]}
              color={COLORS.glassLight}
            />
          ))}
        </>
      )}
    </group>
  );
}

export default function HabitatModel({ level = 1 }) {
  const stage = Math.max(1, Math.min(15, level));

  // Stage 1: Pioneer pressurized habitation.
  if (stage <= 3) {
    return (
      <group>
        <CylinderModule
          length={3.2 + (stage - 1) * 0.8}
        />
        <Airlock position={[0, 0, 1.65]} />
        <ServiceEquipment />
        {stage >= 2 && (
          <PressureTank position={[2.5, 1.1, 1.8]} />
        )}
        {stage >= 3 && (
          <Antenna position={[-2, 1.6, 0]} height={2} />
        )}
      </group>
    );
  }

  // Stage 2: Inflatable residential expansion.
  if (stage <= 6) {
    return (
      <group>
        <CylinderModule length={4.5} />
        <InflatableModule
          position={[-2.7, 0, -1.8]}
          radius={1.45}
        />
        <InflatableModule
          position={[2.7, 0, -1.8]}
          radius={1.45}
        />
        <Airlock position={[0, 0, 1.8]} />
        <UtilityNetwork size={3} />
        <ServiceEquipment advanced />
        {stage >= 5 && (
          <InflatableModule
            position={[0, 0, -3.2]}
            radius={1.5}
          />
        )}
        {stage >= 6 && (
          <CylinderModule
            position={[0, 0, -4.6]}
            length={3.3}
            radius={0.8}
          />
        )}
      </group>
    );
  }

  // Stage 3: Geodesic settlement.
  if (stage <= 9) {
    return (
      <group>
        <GeodesicDome radius={2.8} />
        <CylinderModule
          position={[-3.2, 0, 0]}
          length={3.2}
        />
        <CylinderModule
          position={[3.2, 0, 0]}
          length={3.2}
        />
        <Airlock position={[0, 0, 3]} />
        <UtilityNetwork size={4.5} advanced />
        <ServiceEquipment advanced />
        {stage >= 8 && (
          <InflatableModule
            position={[0, 0, -3.6]}
            radius={1.7}
          />
        )}
        {stage >= 9 && (
          <Antenna position={[4.2, 2, -1.5]} height={3.5} />
        )}
      </group>
    );
  }

  // Stage 4: Integrated residential complex.
  if (stage <= 12) {
    return (
      <group>
        <GeodesicDome radius={3.1} />
        <CylinderModule
          position={[-3.5, 0, 0]}
          length={3.8}
        />
        <CylinderModule
          position={[3.5, 0, 0]}
          length={3.8}
        />
        <InflatableModule
          position={[0, 0, -3.6]}
          radius={1.7}
        />
        <Airlock position={[0, 0, 3.2]} />
        <UtilityNetwork size={5} advanced />
        <ServiceEquipment advanced />
        <Antenna position={[4.2, 2, -2]} height={3.5} />
        {stage >= 11 && (
          <CylinderModule
            position={[0, 0, 4]}
            length={3}
            radius={0.85}
          />
        )}
        {stage >= 12 && (
          <InflatableModule
            position={[-3.5, 0, -3.3]}
            radius={1.4}
          />
        )}
      </group>
    );
  }

  // Stage 5: Advanced frontier arcology.
  return (
    <group>
      <GeodesicDome radius={3.6} />

      {[-1, 1].map((side) => (
        <group key={side}>
          <CylinderModule
            position={[side * 4, 0, 0]}
            length={4.2}
          />
          <InflatableModule
            position={[side * 3.5, 0, -3.4]}
            radius={1.65}
          />
          <Antenna
            position={[side * 5, 2, -2]}
            height={stage >= 15 ? 4 : 3}
          />
        </group>
      ))}

      <CylinderModule
        position={[0, 0, 4.2]}
        length={3.2}
        radius={0.95}
      />
      <Airlock position={[0, 0, 6]} />
      <UtilityNetwork size={5.6} advanced />
      <ServiceEquipment advanced />

      {stage >= 14 && (
        <InflatableModule
          position={[0, 0, -4.4]}
          radius={2}
        />
      )}

      {stage >= 15 && (
        <>
          <GeodesicDome
            position={[0, 0, -6]}
            radius={2.3}
          />
          <Antenna position={[0, 5, 0]} height={4} />
        </>
      )}
    </group>
  );
}
