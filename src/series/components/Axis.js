// @flow

import {scaleLinear} from 'd3-scale';
import {Axis as VxAxis} from '@visx/axis';

type Props = {
  orientation: 'top' | 'right' | 'bottom' | 'left',
  domain: [number, number],
  range: [number, number],
  ticks: number,
  padding: number,
  format: number => string,
  hideLine: bool,
};

const Axis = ({
  orientation,
  domain,
  range,
  ticks,
  padding,
  format,
  hideLine,
}: Props) => {
  const scale = scaleLinear()
    .domain(domain)
    .range(range);

  let tickValues = scale.ticks(ticks);
  tickValues = tickValues.slice(padding, tickValues.length - padding);

  return (
    <VxAxis
      scale={scale}
      orientation={orientation}
      tickValues={tickValues}
      tickFormat={format}
      hideAxisLine={hideLine}
    />
  );
};

Axis.defaultProps = {
  direction: 'bottom',
  domain: [0, 1],
  ticks: 10,
  padding: 0,
  hideAxisLine: false,
  format: (tick) => `${tick}`,
};

export default Axis;
