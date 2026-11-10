import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PALETTE } from "./palette";

export function Block({
  p = [0, 0, 0],
  s = [1, 1, 1],
  r = [0, 0, 0],
  color = PALETTE.shell,
  metal = false,
  glow = false,
  shadow = true,
}) {
  return (
    <mesh position={p} rotation={r} castShadow={shadow} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={color}
        metalness={metal ? 0.65 : 0.18}
        roughness={metal ? 0.4 : 0.76}
        emissive={glow ? color : "#000000"}
        emissiveIntensity={glow ? 0.45 : 0}
      />
    </mesh>
  );
}

export function Cylinder({
  p = [0, 0, 0],
  radius = 0.5,
  height = 1,
  r = [0, 0, 0],
  color = PALETTE.shell,
  top = radius,
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <cylinderGeometry args={[top, radius, height, 20]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.58} />
    </mesh>
  );
}

export function Beam({ a, b, radius = 0.035, color = PALETTE.frame }) {
  const transform = useMemo(() => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    return {
      length: direction.length(),
      middle: start.add(end).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
      ),
    };
  }, [a, b]);
  if (transform.length < 0.0001) return null;
  return (
    <mesh
      position={transform.middle}
      quaternion={transform.quaternion}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, transform.length, 8]} />
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.45} />
    </mesh>
  );
}

export function Pipe({ points, color = PALETTE.copper, radius = 0.045 }) {
  return (
    <group>
      {points.slice(1).map((point, i) => (
        <Beam key={i} a={points[i]} b={point} radius={radius} color={color} />
      ))}
    </group>
  );
}

export function Ring({
  p,
  radius,
  tube = 0.035,
  r = [Math.PI / 2, 0, 0],
  color = PALETTE.dark,
}) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <torusGeometry args={[radius, tube, 6, 32]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.5} />
    </mesh>
  );
}

export function Base({ accent, level, max = 15 }) {
  return (
    <group name="building-foundation">
      <Block p={[0, 0.12, 0]} s={[6.6, 0.24, 6.6]} color={PALETTE.base} />
      <Block p={[0, 0.26, 0]} s={[6.35, 0.08, 6.35]} color={PALETTE.dust} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <Block
            key={`${x}-${z}`}
            p={[x * 3, 0.33, z * 3]}
            s={[0.4, 0.12, 0.4]}
            color={PALETTE.dark}
          />
        )),
      )}
      <Block
        p={[0, 0.32, 3.05]}
        s={[2.8, 0.025, 0.13]}
        color={accent}
        shadow={false}
      />
      {/* One illuminated upgrade marker for every supported level. */}
      {Array.from({ length: max }, (_, i) => (
        <Block
          key={i}
          p={[-1.35 + (i * 2.7) / (max - 1), 0.38, 3.12]}
          s={[0.105, 0.055, 0.08]}
          color={i < level ? accent : PALETTE.dark}
          glow={i < level}
          shadow={false}
        />
      ))}
    </group>
  );
}

export function Airlock({ p = [0, 0.3, 2], accent, scale = 1 }) {
  return (
    <group position={p} scale={scale}>
      <Block p={[0, 0.78, 0]} s={[1.12, 1.55, 0.7]} color={PALETTE.dark} />
      <Block p={[0, 0.78, 0.37]} s={[0.88, 1.3, 0.08]} color={PALETTE.light} />
      <Block p={[0, 1.05, 0.42]} s={[0.52, 0.3, 0.025]} color={PALETTE.glass} />
      <Block p={[0.32, 0.67, 0.44]} s={[0.05, 0.24, 0.04]} color={accent} />
      <Block p={[0, 1.48, 0.42]} s={[0.66, 0.055, 0.025]} color={accent} glow />
      <Block p={[0, 0.06, 0.65]} s={[1.3, 0.12, 0.75]} color={PALETTE.frame} />
      <Block p={[0, 0.025, 1.02]} s={[1.45, 0.05, 0.25]} color={PALETTE.dark} />
    </group>
  );
}

