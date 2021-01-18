// @flow

import * as R from 'ramda';
import React from 'react';
import type {Node} from 'react';
import {Canvas} from 'react-three-fiber';
import {scaleLinear} from 'd3-scale';
import 'resize-observer-polyfill/dist/ResizeObserver.global';
import withResizeObserverProps from '@hocs/with-resize-observer-props';
import {DEFAULT_VIEW_BOUNDS} from '../../vector';
import type {Vector2} from '../../vector';

type Props = {
  onRef?: any,
  name: string,
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
  name,
  containerWidth,
  containerHeight,
  transparent,
  mouseDown,
  mouseMove,
  mouseUp,
  children,
}: Props) => {
  if (name === 'series') {
    DEFAULT_VIEW_BOUNDS.x[0] = -containerWidth/2;
    DEFAULT_VIEW_BOUNDS.x[1] = containerWidth/2;
    DEFAULT_VIEW_BOUNDS.y[0] = -containerHeight/2;
    DEFAULT_VIEW_BOUNDS.y[1] = containerHeight/2;
  }

  const provision = (layer) =>
    React.Children.map(layer.props.children, (child) =>
      React.cloneElement(child, {viewerWidth: containerWidth, viewerHeight: containerHeight})
    );

  const layers = React.Children.toArray(children);
  const svgLayers = layers.filter((layer) => layer.props.svg).map(provision);
  const threeLayers = layers.filter(
    (layer) => layer.props.three
  ).map(provision);

  const domain = window.EEGLabSeriesProviderStore.getState().bounds.domain;
  const amplitude = [0, 1];
  const eventScale = [
    scaleLinear()
      .domain(domain)
      .range(DEFAULT_VIEW_BOUNDS.x),
    scaleLinear()
      .domain(amplitude)
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
      eventScale[0].invert(eventScale[0]((e.clientX - left) / width)),
      eventScale[1].invert(eventScale[1]((e.clientY - top) / height)),
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
      onMouseLeave={R.compose(
        mouseUp,
        eventToPosition
      )}
      style={{position: 'relative', width: '100%', height: '100%'}}
    >
      <Canvas
        invalidateFrameloop
        style={{position: 'absolute'}}
        transparent={transparent.toString()}
        width={containerWidth}
        height={containerHeight}
        orthographic
        camera={{
          left: -containerWidth/2,
          right: containerWidth/2,
          bottom: -containerHeight/2,
          top: containerHeight/2,
        }}
      >
        {threeLayers.length > 0 && (
          <scene
            pointerEvents={['onMouseDown', 'onMouseMove', 'onMouseUp']}
            width={containerWidth}
            height={containerHeight}
          >
            {threeLayers}
          </scene>
        )}
      </Canvas>
      <svg
        style={{position: 'absolute', pointerEvents: 'none'}}
        width={containerWidth}
        height={containerHeight}
      >
        {svgLayers}
      </svg>
    </div>
  );
};

ResponsiveViewer.defaultProps = {
  name: '',
  containerWidth: 400,
  containerHeight: 300,
  transparent: false,
  mouseMove: () => {},
  mouseDown: () => {},
  mouseUp: () => {},
};

export default withResizeObserverProps(({width, height}) => ({
  containerWidth: width,
  containerHeight: height,
}))(ResponsiveViewer);
