// @flow

import {vec2, glMatrix} from 'gl-matrix';

export type Vector2 = typeof glMatrix.ARRAY_TYPE;

export const ap = (f: [(any) => any, (any) => any], p: Vector2): Vector2 =>
  vec2.fromValues(f[0](p[0]), f[1](p[1]));

export const DEFAULT_VIEW_BOUNDS = {
  x: [-1, 1],
  y: [-1, 1],
};

export const MIN_INTERVAL_FACTOR = 0.005;

export const MIN_EPOCH_WIDTH = 1 / 200;

export const MAX_VIEWED_CHUNKS = 3;

export const MAX_RENDERED_EPOCHS = 100;
