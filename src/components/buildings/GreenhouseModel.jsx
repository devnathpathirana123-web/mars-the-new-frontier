
import { useMemo } from "react";
import * as THREE from "three";

// ======================================================
// MARS: THE NEW FRONTIER
// ADVANCED MARTIAN GREENHOUSE ARCHITECTURE
// Levels 1–10
// Standalone model: does not modify gameplay or saves.
// ======================================================

const C = {
  white: "#e1e2d9",
  ceramic: "#bfc9c9",
  frame: "#71838b",
  steel: "#455760",
  dark: "#263941",
  glass: "#76b9c0",
  glassBlue: "#428b9d",
  copper: "#d28d5c",
  pipe: "#b5c6cb",
  soil: "#574c3d",
  tray: "#526b69",
  leaf: "#54a76b",
  leafLight: "#89c879",
  light: "#bceee1",
  foundation: "#555c5c",
};

const MAT = {
  metal: { metalness: 0.65, roughness: 0.38 },
  ceramic: { metalness: 0.2, roughness: 0.68 },
};

// ------------------------------------------------------
// REUSABLE ENGINEERING COMPONENTS
// ------------------------------------------------------

function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  r = [0, 0, 0],
  color = C.white,
  material = "metal",
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={color}
        {...MAT[material]}
      />
    </mesh>
  );
}

function Beam({
  from,
  to,
  radius = 0.055,
  color = C.frame,
  sides = 8,
}) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const length = delta.length();

  const midpoint = start.clone().add(end).multiplyScalar(0.5);

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.normalize()
  );

  if (length < 0.0001) return null;

  return (
    <mesh
      position={midpoint.toArray()}
      quaternion={quaternion}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, length, sides]} />
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.34}
      />
    </mesh>
  );
}

function PipePath({
  points,
  radius = 0.065,
  color = C.pipe,
}) {
  return (
    <group>
      {points.slice(1).map((point, i) => (
        <Beam
          key={i}
          from={points[i]}
          to={point}
          radius={radius}
          color={color}
        />
      ))}
      {points.slice(1, -1).map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[radius * 1.3, 8, 6]} />
          <meshStandardMaterial color={color} metalness={0.7} />
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
  sides = 16,
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry
        args={[radius, radius, height, sides]}
      />
      <meshStandardMaterial
        color={color}
        metalness={0.55}
        roughness={0.42}
      />
    </mesh>
  );
}

function Bolt({ p }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[0.055, 6, 4]} />
      <meshStandardMaterial
        color="#b4bfc2"
        metalness={0.9}
        roughness={0.25}
      />
    </mesh>
  );
}

function Panel({
  p = [0, 0, 0],
  s = [1, 1, 0.05],
  r = [0, 0, 0],
  opacity = 0.3,
}) {
  return (
    <mesh position={p} rotation={r}>
      <boxGeometry args={s} />
      <meshPhysicalMaterial
        color={C.glass}
        transparent
        opacity={opacity}
        roughness={0.16}
        metalness={0.08}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ------------------------------------------------------
// AGRICULTURAL CROPS
// ------------------------------------------------------

function Crop({ p = [0, 0, 0], maturity = 1 }) {
  return (
    <group position={p} scale={maturity}>
      <Beam
        from={[0, 0, 0]}
        to={[0, 0.42, 0]}
        radius={0.018}
        color="#488b50"
        sides={6}
      />

      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;

        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh
              position={[0.14, 0.23 + (i % 2) * 0.1, 0]}
              rotation={[0, 0, -0.45]}
            >
              <sphereGeometry args={[1, 8, 5]} />
              <meshStandardMaterial
                color={i % 2 ? C.leafLight : C.leaf}
                side={THREE.DoubleSide}
                roughness={0.9}
              />
              <group scale={[0.17, 0.035, 0.075]} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.12, 7, 5]} />
        <meshStandardMaterial color={C.leafLight} />
      </mesh>
    </group>
  );
}

