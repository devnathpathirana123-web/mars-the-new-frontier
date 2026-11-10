import { PALETTE as C } from "./shared/palette";
import {
  Airlock,
  Base,
  Block,
  Cylinder,
  Pipe,
  Radiator,
  Ring,
  Tank,
  WindowBand,
} from "./shared/Architecture";
import { modelLevel } from "./shared/levels";

function LivingPod({ p, length = 2.8, accent = C.habitat }) {
  return (
    <group position={p}>
      <Block p={[0, 0.12, 0]} s={[1.65, 0.24, length + 0.25]} color={C.dark} />
      <mesh
        position={[0, 0.9, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.72, length - 1.44, 6, 20]} />
        <meshStandardMaterial
          color={C.shell}
          roughness={0.8}
          metalness={0.15}
        />
      </mesh>
      {[-0.65, 0, 0.65].map((z) => (
        <Ring
          key={z}
          p={[0, 0.9, z]}
          radius={0.74}
          r={[0, 0, 0]}
          tube={0.035}
        />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <WindowBand
            p={[side * 0.7, 1, 0]}
            width={length * 0.5}
            accent={accent}
            r={[0, (side * Math.PI) / 2, 0]}
          />
          <Pipe
            points={[
              [side * 0.8, 0.38, -length * 0.35],
              [side * 0.8, 0.38, length * 0.35],
            ]}
            color={accent}
          />
        </group>
      ))}
    </group>
  );
}

export default function HabitatModel({ level = 1 }) {
  const L = modelLevel(level);
  const paired = L >= 4;
  const hub = L >= 7;
  return (
    <group>
      <Base accent={C.habitat} level={L} />
      {paired ? (
        [-1, 1].map((side) => (
          <LivingPod
            key={side}
            p={[side * 1.75, 0.3, -0.2]}
            length={L >= 6 ? 3.5 : 2.8}
          />
        ))
      ) : (
        <LivingPod p={[0, 0.3, -0.1]} length={2.8 + (L - 1) * 0.25} />
      )}
      {paired && (
        <>
          <Block p={[0, 0.95, 0.3]} s={[2.3, 1.25, 1.15]} />
          <Block p={[0, 1.61, 0.3]} s={[2.5, 0.12, 1.3]} color={C.dark} />
        </>
      )}
      {hub && (
        <>
          <Cylinder p={[0, 1.2, -0.65]} radius={1.08} height={1.7} />
          <Cylinder
            p={[0, 2.12, -0.65]}
            radius={1.18}
            height={0.18}
            color={C.habitat}
          />
          <WindowBand p={[0, 1.65, 0.44]} width={1.1} accent={C.habitat} />
        </>
      )}
      {L >= 10 && (
        <>
          <Block p={[0, 2.6, -0.65]} s={[2.2, 1.1, 2]} />
          <Block p={[0, 3.2, -0.65]} s={[2.4, 0.14, 2.2]} color={C.dark} />
          <WindowBand p={[0, 2.65, 0.38]} width={1.65} accent={C.habitat} />
        </>
      )}
      {L >= 13 &&
        [-1, 1].map((side) => (
          <group key={side}>
            <Block p={[side * 1.8, 2.4, -0.7]} s={[1.1, 0.9, 1.8]} />
            <WindowBand
              p={[side * 1.8, 2.45, 0.23]}
              width={0.8}
              accent={C.habitat}
            />
            <Block
              p={[side * 1.8, 2.9, -0.7]}
              s={[1.2, 0.12, 1.9]}
              color={C.habitat}
            />
          </group>
        ))}
      <Airlock p={[0, 0.3, paired ? 1.65 : 1.25]} accent={C.habitat} />
      <Tank
        p={[-2.6, 0.3, -2.3]}
        radius={0.28}
        height={L >= 5 ? 1.65 : 1.05}
        accent={C.habitat}
      />
      {L >= 2 && (
        <Tank
          p={[-1.9, 0.3, -2.3]}
          radius={0.28}
          height={1.1}
          accent={C.habitat}
        />
      )}
      {L >= 3 && (
        <>
          <Block p={[2.55, 0.85, -2.3]} s={[0.65, 1.1, 0.8]} color={C.dark} />
          <Pipe
            points={[
              [2.55, 1.4, -2.3],
              [2.55, 2.4, -2.3],
            ]}
            radius={0.035}
          />
          <Block
            p={[2.55, 2.35, -2.3]}
            s={[0.6, 0.055, 0.055]}
            color={C.habitat}
          />
        </>
      )}
      {L >= 5 && (
        <Pipe
          points={[
            [-2.6, 0.5, -2.75],
            [2.6, 0.5, -2.75],
            [2.6, 0.5, 1.3],
          ]}
          color={C.habitat}
        />
      )}
      {L >= 8 && (
        <Radiator
          p={[-0.5, 0.3, -2.65]}
          width={1.6}
          height={L >= 12 ? 1.3 : 0.85}
        />
      )}
      {L >= 9 && <Radiator p={[1.25, 0.3, -2.65]} width={1.4} height={0.85} />}
      {L >= 11 && (
        <Block p={[0, 3.35, -0.65]} s={[1.8, 0.17, 1.6]} color={C.habitat} />
      )}
      {L >= 12 &&
        [-1, 1].map((side) => (
          <Block
            key={side}
            p={[side * 1.14, 2.6, -0.65]}
            s={[0.12, 1.1, 2.15]}
            color={C.frame}
          />
        ))}
      {L >= 14 && (
        <Ring p={[0, 3.55, -0.65]} radius={0.9} tube={0.07} color={C.habitat} />
      )}
      {L >= 15 && (
        <>
          <Cylinder
            p={[0, 3.55, -0.65]}
            radius={0.72}
            top={0.55}
            height={0.4}
            color={C.light}
          />
          <Block p={[0, 3.8, -0.65]} s={[0.8, 0.08, 0.8]} color={C.dark} />
        </>
      )}
    </group>
  );
}
