// @flow
import React from "react";
import * as THREE from "three";
import { DEFAULT_VIEW_BOUNDS } from "src/vector";
import { OrthographicCamera } from "drei";
import { useThree } from "react-three-fiber";

type Props = { name: string };

const DefaultOrthoCamera = ({ name, ...rest }: Props) => {
  const { camera } = useThree();
  camera.zoom = 10;
  camera.updateProjectionMatrix();

  {/*const cameraProps = {
    left: DEFAULT_VIEW_BOUNDS.x[0],
    right: DEFAULT_VIEW_BOUNDS.x[1],
    bottom: DEFAULT_VIEW_BOUNDS.y[0],
    top: DEFAULT_VIEW_BOUNDS.y[1],
    near: 0.01,
    far: 10000,
    lookat: new THREE.Vector3(0, 0, -1)
  };
  return <OrthographicCamera makeDefault name={name} {...cameraProps} {...rest} />;*/}
  return null;
};

DefaultOrthoCamera.defaultProps = {
  name: "maincamera"
};

export default DefaultOrthoCamera;