// Correctly shaped leaf geometry for crop rows.
function LeafPlant({ p = [0, 0, 0], scale = 1 }) {
  return (
    <group position={p} scale={scale}>
      <Beam
        from={[0, 0, 0]}
        to={[0, 0.44, 0]}
        radius={0.018}
        color="#458d52"
        sides={6}
      />

      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const y = 0.15 + (i % 3) * 0.09;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.15,
              y,
              Math.sin(angle) * 0.15,
            ]}
            rotation={[0, -angle, -0.45]}
            scale={[0.23, 0.045, 0.095]}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              color={i % 2 ? C.leafLight : C.leaf}
              roughness={0.9}
            />
          </mesh>
        );
      })}

      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.105, 8, 6]} />
        <meshStandardMaterial color="#79bc64" />
      </mesh>
    </group>
  );
}

function HydroponicRack({
  p = [0, 0, 0],
  tiers = 2,
  length = 3.2,
  dense = false,
}) {
  const columns = dense ? 9 : 6;

  return (
    <group position={p}>
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <Beam
            key={`${x}-${z}`}
            from={[x * 0.57, 0, z * length * 0.48]}
            to={[x * 0.57, tiers * 0.82 + 0.25, z * length * 0.48]}
            radius={0.045}
            color={C.steel}
          />
        ))
      )}

      {Array.from({ length: tiers }, (_, tier) => {
        const y = 0.7 + tier * 0.82;

        return (
          <group key={tier}>
            <Box
              p={[0, y, 0]}
              s={[1.3, 0.16, length]}
              color={C.tray}
            />

            <Box
              p={[0, y + 0.11, 0]}
              s={[1.12, 0.08, length - 0.12]}
              color={C.soil}
              material="ceramic"
            />

            {Array.from({ length: columns }, (_, i) => {
              const z =
                -length / 2 +
                0.3 +
                (i * (length - 0.6)) / (columns - 1);

              return [-0.28, 0.28].map((x) => (
                <LeafPlant
                  key={`${i}-${x}`}
                  p={[x, y + 0.16, z]}
                  scale={dense ? 0.92 : 0.78}
                />
              ));
            })}

            <PipePath
              points={[
                [-0.7, y + 0.2, -length / 2],
                [-0.7, y + 0.2, length / 2],
              ]}
              radius={0.035}
              color={C.glassBlue}
            />

            <Box
              p={[0, y + 0.58, 0]}
              s={[0.8, 0.055, length - 0.25]}
              color={C.light}
            />

            <Box
              p={[0, y + 0.62, 0]}
              s={[0.9, 0.09, length - 0.15]}
              color={C.steel}
            />
          </group>
        );
      })}
    </group>
  );
}

// ------------------------------------------------------
// REINFORCED GREENHOUSE SHELL
// ------------------------------------------------------

