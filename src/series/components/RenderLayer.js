// @flow

import type {Node} from 'react';

export type Props = {
  svg?: boolean,
  three?: boolean,
  children?: Node
};

const RenderLayer = ({children}: Props) => {
  return children;
};

RenderLayer.defaultProps = {};

export default RenderLayer;
