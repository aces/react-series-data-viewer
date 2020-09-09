// @flow

import * as R from 'ramda';
import {ofType} from 'redux-observable';
import {Observable, from, of} from 'rxjs';
import * as Rx from 'rxjs/operators';
import {createAction} from 'redux-actions';
import type {
  State as DatasetState,
  Action as DatasetAction,
} from '../state/dataset';
import type {Chunk} from '../types';
import type {State as BoundsState} from '../state/bounds';
import {fetchChunk} from '../../../chunks';
import {MAX_VIEWED_CHUNKS} from '../../../vector';
import {setActiveChannel} from '../state/dataset';
import {setChunks} from '../state/channel';

export const UPDATE_VIEWED_CHUNKS = 'UPDATE_VIEWED_CHUNKS';
export const updateViewedChunks = createAction(UPDATE_VIEWED_CHUNKS);

type FetchedChunks = {
  channelIndex: number,
  chunks: Chunk[]
};

export const loadChunks = ({channelIndex, ...rest}: FetchedChunks) => {
  return (dispatch: any => void) => {
    dispatch(setActiveChannel(channelIndex));
    dispatch(setChunks({channelIndex, ...rest}));
    dispatch(setActiveChannel(null));
  };
};

export const fetchChunkAt = R.memoize(
  (
    baseURL: string,
    downsampling: number,
    channelIndex: number,
    traceIndex: number,
    chunkIndex: number
  ) => {
    return fetchChunk(
      `${baseURL}/raw/${downsampling}`
      + `/${channelIndex}/${traceIndex}/${chunkIndex}.buf`
    );
  }
);

type State = {bounds: BoundsState, dataset: DatasetState};

const UPDATE_DEBOUNCE_TIME = 100;

export const createFetchChunksEpic = (fromState: any => State) => (
  action$: Observable<any>,
  state$: Observable<any>
): Observable<DatasetAction> => {
  // $FlowFixMe TODO: why is this type check failing?
  return action$.pipe(
    ofType(UPDATE_VIEWED_CHUNKS),
    Rx.withLatestFrom(state$),
    Rx.map(([_, state]) => fromState(state)),
    Rx.debounceTime(UPDATE_DEBOUNCE_TIME),
    Rx.concatMap(({bounds, dataset}) => {
      const {chunkDirectoryURL, shapes, timeInterval, channels} = dataset;

      if (!chunkDirectoryURL) {
        return of();
      }

      const fetches = R.flatten(
        channels.map((channel, i) => {
          return (
            channel &&
            channel.traces.map((trace, j) => {
              const ncs = shapes.map((shape) => shape[shape.length - 2]);

              const citvs = ncs
                .map((nc, downsampling) => {
                  const timeLength = Math.abs(
                    timeInterval[1] - timeInterval[0]
                  );
                  const i0 =
                    (nc * Math.ceil(bounds.interval[0] - bounds.domain[0])) /
                    timeLength;
                  const i1 =
                    (nc * Math.ceil(bounds.interval[1] - bounds.domain[0])) /
                    timeLength;
                  return {
                    interval: [Math.floor(i0), Math.min(Math.ceil(i1), nc)],
                    numChunks: nc,
                    downsampling,
                  };
                })
                .filter(
                  ({interval}) =>
                    interval[1] - interval[0] < MAX_VIEWED_CHUNKS
                );
              const max = R.reduce(
                R.maxBy(({interval}) => interval[1] - interval[0]),
                {interval: [0, 0]},
                citvs
              );

              const chunkPromises = R.range(...max.interval).map(
                (chunkIndex) => {
                  const numChunks = max.numChunks;

                  return fetchChunkAt(
                    chunkDirectoryURL,
                    max.downsampling,
                    channel.index,
                    j,
                    chunkIndex
                  ).then((chunk) => ({
                    interval: [
                      timeInterval[0] +
                        (chunkIndex / numChunks) *
                          (timeInterval[1] - timeInterval[0]),
                      timeInterval[0] +
                        ((chunkIndex + 1) / numChunks) *
                          (timeInterval[1] - timeInterval[0]),
                    ],
                    ...chunk,
                  }));
                }
              );

              return from(
                Promise.all(chunkPromises).then((chunks) => ({
                  channelIndex: channel.index,
                  traceIndex: j,
                  chunks,
                }))
              );
            })
          );
        })
      );

      return from(fetches).pipe(Rx.flatMap(R.identity));
    }),
    Rx.map((payload) => loadChunks(payload))
  );
};