function GreenhouseBay({
  p = [0, 0, 0],
  length = 5.5,
  width = 5.6,
  height = 4.6,
  tiers = 2,
  dense = false,
  transparent = true,
}) {
  const half = width / 2;
  const shoulder = height * 0.66;
  const ridge = height;

  const frames = useMemo(() => {
    const count = Math.max(4, Math.ceil(length / 1.1));
    return Array.from(
      { length: count + 1 },
      (_, i) => -length / 2 + (i * length) / count
    );
  }, [length]);

  return (
    <group position={p}>
      {/* Elevated, reinforced foundation */}
      <Box
        p={[0, 0.16, 0]}
        s={[width + 0.65, 0.32, length + 0.65]}
        color={C.foundation}
      />

      <Box
        p={[0, 0.36, 0]}
        s={[width + 0.3, 0.12, length + 0.3]}
        color={C.steel}
      />

      {/* Roof and wall frame assemblies */}
      {frames.map((z, i) => (
        <group key={i}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Beam
                from={[side * half, 0.4, z]}
                to={[side * half, shoulder, z]}
                radius={0.075}
              />

              <Beam
                from={[side * half, shoulder, z]}
                to={[0, ridge, z]}
                radius={0.08}
                color={C.steel}
              />

              <Bolt p={[side * half, shoulder, z]} />
            </group>
          ))}

          <Beam
            from={[0, ridge - 0.12, z]}
            to={[0, ridge + 0.12, z]}
            radius={0.075}
            color={C.copper}
          />
        </group>
      ))}

      {/* Longitudinal structural members */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Beam
            from={[side * half, shoulder, -length / 2]}
            to={[side * half, shoulder, length / 2]}
            radius={0.095}
          />

          <Beam
            from={[side * half, 0.6, -length / 2]}
            to={[side * half, 0.6, length / 2]}
            radius={0.06}
          />
        </group>
      ))}

      <Beam
        from={[0, ridge, -length / 2]}
        to={[0, ridge, length / 2]}
        radius={0.11}
        color={C.steel}
      />

      {/* Individually divided transparent roof panels */}
      {transparent &&
        frames.slice(0, -1).map((z, i) => {
          const next = frames[i + 1];
          const middle = (z + next) / 2;
          const segmentLength = next - z;

          const dx = half;
          const dy = ridge - shoulder;
          const slopeLength = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          return [-1, 1].map((side) => (
            <group key={`${i}-${side}`}>
              <Panel
                p={[
                  side * half * 0.5,
                  (shoulder + ridge) / 2,
                  middle,
                ]}
                s={[
                  slopeLength - 0.1,
                  0.045,
                  segmentLength - 0.08,
                ]}
                r={[0, 0, side * -angle]}
                opacity={0.3}
              />

              <Panel
                p={[
                  side * (half + 0.015),
                  (shoulder + 0.6) / 2,
                  middle,
                ]}
                s={[
                  0.045,
                  shoulder - 0.7,
                  segmentLength - 0.08,
                ]}
                opacity={0.23}
              />
            </group>
          ));
        })}

      {/* Diagonal bracing */}
      {frames.slice(0, -1).map((z, i) =>
        [-1, 1].map((side) => (
          <Beam
            key={`${i}-${side}`}
            from={[side * half, 0.65, z]}
            to={[side * half, shoulder - 0.2, frames[i + 1]]}
            radius={0.025}
            color={C.ceramic}
          />
        ))
      )}

      {/* Internal crop racks */}
      {[-1.55, 1.55].map((x) => (
        <HydroponicRack
          key={x}
          p={[x, 0.42, 0]}
          tiers={tiers}
          length={length - 0.7}
          dense={dense}
        />
      ))}

      {/* Central maintenance walkway */}
      <Box
        p={[0, 0.43, 0]}
        s={[1.05, 0.045, length - 0.4]}
        color={C.dark}
      />

      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          p={[
            0,
            0.47,
            -length / 2 + 0.35 + (i * (length - 0.7)) / 11,
          ]}
          s={[0.95, 0.015, 0.045]}
          color={C.frame}
        />
      ))}

      {/* Irrigation supply manifolds */}
      {[-1, 1].map((side) => (
        <PipePath
          key={side}
          points={[
            [side * 2.55, 0.55, -length / 2],
            [side * 2.55, 0.55, length / 2],
            [side * 1.55, 0.55, length / 2],
          ]}
          radius={0.075}
          color={C.glassBlue}
        />
      ))}

      {/* Overhead climate-control duct */}
      <PipePath
        points={[
          [0, ridge - 0.65, -length / 2],
          [0, ridge - 0.65, length / 2],
        ]}
        radius={0.15}
        color={C.pipe}
      />

      {frames.filter((_, i) => i % 2 === 0).map((z) => (
        <group key={z}>
          <Box
            p={[0, ridge - 0.72, z]}
            s={[0.65, 0.32, 0.55]}
            color={C.dark}
          />

          <Box
            p={[0, ridge - 0.92, z]}
            s={[0.52, 0.05, 0.45]}
            color={C.light}
          />
        </group>
      ))}

      {/* Reinforced end walls */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            p={[-half / 2, shoulder / 2, side * length / 2]}
            s={[half - 0.15, shoulder - 0.4, 0.15]}
            color={C.ceramic}
          />

          <Box
            p={[half / 2, shoulder / 2, side * length / 2]}
            s={[half - 0.15, shoulder - 0.4, 0.15]}
            color={C.ceramic}
          />

          <Box
            p={[0, shoulder + 0.15, side * length / 2]}
            s={[width * 0.5, 0.55, 0.16]}
            color={C.white}
          />

          <Box
            p={[0, 1.25, side * (length / 2 + 0.13)]}
            s={[1.35, 2.25, 0.16]}
            color={C.steel}
          />

          <Box
            p={[0, 1.25, side * (length / 2 + 0.24)]}
            s={[1.05, 1.9, 0.09]}
            color={C.white}
          />

          <Box
            p={[0, 1.65, side * (length / 2 + 0.3)]}
            s={[0.62, 0.45, 0.045]}
            color={C.glassBlue}
          />

          <Box
            p={[0.43, 0.95, side * (length / 2 + 0.31)]}
            s={[0.07, 0.34, 0.06]}
            color={C.copper}
          />
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------
// INDUSTRIAL WATER AND CLIMATE INFRASTRUCTURE
// ------------------------------------------------------

function WaterTank({
  p = [0, 0, 0],
  height = 2,
  radius = 0.7,
}) {
  return (
    <group position={p}>
      <Cylinder
        p={[0, height / 2 + 0.2, 0]}
        height={height}
        radius={radius}
        color={C.ceramic}
      />

      {[0.3, height / 2, height - 0.1].map((y, i) => (
        <Cylinder
          key={i}
          p={[0, y, 0]}
          height={0.12}
          radius={radius + 0.045}
          color={C.steel}
        />
      ))}

      <PipePath
        points={[
          [0, height + 0.2, 0],
          [0, height + 0.48, 0],
          [radius + 0.4, height + 0.48, 0],
        ]}
        radius={0.07}
        color={C.copper}
      />

      <Box
        p={[0, height * 0.65, radius + 0.06]}
        s={[0.55, 0.28, 0.055]}
        color={C.dark}
      />
    </group>
  );
}

function PumpAssembly({ p = [0, 0, 0] }) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.22, 0]}
        s={[1.65, 0.45, 1.35]}
        color={C.foundation}
      />

      <Box
        p={[-0.25, 0.85, 0]}
        s={[0.85, 0.8, 0.8]}
        color={C.ceramic}
      />

      <Cylinder
        p={[0.55, 0.85, 0]}
        radius={0.36}
        height={0.85}
        color={C.copper}
      />

      <PipePath
        points={[
          [0.55, 1.3, 0],
          [0.55, 1.75, 0],
          [1.15, 1.75, 0],
        ]}
        radius={0.095}
        color={C.pipe}
      />

      {[-0.3, 0, 0.3].map((z) => (
        <Box
          key={z}
          p={[-0.7, 0.9, z]}
          s={[0.06, 0.45, 0.08]}
          color={C.steel}
        />
      ))}
    </group>
  );
}

