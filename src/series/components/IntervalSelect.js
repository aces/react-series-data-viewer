// @flow

import * as R from 'ramda';
import {vec2} from 'gl-matrix';
import React from 'react';
import {Group} from '@vx/vx';
import {connect} from 'react-redux';
import * as THREE from 'three';
import {scaleLinear} from 'd3-scale';
import {DEFAULT_VIEW_BOUNDS} from '../../vector';
import {
  startDragInterval,
  continueDragInterval,
  endDragInterval,
} from '../store/logic/drag-bounds';
import ResponsiveViewer from './ResponsiveViewer';
import RenderLayer from './RenderLayer';
import Object2D from './Object2D';
import Axis from './Axis';
import Rectangle from './Rectangle';

type Props = {
  domain: [number, number],
  interval: [number, number],
  dragStart: number => void,
  dragContinue: number => void,
  dragEnd: number => void
};

const IntervalSelect = ({
  domain,
  interval,
  dragStart,
  dragContinue,
  dragEnd,
}: Props) => {
  const topLeft = vec2.fromValues(
    DEFAULT_VIEW_BOUNDS.x[0],
    DEFAULT_VIEW_BOUNDS.y[1]
  );
  const bottomRight = vec2.fromValues(
    DEFAULT_VIEW_BOUNDS.x[1],
    DEFAULT_VIEW_BOUNDS.y[0]
  );
  const center = vec2.create();
  vec2.add(center, topLeft, bottomRight);
  vec2.scale(center, center, 1 / 2);
  const scale = scaleLinear()
    .domain(domain)
    .range(DEFAULT_VIEW_BOUNDS.x);
  const ySlice = (x) => ({
    p0: vec2.fromValues(x, topLeft[1]),
    p1: vec2.fromValues(x, bottomRight[1]),
  });
  const BackShadowLayer = ({interval}) => (
    <Object2D position={center} layer={1}>
      <Rectangle
        color={new THREE.Color('#aaa')}
        opacity={0.3}
        start={vec2.clone(topLeft)}
        end={ySlice(scale(interval[0])).p1}
      />
      <Rectangle
        color={new THREE.Color('#aaa')}
        opacity={0.3}
        start={ySlice(scale(interval[1])).p0}
        end={bottomRight}
      />
    </Object2D>
  );
  const AxisLayer = ({viewerWidth, viewerHeight, domain}) => (
    <Group top={viewerHeight - 1}>
      <Axis domain={domain} range={[0, viewerWidth]} orientation='top' />
    </Group>
  );

  return (
    <ResponsiveViewer
      transparent={true}
      mouseDown={R.compose(
        dragStart,
        scale.invert,
        R.nth(0)
      )}
      mouseMove={R.compose(
        dragContinue,
        scale.invert,
        R.nth(0)
      )}
      mouseUp={R.compose(
        dragEnd,
        scale.invert,
        R.nth(0)
      )}
    >
      <RenderLayer svg>
        <AxisLayer viewerWidth={0} viewerHeight={0} domain={domain} />
      </RenderLayer>
      <RenderLayer three>
        <BackShadowLayer interval={interval} />
      </RenderLayer>
    </ResponsiveViewer>
  );
};

IntervalSelect.defaultProps = {
  domain: [0, 1],
  interval: [0.25, 0.75],
};

export default connect(
  (state) => ({
    domain: state.bounds.domain,
    interval: state.bounds.interval,
  }),
  (dispatch: any => void) => ({
    dragStart: R.compose(
      dispatch,
      startDragInterval
    ),
    dragContinue: R.compose(
      dispatch,
      continueDragInterval
    ),
    dragEnd: R.compose(
      dispatch,
      endDragInterval
    ),
  })
)(IntervalSelect);
