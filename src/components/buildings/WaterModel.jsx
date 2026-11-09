
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// =======================================================
// MARS: THE NEW FRONTIER
// AQUIFER — MARTIAN WATERWORKS
// 10 upgrade levels | Animated industrial architecture
// =======================================================

const C = {
  white: "#d9dfdc",
  ceramic: "#b9c7ca",
  steel: "#566b75",
  frame: "#354b55",
  dark: "#24343d",
  foundation: "#686765",
  copper: "#cb8c5d",
  blue: "#438ca6",
  water: "#70c9df",
  warning: "#e5ad53",
  glass: "#8ad3e2",
  rubber: "#292e32",
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
        roughness={0.42}
      />
    </mesh>
  );
}

function Rod({
  a,
  b,
  radius = 0.055,
  color = C.steel,
}) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start);
  const length = direction.length();

  if (length < 0.0001) return null;

  const midpoint = start.clone().add(end).multiplyScalar(0.5);

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  return (
    <mesh
      position={midpoint.toArray()}
      quaternion={quaternion}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial
        color={color}
        metalness={0.75}
        roughness={0.3}
      />
    </mesh>
  );
}

function Pipe({
  points,
  radius = 0.075,
  color = C.copper,
}) {
  return (
    <group>
      {points.slice(1).map((point, i) => (
        <Rod
          key={i}
          a={points[i]}
          b={point}
          radius={radius}
          color={color}
        />
      ))}

      {points.slice(1, -1).map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[radius * 1.25, 8, 6]} />
          <meshStandardMaterial
            color={color}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function Cylinder({
  p = [0, 0, 0],
  radius = 0.5,
  height = 1,
  color = C.white,
  rotation = [0, 0, 0],
  sides = 16,
}) {
  return (
    <mesh position={p} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, sides]} />
      <meshStandardMaterial
        color={color}
        metalness={0.55}
        roughness={0.38}
      />
    </mesh>
  );
}

function StatusLight({
  p = [0, 0, 0],
  color = C.water,
}) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[0.085, 10, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.8}
      />
    </mesh>
  );
}

// -------------------------------------------------------
// REINFORCED DRILLING DERRICK
// -------------------------------------------------------

function Derrick({ height = 6.5 }) {
  const feet = [
    [-0.95, -0.95],
    [0.95, -0.95],
    [-0.95, 0.95],
    [0.95, 0.95],
  ];

  const top = 0.28;
  const sections = 7;

  return (
    <group>
      {feet.map(([x, z], i) => (
        <Rod
          key={i}
          a={[x, 0.45, z]}
          b={[Math.sign(x) * top, height, Math.sign(z) * top]}
          radius={0.09}
          color={C.frame}
        />
      ))}

      {Array.from({ length: sections }, (_, i) => {
        const y1 = 0.5 + (i * (height - 0.6)) / sections;
        const y2 = 0.5 + ((i + 1) * (height - 0.6)) / sections;

        const w1 = 0.95 - (0.67 * i) / sections;
        const w2 = 0.95 - (0.67 * (i + 1)) / sections;

        return (
          <group key={i}>
            {[-1, 1].map((side) => (
              <group key={side}>
                <Rod
                  a={[side * w1, y1, -w1]}
                  b={[-side * w2, y2, -w2]}
                  radius={0.045}
                  color={C.ceramic}
                />

                <Rod
                  a={[side * w1, y1, w1]}
                  b={[-side * w2, y2, w2]}
                  radius={0.045}
                  color={C.ceramic}
                />

                <Rod
                  a={[-w1, y1, side * w1]}
                  b={[w2, y2, side * w2]}
                  radius={0.04}
                />
              </group>
            ))}

            <Rod
              a={[-w1, y1, -w1]}
              b={[w1, y1, -w1]}
              radius={0.055}
            />

            <Rod
              a={[-w1, y1, w1]}
              b={[w1, y1, w1]}
              radius={0.055}
            />
          </group>
        );
      })}

      <Box
        p={[0, height + 0.12, 0]}
        s={[1.1, 0.28, 1.1]}
        color={C.warning}
      />

      <Box
        p={[0, height - 0.4, 0]}
        s={[0.75, 0.45, 0.75]}
        color={C.dark}
      />

      <StatusLight p={[0, height + 0.36, 0]} color={C.warning} />
    </group>
  );
}

// -------------------------------------------------------
// ANIMATED DRILL HEAD
// -------------------------------------------------------

