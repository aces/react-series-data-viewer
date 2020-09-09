// @flow

import * as R from 'ramda';
import React from 'react';
import type {Node} from 'react';
import {Canvas} from 'react-three-fiber';
import {scaleLinear} from 'd3-scale';
import 'resize-observer-polyfill/dist/ResizeObserver.global';
// $FlowFixMe
import withResizeObserverProps from '@hocs/with-resize-observer-props';
import {DEFAULT_VIEW_BOUNDS} from '../../vector';
import type {Vector2} from '../../vector';

type Props = {
  onRef?: any,
  containerWidth: number,
  containerHeight: number,
  transparent: boolean,
  mouseDown: Vector2 => void,
  mouseMove: Vector2 => void,
  mouseUp: Vector2 => void,
  children: Node
};

const ResponsiveViewer = ({
  onRef,
  containerWidth,
  containerHeight,
  transparent,
  mouseDown,
  mouseMove,
  mouseUp,
  children,
}: Props) => {
  const width = containerWidth;
  const height = containerHeight - 4;

  DEFAULT_VIEW_BOUNDS.x[0] = -width/2;
  DEFAULT_VIEW_BOUNDS.x[1] = width/2;
  DEFAULT_VIEW_BOUNDS.y[0] = -height/2;
  DEFAULT_VIEW_BOUNDS.y[1] = height/2;

  const provision = (layer) =>
    React.Children.map(layer.props.children, (child) =>
      React.cloneElement(child, {viewerWidth: width, viewerHeight: height})
    );

  const layers = React.Children.toArray(children);
  const svgLayers = layers.filter((layer) => layer.props.svg).map(provision);
  const threeLayers = layers.filter(
    (layer) => layer.props.three
  ).map(provision);

  const eventScale = [
    scaleLinear()
      .domain([0, 1])
      .range(DEFAULT_VIEW_BOUNDS.x),

    scaleLinear()
      .domain([0, 1])
      .range(DEFAULT_VIEW_BOUNDS.y),
  ];

  const eventToPosition = (e) => {
    const {
      top,
      left,
      width,
      height,
    } = e.currentTarget.getBoundingClientRect();

    return [
      eventScale[0]((e.clientX - left) / width),
      eventScale[1]((e.clientY - top) / height),
    ];
  };

  return (
    <div
      ref={onRef}
      style={{width: '100%', height: '100%'}}
      onMouseDown={R.compose(
        mouseDown,
        eventToPosition
      )}
      onMouseMove={R.compose(
        mouseMove,
        eventToPosition
      )}
      onMouseUp={R.compose(
        mouseUp,
        eventToPosition
      )}
    >
      <Canvas
        style={{position: 'absolute'}}
        transparent={transparent.toString()}
        width={width}
        height={height}
        orthographic
        camera={{
          left: DEFAULT_VIEW_BOUNDS.x[0],
          right: DEFAULT_VIEW_BOUNDS.x[1],
          bottom: DEFAULT_VIEW_BOUNDS.y[0],
          top: DEFAULT_VIEW_BOUNDS.y[1],
        }}
      >
        {threeLayers.length > 0 && (
          <scene
            pointerEvents={['onMouseDown', 'onMouseMove', 'onMouseUp']}
            width={width}
            height={height}
          >
            {threeLayers}
          </scene>
        )}
      </Canvas>
      <svg
        style={{position: 'absolute', pointerEvents: 'none'}}
        width={width}
        height={height}
      >
        {svgLayers}
      </svg>
    </div>
  );
};

ResponsiveViewer.defaultProps = {
  containerWidth: 400,
  containerHeight: 300,
  transparent: false,
};

export default withResizeObserverProps(({width, height}) => ({
  containerWidth: width,
  containerHeight: height,
}))(ResponsiveViewer);
