// @flow

import * as R from 'ramda';
import {vec2} from 'gl-matrix';
import {Container, Row, Col, Input, ButtonGroup, Button} from 'reactstrap';
import {Group} from '@vx/vx';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3-scale';
import {DEFAULT_VIEW_BOUNDS, MAX_RENDERED_EPOCHS} from '../../vector';
import ResponsiveViewer from './ResponsiveViewer';
import Object2D from './Object2D';
import Axis from './Axis';
import LineChunk from './LineChunk';
import Epoch from './Epoch';
import SeriesCursor from './SeriesCursor';
import RenderLayer from './RenderLayer';
import {setCursor} from '../store/state/cursor';
import {setOffsetIndex} from '../store/logic/pagination';
import {setAmplitudesScale, resetAmplitudesScale} from '../store/logic/scaleAmplitudes';
import {LOW_PASS_FILTERS, setLowPassFilter, HIGH_PASS_FILTERS, setHighPassFilter} from '../store/logic/highLowPass';

import type {
  ChannelMetadata,
  Channel,
  Epoch as EpochType,
} from '../store/types';

type Props = {
  domain: [number, number],
  interval: [number, number],
  seriesRange: [number, number],
  amplitudeScale: number,
  cursor: ?number,
  setCursor: (?number) => void,
  channels: Channel[],
  channelMetadata: ChannelMetadata[],
  hidden: number[],
  epochs: EpochType[],
  offsetIndex: number,
  setOffsetIndex: number => void,
  setAmplitudesScale: number => void,
  setLowPassFilter: string => void,
  setHighPassFilter: string => void,
  limit: number
};

