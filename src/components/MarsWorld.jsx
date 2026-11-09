
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

// ==========================================
// TERRAIN GENERATION
// ==========================================

function terrainHeight(x, z) {
  return (
    Math.sin(x * 0.07) * 0.45 +
    Math.cos(z * 0.06) * 0.35 +
    Math.sin((x + z) * 0.035) * 0.25 -
    0.35
  );
}

function MarsGround() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      300,
      300,
      160,
      160
    );

    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = [];

    const soil = new THREE.Color("#92503b");
    const darkerSoil = new THREE.Color("#623c32");
    const lighterSoil = new THREE.Color("#b87350");

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const height = terrainHeight(x, z);
      positions.setY(i, height);

      const variation =
        Math.sin(x * 0.13) *
        Math.cos(z * 0.11);

      const color = soil.clone();

      if (variation > 0.25) {
        color.lerp(lighterSoil, 0.3);
      } else if (variation < -0.25) {
        color.lerp(darkerSoil, 0.3);
      }

      colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    positions.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }, []);

  return (
    <group>
      <mesh
        geometry={geometry}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={1}
        />
      </mesh>

      {/* Surface rocks */}
      {Array.from({ length: 110 }, (_, i) => {
        const x = Math.sin(i * 17.3) * 45;
        const z = Math.cos(i * 9.7) * 45;
        const scale = 0.15 + (i % 5) * 0.09;

        return (
          <mesh
            key={i}
            position={[
              x,
              terrainHeight(x, z) + scale * 0.45,
              z,
            ]}
            rotation={[i, i * 0.7, i * 0.3]}
            scale={[scale * 1.4, scale, scale]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[1, 0]} />

            <meshStandardMaterial
              color={
                i % 3 === 0
                  ? "#684034"
                  : "#a36349"
              }
              roughness={1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ==========================================
// HABITAT STRUCTURE
// ==========================================

function StructuralRings() {
  return (
    <>
      {[-2.5, -1.6, -0.7, 0.2, 1.1, 2].map((x) => (
        <mesh
          key={x}
          position={[x, 2, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <torusGeometry args={[1.48, 0.055, 10, 48]} />

          <meshStandardMaterial
            color="#626b70"
            metalness={0.8}
            roughness={0.35}
          />
        </mesh>
      ))}
    </>
  );
}

function Windows() {
  return (
    <>
      {[-2, -0.7, 0.7, 2].map((x) => (
        <group key={x} position={[x, 2.25, 1.36]}>
          <mesh>
            <cylinderGeometry
              args={[0.25, 0.25, 0.12, 32]}
            />

            <meshStandardMaterial
              color="#343b40"
              metalness={0.7}
            />
          </mesh>

          <mesh position={[0, 0, 0.07]}>
            <circleGeometry args={[0.19, 32]} />

            <meshPhysicalMaterial
              color="#8dbbc9"
              metalness={0.25}
              roughness={0.12}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SolarArray({ position, rotation = 0 }) {
  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
    >
      <mesh
        position={[0, 0.8, 0]}
        castShadow
      >
        <boxGeometry args={[0.12, 1.6, 0.12]} />

        <meshStandardMaterial
          color="#62666a"
          metalness={0.7}
        />
      </mesh>

      <mesh
        position={[0, 1.65, 0]}
        rotation={[-0.25, 0, 0]}
        castShadow
      >
        <boxGeometry args={[3.8, 0.08, 2.3]} />

        <meshStandardMaterial
          color="#172f4d"
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>

      {[-1.25, -0.42, 0.42, 1.25].map((x) => (
        <mesh
          key={x}
          position={[x, 1.72, 0]}
          rotation={[-0.25, 0, 0]}
        >
          <boxGeometry args={[0.035, 0.015, 2.3]} />

          <meshStandardMaterial color="#91a9ba" />
        </mesh>
      ))}
    </group>
  );
}

function Airlock() {
  return (
    <group position={[3.8, 0, 0]}>
      <mesh
        position={[0, 1.2, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.85, 0.95, 2.4, 24]}
        />

        <meshStandardMaterial
          color="#899397"
          metalness={0.45}
          roughness={0.65}
        />
      </mesh>

      <mesh position={[0, 2.45, 0]}>
        <cylinderGeometry
          args={[0.85, 0.85, 0.12, 24]}
        />

        <meshStandardMaterial
          color="#525b60"
          metalness={0.7}
        />
      </mesh>

      <mesh position={[0, 1.05, 0.92]}>
        <boxGeometry args={[0.9, 1.5, 0.12]} />

        <meshStandardMaterial
          color="#3d464a"
          metalness={0.5}
        />
      </mesh>

      <mesh position={[0, 1.95, 1]}>
        <boxGeometry args={[0.25, 0.08, 0.04]} />

        <meshStandardMaterial
          color="#e5a45d"
          emissive="#e5a45d"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

function Habitat() {
  return (
    <group>
      {/* Main pressurised module */}
      <mesh
        position={[0, 2, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[1.45, 4.8, 8, 32]} />

        <meshStandardMaterial
          color="#b8b9b4"
          metalness={0.45}
          roughness={0.55}
        />
      </mesh>

      <StructuralRings />
      <Windows />
      <Airlock />

      {/* Foundation supports */}
      {[-2, 0, 2].map((x) => (
        <mesh
          key={x}
          position={[x, 0.35, 0]}
          castShadow
        >
          <boxGeometry args={[0.35, 0.7, 0.35]} />

          <meshStandardMaterial
            color="#53585b"
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* External equipment */}
      {[-2.8, -1.7, 1.7].map((x) => (
        <mesh
          key={x}
          position={[x, 0.55, -1.5]}
          castShadow
        >
          <boxGeometry args={[0.7, 0.9, 0.65]} />

          <meshStandardMaterial
            color="#777e80"
            metalness={0.55}
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* Solar infrastructure */}
      <SolarArray position={[-6, 0, 0]} />
      <SolarArray
        position={[6, 0, 0]}
        rotation={Math.PI}
      />
    </group>
  );
}

// ==========================================
// MAIN SCENE
// ==========================================

function Scene() {
  return (
    <>
      <color attach="background" args={["#17191d"]} />

      <fog attach="fog" args={["#9b6651", 65, 170]} />

      <ambientLight intensity={0.55} />

      <directionalLight
        position={[35, 50, 25]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <MarsGround />
      <Habitat />

      <ContactShadows
        position={[0, 0.025, 0]}
        opacity={0.5}
        scale={28}
        blur={2.5}
        far={10}
      />

      <Stars
        radius={180}
        depth={50}
        count={1000}
        factor={2}
        fade
      />

      <OrbitControls
        makeDefault
        minDistance={8}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.12}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

// ==========================================
// EXPORTED WORLD
// ==========================================

export default function MarsWorld() {
  return (
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
      <Scene />
    </Canvas>
  );
}
