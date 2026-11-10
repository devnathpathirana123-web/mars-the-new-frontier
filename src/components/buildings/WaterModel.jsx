import { PALETTE as C } from "./shared/palette";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Base,
  Beam,
  Block,
  Cylinder,
  Pipe,
  Radiator,
  Ring,
  Tank,
  Vent,
  WindowBand,
} from "./shared/Architecture";
import { modelLevel } from "./shared/levels";

function Wellhead({ advanced, animated }) {
  const rotor = useRef(null);
  useFrame((_, delta) => {
    if (animated && rotor.current) rotor.current.rotation.y += delta * 0.7;
  });
  const height = advanced ? 2.9 : 2.3;
  return (
    <group position={[-2, 0.3, -0.7]}>
      <Block p={[0, 0.2, 0]} s={[1.5, 0.4, 1.8]} color={C.dark} />
      <Cylinder p={[0, 0.7, 0]} radius={0.4} height={0.65} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Beam
            key={`leg-${side}`}
            a={[side * 0.6, 0.25, -0.55]}
            b={[side * 0.35, height, -0.3]}
            radius={0.06}
            color={C.water}
          />
          <Beam
            key={`front-${side}`}
            a={[side * 0.6, 0.25, 0.55]}
            b={[side * 0.35, height, 0.3]}
            radius={0.06}
            color={C.water}
          />
        </group>
      ))}
      <Block p={[0, height, 0]} s={[0.95, 0.2, 0.95]} color={C.water} />
      <Cylinder
        p={[0, height / 2, 0]}
        radius={0.08}
        height={height - 0.4}
        color={C.frame}
      />
      <group ref={rotor} position={[0, 1.25, 0]}>
        <Cylinder radius={0.25} height={0.2} color={C.dark} />
        <Block s={[0.65, 0.08, 0.12]} color={C.water} />
      </group>
      <Block p={[-0.4, 0.8, 0.6]} s={[0.35, 0.8, 0.45]} />
    </group>
  );
}

export default function WaterModel({ level = 1, animated = true }) {
  const L = modelLevel(level);
  return (
    <group>
      <Base accent={C.water} level={L} />
      <Wellhead advanced={L >= 7} animated={animated} />
      <Block p={[-0.65, 0.65, 0.1]} s={[0.75, 0.7, 0.9]} color={C.dark} />
      <Cylinder
        p={[-0.65, 1.05, 0.1]}
        radius={0.25}
        height={0.45}
        color={C.water}
      />
      <Pipe
        points={[
          [-2, 0.75, 0.2],
          [-2, 0.75, 0.65],
          [-0.65, 0.75, 0.65],
          [-0.65, 0.75, -0.3],
        ]}
        color={C.water}
        radius={0.065}
      />
      <Pipe
        points={[
          [-0.65, 0.75, -0.3],
          [-0.65, 0.75, -0.7],
          [2.1, 0.75, -0.7],
        ]}
        color={C.water}
        radius={0.06}
      />
      {L >= 2 && (
        <Pipe
          points={[
            [0.35, 1.65, 0.3],
            [0.35, 1.65, -0.3],
            [1.25, 1.65, -0.3],
            [1.25, 0.75, -0.7],
          ]}
          color={C.water}
        />
      )}
      {L >= 3 && (
        <Pipe
          points={[
            [1, 1.65, 0.3],
            [1, 1.65, -0.3],
          ]}
          color={C.water}
        />
      )}
      <Tank
        p={[2.1, 0.3, -0.7]}
        radius={0.65}
        height={L >= 10 ? 2.8 : L >= 3 ? 2.15 : 1.45}
      />
      {L >= 2 && <Tank p={[0.35, 0.3, 0.3]} radius={0.22} height={1.15} />}
      {L >= 3 && <Tank p={[1, 0.3, 0.3]} radius={0.22} height={1.15} />}
      {L >= 4 && (
        <>
          <Block p={[0.3, 1.15, -1.55]} s={[1.75, 1.7, 1.6]} />
          <Block
            p={[0.3, 2.07, -1.55]}
            s={[1.95, 0.14, 1.75]}
            color={C.water}
          />
          <WindowBand p={[0.3, 1.45, -0.72]} width={1.2} accent={C.water} />
        </>
      )}
      {L >= 5 && <Vent p={[0.3, 2.4, -1.55]} accent={C.water} />}
      {L >= 6 && (
        <Tank p={[2.1, 0.3, 1.2]} radius={0.65} height={L >= 12 ? 2.8 : 2.15} />
      )}
      {L >= 7 && (
        <Pipe
          points={[
            [-2.5, 0.55, 1.8],
            [2.5, 0.55, 1.8],
            [2.5, 0.55, -0.7],
          ]}
          color={C.water}
          radius={0.09}
        />
      )}
      {L >= 8 && <Radiator p={[-0.2, 0.3, -2.65]} width={1.75} height={1.4} />}
      {L >= 9 && (
        <>
          <Block p={[-1.4, 0.85, 2.2]} s={[1.4, 1.1, 0.8]} />
          <WindowBand p={[-1.4, 1.05, 2.62]} width={0.9} accent={C.water} />
        </>
      )}
      {L >= 10 && (
        <Pipe
          points={[
            [1.35, 2.2, -0.7],
            [1.35, 2.2, 1.2],
          ]}
          color={C.water}
          radius={0.07}
        />
      )}
      {L >= 11 && <Tank p={[-2, 0.3, -2.5]} radius={0.38} height={1.7} />}
      {L >= 12 && (
        <Block p={[0.3, 2.8, -1.55]} s={[1.4, 0.45, 1.2]} color={C.dark} />
      )}
      {L >= 13 && (
        <>
          <Tank p={[-0.5, 0.3, 1.1]} radius={0.24} height={1.7} />
          <Tank p={[0.15, 0.3, 1.1]} radius={0.24} height={1.7} />
        </>
      )}
      {L >= 14 && <Radiator p={[2, 0.3, -2.65]} width={1.3} height={1.7} />}
      {L >= 15 && (
        <>
          <Block p={[-1.4, 1.5, 2.2]} s={[1.6, 0.15, 0.95]} color={C.water} />
          <Ring p={[2.1, 3.3, -0.7]} radius={0.67} color={C.water} />
          <Ring p={[2.1, 3.3, 1.2]} radius={0.67} color={C.water} />
          <Pipe
            points={[
              [-2, 2.25, -2.5],
              [-0.8, 2.25, -2.5],
              [-0.8, 2.25, -1.55],
            ]}
            color={C.water}
          />
        </>
      )}
    </group>
  );
}
