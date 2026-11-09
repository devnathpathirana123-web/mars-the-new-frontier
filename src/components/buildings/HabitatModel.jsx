
import { useMemo } from "react";
import * as THREE from "three";

// MARS: THE NEW FRONTIER — habitat visuals, levels 1–15.
// Ground plane is y = 0. Geometry stays above the terrain.
const C = {
  shell: "#d5d2c7", light: "#ece9df", ceramic: "#c4b9a5",
  frame: "#78858a", dark: "#35464e", glass: "#244d64",
  highlight: "#6babbc", pipe: "#b5a79a", orange: "#db8854",
  foundation: "#50575b", rubber: "#30383b",
};

function Box({ position = [0, 0, 0], rotation = [0, 0, 0], size = [1, 1, 1], color = C.shell }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} metalness={0.35} roughness={0.48} />
  </mesh>;
}

function Tube({ a, b, radius = 0.06, color = C.pipe }) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start);
  const middle = start.clone().add(end).multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), direction.clone().normalize()
  );
  return <mesh position={middle.toArray()} quaternion={rotation} castShadow>
    <cylinderGeometry args={[radius, radius, direction.length(), 10]} />
    <meshStandardMaterial color={color} metalness={0.65} roughness={0.35} />
  </mesh>;
}

function Ring({ radius = 1.25, thickness = 0.05, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return <mesh position={position} rotation={rotation} castShadow>
    <torusGeometry args={[radius, thickness, 8, 32]} />
    <meshStandardMaterial color={C.frame} metalness={0.65} roughness={0.4} />
  </mesh>;
}

function Foundation({ width = 5, depth = 5 }) {
  return <group>
    <Box position={[0, 0.12, 0]} size={[width, 0.24, depth]} color={C.foundation} />
    {[-1, 1].flatMap(x => [-1, 1].map(z =>
      <group key={`${x}-${z}`} position={[x * width / 2.3, 0.4, z * depth / 2.3]}>
        <Box size={[0.28, 0.6, 0.28]} color={C.frame} />
        <Box position={[0, -0.26, 0]} size={[0.65, 0.1, 0.65]} color={C.rubber} />
      </group>
    ))}
  </group>;
}

function Antenna({ position = [0, 0, 0], height = 2 }) {
  return <group position={position}>
    <Tube a={[0, 0, 0]} b={[0, height, 0]} radius={0.045} />
    <Tube a={[-0.3, height * 0.7, 0]} b={[0.3, height * 0.7, 0]} radius={0.025} />
    <mesh position={[0, height, 0]}>
      <sphereGeometry args={[0.13, 12, 8]} />
      <meshStandardMaterial color={C.orange} emissive="#9b4e22" emissiveIntensity={0.5} />
    </mesh>
  </group>;
}

function Airlock({ position = [0, 0, 0] }) {
  return <group position={position}>
    <Box position={[0, 1.12, 0]} size={[1.35, 2.15, 0.65]} color={C.frame} />
    <Box position={[0, 1.12, 0.38]} size={[1.05, 1.85, 0.1]} color={C.light} />
    <Box position={[0, 1.2, 0.45]} size={[0.55, 0.48, 0.04]} color={C.glass} />
    <Box position={[0.42, 0.85, 0.47]} size={[0.07, 0.32, 0.07]} color={C.orange} />
    <Box position={[0, 0.12, 0.6]} size={[1.6, 0.16, 0.9]} color={C.foundation} />
  </group>;
}

function Tank({ position = [0, 0, 0], scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.8, 0]} castShadow>
      <cylinderGeometry args={[0.34, 0.34, 1.6, 16]} />
      <meshStandardMaterial color={C.light} metalness={0.55} roughness={0.38} />
    </mesh>
    {[0.22, 1.38].map(y => <mesh key={y} position={[0, y, 0]} castShadow>
      <cylinderGeometry args={[0.38, 0.38, 0.12, 16]} />
      <meshStandardMaterial color={C.frame} />
    </mesh>)}
    <Tube a={[0, 1.65, 0]} b={[0.45, 1.65, 0]} color={C.orange} />
  </group>;
}

