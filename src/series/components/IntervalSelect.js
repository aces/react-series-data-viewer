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
import React, {useCallback, useEffect, useState} from 'react';
import {Button, Row, Col} from 'reactstrap';
import {setInterval} from '../store/state/bounds';

type Props = {
  viewerHeight: number,
  seriesViewerWidth: number,
  domain: [number, number],
  interval: [number, number],
  setInterval: [number, number] => void,
  dragStart: number => void,
  dragContinue: number => void,
  dragEnd: number => void,
};

const IntervalSelect = ({
  viewerHeight,
  seriesViewerWidth,
  domain,
  interval,
  setInterval,
  dragStart,
  dragContinue,
  dragEnd,
}: Props) => {
  const [refNode, setRefNode] = useState(null);
  const [bounds, setBounds] = useState(null);
  const getBounds = useCallback((domNode) => {
    if (domNode) {
      setRefNode(domNode);
    }
  }, []);

  useEffect(() => {
    if (refNode) {
      setBounds(refNode.getBoundingClientRect());
    }
  }, [seriesViewerWidth]);

  const topLeft = vec2.fromValues(
    -seriesViewerWidth/2,
    viewerHeight/2
  );
  const bottomRight = vec2.fromValues(
    seriesViewerWidth/2,
    -viewerHeight/2
  );

  const scale = scaleLinear()
    .domain(domain)
    .range([-seriesViewerWidth/2, seriesViewerWidth/2]);

  const ySlice = (x) => ({
    p0: vec2.fromValues(x, topLeft[1]),
    p1: vec2.fromValues(x, bottomRight[1]),
  });

  const start = ySlice(scale(interval[0])).p1[0];
  const end = ySlice(scale(interval[1])).p0[0];
  const width = Math.abs(end - start);
  const center = (start + end) / 2;

  const BackShadowLayer = ({interval}) => (
    <>
      <rect
        fill='#E4EBF2'
        stroke='#C3D5DB'
        width={width}
        height={'100%'}
        x={center - width/2}
        y={-viewerHeight/2}
      />
    </>
  );

  const AxisLayer = ({viewerWidth, viewerHeight, domain}) => (
    <Group top={viewerHeight/2} left={-viewerWidth/2}>
      <Axis domain={domain} range={[0, viewerWidth]} orientation='top' />
    </Group>
  );

  const onMouseMove = (v) => {
    const x = Math.min(1, Math.max(0, (v.pageX - bounds.x)/bounds.width));
    return (dragContinue)(x);
  };

  const onMouseUp = (v) => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    const x = Math.min(100, Math.max(0, (v.pageX - bounds.x)/bounds.width));
    return (dragEnd)(x);
  };

  return (
    <Row className='no-gutters'>
      <Col
        xs={2}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>Timeline range</div>
        <Button
          onClick={() => setInterval([domain[0], domain[1]])}
        >Reset</Button>
      </Col>
      <div className='col-xs-10' style={{height: viewerHeight}} ref={getBounds}>
        <ResponsiveViewer
          mouseDown={(v) => {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            R.compose(dragStart, R.nth(0))(v);
          }}
        >
          <BackShadowLayer interval={interval} />
          <AxisLayer domain={domain} />
        </ResponsiveViewer>
      </div>
    </Row>
  );
};

IntervalSelect.defaultProps = {
  viewerHeight: 50,
  seriesViewerWidth: 400,
  domain: [0, 1],
  interval: [0.25, 0.75],
};

export default connect(
  (state) => ({
    domain: state.bounds.domain,
    interval: state.bounds.interval,
    seriesViewerWidth: state.bounds.viewerWidth,
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
    setInterval: R.compose(
      dispatch,
      setInterval
    ),
  })
)(IntervalSelect);