function Radiator({ p = [0, 0, 0], count = 7 }) {
  return (
    <group position={p}>
      <Box
        p={[0, 1.2, 0]}
        s={[0.3, 2.3, 2.6]}
        color={C.steel}
      />

      {Array.from({ length: count }, (_, i) => (
        <Box
          key={i}
          p={[
            0.23,
            1.2,
            -1.05 + (i * 2.1) / Math.max(1, count - 1),
          ]}
          s={[0.35, 2.05, 0.11]}
          color={C.ceramic}
        />
      ))}

      <PipePath
        points={[
          [0, 0.3, -1.1],
          [0, 0.3, 1.1],
        ]}
        radius={0.07}
        color={C.copper}
      />
    </group>
  );
}

function AirlockCorridor({
  p = [0, 0, 0],
  length = 3,
}) {
  return (
    <group position={p}>
      <Box
        p={[0, 1.4, 0]}
        s={[1.85, 2.5, length]}
        color={C.ceramic}
      />

      <Box
        p={[0, 1.45, 0]}
        s={[1.9, 1.1, length - 0.2]}
        color={C.white}
      />

      {Array.from({ length: 5 }, (_, i) => {
        const z = -length / 2 + (i * length) / 4;

        return (
          <group key={i}>
            <Box
              p={[0, 1.45, z]}
              s={[2.02, 2.6, 0.09]}
              color={C.frame}
            />

            <Box
              p={[0, 2.8, z]}
              s={[2.2, 0.12, 0.2]}
              color={C.steel}
            />
          </group>
        );
      })}

      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            p={[side * 0.94, 1.8, 0]}
            s={[0.08, 0.6, length - 0.3]}
            color={C.glassBlue}
          />

          <PipePath
            points={[
              [side * 1.1, 0.5, -length / 2],
              [side * 1.1, 0.5, length / 2],
            ]}
            radius={0.065}
            color={C.copper}
          />
        </group>
      ))}
    </group>
  );
}

