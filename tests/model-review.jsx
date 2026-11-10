import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Habitat from "../src/components/buildings/HabitatModel";
import Greenhouse from "../src/components/buildings/GreenhouseModel";
import Research from "../src/components/buildings/ResearchModel";
import Mine from "../src/components/buildings/MineModel";
import Water from "../src/components/buildings/WaterModel";
import Solar from "../src/components/buildings/SolarModel";
import CompactBuildingModel from "../src/components/buildings/shared/CompactBuildingModel";

function Oversized() {
  return (
    <mesh position={[9, -2, 10]}>
      <boxGeometry args={[25, 4, 30]} />
      <meshStandardMaterial />
    </mesh>
  );
}
const models = { Habitat, Greenhouse, Research, Mine, Water, Solar, Oversized };
function TestClock() {
  useFrame(({ clock }) => {
    if (Number.isFinite(window.modelTime)) clock.elapsedTime = window.modelTime;
  }, -100);
  return null;
}
const maxima = {
  Habitat: 15,
  Greenhouse: 10,
  Research: 15,
  Mine: 15,
  Water: 15,
  Solar: 10,
};

function Inspect({ name, level, animated }) {
  const ref = useRef(null);
  const Model = models[name];
  useLayoutEffect(() => {
    ref.current.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(ref.current);
    let meshes = 0;
    let triangles = 0;
    let signature = "";
    ref.current.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      const g = o.geometry;
      triangles +=
        ((g.index ? g.index.count : g.attributes.position.count) / 3) *
        (o.isInstancedMesh ? o.count : 1);
      // Upgrade indicators must not make an unchanged building pass progression checks.
      let parent = o.parent;
      while (parent) {
        if (parent.name === "building-foundation") return;
        parent = parent.parent;
      }
      signature += JSON.stringify([
        g.type,
        g.parameters,
        o.position.toArray(),
        o.scale.toArray(),
        o.material.color?.getHex(),
        o.count,
      ]);
    });
    window.modelReport = {
      name,
      level,
      min: box.min.toArray(),
      max: box.max.toArray(),
      meshes,
      triangles,
      signature,
    };
  }, [name, level, animated]);
  useFrame(() => {
    if (ref.current) {
      const box = new THREE.Box3().setFromObject(ref.current);
      window.animatedBounds = {
        min: box.min.toArray(),
        max: box.max.toArray(),
      };
    }
  });
  return (
    <group ref={ref}>
      <TestClock />
      <CompactBuildingModel Model={Model} level={level} animated={animated} />
    </group>
  );
}

export default function Review() {
  const [name, setName] = useState("Habitat");
  const [level, setLevel] = useState(15);
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    window.reviewModel = (nextName, nextLevel, motion = false) => {
      window.modelReport = null;
      setName(nextName);
      setLevel(nextLevel);
      setAnimated(motion);
    };
    return () => {
      delete window.reviewModel;
    };
  }, []);
  return (
    <main
      style={{
        background: "#171e22",
        color: "#e7e1d5",
        minHeight: "100vh",
        fontFamily: "system-ui",
      }}
    >
      <header
        style={{
          padding: "20px 32px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ letterSpacing: 5, color: "#ca926c", fontSize: 11 }}>
            MARS / THE NEW FRONTIER
          </div>
          <h1 style={{ margin: "8px 0", fontSize: 27, fontWeight: 500 }}>
            {name}{" "}
            <span style={{ color: "#93a2a6", fontSize: 17 }}>
              {" "}
              · Level {level}
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <select
            aria-label="Building"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLevel(Math.min(level, maxima[e.target.value]));
            }}
          >
            {Object.keys(maxima).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <input
            aria-label="Level"
            type="number"
            min="1"
            max={maxima[name]}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            style={{ width: 48 }}
          />
          <label>
            <input
              aria-label="Animate"
              type="checkbox"
              checked={animated}
              onChange={(e) => setAnimated(e.target.checked)}
            />{" "}
            Animate
          </label>
        </div>
      </header>
      <div style={{ height: "calc(100vh - 115px)" }}>
        <Canvas
          shadows
          camera={{ position: [10, 8.5, 11], fov: 36 }}
          dpr={1}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ camera }) => camera.lookAt(0, 1.4, 0)}
        >
          <color attach="background" args={["#171e22"]} />
          <ambientLight intensity={1.3} />
          <hemisphereLight args={["#c7e2ef", "#806047", 1.4]} />
          <directionalLight
            position={[-4, 9, 6]}
            intensity={3}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-7}
            shadow-camera-right={7}
            shadow-camera-top={7}
            shadow-camera-bottom={-7}
            shadow-normalBias={0.04}
          />
          <Inspect key={name} name={name} level={level} animated={animated} />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.03, 0]}
            receiveShadow
          >
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#6b4b3b" roughness={1} />
          </mesh>
          <gridHelper
            args={[7.5, 1, "#bf9872", "#bf9872"]}
            position={[0, 0.005, 0]}
          />
        </Canvas>
      </div>
      <footer
        style={{
          padding: "0 32px",
          fontSize: 11,
          letterSpacing: 2,
          color: "#a9aaa1",
        }}
      >
        ARCHITECTURE STUDY · 7.5 × 7.5 CONSTRUCTION PLOT · CERAMIC / STEEL /
        MARTIAN DUST
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<Review />);
