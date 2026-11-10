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
  Ring,
  Vent,
} from "./shared/Architecture";
import { modelLevel } from "./shared/levels";

function Headframe({ level, animated }) {
  const cutter = useRef(null);
  const height = level >= 13 ? 4.5 : level >= 7 ? 3.6 : level >= 4 ? 3 : 2.3;
  useFrame((_, delta) => {
    if (animated && cutter.current) cutter.current.rotation.y += delta * 0.6;
  });
  return (
    <group position={[-1.9, 0.3, -0.7]}>
      <Block p={[0, 0.18, 0]} s={[1.75, 0.36, 2.1]} color={C.dark} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <Beam
            key={`${x}-${z}`}
            a={[x * 0.7, 0.2, z * 0.8]}
            b={[x * 0.5, height, z * 0.55]}
            radius={0.07}
            color={C.mine}
          />
        )),
      )}
      {[0.9, 1.6, ...(level >= 4 ? [2.3] : []), ...(level >= 7 ? [3] : [])].map(
        (y) =>
          [-1, 1].map((side) => (
            <group key={`${y}-${side}`}>
              <Beam
                a={[-0.65, y - 0.6, side * 0.7]}
                b={[0.55, y, side * 0.6]}
              />
              <Beam a={[-0.6, y, side * 0.65]} b={[0.6, y, side * 0.65]} />
            </group>
          )),
      )}
      <Block p={[0, height, 0]} s={[1.55, 0.26, 1.65]} color={C.mine} />
      <Cylinder
        p={[0, height * 0.48, 0]}
        radius={0.1}
        height={height * 0.85}
        color={C.frame}
      />
      <group ref={cutter} position={[0, 0.48, 0]}>
        <Cylinder radius={0.4} height={0.25} color={C.dark} />
        {[0, 1, 2, 3].map((i) => (
          <Block
            key={i}
            p={[0, 0.05, 0]}
            s={[0.95, 0.1, 0.15]}
            r={[0, (i * Math.PI) / 4, 0]}
            color={C.mine}
          />
        ))}
      </group>
      {level >= 5 && (
        <Block
          p={[0, height - 0.4, 0.65]}
          s={[0.9, 0.6, 0.35]}
          color={C.dark}
        />
      )}
      {level >= 14 && (
        <Ring p={[0, height + 0.3, 0]} radius={0.55} color={C.mine} />
      )}
    </group>
  );
}

function Conveyor({ animated }) {
  const ore = useRef(null);
  const pieces = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        p: [-1.05 + i * 0.5, 0, 0],
        s: [0.24, 0.17, 0.24],
        r: [0, i, 0.2],
      })),
    [],
  );
  useFrame(({ clock }) => {
    if (animated && ore.current)
      ore.current.position.x = (clock.elapsedTime * 0.25) % 0.5;
  });
  return (
    <group position={[0.25, 0.88, 0.8]}>
      <Block s={[3.7, 0.16, 0.65]} color={C.dark} />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          p={[0, 0.15, side * 0.36]}
          s={[3.8, 0.25, 0.08]}
          color={C.frame}
        />
      ))}
      <group ref={ore} position={[0, 0.2, 0]}>
        <Instances parts={pieces} color="#9e6247" shape="ore" />
      </group>
      {[-1.4, 1.4].map((x) => (
        <Block key={x} p={[x, -0.3, 0]} s={[0.12, 0.6, 0.55]} color={C.frame} />
      ))}
    </group>
  );
}