function CylinderModule({ position = [0, 0, 0], length = 4, radius = 1.15 }) {
  const cy = radius + 0.35;
  const rings = Math.max(3, Math.ceil(length / 0.65));
  return <group position={position}>
    <mesh position={[0, cy, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 32]} />
      <meshStandardMaterial color={C.shell} metalness={0.3} roughness={0.62} />
    </mesh>
    {Array.from({ length: rings }, (_, i) =>
      <Ring key={i} position={[-length / 2 + i * length / (rings - 1), cy, 0]}
        rotation={[0, Math.PI / 2, 0]} radius={radius + 0.035} />
    )}
    {[-1, 1].map(side => <group key={side}>
      <Tube a={[-length / 2, 0.45, side * (radius + 0.12)]}
        b={[length / 2, 0.45, side * (radius + 0.12)]} color={C.orange} />
      <Tube a={[-length / 2, 0.72, side * (radius + 0.08)]}
        b={[length / 2, 0.72, side * (radius + 0.08)]} radius={0.045} />
    </group>)}
    {[-1, 0, 1].map(i => <group key={i} position={[i * Math.min(1.05, length / 3.5), radius + 0.55, radius + 0.015]}>
      <Box size={[0.68, 0.58, 0.12]} color={C.dark} />
      <Box position={[0, 0, 0.075]} size={[0.52, 0.42, 0.035]} color={C.glass} />
      <Box position={[0, 0, 0.1]} size={[0.035, 0.42, 0.02]} color={C.frame} />
      <Box position={[0, 0, 0.105]} size={[0.39, 0.025, 0.02]} color={C.highlight} />
    </group>)}
    <Foundation width={length + 0.3} depth={radius * 2.5} />
  </group>;
}

function InflatableModule({ position = [0, 0, 0], radius = 1.7 }) {
  // Raise the sphere so no lower hemisphere or wireframe sinks beneath the terrain.
  const cy = radius + 0.24;
  return <group position={position}>
    <mesh position={[0, cy, 0]} castShadow receiveShadow>
      <sphereGeometry args={[radius, 32, 20]} />
      <meshStandardMaterial color={C.ceramic} roughness={0.88} />
    </mesh>
    {Array.from({ length: 12 }, (_, i) =>
      <Ring key={i} position={[0, cy, 0]} rotation={[0, i * Math.PI / 6, 0]}
        radius={radius + 0.025} thickness={0.025} />
    )}
    <Ring position={[0, cy, 0]} rotation={[Math.PI / 2, 0, 0]} radius={radius + 0.025} />
    <Foundation width={radius * 2.2} depth={radius * 2.2} />
  </group>;
}