const SeriesRenderer = ({
  domain,
  interval,
  seriesRange,
  amplitudeScale,
  cursor,
  setCursor,
  channels,
  channelMetadata,
  hidden,
  epochs,
  offsetIndex,
  setOffsetIndex,
  setAmplitudesScale,
  resetAmplitudesScale,
  setLowPassFilter,
  setHighPassFilter,
  limit,
}: Props) => {
  const topLeft = vec2.fromValues(
    DEFAULT_VIEW_BOUNDS.x[0],
    DEFAULT_VIEW_BOUNDS.y[1]
  );

  const bottomRight = vec2.fromValues(
    DEFAULT_VIEW_BOUNDS.x[1],
    DEFAULT_VIEW_BOUNDS.y[0]
  );

  const diagonal = vec2.create();
  vec2.sub(diagonal, bottomRight, topLeft);

  const center = vec2.create();
  vec2.add(center, topLeft, bottomRight);
  vec2.scale(center, center, 1 / 2);

  const scales = [
    scaleLinear()
      .domain(interval)
      .range([topLeft[0], bottomRight[0]]),
    scaleLinear()
      .domain(DEFAULT_VIEW_BOUNDS.y)
      .range([topLeft[1], bottomRight[1]]),
  ];

  const filteredChannels = channels.filter((_, i) => !hidden.includes(i));

  const XAxisLayer = ({viewerWidth, viewerHeight, interval}) => {
    return (
      <Group>
        <Group>
          <Axis
            domain={interval}
            range={[0, viewerWidth]}
            orientation='bottom'
          />
        </Group>
        <Group top={viewerHeight - 1}>
          <Axis domain={interval} range={[0, viewerWidth]} orientation='top' />
        </Group>
      </Group>
    );
  };

  const EpochsLayer = () => {
    const filteredEpochs = epochs.filter(
      (epoch) =>
        epoch.onset + epoch.duration > interval[0] && epoch.onset < interval[1]
    );
    return (
      <Object2D position={center} layer={2}>
        {filteredEpochs.length < MAX_RENDERED_EPOCHS &&
          filteredEpochs.map((epoch, i) => {
            return (
              <Epoch
                key={`${i}-${epochs.length}`}
                {...epoch}
                scales={scales}
                opacity={0.3}
              />
            );
          })}
      </Object2D>
    );
  };

  const ChannelAxesLayer = ({viewerWidth, viewerHeight}) => {
    const axisHeight = viewerHeight / filteredChannels.length;
    return (
      <Group>
        {filteredChannels.map((channel, i) => {
          const seriesRange = channelMetadata[channel.index].seriesRange;
          return (
            <Axis
              key={`${channel.index}`}
              padding={2}
              domain={seriesRange}
              range={[i * axisHeight, (i + 1) * axisHeight]}
              format={(tick) => ''}
              orientation='right'
            />
          );
        })}
      </Group>
    );
  };

  const ChannelsLayer = () => {
    return (
      <Object2D position={center} layer={3}>
        {filteredChannels.map((channel, i) => {
          if (!channelMetadata[channel.index]) {
            return null;
          }
          const subTopLeft = vec2.create();
          vec2.add(
            subTopLeft,
            topLeft,
            vec2.fromValues(0, (i * diagonal[1]) / channels.length)
          );

          const subBottomRight = vec2.create();
          vec2.add(
            subBottomRight,
            topLeft,
            vec2.fromValues(
              diagonal[0],
              ((i + 1) * diagonal[1]) / channels.length
            )
          );

          const subDiagonal = vec2.create();
          vec2.sub(subDiagonal, subBottomRight, subTopLeft);

          const axisEnd = vec2.create();
          vec2.add(axisEnd, subTopLeft, vec2.fromValues(0.1, subDiagonal[1]));

          const scales = [
            scaleLinear()
              .domain(interval)
              .range([subTopLeft[0], subBottomRight[0]]),
            scaleLinear()
              .domain(channelMetadata[channel.index].seriesRange)
              .range([subTopLeft[1], subBottomRight[1]]),
          ];
          const seriesRange = channelMetadata[channel.index].seriesRange;

          return (
            <Object2D
              key={`${channel.index}-${channels.length}`}
              position={center}
            >
              <Object2D layer={1}>
                {channel.traces.map((trace, j) => {
                  return (
                    <Object2D key={`${j}-${channel.traces.length}`}>
                      {trace.chunks.map((chunk, k) => {
                        return (
                          <LineChunk
                            channelIndex={channel.index}
                            traceIndex={j}
                            chunkIndex={k}
                            key={`${k}-${trace.chunks.length}`}
                            chunk={chunk}
                            seriesRange={seriesRange}
                            amplitudeScale={amplitudeScale}
                            scales={scales}
                          />
                        );
                      })}
                    </Object2D>
                  );
                })}
              </Object2D>
            </Object2D>
          );
        })}
      </Object2D>
    );
  };

  const highPassFilters = Object.keys(HIGH_PASS_FILTERS).map((key) =>
    <option value={key} key={key}>{HIGH_PASS_FILTERS[key].label}</option>
  );

  const lowPassFilters = Object.keys(LOW_PASS_FILTERS).map((key) =>
    <option value={key} key={key}>{LOW_PASS_FILTERS[key].label}</option>
  );

  const hardLimit = Math.min(offsetIndex + limit - 1, channelMetadata.length);

  return channels.length > 0 ? (
    <Container fluid style={{height: '100%'}}>
      <Row style={{height: '100%'}}>
        <Col xs={12}>
          <Row>
            <Col xs={2} />
            <Col xs={10}>
              <Row style={{paddingTop: '10px', paddingBottom: '10px'}}>
                <Col xs={2}>
                  <ButtonGroup>
                    <Button onClick={() => setAmplitudesScale(1.1)}>-</Button>
                    <Button onClick={() => resetAmplitudesScale()}>Reset</Button>
                    <Button onClick={() => setAmplitudesScale(0.9)}>+</Button>
                  </ButtonGroup>
                </Col>
                <Col xs={2}>
                  <Input
                    type="select"
                    name="highPassFilters"
                    onChange={(e) => setHighPassFilter(e.target.value)}
                  >
                    {highPassFilters}
                  </Input>
                </Col>
                <Col xs={2}>
                  <Input
                    type="select"
                    name="lowPassFilters"
                    onChange={(e) => setLowPassFilter(e.target.value)}
                  >
                    {lowPassFilters}
                  </Input>
                </Col>
                <Col xs={2}>
                  <ButtonGroup>
                    <Button onClick={() => setOffsetIndex(offsetIndex - limit)}>
                      &lt;&lt;
                    </Button>
                    <Button onClick={() => setOffsetIndex(offsetIndex - 1)}>
                      &lt;
                    </Button>
                    <Button onClick={() => setOffsetIndex(offsetIndex + 1)}>
                      &gt;
                    </Button>
                    <Button onClick={() => setOffsetIndex(offsetIndex + limit)}>
                      &gt;&gt;
                    </Button>
                  </ButtonGroup>
                </Col>
                <Col xs={4}>
                  Showing{' '}
                  <div style={{display: 'inline-block', width: '80px'}}>
                    <Input
                      type='number'
                      value={offsetIndex}
                      onChange={(e) => setOffsetIndex(e.target.value)}
                    />
                  </div>{' '}
                  to {hardLimit} of {channelMetadata.length}
                </Col>
              </Row>
            </Col>
          </Row>
          <Row style={{height: '100%'}} noGutters>
            <Col
              xs={2}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {filteredChannels.map((channel) => (
                <div
                  key={channel.index}
                  style={{display: 'flex', margin: 'auto'}}
                >
                  {channelMetadata[channel.index] &&
                    channelMetadata[channel.index].name}
                </div>
              ))}
            </Col>
            <Col
              xs={10}
              style={{position: 'relative'}}
              onMouseLeave={() => setCursor(null)}
            >
              {cursor && (
                <SeriesCursor
                  cursor={cursor}
                  channels={channels}
                  interval={interval}
                />
              )}
              <ResponsiveViewer
                transparent={true}
                mouseMove={R.compose(
                  setCursor,
                  R.nth(0)
                )}
              >
                <RenderLayer svg>
                  <XAxisLayer
                    viewerWidth={0}
                    viewerHeight={0}
                    interval={interval}
                  />
                  <ChannelAxesLayer viewerWidth={0} viewerHeight={0} />
                </RenderLayer>
                <RenderLayer three>
                  <EpochsLayer />
                  <ChannelsLayer />
                </RenderLayer>
              </ResponsiveViewer>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  ) : (
    <div style={{width: '100%', height: '100%'}}>
      <h4>Loading...</h4>
    </div>
  );
};

