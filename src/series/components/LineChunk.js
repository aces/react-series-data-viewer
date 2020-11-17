// @flow

import * as R from 'ramda';
import {scaleLinear} from 'd3-scale';
import {vec2} from 'gl-matrix';
import * as THREE from 'three';
import {colorOrder} from '../../color';
import type {Chunk} from '../store/types';
import Object2D from './Object2D';
import Line from './Line';

const LineMemo = R.memoizeWith(
  ({interval, amplitudeScale, channelIndex, traceIndex, chunkIndex}) =>
    `${interval[0]},${interval[1]},${amplitudeScale}-${channelIndex}-${traceIndex}-${chunkIndex}`,
  ({
    channelIndex,
    traceIndex,
    chunkIndex,
    interval,
    seriesRange,
    amplitudeScale,
    values,
    ...rest
}) => {
    const scales = [
      scaleLinear()
        .domain(interval)
        .range([-0.5, 0.5]),
      scaleLinear()
        .domain(seriesRange.map((x) => (x * amplitudeScale)))
        .range([-0.5, 0.5]),
    ];

    const points = values.map((value, i) =>
      vec2.fromValues(
        scales[0](
          interval[0] + (i / values.length) * (interval[1] - interval[0])
        ),
        scales[1](value)
      )
    );
    return (
      <Line
        cacheKey={`${interval[0]},${interval[1]},${amplitudeScale}-${channelIndex}-${traceIndex}-${chunkIndex}`}
        points={points}
        {...rest}
      />
    );
  }
);

type Props = {
  channelIndex: number,
  traceIndex: number,
  chunkIndex: number,
  chunk: Chunk,
  seriesRange: [number, number],
  amplitudeScale: number,
  scales: [any, any],
  color?: THREE.Color
};

const LineChunk = ({
  channelIndex,
  traceIndex,
  chunkIndex,
  chunk,
  seriesRange,
  amplitudeScale,
  scales,
  color,
  ...rest
}: Props) => {
  const {interval, values} = chunk;

  if (values.length === 0) {
    return <Object2D />;
  }

  const range = scales[1].range();
  const chunkLength = Math.abs(scales[0](interval[1]) - scales[0](interval[0]));

  const chunkHeight = Math.abs(range[1] - range[0]);

  const p0 = vec2.fromValues(
    (scales[0](interval[0]) + scales[0](interval[1])) / 2,
    (range[0] + range[1]) / 2
  );

  const lineColor = new THREE.Color(
    colorOrder(channelIndex) || new THREE.Color('#666')
  );

  return (
    <Object2D
      position={p0}
      scale={new THREE.Vector3(chunkLength, chunkHeight, 1)}
    >
      <LineMemo
        channelIndex={channelIndex}
        traceIndex={traceIndex}
        chunkIndex={chunkIndex}
        values={values}
        interval={interval}
        seriesRange={seriesRange}
        amplitudeScale={amplitudeScale}
        color={lineColor}
        {...rest}
      />
    </Object2D>
  );
};

export default LineChunk;
