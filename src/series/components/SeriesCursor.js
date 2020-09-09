// @flow

import * as R from 'ramda';
import React from 'react';
import type {Node} from 'react';
import {bisector} from 'd3-array';
import {colorOrder} from '../../color';
import type {Channel} from '../store/types';
import {DEFAULT_VIEW_BOUNDS} from '../../vector';

type CursorContentProps = {
  cursor: number,
  channel: Channel,
  contentIndex: number
};

type Props = {
  cursor: number,
  scale: any,
  channels: Channel[],
  CursorContent: CursorContentProps => Node
};

const SeriesCursor = ({cursor, scale, channels, CursorContent}: Props) => {
  const left = `${Math.min(
    Math.max(100 * (scale(cursor) + DEFAULT_VIEW_BOUNDS.x[1]) / (2 * DEFAULT_VIEW_BOUNDS.x[1]), 0),
    100
  )}%`;

  const Cursor = () => (
    <div
      style={{
        position: 'absolute',
        left,
        top: '0',
        backgroundColor: '#000',
        width: '1px',
        height: '100%',
      }}
    />
  );

  const ValueTags = () => (
    <div
      style={{
        left,
        top: '0',
        height: '100%',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {channels.map((channel, i) => (
        <div
          key={`${channel.index}-${channels.length}`}
          style={{margin: 'auto'}}
        >
          <CursorContent cursor={cursor} channel={channel} contentIndex={i} />
        </div>
      ))}
    </div>
  );
  const TimeMarker = () => (
    <div
      style={{
        left,
        top: '100%',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#eee',
        padding: '2px 2px',
        borderRadius: '3px',
      }}
    >
      {cursor}
    </div>
  );
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
      }}
    >
      <Cursor />
      <ValueTags />
      <TimeMarker />
    </div>
  );
};

const createIndices = R.memoize((array) => array.map((_, i) => i));

const indexToTime = (chunk) => (index) =>
  chunk.interval[0] +
  (index / chunk.values.length) * (chunk.interval[1] - chunk.interval[0]);

const CursorContent = ({cursor, channel}) => {
  const Marker = ({color}) => (
    <div
      style={{
        margin: 'auto',
        marginLeft: '5px',
        marginRight: '5px',
        padding: '5px 5px',
        backgroundColor: color,
      }}
    />
  );

  return (
    <div style={{margin: '5px 5px'}}>
      {channel.traces.map((trace, i) => {
        const chunk = trace.chunks.find(
          (chunk) => chunk.interval[0] <= cursor && chunk.interval[1] >= cursor
        );
        const computeValue = (chunk) => {
          const indices = createIndices(chunk.values);

          const bisectTime = bisector(indexToTime(chunk)).left;

          const idx = bisectTime(indices, cursor);

          const value = chunk.values[idx];

          return value;
        };
        return (
          <div
            key={`${i}-${channel.traces.length}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              backgroundColor: '#eee',
              padding: '2px 2px',
              borderRadius: '3px',
            }}
          >
            <Marker color={colorOrder(i)} /> {chunk && computeValue(chunk)}{' '}
          </div>
        );
      })}
    </div>
  );
};

SeriesCursor.defaultProps = {
  channels: [],
  CursorContent,
};

export default SeriesCursor;
