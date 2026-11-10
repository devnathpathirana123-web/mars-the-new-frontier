import { PALETTE as C } from "./shared/palette";
import { useMemo } from "react";
import {
  Airlock,
  Base,
  Beam,
  Block,
  Glass,
  Instances,
  Pipe,
  Radiator,
  Tank,
  Vent,
} from "./shared/Architecture";
import { modelLevel } from "./shared/levels";

function GrowingBay({ x, tiers, shade }) {
  const cropParts = useMemo(() => {
    const parts = [];
    for (let t = 0; t < tiers; t++)
      for (let row = 0; row < 7; row++) {
        for (const side of [-1, 1])
          parts.push({
            p: [side * 0.24, 0.85 + t * 0.55, -1.2 + row * 0.4],
            s: [0.32, 0.24, 0.28],
            r: [0, row * 0.6, 0.15 * side],
          });
      }
    return parts;
  }, [tiers]);
  const height = tiers === 3 ? 2.8 : 2.4;
  return (
    <group position={[x, 0.3, -0.4]}>
      <Block p={[0, 0.22, 0]} s={[1.65, 0.44, 3.6]} color={C.shell} />
      {Array.from({ length: tiers }, (_, i) => (
        <group key={i}>
          <Block
            p={[0, 0.65 + i * 0.55, 0]}
            s={[1.24, 0.1, 3]}
            color={C.dark}
          />
          <Block
            p={[0, 1.02 + i * 0.55, 0]}
            s={[0.65, 0.035, 2.85]}
            color="#c0dfb1"
            glow
            shadow={false}
          />
        </group>
      ))}
      <Instances parts={cropParts} color={C.greenhouse} shape="leaf" />
      {[-1.8, -0.9, 0, 0.9, 1.8].map((z) => (
        <group key={z}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Beam
                a={[side * 0.83, 0.4, z]}
                b={[side * 0.83, height - 0.5, z]}
                radius={0.045}
              />
              <Beam
                a={[side * 0.83, height - 0.5, z]}
                b={[0, height, z]}
                radius={0.05}
              />
            </group>
          ))}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Glass
            p={[side * 0.83, height / 2 + 0.05, 0]}
            s={[0.025, height - 0.85, 3.55]}
          />
          <Glass
            p={[side * 0.415, height - 0.25, 0]}
            s={[0.97, 0.025, 3.55]}
            r={[0, 0, -side * Math.atan2(0.5, 0.83)]}
          />
          <Beam
            a={[side * 0.83, height - 0.5, -1.8]}
            b={[side * 0.83, height - 0.5, 1.8]}
            radius={0.05}
            color={C.greenhouse}
          />
          <Pipe
            points={[
              [side * 0.68, 0.5, -1.65],
              [side * 0.68, 0.5, 1.65],
            ]}
            color={C.greenhouse}
            radius={0.03}
          />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <Glass
          key={side}
          p={[0, height / 2, side * 1.8]}
          s={[1.5, height - 0.55, 0.025]}
        />
      ))}
      <Beam a={[0, height, -1.8]} b={[0, height, 1.8]} radius={0.055} />
      {shade &&
        [-1.25, 0, 1.25].map((z) => (
          <Block
            key={z}
            p={[0, height + 0.03, z]}
            s={[1.2, 0.045, 0.28]}
            color={C.light}
          />
        ))}
    </group>
  );
}

export default function GreenhouseModel({ level = 1 }) {
  const L = modelLevel(level, 10);
  const bays = L >= 7 ? [-1.8, 0, 1.8] : L >= 3 ? [-0.95, 0.95] : [0];
  return (
    <group>
      <Base accent={C.greenhouse} level={L} max={10} />
      {bays.map((x) => (
        <GrowingBay
          key={x}
          x={x}
          tiers={L >= 6 ? 3 : L >= 3 ? 2 : 1}
          shade={L >= 5}
        />
      ))}
      <Block
        p={[0, 0.95, 1.75]}
        s={[bays.length === 1 ? 1.8 : 5.3, 1.3, 0.65]}
      />
      <Block
        p={[0, 1.65, 1.75]}
        s={[bays.length === 1 ? 1.9 : 5.5, 0.1, 0.75]}
        color={C.greenhouse}
      />
      <Airlock p={[0, 0.3, 2.05]} accent={C.greenhouse} scale={0.8} />
      <Block p={[0, 0.9, -2.55]} s={[2.2, 1.2, 0.8]} color={C.shell} />
      <Vent p={[0, 1, -2.1]} width={0.8} accent={C.greenhouse} />
      {L >= 2 && (
        <Tank
          p={[-2.45, 0.3, -2.55]}
          radius={0.33}
          height={1.2}
          accent={C.greenhouse}
        />
      )}
      {L >= 4 && (
        <Tank
          p={[2.45, 0.3, -2.55]}
          radius={0.33}
          height={1.5}
          accent={C.greenhouse}
        />
      )}
      {L >= 5 && <Radiator p={[1.6, 0.3, -2.9]} width={0.7} height={1.1} />}
      {L >= 7 && (
        <Pipe
          points={[
            [-2.45, 0.48, -2.8],
            [2.45, 0.48, -2.8],
          ]}
          color={C.greenhouse}
          radius={0.07}
        />
      )}
      {L >= 8 && (
        <Block p={[0, 1.7, -2.55]} s={[1.8, 0.35, 0.65]} color={C.dark} />
      )}
      {L >= 9 && (
        <>
          <Block p={[0, 2.1, -2.55]} s={[1.3, 0.45, 0.6]} />
          <Block
            p={[0, 2.12, -2.23]}
            s={[0.9, 0.2, 0.025]}
            color={C.greenhouse}
            glow
          />
        </>
      )}
      {L === 10 && (
        <>
          <Tank
            p={[-1.45, 0.3, -2.55]}
            radius={0.28}
            height={1.9}
            accent={C.greenhouse}
          />
          <Tank
            p={[1.45, 0.3, -2.55]}
            radius={0.28}
            height={1.9}
            accent={C.greenhouse}
          />
        </>
      )}
    </group>
  );
}
