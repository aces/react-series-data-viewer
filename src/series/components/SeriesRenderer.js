// @flow

import * as R from 'ramda';
import {vec2} from 'gl-matrix';
import {Container, Row, Col, Input, ButtonGroup, Button} from 'reactstrap';
import {Group} from '@visx/group';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3-scale';
import {MAX_RENDERED_EPOCHS} from '../../vector';
import ResponsiveViewer from './ResponsiveViewer';
import Axis from './Axis';
import LineChunk from './LineChunk';
import Epoch from './Epoch';
import SeriesCursor from './SeriesCursor';
import {setCursor} from '../store/state/cursor';
import {setOffsetIndex} from '../store/logic/pagination';
import {
  setAmplitudesScale,
  resetAmplitudesScale,
} from '../store/logic/scaleAmplitudes';
import {
  LOW_PASS_FILTERS,
  setLowPassFilter,
  HIGH_PASS_FILTERS,
  setHighPassFilter,
} from '../store/logic/highLowPass';
import {withParentSize} from '@visx/responsive';

import type {
  ChannelMetadata,
  Channel,
  Epoch as EpochType,
} from '../store/types';

type Props = {
  parentWidth: number,
  parentHeight: number,
  interval: [number, number],
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
  resetAmplitudesScale: void => void,
  setLowPassFilter: string => void,
  setHighPassFilter: string => void,
  limit: number
};

const SeriesRenderer = ({
  parentWidth,
  parentHeight,
  interval,
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
    -parentWidth/2,
    parentHeight/2
  );

  const bottomRight = vec2.fromValues(
    parentWidth/2,
    -parentHeight/2
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
      .domain([-parentHeight/2, parentHeight/2])
      .range([topLeft[1], bottomRight[1]]),
  ];

  const filteredChannels = channels.filter((_, i) => !hidden.includes(i));

  const XAxisLayer = ({viewerWidth, viewerHeight, interval}) => {
    return (
      <Group>
        <Axis
          domain={interval}
          range={[0, viewerWidth]}
          orientation='bottom'
        />
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
      <Group>
        {filteredEpochs.length < MAX_RENDERED_EPOCHS &&
          filteredEpochs.map((epoch, i) => {
            return (
              <Epoch
                {...epoch}
                key={`${i}-${epochs.length}`}
                scales={scales}
                opacity={0.3}
              />
            );
          })}
      </Group>
    );
  };

  const ChannelAxesLayer = ({viewerHeight}) => {
    const axisHeight = viewerHeight / filteredChannels.length;
    return (
      <Group>
        {filteredChannels.map((channel, i) => {
          const seriesRange = channelMetadata[channel.index].seriesRange;
          return (
            <Axis
              index={i}
              key={`${channel.index}`}
              padding={10}
              domain={seriesRange}
              range={[i * axisHeight, (i + 1) * axisHeight]}
              format={() => ''}
              orientation='right'
            />
          );
        })}
      </Group>
    );
  };

  const ChannelsLayer = () => (
    <svg viewBox={[
      -parentWidth/2,
      -parentHeight/2,
      parentWidth,
      parentHeight,
    ].join(' ')}>
      <clipPath id='lineChunk' clipPathUnits='userSpaceOnUse'>
        <rect x={-parentWidth/2} y={-parentHeight/12} width={parentWidth} height={parentHeight/6} />
      </clipPath>

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

        const seriesRange = channelMetadata[channel.index].seriesRange;
        const scales = [
          scaleLinear()
            .domain(interval)
            .range([subTopLeft[0], subBottomRight[0]]),
          scaleLinear()
            .domain(seriesRange)
            .range([subTopLeft[1], subBottomRight[1]]),
        ];

        return (
          channel.traces.map((trace, j) => (
            trace.chunks.map((chunk, k) => (
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
            ))
          ))
        );
      })}
    </svg>
  );

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
            <Col xs={2}/>
            <Col xs={10}>
              <Row style={{paddingTop: '10px', paddingBottom: '10px'}}>
                <Col xs={2}>
                  <ButtonGroup>
                    <Button
                      onClick={() => setAmplitudesScale(1.1)}
                    >-</Button>
                    <Button
                      onClick={() => resetAmplitudesScale()}
                    >Reset</Button>
                    <Button
                      onClick={() => setAmplitudesScale(0.9)}
                    >+</Button>
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
                  </div>
                  {' '}
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
                padding: '40px 0',
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
                name='series'
                transparent={true}
                mouseMove={R.compose(
                  setCursor,
                  R.nth(0)
                )}
              >
                <XAxisLayer
                  viewerWidth={0}
                  viewerHeight={0}
                  interval={interval}
                />
                <ChannelAxesLayer viewerHeight={0}/>
                <EpochsLayer/>
                <ChannelsLayer/>
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
  parentWidth: 400,
  parentHeight: 300,
  interval: [0.25, 0.75],
  amplitudeScale: 1,
  channels: [],
  epochs: [],
  hidden: [],
  channelMetadata: [],
  offsetIndex: 1,
  limit: 6,
};

export default R.compose(
  connect(
    (state) => ({
      interval: state.bounds.interval,
      amplitudeScale: state.bounds.amplitudeScale,
      cursor: state.cursor,
      channels: state.dataset.channels,
      epochs: state.dataset.epochs,
      hidden: state.montage.hidden,
      channelMetadata: state.dataset.channelMetadata,
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
    }),
  ),
  withParentSize
)(SeriesRenderer);
