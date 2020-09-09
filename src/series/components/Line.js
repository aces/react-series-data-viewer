// @flow

import * as R from 'ramda';
import React from 'react';
import * as THREE from 'three';
import type {Vector2} from 'src/vector';

const lineGeometry = ({points}) => {
  const geometry = new THREE.Geometry();
  geometry.vertices = points.map((p) => new THREE.Vector3(p[0], p[1], 0));
  return geometry;
};

const lineGeometryMemo = R.memoizeWith(
  ({cacheKey}) => cacheKey,
  lineGeometry
);

const lineMaterial = ({linewidth, color}) => {
  const material = new THREE.LineBasicMaterial({color, linewidth});
  return material;
};

const lineMaterialMemo = R.memoizeWith(
  ({cacheKey}) => cacheKey,
  lineMaterial
);

type Props = {
  cacheKey?: any,
  points: Vector2[],
  linewidth: number,
  color: THREE.Color
};

const Line = ({cacheKey, points, linewidth, color}: Props) => {
  const geometry = cacheKey
    ? lineGeometryMemo({cacheKey, points})
    : lineGeometry({points});

  const material = cacheKey
    ? lineMaterialMemo({cacheKey, linewidth, color})
    : lineMaterial({linewidth, color});

  return <line geometry={geometry} material={material} />;
};

Line.defaultProps = {
  color: new THREE.Color('#000'),
  linewidth: 1,
};

export default Line;