function ServicePlant({
  p = [0, 0, 0],
  advanced = false,
}) {
  return (
    <group position={p}>
      <Box
        p={[0, 0.15, 0]}
        s={[4.2, 0.3, 4.3]}
        color={C.foundation}
      />

      <Box
        p={[0, 1.4, -0.7]}
        s={[3.5, 2.5, 2.2]}
        color={C.white}
      />

      <Box
        p={[0, 2.72, -0.7]}
        s={[3.7, 0.2, 2.4]}
        color={C.steel}
      />

      <PumpAssembly p={[-1.1, 0.2, 1.1]} />

      <WaterTank
        p={[1.1, 0.2, 1.1]}
        height={advanced ? 2.4 : 1.7}
        radius={0.55}
      />

      <PipePath
        points={[
          [-1.1, 1.9, 1.1],
          [-1.1, 2.6, 1.1],
          [1.1, 2.6, 1.1],
          [1.1, 2.2, 1.1],
        ]}
        radius={0.07}
        color={C.glassBlue}
      />

      {advanced && (
        <>
          <Radiator p={[2.1, 0, -0.7]} count={9} />

          <Box
            p={[0, 1.6, -1.85]}
            s={[1.5, 0.9, 0.09]}
            color={C.dark}
          />

          {Array.from({ length: 4 }, (_, i) => (
            <Box
              key={i}
              p={[-0.5 + i * 0.33, 1.6, -1.91]}
              s={[0.22, 0.48, 0.03]}
              color={i % 2 ? C.glassBlue : C.light}
            />
          ))}
        </>
      )}
    </group>
  );
}

// ------------------------------------------------------
// LEVEL 1–10 ARCHITECTURAL PROGRESSION
// ------------------------------------------------------

