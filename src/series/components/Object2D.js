// @flow

import {vec2} from 'gl-matrix';
import type{Node} from 'react';
import * as THREE from 'three';
import type{Vector2} from '../../vector';

type Props = {
  position: Vector2,
  layer: number,
  children?: Node
};

const Object2D = ({position, layer, children, ...objectProps}: Props) => {
  return (
    <object3D
      {...objectProps}
      position={new THREE.Vector3().fromArray([
        position[0],
        position[1],
        -(layer + 1),
      ])}
    >
      {children}
    </object3D>
  );
};

Object2D.defaultProps = {
  position: vec2.create(),
  layer: 0,
};

export default Object2D;