function GeodesicDome({ position = [0, 0, 0], radius = 3 }) {
  // CRITICAL FIX: Both the shell and the structural wireframe are hemispheres.
  // The old full-icosahedron wireframe extended below ground.
  const wire = useMemo(() => {
    const halfSphere = new THREE.SphereGeometry(
      radius + 0.025, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2
    );
    const edges = new THREE.EdgesGeometry(halfSphere, 24);
    halfSphere.dispose();
    return edges;
  }, [radius]);
  return <group position={position}>
    <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
      <sphereGeometry args={[radius, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={C.light} metalness={0.22} roughness={0.55} side={THREE.DoubleSide} />
    </mesh>
    <lineSegments geometry={wire} position={[0, 0.6, 0]}>
      <lineBasicMaterial color={C.frame} />
    </lineSegments>
    <mesh position={[0, 0.6, 0]}>
      <sphereGeometry args={[radius * 0.99, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={C.glass} transparent opacity={0.06}
        depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.32, 0]} receiveShadow>
      <cylinderGeometry args={[radius, radius, 0.55, 40]} />
      <meshStandardMaterial color={C.foundation} />
    </mesh>
    <Antenna position={[0, radius + 0.6, 0]} height={1.1} />
  </group>;
}

function Utilities({ size = 4, advanced = false }) {
  return <group>
    {[-1, 1].map(side => <group key={side}>
      <Tube a={[-size, 0.45, side * 2.4]} b={[size, 0.45, side * 2.4]}
        radius={advanced ? 0.11 : 0.075} color={C.orange} />
      <Tube a={[-size, 0.7, side * 2.65]} b={[size, 0.7, side * 2.65]} />
      {[-size + 1, 0, size - 1].map(x => <group key={x}>
        <Tube a={[x, 0.25, side * 2.4]} b={[x, 0.85, side * 2.4]} radius={0.045} />
        <Box position={[x, 0.4, side * 2.4]} size={[0.3, 0.16, 0.3]} color={C.frame} />
      </group>)}
    </group>)}
  </group>;
}

function Equipment({ advanced = false }) {
  return <group>
    <Tank position={[-2.5, 0.2, -2.6]} scale={0.8} />
    <Tank position={[-1.65, 0.2, -2.6]} scale={0.8} />
    <Box position={[2.5, 0.9, -2.6]} size={[1.1, 1.5, 0.9]} color={C.frame} />
    <Box position={[2.5, 1.72, -2.6]} size={[1.25, 0.12, 1.05]} color={C.light} />
    <Tube a={[-2.5, 1.9, -2.6]} b={[-2.5, 2.2, -1.5]} color={C.orange} />
    {advanced && <>
      <Tank position={[3.4, 0.2, 2.7]} />
      <Antenna position={[3.1, 1.5, -2.5]} height={2.5} />
      <Box position={[-3.4, 1.1, 2.7]} size={[1.2, 1.7, 1]} color={C.dark} />
      {Array.from({ length: 5 }, (_, i) =>
        <Box key={i} position={[-3.4, 0.55 + i * 0.22, 3.22]}
          size={[0.9, 0.065, 0.05]} color={C.highlight} />
      )}
    </>}
  </group>;
}

export default function HabitatModel({ level = 1 }) {
  const stage = Math.max(1, Math.min(15, level));
  if (stage <= 3) return <group>
    <CylinderModule length={3.2 + (stage - 1) * 0.8} />
    <Airlock position={[0, 0, 1.65]} />
    <Equipment />
    {stage >= 2 && <Tank position={[2.5, 0.2, 1.8]} />}
    {stage >= 3 && <Antenna position={[-2, 1.6, 0]} height={2} />}
  </group>;

  if (stage <= 6) return <group>
    <CylinderModule length={4.5} />
    <InflatableModule position={[-2.7, 0, -1.8]} radius={1.45} />
    <InflatableModule position={[2.7, 0, -1.8]} radius={1.45} />
    <Airlock position={[0, 0, 1.8]} />
    <Utilities size={3} />
    <Equipment advanced />
    {stage >= 5 && <InflatableModule position={[0, 0, -3.2]} radius={1.5} />}
    {stage >= 6 && <CylinderModule position={[0, 0, -4.6]} length={3.3} radius={0.8} />}
  </group>;

  if (stage <= 9) return <group>
    <GeodesicDome radius={2.8} />
    <CylinderModule position={[-3.2, 0, 0]} length={3.2} />
    <CylinderModule position={[3.2, 0, 0]} length={3.2} />
    <Airlock position={[0, 0, 3]} />
    <Utilities size={4.5} advanced />
    <Equipment advanced />
    {stage >= 8 && <InflatableModule position={[0, 0, -3.6]} radius={1.7} />}
    {stage >= 9 && <Antenna position={[4.2, 2, -1.5]} height={3.5} />}
  </group>;

  if (stage <= 12) return <group>
    <GeodesicDome radius={3.1} />
    <CylinderModule position={[-3.5, 0, 0]} length={3.8} />
    <CylinderModule position={[3.5, 0, 0]} length={3.8} />
    <InflatableModule position={[0, 0, -3.6]} radius={1.7} />
    <Airlock position={[0, 0, 3.2]} />
    <Utilities size={5} advanced />
    <Equipment advanced />
    <Antenna position={[4.2, 2, -2]} height={3.5} />
    {stage >= 11 && <CylinderModule position={[0, 0, 4]} length={3} radius={0.85} />}
    {stage >= 12 && <InflatableModule position={[-3.5, 0, -3.3]} radius={1.4} />}
  </group>;

  return <group>
    <GeodesicDome radius={3.6} />
    {[-1, 1].map(side => <group key={side}>
      <CylinderModule position={[side * 4, 0, 0]} length={4.2} />
      <InflatableModule position={[side * 3.5, 0, -3.4]} radius={1.65} />
      <Antenna position={[side * 5, 2, -2]} height={stage >= 15 ? 4 : 3} />
    </group>)}
    <CylinderModule position={[0, 0, 4.2]} length={3.2} radius={0.95} />
    <Airlock position={[0, 0, 6]} />
    <Utilities size={5.6} advanced />
    <Equipment advanced />
    {stage >= 14 && <InflatableModule position={[0, 0, -4.4]} radius={2} />}
    {stage >= 15 && <>
      <GeodesicDome position={[0, 0, -6]} radius={2.3} />
      <Antenna position={[0, 5, 0]} height={4} />
    </>}
  </group>;
}
