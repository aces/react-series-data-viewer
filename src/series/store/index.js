// @flow

import * as R from 'ramda';
import {combineReducers} from 'redux';
import {combineEpics} from 'redux-observable';
import {boundsReducer} from './state/bounds';
import {datasetReducer} from './state/dataset';
import {cursorReducer} from './state/cursor';
import {montageReducer} from './state/montage';
import {createDragBoundsEpic} from './logic/drag-bounds';
import {createFetchChunksEpic} from './logic/fetch-chunks';
import {createPaginationEpic} from './logic/pagination';

export const rootReducer = combineReducers({
  bounds: boundsReducer,
  dataset: datasetReducer,
  cursor: cursorReducer,
  montage: montageReducer,
});

export const rootEpic = combineEpics(
  createDragBoundsEpic(R.prop('bounds')),
  createFetchChunksEpic(({bounds, dataset}) => ({
    bounds,
    dataset,
  })),
  createPaginationEpic(({dataset}) => {
    const {limit, channelMetadata, channels} = dataset;
    return {limit, channelMetadata, channels};
  })
);
