// @flow

import * as R from "ramda";
import { combineReducers } from "redux";
import { combineEpics } from "redux-observable";
import { boundsReducer } from "./state/bounds";
import { datasetReducer } from "./state/dataset";
import { createDragBoundsEpic } from "./logic/drag-bounds";
import { createFetchChunksEpic } from "./logic/fetch-chunks";

export const rootReducer = combineReducers({
  bounds: boundsReducer,
  dataset: datasetReducer
});

export const rootEpic = combineEpics(
  createDragBoundsEpic(R.prop("bounds")),
  createFetchChunksEpic(({ bounds, dataset }) => ({
    bounds,
    dataset
  }))
);