export default function GreenhouseModel({ level = 1 }) {
  const L = Math.max(1, Math.min(10, Math.floor(level)));

  const bays =
    L <= 2 ? 1 :
    L <= 4 ? 2 :
    L <= 6 ? 3 :
    L <= 8 ? 4 : 5;

  const bayLength = L <= 2 ? 4.5 : 5.5;
  const bayWidth = L <= 4 ? 5 : 5.6;
  const bayHeight = L <= 4 ? 3.8 : 4.8;

  const tierCount =
    L <= 2 ? 1 :
    L <= 5 ? 2 : 3;

  const positions = Array.from({ length: bays }, (_, i) => {
    const spacing = bayWidth + 1.6;
    return (i - (bays - 1) / 2) * spacing;
  });

  return (
    <group>
      {/* Reinforced industrial growing chambers */}
      {positions.map((x, i) => (
        <group key={i}>
          <GreenhouseBay
            p={[x, 0, 0]}
            length={bayLength}
            width={bayWidth}
            height={bayHeight}
            tiers={tierCount}
            dense={L >= 6}
          />

          {/* Utility service pods */}
          {(i === 0 || L >= 7) && (
            <ServicePlant
              p={[
                x,
                0,
                -(bayLength / 2 + 3.5),
              ]}
              advanced={L >= 5}
            />
          )}

          {/* Water storage expansion */}
          {L >= 3 && (
            <WaterTank
              p={[
                x + bayWidth / 2 + 0.85,
                0,
                -bayLength / 2 + 0.7,
              ]}
              height={L >= 8 ? 2.7 : 1.8}
              radius={0.55}
            />
          )}

          {/* Additional exterior climate radiators */}
          {L >= 5 && (
            <Radiator
              p={[
                x - bayWidth / 2 - 0.65,
                0,
                -1.1,
              ]}
              count={L >= 9 ? 11 : 7}
            />
          )}

          {/* Ventilation machinery */}
          {L >= 4 && (
            <group position={[x, bayHeight + 0.2, 0]}>
              <Box
                p={[0, 0, 0]}
                s={[1.2, 0.4, 1.2]}
                color={C.steel}
              />
              <Cylinder
                p={[0, 0.35, 0]}
                radius={0.4}
                height={0.3}
                color={C.ceramic}
              />
            </group>
          )}
        </group>
      ))}

      {/* Interconnecting pressurized corridors */}
      {positions.slice(0, -1).map((x, i) => {
        const nextX = positions[i + 1];
        const middle = (x + nextX) / 2;
        const length = nextX - x - bayWidth + 0.2;

        return (
          <group key={`connection-${i}`}>
            <group
              position={[middle, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <AirlockCorridor length={length} />
            </group>

            {/* Cross-building utility distribution */}
            <PipePath
              points={[
                [x + bayWidth / 2, 0.6, 2.2],
                [nextX - bayWidth / 2, 0.6, 2.2],
              ]}
              radius={0.09}
              color={C.glassBlue}
            />
          </group>
        );
      })}

      {/* Level 7+ external industrial utility trunk */}
      {L >= 7 && (
        <PipePath
          points={[
            [positions[0] - 1, 0.5, -bayLength / 2 - 1.2],
            [positions[bays - 1] + 1, 0.5, -bayLength / 2 - 1.2],
          ]}
          radius={0.14}
          color={C.copper}
        />
      )}

      {/* Level 9–10 central biosphere control structure */}
      {L >= 9 && (
        <group
          position={[
            0,
            0,
            bayLength / 2 + 4,
          ]}
        >
          <ServicePlant advanced />

          <Box
            p={[0, 3.1, 0]}
            s={[3.6, 0.6, 3.6]}
            color={C.steel}
          />

          <Box
            p={[0, 3.5, 0]}
            s={[2.9, 0.4, 2.9]}
            color={C.glassBlue}
          />

          <Beam
            from={[0, 3.7, 0]}
            to={[0, L === 10 ? 7 : 5.5, 0]}
            radius={0.07}
            color={C.steel}
          />

          <mesh position={[0, L === 10 ? 7 : 5.5, 0]}>
            <sphereGeometry args={[0.15, 12, 8]} />
            <meshStandardMaterial
              color={C.copper}
              emissive="#a85a2a"
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      )}

      {/* Level 10: expanded climate-control infrastructure */}
      {L === 10 && (
        <>
          <ServicePlant
            p={[positions[0] - 4, 0, 3.5]}
            advanced
          />
          <ServicePlant
            p={[positions[bays - 1] + 4, 0, 3.5]}
            advanced
          />

          {[-1, 1].map((side) => (
            <group key={side}>
              <WaterTank
                p={[side * 4.2, 0, 8.5]}
                height={3.3}
                radius={0.85}
              />

              <WaterTank
                p={[side * 6.1, 0, 8.5]}
                height={3.3}
                radius={0.85}
              />
            </group>
          ))}
        </>
      )}
    </group>
  );
}