function DrillMechanism({ height = 6.5 }) {
  const rotor = useRef();
  const carriage = useRef();

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (rotor.current) {
      rotor.current.rotation.y += delta * 1.8;
    }

    if (carriage.current) {
      carriage.current.position.y = Math.sin(t * 1.15) * 0.18;
    }
  });

  return (
    <group>
      <group ref={carriage}>
        <Box
          p={[0, height - 1.3, 0]}
          s={[0.95, 0.65, 0.95]}
          color={C.copper}
        />

        <Box
          p={[0, height - 1.3, 0.5]}
          s={[0.7, 0.3, 0.2]}
          color={C.dark}
        />
      </group>

      <group ref={rotor}>
        <Cylinder
          p={[0, height / 2, 0]}
          radius={0.12}
          height={height - 0.7}
          color={C.ceramic}
          sides={12}
        />

        {Array.from({ length: 9 }, (_, i) => (
          <group
            key={i}
            position={[0, 0.45 + i * 0.38, 0]}
            rotation={[0, i * 0.55, 0]}
          >
            <Box
              p={[0.16, 0, 0]}
              s={[0.35, 0.11, 0.12]}
              r={[0, 0, -0.35]}
              color={C.copper}
            />

            <Box
              p={[-0.16, 0, 0]}
              s={[0.35, 0.11, 0.12]}
              r={[0, 0, 0.35]}
              color={C.copper}
            />
          </group>
        ))}

        <mesh position={[0, 0.27, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.36, 0.55, 10]} />
          <meshStandardMaterial
            color={C.steel}
            metalness={0.85}
            roughness={0.28}
          />
        </mesh>
      </group>
    </group>
  );
}

