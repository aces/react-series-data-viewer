// @flow

import {vec2} from 'gl-matrix';
import type {Vector2} from '../../vector';
import {hex2rgba} from '../../color';

type Props = {
  height: string|number,
  start: Vector2,
  end: Vector2,
  color: string,
  opacity?: number
};

const Rectangle = ({
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
    <rect
      fill={hex2rgba({color: color, alpha: opacity})}
      width={Math.abs(d[0])}
      height={Math.abs(d[1])}
      x={p[0] - Math.abs(d[0]/2)}
      y={p[1]}
    />
  );
};

Rectangle.defaultProps = {
  color: '#000000',
  opacity: 1.0,
};

export default Rectangle;