SeriesRenderer.defaultProps = {
  domain: [0, 1],
  interval: [0.25, 0.75],
  seriesRange: [-1, 2],
  amplitudeScale: 1,
  channels: [],
  epochs: [],
  hidden: [],
  channelMetadata: [],
  offsetIndex: 1,
  limit: 6,
};

export default connect(
  (state) => ({
    domain: state.bounds.domain,
    interval: state.bounds.interval,
    amplitudeScale: state.bounds.amplitudeScale,
    cursor: state.cursor,
    channels: state.dataset.channels,
    epochs: state.dataset.epochs,
    hidden: state.montage.hidden,
    channelMetadata: state.dataset.channelMetadata,
    seriesRange: state.dataset.seriesRange,
    offsetIndex: state.dataset.offsetIndex,
  }),

  (dispatch: (any) => void) => ({
    setOffsetIndex: R.compose(
      dispatch,
      setOffsetIndex
    ),
    setCursor: R.compose(
      dispatch,
      setCursor
    ),
    setAmplitudesScale: R.compose(
      dispatch,
      setAmplitudesScale
    ),
    resetAmplitudesScale: R.compose(
      dispatch,
      resetAmplitudesScale
    ),
    setLowPassFilter: R.compose(
      dispatch,
      setLowPassFilter
    ),
    setHighPassFilter: R.compose(
      dispatch,
      setHighPassFilter
    ),
  })
)(SeriesRenderer);
