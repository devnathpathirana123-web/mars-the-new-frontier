import { PALETTE as C } from "./shared/palette";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Base,
  Beam,
  Block,
  Cylinder,
  Instances,
  Pipe,
  Radiator,
  Vent,
} from "./shared/Architecture";
import { modelLevel } from "./shared/levels";

function SolarTable({ p, advanced, tracking, animated }) {
  const pivot = useRef(null);
  const cells = useMemo(() => {
    const parts = [];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 7; col++) {
        parts.push({
          p: [-1.02 + col * 0.34, -0.42 + row * 0.42, 0.045],
          s: [0.315, 0.38, 0.018],
        });
      }
    return parts;
  }, []);
  useFrame(({ clock }) => {
    if (animated && tracking && pivot.current)
      pivot.current.rotation.x =
        -Math.PI / 2 + 0.3 + Math.sin(clock.elapsedTime * 0.07) * 0.06;
  });
  return (
    <group position={p}>
      <Block p={[0, 0.09, 0]} s={[0.8, 0.18, 0.7]} color={C.dark} />
      <Cylinder
        p={[0, 0.55, 0]}
        radius={advanced ? 0.11 : 0.08}
        height={0.95}
        color={C.frame}
      />
      <group
        ref={pivot}
        position={[0, 1.1, 0]}
        rotation={[-Math.PI / 2 + 0.3, 0, 0]}
      >
        <Block s={[2.55, 1.48, 0.07]} color={C.dark} />
        <Instances parts={cells} color={advanced ? "#24537e" : C.cell} metal />
        {[-1, 1].map((side) => (
          <Block
            key={side}
            p={[side * 1.25, 0, 0.075]}
            s={[0.045, 1.5, 0.07]}
            color={C.frame}
            metal
          />
        ))}
        <Block
          p={[0, 0, 0.075]}
          s={[2.5, 0.025, 0.02]}
          color={C.frame}
          shadow={false}
        />
        <Beam a={[-0.85, 0, -0.12]} b={[0.85, 0, -0.12]} radius={0.04} />
      </group>
      {tracking && (
        <Beam
          a={[0.35, 0.25, 0.3]}
          b={[0.35, 0.96, 0.4]}
          radius={0.045}
          color={C.copper}
        />
      )}
    </group>
  );
}

function Battery({ p, advanced }) {
  return (
    <group position={p}>
      <Block p={[0, 0.65, 0]} s={[0.65, 1.3, 0.65]} />
      <Block p={[0, 1.34, 0]} s={[0.72, 0.08, 0.72]} color={C.dark} />
      <Block p={[0, 0.75, 0.34]} s={[0.45, 0.9, 0.03]} color={C.dark} />
      <Block p={[0, 1.05, 0.365]} s={[0.28, 0.1, 0.015]} color={C.solar} glow />
      {advanced && (
        <Block p={[0, 0.7, 0.37]} s={[0.27, 0.4, 0.025]} color={C.frame} />
      )}
    </group>
  );
}

export default function SolarModel({ level = 1, animated = true }) {
  const L = modelLevel(level, 10);
  const rows = L >= 7 ? [-1.35, 0.2, 1.75] : L >= 3 ? [-0.9, 0.9] : [0];
  return (
    <group>
      <Base accent={C.solar} level={L} max={10} />
      {[-1.45, 1.45].map((x) =>
        rows.map((z) => (
          <SolarTable
            key={`${x}-${z}`}
            p={[x, 0.3, z]}
            advanced={L >= 5}
            tracking={L >= 5}
            animated={animated}
          />
        )),
      )}
      {/* Conversion and storage share one rear service strip. */}
      <Block p={[0, 0.85, -2.55]} s={[1.4, 1.1, 0.75]} />
      <Block p={[0, 1.45, -2.55]} s={[1.55, 0.12, 0.85]} color={C.solar} />
      <Vent p={[0, 0.85, -2.13]} width={0.9} accent={C.frame} />
      {L >= 2 && (
        <Pipe
          points={[
            [-2.8, 0.4, 2.55],
            [-2.8, 0.4, -2.55],
            [2.8, 0.4, -2.55],
            [2.8, 0.4, 2.55],
          ]}
          color={C.copper}
          radius={0.04}
        />
      )}
      {L >= 3 && <Battery p={[-1.4, 0.3, -2.55]} advanced={L >= 6} />}
      {L >= 4 && <Battery p={[1.4, 0.3, -2.55]} advanced={L >= 6} />}
      {L >= 5 && (
        <Block p={[0, 1.72, -2.55]} s={[1.1, 0.4, 0.7]} color={C.dark} />
      )}
      {L >= 6 && <Radiator p={[-2.45, 0.3, -2.8]} width={0.75} height={1.2} />}
      {L >= 8 && (
        <>
          <Block p={[0, 2.15, -2.55]} s={[1.3, 0.45, 0.75]} />
          <Block
            p={[0, 2.17, -2.16]}
            s={[0.9, 0.22, 0.025]}
            color={C.solar}
            glow
          />
        </>
      )}
      {L >= 9 && <Battery p={[2.45, 0.3, -2.55]} advanced />}
      {L === 10 && (
        <>
          <Block p={[0, 2.45, -2.55]} s={[1.5, 0.12, 0.85]} color={C.solar} />
          <Beam
            a={[-2.8, 1.85, -2.9]}
            b={[2.8, 1.85, -2.9]}
            radius={0.045}
            color={C.frame}
          />
          {[-2.8, 2.8].map((x) => (
            <Beam
              key={x}
              a={[x, 0.3, -2.9]}
              b={[x, 1.85, -2.9]}
              radius={0.05}
              color={C.frame}
            />
          ))}
        </>
      )}
    </group>
  );
}
