// @flow

import * as R from 'ramda';
import {vec2} from 'gl-matrix';
import {Group} from '@visx/group';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3-scale';
import {
  startDragInterval,
  continueDragInterval,
  endDragInterval,
} from '../store/logic/dragBounds';
import ResponsiveViewer from './ResponsiveViewer';
import Axis from './Axis';
import {withParentSize} from '@visx/responsive';
import {hex2rgba} from '../../color';

type Props = {
  parentWidth: number,
  parentHeight: number,
  domain: [number, number],
  interval: [number, number],
  dragStart: number => void,
  dragContinue: number => void,
  dragEnd: number => void
};

const IntervalSelect = ({
  parentWidth,
  parentHeight,
  domain,
  interval,
  dragStart,
  dragContinue,
  dragEnd,
}: Props) => {
  const topLeft = vec2.fromValues(
    -parentWidth/2,
    parentHeight/2
  );
  const bottomRight = vec2.fromValues(
    parentWidth/2,
    -parentHeight/2
  );

  const scale = scaleLinear()
    .domain(domain)
    .range([-parentWidth/2, parentWidth/2]);

  const ySlice = (x) => ({
    p0: vec2.fromValues(x, topLeft[1]),
    p1: vec2.fromValues(x, bottomRight[1]),
  });

  const leftStart = topLeft[0];
  const leftEnd = ySlice(scale(interval[0])).p1[0];
  const leftWidth = Math.abs(leftEnd - leftStart);
  const leftCenter = (leftStart + leftEnd) / 2;

  const rightStart = ySlice(scale(interval[1])).p0[0];
  const rightEnd = bottomRight[0];
  const rightWidth = Math.abs(rightEnd - rightStart);
  const rightCenter = (rightStart + rightEnd) / 2;

  const BackShadowLayer = ({interval}) => (
    <svg viewBox={[-parentWidth/2, 0, parentWidth, parentHeight].join(' ')}>
      <rect
        fill={hex2rgba({color: '#aaaaaa', alpha: 0.3})}
        width={leftWidth}
        height={'100%'}
        x={leftCenter - leftWidth/2}
      />
      <rect
        fill={hex2rgba({color: '#aaaaaa', alpha: 0.3})}
        width={rightWidth}
        height={'100%'}
        x={rightCenter - rightWidth/2}
      />
    </svg>
  );

  const AxisLayer = ({viewerWidth, viewerHeight, domain}) => (
    <Group top={viewerHeight - 1}>
      <Axis domain={domain} range={[0, viewerWidth]} orientation='top' />
    </Group>
  );

  return (
    <ResponsiveViewer
      transparent={true}
      mouseDown={(v) => {
        R.compose(
          dragStart,
          R.nth(0)
        )(v);
      }}
      mouseMove={(v) => {
        R.compose(
          dragContinue,
          R.nth(0)
        )(v);
      }}
      mouseUp={(v) => {
        R.compose(
          dragEnd,
          R.nth(0)
        )(v);
      }}
    >
      <AxisLayer viewerWidth={0} viewerHeight={0} domain={domain} />
      <BackShadowLayer interval={interval} />
    </ResponsiveViewer>
  );
};

IntervalSelect.defaultProps = {
  parentWidth: 400,
  parentHeight: 50,
  domain: [0, 1],
  interval: [0.25, 0.75],
};

export default R.compose(
  connect(
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
  ),
  withParentSize
)(IntervalSelect);
