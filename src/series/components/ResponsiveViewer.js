// @flow

import * as R from "ramda";
import React from "react";
import type { Node } from "react";
import { Renderer, Scene } from "react-three";
import { scaleLinear } from "d3-scale";
import "resize-observer-polyfill/dist/ResizeObserver.global";
// $FlowFixMe
import withResizeObserverProps from "@hocs/with-resize-observer-props";
import Object2D from "./Object2D";
import { DEFUALT_VIEW_BOUNDS } from "src/vector";
import type { Vector2 } from "src/vector";

type Props = {
  onRef?: any,
  containerWidth: number,
  containerHeight: number,
  transparent: boolean,
  activeCamera?: string,
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
  activeCamera,
  mouseDown,
  mouseMove,
  mouseUp,
  children
}: Props) => {
  const width = containerWidth;
  const height = containerHeight - 4;

  const provision = layer =>
    React.Children.map(layer.props.children, child =>
      React.cloneElement(child, { viewerWidth: width, viewerHeight: height })
    );

  const layers = React.Children.toArray(children);
  const svgLayers = layers.filter(layer => layer.props.svg).map(provision);
  const threeLayers = layers.filter(layer => layer.props.three).map(provision);

  const eventScale = [
    scaleLinear()
      .domain([0, 1])
      .range(DEFUALT_VIEW_BOUNDS.x),

    scaleLinear()
      .domain([0, 1])
      .range(DEFUALT_VIEW_BOUNDS.y)
  ];

  const eventToPosition = e => {
    const {
      top,
      left,
      width,
      height
    } = e.currentTarget.getBoundingClientRect();

    return [
      eventScale[0]((e.clientX - left) / width),
      eventScale[1]((e.clientY - top) / height)
    ];
  };

  return (
    <div
      ref={onRef}
      style={{ width: "100%", height: "100%" }}
      /*onMouseDown={R.compose(
        mouseDown,
        eventToPosition
      )}*/
      onMouseMove={R.compose(
        mouseMove,
        eventToPosition
      )}
      /*onMouseUp={R.compose(
        mouseUp,
        eventToPosition
      )}*/
    >
      <Renderer
        style={{ position: "absolute" }}
        transparent
        width={width}
        height={height}
      >
        {threeLayers.length > 0 && (
          <Scene
            pointerEvents={["onMouseDown", "onMouseMove", "onMouseUp"]}
            width={width}
            height={height}
            camera={activeCamera}
          >
            {threeLayers}
          </Scene>
        )}
      </Renderer>
      <svg
        style={{ position: "absolute", pointerEvents: "none" }}
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
  transparent: false
};

export default withResizeObserverProps(({ width, height }) => ({
  containerWidth: width,
  containerHeight: height
}))(ResponsiveViewer);
