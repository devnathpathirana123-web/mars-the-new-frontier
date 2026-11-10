import { PALETTE as C } from "./shared/palette";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Airlock,
  Base,
  Beam,
  Block,
  Cylinder,
  Glass,
  Radiator,
  Ring,
  Vent,
  WindowBand,
} from "./shared/Architecture";
import { modelLevel } from "./shared/levels";

function Laboratory({ p, width = 2.5, depth = 2, height = 1.7 }) {
  return (
    <group position={p}>
      <Block p={[0, height / 2, 0]} s={[width, height, depth]} />
      <Block
        p={[0, height + 0.07, 0]}
        s={[width + 0.12, 0.14, depth + 0.12]}
        color={C.dark}
      />
      <WindowBand
        p={[0, height * 0.6, depth / 2 + 0.03]}
        width={width * 0.75}
        accent={C.research}
      />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          p={[side * (width / 2 - 0.12), height / 2, depth / 2 + 0.05]}
          s={[0.12, height, 0.12]}
          color={C.frame}
        />
      ))}
    </group>
  );
}

function Dish({ p, large, animated }) {
  const head = useRef(null);
  useFrame(({ clock }) => {
    if (animated && head.current)
      head.current.rotation.y = Math.sin(clock.elapsedTime * 0.17) * 0.35;
  });
  return (
    <group position={p}>
      <Cylinder p={[0, 0.5, 0]} radius={0.2} height={1} color={C.dark} />
      <group ref={head} position={[0, 1.05, 0]}>
        <group rotation={[0.55, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <sphereGeometry
              args={[
                large ? 0.75 : 0.55,
                24,
                12,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2.5,
              ]}
            />
            <meshStandardMaterial
              color={C.light}
              side={2}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          <Ring
            p={[0, 0, 0]}
            radius={large ? 0.71 : 0.52}
            r={[0, 0, 0]}
            color={C.research}
          />
          <Beam a={[0, 0, 0]} b={[0, 0, 0.65]} radius={0.025} />
          <Block p={[0, 0, 0.65]} s={[0.12, 0.12, 0.12]} color={C.research} />
        </group>
      </group>
    </group>
  );
}

function InstrumentDome({ p, advanced }) {
  return (
    <group position={p}>
      <Cylinder p={[0, 0.25, 0]} radius={0.78} height={0.5} color={C.dark} />
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.78, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={C.light} roughness={0.65} />
      </mesh>
      <Block
        p={[0, 0.88, 0.55]}
        s={[0.2, 0.58, 0.55]}
        color={C.dark}
        r={[-0.35, 0, 0]}
      />
      <Cylinder
        p={[0, 0.95, 0.83]}
        r={[Math.PI / 2, 0, 0]}
        radius={advanced ? 0.23 : 0.16}
        height={0.14}
        color={C.research}
      />
      <Ring p={[0, 0.5, 0]} radius={0.8} color={C.research} />
    </group>
  );
}

function SamplingArm({ animated }) {
  const shoulder = useRef(null);
  useFrame(({ clock }) => {
    if (animated && shoulder.current)
      shoulder.current.rotation.z = Math.sin(clock.elapsedTime * 0.6) * 0.18;
  });
  return (
    <group position={[-2.25, 0.5, 0.4]}>
      <Cylinder p={[0, 0.12, 0]} radius={0.17} height={0.24} color={C.frame} />
      <group ref={shoulder} position={[0, 0.25, 0]}>
        <Beam a={[0, 0, 0]} b={[-0.2, 0.4, 0]} radius={0.07} color={C.light} />
        <Beam
          a={[-0.2, 0.4, 0]}
          b={[0.25, 0.3, 0]}
          radius={0.055}
          color={C.research}
        />
        <Block p={[0.25, 0.2, 0]} s={[0.16, 0.15, 0.12]} color={C.dark} />
      </group>
      <Cylinder
        p={[0.3, 0.08, 0]}
        radius={0.13}
        height={0.1}
        color={C.research}
      />
    </group>
  );
}

export default function ResearchModel({ level = 1, animated = true }) {
  const L = modelLevel(level);
  return (
    <group>
      <Base accent={C.research} level={L} />
      <Laboratory
        p={[0, 0.3, 0.3]}
        width={L >= 4 ? 3.1 : 2.6}
        depth={2.4}
        height={L >= 7 ? 2.3 : 1.7}
      />
      <Airlock p={[0, 0.3, 1.7]} scale={0.85} accent={C.research} />
      <Dish p={[2.3, 0.3, -1.7]} large={L >= 5} animated={animated} />
      {L >= 2 && <InstrumentDome p={[-2.15, 0.3, -1.8]} advanced={L >= 8} />}
      {L >= 3 && (
        <Laboratory p={[0, 0.3, -1.65]} width={2} depth={1.5} height={1.45} />
      )}
      {L >= 4 && (
        <>
          <Block p={[-2.25, 0.4, 0.4]} s={[1.15, 0.2, 1.7]} color={C.dark} />
          <Block p={[-2.25, 1.45, 0.4]} s={[1.15, 0.1, 1.7]} color={C.dark} />
          <Block p={[-2.25, 0.95, -0.4]} s={[1.15, 1, 0.1]} />
          <Glass p={[-2.8, 0.95, 0.4]} s={[0.025, 0.9, 1.5]} />
          <SamplingArm animated={animated} />
          <Glass p={[-2.25, 1.1, 1.27]} s={[0.95, 0.6, 0.025]} />
        </>
      )}
      {L >= 5 && (
        <>
          <Beam a={[2.7, 0.3, 0.6]} b={[2.7, 3.3, 0.6]} radius={0.045} />
          <Block p={[2.7, 2.8, 0.6]} s={[0.6, 0.2, 0.08]} color={C.research} />
        </>
      )}
      {L >= 6 && <Radiator p={[0, 0.3, -2.8]} width={1.7} height={0.9} />}
      {L >= 7 && (
        <Laboratory p={[0, 2.6, 0.15]} width={2.7} depth={2} height={1.1} />
      )}
      {L >= 8 && <Vent p={[1.2, 2.75, -1.4]} accent={C.research} />}
      {L >= 9 && (
        <Laboratory p={[2.2, 0.3, 0.5]} width={1.1} depth={1.65} height={1.5} />
      )}
      {L >= 10 && (
        <Block p={[0, 3.95, 0.15]} s={[1.7, 0.25, 1.6]} color={C.research} />
      )}
      {L >= 11 && (
        <Laboratory p={[0, 1.9, -1.65]} width={1.75} depth={1.4} height={1.1} />
      )}
      {L >= 12 &&
        [-1, 1].map((side) => (
          <Radiator
            key={side}
            p={[side * 1.8, 0.3, -2.8]}
            width={1.1}
            height={1.35}
          />
        ))}
      {L >= 13 && (
        <>
          <Cylinder
            p={[0, 4.35, 0.15]}
            radius={0.45}
            height={0.65}
            color={C.dark}
          />
          <Ring p={[0, 4.65, 0.15]} radius={0.6} color={C.research} />
        </>
      )}
      {L >= 14 && (
        <Laboratory
          p={[-2.25, 1.5, 0.4]}
          width={1.15}
          depth={1.6}
          height={0.85}
        />
      )}
      {L >= 15 && (
        <>
          <InstrumentDome p={[0, 4.08, 0.15]} advanced />
          <Block
            p={[0, 3.3, -2.38]}
            s={[1.65, 0.08, 0.08]}
            color={C.research}
            glow
          />
        </>
      )}
    </group>
  );
}