function DrillRig({
  p = [0, 0, 0],
  advanced = false,
}) {
  const height = advanced ? 8 : 6.2;

  return (
    <group position={p}>
      <Box
        p={[0, 0.22, 0]}
        s={[4.6, 0.44, 4.6]}
        color={C.foundation}
      />

      <Box
        p={[0, 0.48, 0]}
        s={[3.6, 0.12, 3.6]}
        color={C.steel}
      />

      <Derrick height={height} />
      <DrillMechanism height={height} />

      {/* Side-mounted hydraulic power unit */}
      <Box
        p={[1.65, 1.05, 0]}
        s={[1.2, 1.35, 1.65]}
        color={C.white}
      />

      <Box
        p={[2.28, 1.2, 0]}
        s={[0.1, 0.6, 0.85]}
        color={C.dark}
      />

      <Pipe
        points={[
          [1.65, 1.7, 0],
          [1.65, 2.4, 0],
          [0.5, 2.4, 0],
          [0.5, 3.2, 0],
        ]}
        radius={0.08}
        color={C.copper}
      />

      {/* Stabilizing feet */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}-${z}`}>
            <Rod
              a={[x * 1.1, 1.6, z * 1.1]}
              b={[x * 2.05, 0.4, z * 2.05]}
              radius={0.09}
            />

            <Box
              p={[x * 2.05, 0.18, z * 2.05]}
              s={[0.65, 0.3, 0.65]}
              color={C.warning}
            />
          </group>
        ))
      )}

      <StatusLight p={[1.7, 1.85, 0.8]} />
    </group>
  );
}

// -------------------------------------------------------
// INDUSTRIAL STORAGE RESERVOIR
// -------------------------------------------------------

function Reservoir({
  p = [0, 0, 0],
  radius = 1.1,
  height = 3.2,
}) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.16, 0]}
        s={[radius * 2.6, 0.32, radius * 2.6]}
        color={C.foundation}
      />

      <Cylinder
        p={[0, height / 2 + 0.32, 0]}
        radius={radius}
        height={height}
        color={C.white}
        sides={24}
      />

      {[0.55, height * 0.5, height + 0.1].map((y, i) => (
        <Cylinder
          key={i}
          p={[0, y, 0]}
          radius={radius + 0.055}
          height={0.13}
          color={C.frame}
          sides={24}
        />
      ))}

      <Cylinder
        p={[0, height + 0.38, 0]}
        radius={radius * 0.75}
        height={0.25}
        color={C.steel}
      />

      <Pipe
        points={[
          [0, height + 0.5, 0],
          [0, height + 0.95, 0],
          [radius + 0.55, height + 0.95, 0],
        ]}
        radius={0.085}
        color={C.blue}
      />

      {/* Inspection ladder */}
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          p={[radius + 0.12, 0.65 + i * (height - 0.55) / 9, 0]}
          s={[0.3, 0.045, 0.75]}
          color={C.steel}
        />
      ))}

      <Box
        p={[0, height * 0.65, radius + 0.04]}
        s={[0.75, 0.36, 0.055]}
        color={C.dark}
      />

      <StatusLight
        p={[0, height * 0.65, radius + 0.09]}
      />
    </group>
  );
}

// -------------------------------------------------------
// ANIMATED PUMPING STATION
// -------------------------------------------------------

function Pump({ p = [0, 0, 0] }) {
  const flywheel = useRef();
  const piston = useRef();

  useFrame(({ clock }, delta) => {
    if (flywheel.current) {
      flywheel.current.rotation.x += delta * 2.3;
    }

    if (piston.current) {
      piston.current.position.y =
        Math.sin(clock.elapsedTime * 2.3) * 0.15;
    }
  });

  return (
    <group position={p}>
      <Box
        p={[0, 0.2, 0]}
        s={[2.6, 0.4, 2.1]}
        color={C.foundation}
      />

      <Box
        p={[-0.45, 0.85, 0]}
        s={[1.1, 0.85, 1.15]}
        color={C.white}
      />

      <group ref={flywheel} position={[0.6, 1.0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.47, 0.085, 8, 20]} />
          <meshStandardMaterial
            color={C.copper}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI * 2) / 6;

          return (
            <Rod
              key={i}
              a={[0, 0, 0]}
              b={[
                0,
                Math.cos(a) * 0.45,
                Math.sin(a) * 0.45,
              ]}
              radius={0.045}
              color={C.steel}
            />
          );
        })}
      </group>

      <group ref={piston}>
        <Cylinder
          p={[-0.45, 1.55, 0]}
          radius={0.18}
          height={0.95}
          color={C.copper}
        />
      </group>

      <Pipe
        points={[
          [-1.05, 0.85, 0],
          [-1.45, 0.85, 0],
          [-1.45, 0.35, 0],
        ]}
        radius={0.12}
        color={C.blue}
      />

      <Pipe
        points={[
          [0.1, 0.85, 0],
          [0.1, 1.65, 0],
          [1.25, 1.65, 0],
        ]}
        radius={0.1}
      />
    </group>
  );
}

// -------------------------------------------------------
// FILTRATION AND PROCESSING BUILDING
// -------------------------------------------------------

function ProcessingPlant({
  p = [0, 0, 0],
  advanced = false,
}) {
  const filters = advanced ? 5 : 3;

  return (
    <group position={p}>
      <Box
        p={[0, 0.2, 0]}
        s={[6.8, 0.4, 5.4]}
        color={C.foundation}
      />

      <Box
        p={[0, 1.75, -0.5]}
        s={[6.1, 2.75, 3.9]}
        color={C.white}
      />

      <Box
        p={[0, 3.2, -0.5]}
        s={[6.5, 0.2, 4.3]}
        color={C.steel}
      />

      {/* External filtration cartridges */}
      {Array.from({ length: filters }, (_, i) => {
        const x =
          (i - (filters - 1) / 2) * 0.95;

        return (
          <group key={i}>
            <Cylinder
              p={[x, 1.25, 2.05]}
              radius={0.32}
              height={1.65}
              color={C.ceramic}
            />

            <Cylinder
              p={[x, 2.15, 2.05]}
              radius={0.37}
              height={0.16}
              color={C.frame}
            />

            <Pipe
              points={[
                [x, 2.25, 2.05],
                [x, 2.65, 2.05],
                [x, 2.65, 2.5],
              ]}
              radius={0.045}
              color={C.blue}
            />
          </group>
        );
      })}

      {/* Control and monitoring screens */}
      {[-2.3, -1.3, 1.3, 2.3].map((x, i) => (
        <group key={i}>
          <Box
            p={[x, 1.7, -2.49]}
            s={[0.7, 0.55, 0.09]}
            color={C.dark}
          />

          <Box
            p={[x, 1.7, -2.55]}
            s={[0.49, 0.31, 0.03]}
            color={i % 2 ? C.blue : C.glass}
          />
        </group>
      ))}

      <Box
        p={[0, 1.3, -2.53]}
        s={[1.1, 2.1, 0.13]}
        color={C.frame}
      />

      <Box
        p={[0, 1.8, -2.62]}
        s={[0.65, 0.45, 0.05]}
        color={C.glass}
      />

      {/* Roof-mounted heat exchangers */}
      {[-1.65, 1.65].map((x) => (
        <group key={x}>
          <Box
            p={[x, 3.6, -0.5]}
            s={[1.7, 0.6, 1.5]}
            color={C.dark}
          />

          {Array.from({ length: 6 }, (_, i) => (
            <Box
              key={i}
              p={[x - 0.6 + i * 0.24, 3.95, -0.5]}
              s={[0.11, 0.3, 1.2]}
              color={C.ceramic}
            />
          ))}
        </group>
      ))}

      <Pipe
        points={[
          [-3.15, 0.7, 0.7],
          [-3.65, 0.7, 0.7],
          [-3.65, 2.2, 0.7],
          [-2.7, 2.2, 0.7],
        ]}
        radius={0.13}
        color={C.blue}
      />

      {advanced && (
        <>
          <Reservoir
            p={[4.8, 0, 0]}
            radius={0.85}
            height={2.8}
          />

          <Pump p={[-4.6, 0, 0]} />
        </>
      )}
    </group>
  );
}

// -------------------------------------------------------
// PRESSURIZED UTILITY CORRIDOR
// -------------------------------------------------------

function UtilityCorridor({
  p = [0, 0, 0],
  length = 5,
}) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.2, 0]}
        s={[2.5, 0.4, length]}
        color={C.foundation}
      />

      <Box
        p={[0, 1.3, 0]}
        s={[2.1, 2.1, length]}
        color={C.white}
      />

      {Array.from({ length: 6 }, (_, i) => {
        const z = -length / 2 + (i * length) / 5;

        return (
          <group key={i}>
            <Box
              p={[0, 1.3, z]}
              s={[2.25, 2.35, 0.11]}
              color={C.frame}
            />

            <Box
              p={[0, 2.5, z]}
              s={[2.5, 0.12, 0.25]}
              color={C.ceramic}
            />
          </group>
        );
      })}

      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            p={[side * 1.09, 1.55, 0]}
            s={[0.055, 0.55, length - 0.3]}
            color={C.glass}
          />

          <Pipe
            points={[
              [side * 1.3, 0.5, -length / 2],
              [side * 1.3, 0.5, length / 2],
            ]}
            radius={0.08}
            color={C.blue}
          />
        </group>
      ))}
    </group>
  );
}

// -------------------------------------------------------
// CENTRAL WATER MANAGEMENT HQ
// -------------------------------------------------------

function WaterControl({ p = [0, 0, 0] }) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.2, 0]}
        s={[7.6, 0.4, 6.2]}
        color={C.foundation}
      />

      <Box
        p={[0, 1.8, 0]}
        s={[6.8, 2.9, 5.4]}
        color={C.white}
      />

      <Box
        p={[0, 3.35, 0]}
        s={[7.2, 0.22, 5.8]}
        color={C.steel}
      />

      <Box
        p={[0, 4.25, -0.5]}
        s={[4.7, 1.6, 3.5]}
        color={C.frame}
      />

      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={i}
          p={[-2.6 + i * 1.04, 2.1, 2.76]}
          s={[0.8, 0.85, 0.08]}
          color={C.glass}
        />
      ))}

      <Box
        p={[0, 1.35, 2.8]}
        s={[1.4, 2.1, 0.12]}
        color={C.dark}
      />

      <Box
        p={[0, 2.1, 2.88]}
        s={[0.75, 0.4, 0.05]}
        color={C.glass}
      />

      <Rod
        a={[0, 5.1, -0.5]}
        b={[0, 8.2, -0.5]}
        radius={0.075}
      />

      {[-1, 1].map((side) => (
        <Rod
          key={side}
          a={[0, 6.5, -0.5]}
          b={[side * 1.2, 5.2, -0.5]}
          radius={0.035}
        />
      ))}

      <StatusLight
        p={[0, 8.25, -0.5]}
        color={C.warning}
      />

      {/* Utility distribution manifolds */}
      {[-1, 1].map((side) => (
        <Pipe
          key={side}
          points={[
            [side * 3.5, 0.6, -2],
            [side * 4.2, 0.6, -2],
            [side * 4.2, 0.6, 2],
          ]}
          radius={0.14}
          color={C.blue}
        />
      ))}
    </group>
  );
}

// -------------------------------------------------------
// EXPANDABLE INDUSTRIAL DISTRICT
// -------------------------------------------------------

function WaterDistrict({
  p = [0, 0, 0],
  level = 1,
  index = 0,
}) {
  const advanced = level >= 5;

  return (
    <group position={p}>
      <Box
        p={[0, 0.12, 0]}
        s={[13.6, 0.24, 12.8]}
        color={C.foundation}
      />

      <DrillRig
        p={[-3.8, 0.2, -2.5]}
        advanced={advanced}
      />

      <Pump p={[2.5, 0.2, -3.1]} />

      <Reservoir
        p={[3.5, 0.2, 2.4]}
        radius={level >= 8 ? 1.35 : 1}
        height={level >= 8 ? 3.8 : 2.8}
      />

      <Pipe
        points={[
          [-3.8, 0.55, -2.5],
          [-3.8, 0.55, 3.5],
          [2.5, 0.55, 3.5],
          [2.5, 0.55, 2.4],
        ]}
        radius={0.13}
        color={C.blue}
      />

      {advanced && (
        <>
          <Reservoir
            p={[-3.5, 0.2, 3.3]}
            radius={1}
            height={3}
          />

          <Pipe
            points={[
              [-3.5, 0.65, 3.3],
              [-3.5, 0.65, 5.4],
              [3.5, 0.65, 5.4],
              [3.5, 0.65, 2.4],
            ]}
            radius={0.095}
          />
        </>
      )}

      {level >= 8 && (
        <DrillRig
          p={[3.3, 0.2, -0.8]}
          advanced
        />
      )}

      {/* Service junction boxes */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            p={[side * 5.6, 0.85, 4.7]}
            s={[0.9, 1.35, 0.75]}
            color={C.white}
          />

          <Box
            p={[side * 5.6, 1.1, 5.1]}
            s={[0.55, 0.35, 0.045]}
            color={C.dark}
          />

          <StatusLight
            p={[side * 5.6, 1.1, 5.15]}
          />
        </group>
      ))}

      {index % 2 === 0 && (
        <Box
          p={[0, 0.29, 5.6]}
          s={[3.4, 0.035, 0.25]}
          color={C.warning}
        />
      )}
    </group>
  );
}

// -------------------------------------------------------
// MAIN LEVEL 1–10 WATERWORKS MODEL
// -------------------------------------------------------

export default function WaterModel({ level = 1 }) {
  const L = Math.max(1, Math.min(10, Math.floor(level)));

  const districtCount =
    L <= 2 ? 1 :
    L <= 4 ? 2 :
    L <= 6 ? 3 :
    L <= 8 ? 4 : 6;

  const positions = useMemo(() => {
    return Array.from({ length: districtCount }, (_, i) => {
      const column = i % 3;
      const row = Math.floor(i / 3);

      return [
        (column - 1) * 17,
        0,
        row * 17,
      ];
    });
  }, [districtCount]);

  return (
    <group>
      {/* Drilling and extraction districts */}
      {positions.map((p, i) => (
        <WaterDistrict
          key={i}
          p={p}
          level={L}
          index={i}
        />
      ))}

      {/* Primary purification and processing */}
      <ProcessingPlant
        p={[0, 0, -12]}
        advanced={L >= 4}
      />

      {/* Additional processing capacity */}
      {L >= 5 && (
        <ProcessingPlant
          p={[10, 0, -12]}
          advanced
        />
      )}

      {L >= 7 && (
        <ProcessingPlant
          p={[-10, 0, -12]}
          advanced
        />
      )}

      {/* Central utility storage */}
      {L >= 3 && (
        <>
          <Reservoir
            p={[7, 0, -5]}
            radius={1.25}
            height={3.8}
          />

          <Reservoir
            p={[-7, 0, -5]}
            radius={1.25}
            height={3.8}
          />
        </>
      )}

      {/* Water distribution infrastructure */}
      {L >= 4 && (
        <Pipe
          points={[
            [-12, 0.45, -7],
            [12, 0.45, -7],
          ]}
          radius={0.18}
          color={C.blue}
        />
      )}

      {/* High-capacity water management center */}
      {L >= 7 && (
        <WaterControl p={[0, 0, -23]} />
      )}

      {/* Advanced central water-storage campus */}
      {L >= 9 && (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Reservoir
                p={[side * 14, 0, -23]}
                radius={1.8}
                height={5.2}
              />

              <Reservoir
                p={[side * 14, 0, -29]}
                radius={1.8}
                height={5.2}
              />

              <Pipe
                points={[
                  [side * 14, 0.6, -23],
                  [side * 14, 0.6, -29],
                  [side * 8, 0.6, -29],
                ]}
                radius={0.17}
                color={C.blue}
              />
            </group>
          ))}
        </>
      )}

      {/* Level 10 — expanded industrial refining */}
      {L === 10 && (
        <>
          <ProcessingPlant
            p={[0, 0, -35]}
            advanced
          />

          <Pump p={[-5.5, 0, -35]} />
          <Pump p={[5.5, 0, -35]} />

          <Pipe
            points={[
              [-14, 0.5, -32],
              [14, 0.5, -32],
            ]}
            radius={0.2}
            color={C.blue}
          />
        </>
      )}
    </group>
  );
}
