// @flow

import { vec2 } from "gl-matrix";
import React from "react";
import * as THREE from "three";
import Rectangle from "./Rectangle";
import { MIN_EPOCH_WIDTH, DEFAULT_VIEW_BOUNDS } from "src/vector";

type Props = {
  onset: number,
  duration: number,
  type: string,
  scales: [any, any],
  color: THREE.Color,
  opacity: number
};

const Epoch = ({ onset, duration, type, scales, color, opacity }: Props) => {
  const p0 = vec2.fromValues(
    scales[0](onset),
    scales[1](DEFAULT_VIEW_BOUNDS.y[0])
  );

  const p1 = vec2.fromValues(
    scales[0](onset + duration) + MIN_EPOCH_WIDTH,
    scales[1](DEFAULT_VIEW_BOUNDS.y[1])
  );

  return (
    <Rectangle
      cacheKey={`${onset}-${duration}-${type}`}
      start={p0}
      end={p1}
      color={color}
      opacity={opacity}
    />
  );
};

Epoch.defaultProps = {
  color: new THREE.Color("#000"),
  opacity: 1
};

export default Epoch;
