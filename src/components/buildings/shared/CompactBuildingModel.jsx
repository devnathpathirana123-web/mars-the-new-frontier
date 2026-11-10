import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

/** Recenter geometry and fit once, without enlarging beyond its reserved plot. */
export default function CompactBuildingModel({
  Model,
  level,
  animated = true,
  plotSize = 7.5,
}) {
  const modelRoot = useRef(null);
  const fitRoot = useRef(null);
  useLayoutEffect(() => {
    const root = modelRoot.current;
    const fit = fitRoot.current;
    if (!root || !fit) return;
    fit.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);
    fit.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(root);
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new THREE.Vector3());
    const localCenter = fit.worldToLocal(center.clone());
    const bottom = fit.worldToLocal(
      new THREE.Vector3(center.x, bounds.min.y, center.z),
    );
    const size = bounds.getSize(new THREE.Vector3());
    const factor = Math.min(
      1,
      (plotSize - 0.6) / Math.max(size.x, size.z, 0.001),
    );
    root.position.set(-localCenter.x, -bottom.y, -localCenter.z);
    fit.scale.setScalar(factor);
    fit.updateWorldMatrix(true, true);
  }, [Model, level, plotSize]);
  return (
    <group ref={fitRoot}>
      <group ref={modelRoot}>
        <Model level={level} animated={animated} />
      </group>
    </group>
  );
}