export default function MineModel({ level = 1, animated = true }) {
  const L = modelLevel(level);
  const trolley = useRef(null);
  useFrame(({ clock }) => {
    if (animated && trolley.current)
      trolley.current.position.x = 1 + Math.sin(clock.elapsedTime * 0.3) * 0.65;
  });
  return (
    <group>
      <Base accent={C.mine} level={L} />
      <Headframe level={L} animated={animated} />
      {/* Intake hopper, directly beside the extraction unit. */}
      <Cylinder
        p={[-0.15, 0.95, -0.6]}
        radius={0.32}
        top={0.65}
        height={0.8}
        color={C.mine}
      />
      <Cylinder
        p={[-0.15, 1.36, -0.6]}
        radius={0.57}
        height={0.025}
        color={C.dark}
      />
      <Block p={[-0.15, 0.45, -0.6]} s={[0.75, 0.3, 0.75]} color={C.dark} />
      {L >= 2 && <Conveyor animated={animated} />}
      {L >= 3 && (
        <>
          <Block p={[0.65, 1.05, -0.8]} s={[0.95, 1.5, 1.65]} color={C.dark} />
          <Block p={[0.65, 1.85, -0.8]} s={[1.08, 0.18, 1.8]} color={C.mine} />
          <Vent p={[0.65, 1, 0.08]} width={0.65} />
        </>
      )}
      {L >= 4 && (
        <>
          <Cylinder p={[2.25, 1.25, -0.85]} radius={0.58} height={1.9} />
          <Cylinder
            p={[2.25, 2.3, -0.85]}
            radius={0.65}
            top={0.15}
            height={0.35}
            color={C.mine}
          />
          <Pipe
            points={[
              [1.12, 1.5, -0.8],
              [1.55, 1.5, -0.8],
              [1.55, 2.15, -0.8],
              [2.25, 2.15, -0.8],
            ]}
          />
        </>
      )}
      {L >= 5 && (
        <Block p={[0.5, 0.8, 2.2]} s={[1.5, 1, 0.9]} color={C.shell} />
      )}
      {L >= 6 && <Radiator p={[0.3, 0.3, -2.6]} width={1.5} height={1.15} />}
      {L >= 7 && (
        <>
          <Block p={[0.65, 2.25, -0.8]} s={[1.05, 0.65, 1.6]} />
          <Block p={[0.65, 2.63, -0.8]} s={[1.2, 0.12, 1.8]} color={C.mine} />
        </>
      )}
      {L >= 8 && (
        <Cylinder
          p={[2.25, 2.7, -0.85]}
          radius={0.56}
          height={0.65}
          color={C.dark}
        />
      )}
      {L >= 9 && (
        <>
          {[-0.5, 2.65].map((x) => (
            <Beam
              key={x}
              a={[x, 0.3, -2.1]}
              b={[x, 3.4, -2.1]}
              radius={0.085}
              color={C.mine}
            />
          ))}
          <Block p={[1.07, 3.4, -2.1]} s={[3.45, 0.25, 0.38]} color={C.mine} />
          <group ref={trolley} position={[1, 3.2, -2.1]}>
            <Block s={[0.6, 0.25, 0.55]} color={C.dark} />
            <Beam a={[0, -0.1, 0]} b={[0, -1, 0]} radius={0.02} />
            <Ring
              p={[0, -1.1, 0]}
              radius={0.12}
              r={[0, 0, 0]}
              tube={0.025}
              color={C.mine}
            />
          </group>
        </>
      )}
      {L >= 10 && (
        <Block p={[-2.2, 0.65, 2.15]} s={[1.1, 0.7, 1.05]} color={C.mine} />
      )}
      {L >= 11 && (
        <Pipe
          points={[
            [-2.5, 0.45, -2.7],
            [2.6, 0.45, -2.7],
            [2.6, 0.45, 1.5],
          ]}
          radius={0.07}
        />
      )}
      {L >= 12 && <Radiator p={[-1.8, 0.3, -2.65]} width={1.5} height={1.4} />}
      {L >= 13 && (
        <Block p={[0.55, 3, -0.85]} s={[1.05, 0.65, 1.4]} color={C.dark} />
      )}
      {L >= 14 && (
        <Block p={[2.25, 3.2, -0.85]} s={[1.2, 0.18, 1.2]} color={C.mine} />
      )}
      {L >= 15 && (
        <>
          <Block p={[1.07, 3.78, -2.1]} s={[3.45, 0.15, 0.45]} color={C.dark} />
          {[-0.25, 0.5, 1.25, 2].map((x) => (
            <Beam
              key={x}
              a={[x, 3.52, -2.1]}
              b={[x + 0.4, 3.78, -2.1]}
              color={C.mine}
            />
          ))}
          <Block p={[0.65, 3.38, -0.85]} s={[1.2, 0.12, 1.55]} color={C.mine} />
        </>
      )}
    </group>
  );
}