export function Tank({
  p = [0, 0.3, 0],
  radius = 0.42,
  height = 1.5,
  accent = PALETTE.water,
}) {
  return (
    <group position={p}>
      <Cylinder p={[0, height / 2 + 0.1, 0]} radius={radius} height={height} />
      <Cylinder
        p={[0, height + 0.13, 0]}
        radius={radius * 0.9}
        height={0.14}
        color={PALETTE.dark}
      />
      {[0.2, height * 0.72].map((y) => (
        <Cylinder
          key={y}
          p={[0, y, 0]}
          radius={radius + 0.025}
          height={0.09}
          color={accent}
        />
      ))}
      <Block
        p={[0, height * 0.55, radius + 0.02]}
        s={[0.12, height * 0.4, 0.035]}
        color={PALETTE.dark}
      />
      <Block
        p={[0, height * 0.55, radius + 0.045]}
        s={[0.055, height * 0.28, 0.015]}
        color={accent}
        glow
        shadow={false}
      />
      <Pipe
        points={[
          [0, height + 0.23, 0],
          [radius + 0.15, height + 0.23, 0],
          [radius + 0.15, 0.22, 0],
        ]}
        color={accent}
      />
    </group>
  );
}

export function Radiator({ p, r = [0, 0, 0], width = 1.5, height = 1 }) {
  return (
    <group position={p} rotation={r}>
      <Block
        p={[0, height / 2, 0]}
        s={[width, height, 0.15]}
        color={PALETTE.dark}
      />
      {Array.from({ length: 8 }, (_, i) => (
        <Block
          key={i}
          p={[-width * 0.43 + (i * width * 0.86) / 7, height / 2, 0.13]}
          s={[width / 16, height * 0.9, 0.16]}
          color={PALETTE.frame}
          metal
        />
      ))}
    </group>
  );
}

export function Vent({ p, width = 0.7, accent = PALETTE.frame }) {
  return (
    <group position={p}>
      <Block s={[width, 0.6, 0.35]} color={PALETTE.dark} />
      {[0, 1, 2, 3].map((i) => (
        <Block
          key={i}
          p={[0, -0.2 + i * 0.13, 0.2]}
          s={[width * 0.85, 0.04, 0.1]}
          color={accent}
        />
      ))}
    </group>
  );
}

export function WindowBand({ p, width = 2, accent, r = [0, 0, 0] }) {
  return (
    <group position={p} rotation={r}>
      <Block s={[width + 0.08, 0.46, 0.08]} color={PALETTE.dark} />
      <Block p={[0, 0, 0.05]} s={[width, 0.32, 0.025]} color={PALETTE.glass} />
      {[-0.3, 0, 0.3].map((x) => (
        <Block
          key={x}
          p={[x * width, 0, 0.075]}
          s={[0.035, 0.35, 0.02]}
          color={PALETTE.frame}
        />
      ))}
      <Block
        p={[0, -0.2, 0.06]}
        s={[width, 0.035, 0.02]}
        color={accent}
        shadow={false}
      />
    </group>
  );
}

export function Glass({ p, s, r = [0, 0, 0], color = "#73b4b9" }) {
  return (
    <mesh position={p} rotation={r}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.24}
        depthWrite={false}
        roughness={0.28}
        metalness={0.12}
      />
    </mesh>
  );
}

// One draw call for repeated crops, photovoltaic cells, or ore blocks.
export function Instances({ parts, color, metal = false, shape = "box" }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    const dummy = new THREE.Object3D();
    parts.forEach(({ p, s, r = [0, 0, 0] }, i) => {
      dummy.position.set(...p);
      dummy.scale.set(...s);
      dummy.rotation.set(...r);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [parts]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, parts.length]}
      receiveShadow
    >
      {shape === "leaf" ? (
        <sphereGeometry args={[0.5, 8, 6]} />
      ) : shape === "ore" ? (
        <dodecahedronGeometry args={[0.6, 0]} />
      ) : (
        <boxGeometry />
      )}
      <meshStandardMaterial
        color={color}
        metalness={metal ? 0.6 : 0.05}
        roughness={metal ? 0.38 : 0.9}
      />
    </instancedMesh>
  );
}
