// @flow

import * as R from "ramda";
import { vec2 } from "gl-matrix";
import React from "react";
import * as THREE from "three";
import type { Vector2 } from "src/vector";
import Object2D from "./Object2D";

const RectMesh = ({ color, opacity, ...rest }) => {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: true,
    premultipliedAlpha: true,
    side: THREE.DoubleSide
  });

  return <mesh geometry={geometry} material={material} {...rest} />;
};

const RectMeshMemo = R.memoizeWith(
  ({ cacheKey }) => cacheKey,
  props => <RectMesh {...props} />
);

type Props = {
  cacheKey?: string,
  start: Vector2,
  end: Vector2,
  color: THREE.Color,
  opacity: number
};

const Rectangle = ({
  cacheKey,
  start,
  end,
  color,
  opacity,
  ...rest
}: Props) => {
  const d = vec2.create();
  vec2.sub(d, end, start);

  const p = vec2.create();
  vec2.add(p, start, end);
  vec2.scale(p, p, 1 / 2);

  return (
    <Object2D
      position={p}
      scale={
        new THREE.Vector3(Math.abs(d[0]) + 0.0001, Math.abs(d[1]) + 0.0001, 1)
      }
    >
      {cacheKey ? (
        <RectMeshMemo color={color} opacity={opacity} {...rest} />
      ) : (
        <RectMesh color={color} opacity={opacity} {...rest} />
      )}
    </Object2D>
  );
};

Rectangle.defaultProps = {
  color: new THREE.Color("#000"),
  opacity: 1.0
};

export default Rectangle;
