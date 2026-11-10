import { useMemo } from "react";
import * as THREE from "three";
import { networkStatus, validateLink } from "../game/networks";

const COLORS = { power: "#e6b863", water: "#55bddd", corridor: "#92c6ae" };
const RADIUS = { power: 0.045, water: 0.075, corridor: 0.38 };
const CLEARANCE = { power: 0.16, water: 0.28, corridor: 0.65 };

/** Sample terrain at every point rather than smoothing between sampled heights. */
class TerrainRoute extends THREE.Curve {
  constructor(from, to, kind, heightAt) {
    super();
    this.from = from;
    this.dx = to.x - from.x;
    this.dz = to.z - from.z;
    this.distance = Math.hypot(this.dx, this.dz);
    this.heightAt = heightAt;
    this.clearance = CLEARANCE[kind];
    this.offset = kind === "water" ? 0.45 : kind === "power" ? -0.45 : 0;
    // Short imported routes must never reverse their endpoint order.
    this.inset = Math.min(3.12 / this.distance, 0.49);
  }

  getPoint(t, target = new THREE.Vector3()) {
    const along = this.inset + t * (1 - 2 * this.inset);
    const x =
      this.from.x + this.dx * along - (this.dz / this.distance) * this.offset;
    const z =
      this.from.z + this.dz * along + (this.dx / this.distance) * this.offset;
    return target.set(x, this.heightAt(x, z) + this.clearance, z);
  }
}

function UtilityRoute({
  from,
  to,
  kind,
  heightAt,
  active,
  dimmed,
  preview = false,
  valid = true,
}) {
  const curve = useMemo(() => {
    if (Math.hypot(to.x - from.x, to.z - from.z) < 0.001) return null;
    return new TerrainRoute(from, to, kind, heightAt);
  }, [from, to, kind, heightAt]);
  if (!curve) return null;
  const radius = RADIUS[kind] * (preview ? 1.7 : 1);
  const segments = Math.max(32, Math.ceil(curve.distance * 4));
  const color = preview
    ? valid
      ? "#74ffd1"
      : "#ff927b"
    : active
      ? COLORS[kind]
      : "#62666a";
  // Close support spacing also keeps a long pressurized route visually grounded.
  const supportCount = Math.max(2, Math.ceil((curve.distance - 6.24) / 4) + 1);
  return (
    <group raycast={() => {}}>
      <mesh raycast={() => {}} castShadow receiveShadow>
        <tubeGeometry
          args={[curve, segments, radius, kind === "corridor" ? 6 : 8, false]}
        />
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.65}
          transparent={preview || dimmed}
          depthWrite={!preview}
          wireframe={preview}
          emissive={preview ? color : "#000000"}
          emissiveIntensity={preview ? 0.5 : 0}
          opacity={preview ? 0.55 : dimmed ? 0.25 : 1}
        />
      </mesh>
      {Array.from({ length: preview ? 0 : supportCount }, (_, i) => {
        const point = curve.getPoint(i / (supportCount - 1));
        const ground = heightAt(point.x, point.z);
        const bottom = ground + 0.025;
        const top = point.y - radius + 0.025;
        const height = Math.max(0.03, top - bottom);
        const material = {
          color: active ? COLORS[kind] : "#62666a",
          roughness: 0.8,
          transparent: dimmed,
          opacity: dimmed ? 0.25 : 1,
        };
        return (
          <group key={i}>
            <mesh
              position={[point.x, bottom + height / 2, point.z]}
              raycast={() => {}}
              castShadow
            >
              <boxGeometry
                args={[
                  kind === "corridor" ? 0.3 : 0.16,
                  height,
                  kind === "corridor" ? 0.3 : 0.16,
                ]}
              />
              <meshStandardMaterial {...material} />
            </mesh>
            <mesh
              position={[point.x, ground + 0.02, point.z]}
              raycast={() => {}}
              receiveShadow
            >
              <boxGeometry
                args={[
                  kind === "corridor" ? 0.5 : 0.3,
                  0.04,
                  kind === "corridor" ? 0.5 : 0.3,
                ]}
              />
              <meshStandardMaterial {...material} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function Infrastructure({
  game,
  heightAt,
  activeKind,
  report,
  previewFrom,
  previewPoint,
}) {
  const status = useMemo(() => networkStatus(game), [game]);
  const buildings = new Map(
    game.buildings.map((building) => [building.id, building]),
  );
  return (
    <group name="colony-infrastructure">
      {activeKind &&
        previewFrom &&
        previewPoint &&
        buildings.get(previewFrom) &&
        (() => {
          const from = buildings.get(previewFrom);
          const target = [...buildings.values()].find(
            (b) => b.x === previewPoint[0] && b.z === previewPoint[2],
          );
          const to = target ?? { x: previewPoint[0], z: previewPoint[2] };
          return (
            <UtilityRoute
              from={from}
              to={to}
              kind={activeKind}
              heightAt={heightAt}
              preview
              valid={Boolean(
                target &&
                validateLink(game, {
                  kind: activeKind,
                  from: from.id,
                  to: target.id,
                }).valid,
              )}
            />
          );
        })()}
      {(game.links ?? []).map((link) => {
        const from = buildings.get(link.from),
          to = buildings.get(link.to);
        if (!from || !to || !COLORS[link.kind]) return null;
        return (
          <UtilityRoute
            key={link.id}
            from={from}
            to={to}
            kind={link.kind}
            heightAt={heightAt}
            active={
              link.kind === "water" && report
                ? report.byBuilding[from.id]?.waterConnected &&
                  report.byBuilding[to.id]?.waterConnected
                : status.byBuilding[from.id]?.[link.kind] &&
                  status.byBuilding[to.id]?.[link.kind]
            }
            dimmed={Boolean(activeKind && activeKind !== link.kind)}
          />
        );
      })}
    </group>
  );
}
