// @flow

import React, {useEffect} from 'react';
import * as R from 'ramda';
import {vec2} from 'gl-matrix';
import {Row, Col, Input, ButtonGroup, Button} from 'reactstrap';
import {Group} from '@visx/group';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3-scale';
import {MAX_RENDERED_EPOCHS, MAX_CHANNELS} from '../../vector';
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
import {setViewerWidth, setViewerHeight} from '../store/state/bounds';

import type {
  ChannelMetadata,
  Channel,
  Epoch as EpochType,
} from '../store/types';

type Props = {
  viewerWidth: number,
  viewerHeight: number,
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
  setViewerWidth: number => void,
  setViewerHeight: number => void,
  limit: number
};

const SeriesRenderer = ({
  viewerHeight,
  viewerWidth,
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
  setViewerWidth,
  setViewerHeight,
  limit,
}: Props) => {
  useEffect(() => {
    setViewerHeight(viewerHeight);
  }, [viewerHeight]);

  const topLeft = vec2.fromValues(
    -viewerWidth/2,
    viewerHeight/2
  );

  const bottomRight = vec2.fromValues(
    viewerWidth/2,
    -viewerHeight/2
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
      .domain([-viewerHeight/2, viewerHeight/2])
      .range([topLeft[1], bottomRight[1]]),
  ];

  const filteredChannels = channels.filter((_, i) => !hidden.includes(i));

  const XAxisLayer = ({viewerWidth, viewerHeight, interval}) => {
    return (
      <>
        <Group top={-viewerHeight/2} left={-viewerWidth/2}>
          <Axis
            domain={interval}
            range={[0, viewerWidth]}
            orientation='bottom'
          />
        </Group>
        <Group top={viewerHeight/2} left={-viewerWidth/2}>
          <Axis domain={interval} range={[0, viewerWidth]} orientation='top' />
        </Group>
      </>
    );
  };

  const filteredEpochs = epochs.filter(
    (epoch) =>
      epoch.onset + epoch.duration > interval[0] && epoch.onset < interval[1]
  );

  const EpochsLayer = () => {
    return (
      <Group>
        {filteredEpochs.slice(0, MAX_RENDERED_EPOCHS).map((epoch, i) => {
            return (
              <Epoch
                {...epoch}
                parentHeight={viewerHeight}
                key={`${i}-${epochs.length}`}
                scales={scales}
              />
            );
          })}
      </Group>
    );
  };

  const ChannelAxesLayer = ({viewerWidth, viewerHeight}) => {
    const axisHeight = viewerHeight / MAX_CHANNELS;
    return (
      <Group top={-viewerHeight/2} left={-viewerWidth/2}>
        <line y1="0" y2={viewerHeight} stroke="black" />
        {filteredChannels.map((channel, i) => {
          const seriesRange = channelMetadata[channel.index].seriesRange;
          return (
            <Axis
              key={`${channel.index}`}
              padding={2}
              domain={seriesRange}
              range={[i * axisHeight, (i + 1) * axisHeight]}
              format={() => ''}
              orientation='right'
              hideLine='true'
            />
          );
        })}
      </Group>
    );
  };

  const ChannelsLayer = ({viewerWidth}) => {
    useEffect(() => {
      setViewerWidth(viewerWidth);
    }, [viewerWidth]);

    return (
      <>
        <clipPath id='lineChunk' clipPathUnits='userSpaceOnUse'>
          <rect x={-viewerWidth / 2} y={-viewerHeight / 12} width={viewerWidth} height={viewerHeight / 6}/>
        </clipPath>

        {filteredChannels.map((channel, i) => {
          if (!channelMetadata[channel.index]) {
            return null;
          }
          const subTopLeft = vec2.create();
          vec2.add(
            subTopLeft,
            topLeft,
            vec2.fromValues(0, (i * diagonal[1]) / MAX_CHANNELS)
          );

          const subBottomRight = vec2.create();
          vec2.add(
            subBottomRight,
            topLeft,
            vec2.fromValues(
              diagonal[0],
              ((i + 1) * diagonal[1]) / MAX_CHANNELS
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
      </>
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
    <>
      <Row className='no-gutters'>
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
      <Row noGutters>
        <Col
          xs={2}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {filteredChannels.map((channel) => (
            <div
              key={channel.index}
              style={{
                display: 'flex',
                height: 1 / MAX_CHANNELS * 100 + '%',
                alignItems: 'center',
              }}
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
              epochs={filteredEpochs}
              interval={interval}
            />
          )}
          <div style={{height: viewerHeight}}>
            <ResponsiveViewer
              name='series'
              transparent={true}
              mouseMove={R.compose(
                setCursor,
                R.nth(0)
              )}
            >
              <EpochsLayer/>
              <ChannelsLayer/>
              <XAxisLayer
                viewerWidth={0}
                viewerHeight={0}
                interval={interval}
              />
              <ChannelAxesLayer viewerHeight={0}/>
            </ResponsiveViewer>
          </div>
        </Col>
      </Row>
    </>
  ) : (
    <div style={{width: '100%', height: '100%'}}>
      <h4>Loading...</h4>
    </div>
  );
};

SeriesRenderer.defaultProps = {
  interval: [0.25, 0.75],
  amplitudeScale: 1,
  viewerHeight: 400,
  viewerSize: [400, 400],
  channels: [],
  epochs: [],
  hidden: [],
  channelMetadata: [],
  offsetIndex: 1,
  limit: 6,
};

export default connect(
  (state)=> ({
    viewerWidth: state.bounds.viewerWidth,
    viewerHeight: state.bounds.viewerHeight,
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
    setViewerWidth: R.compose(
      dispatch,
      setViewerWidth
    ),
    setViewerHeight: R.compose(
      dispatch,
      setViewerHeight
    ),
  })
)(SeriesRenderer);
