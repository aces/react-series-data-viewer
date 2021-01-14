// @flow

import * as R from 'ramda';
import {combineReducers} from 'redux';
import {combineEpics} from 'redux-observable';
import {boundsReducer} from './state/bounds';
import {filtersReducer} from './state/filters';
import {datasetReducer} from './state/dataset';
import {cursorReducer} from './state/cursor';
import {montageReducer} from './state/montage';
import {createDragBoundsEpic} from './logic/dragBounds';
import {createFetchChunksEpic} from './logic/fetchChunks';
import {createPaginationEpic} from './logic/pagination';
import {createScaleAmplitudesEpic, createResetAmplitudesEpic} from './logic/scaleAmplitudes';
import {createLowPassFilterEpic, createHighPassFilterEpic} from './logic/highLowPass';

export const rootReducer = combineReducers({
  bounds: boundsReducer,
  filters: filtersReducer,
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
  }),
  createScaleAmplitudesEpic(({bounds}) => {
    const {amplitudeScale} = bounds;
    return amplitudeScale;
  }),
  createResetAmplitudesEpic(),
  createLowPassFilterEpic(),
  createHighPassFilterEpic()
);
