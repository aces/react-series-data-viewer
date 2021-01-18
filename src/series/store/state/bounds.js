// @flow

import {createAction} from 'redux-actions';

export const SET_INTERVAL = 'SET_INTERVAL';
export const setInterval = createAction(SET_INTERVAL);

export const SET_DOMAIN = 'SET_DOMAIN';
export const setDomain = createAction(SET_DOMAIN);

export const SET_AMPLITUDE_SCALE = 'SET_AMPLITUDE_SCALE';
export const setAmplitudeScale = createAction(SET_AMPLITUDE_SCALE);

export type Action =
  | {type: 'SET_INTERVAL', payload: [number, number]}
  | {type: 'SET_DOMAIN', payload: [number, number]}
  | {type: 'SET_AMPLITUDE_SCALE', payload: number}

export type State = {
  interval: [number, number],
  domain: [number, number],
  amplitudeScale: number
};

const interval = (state = [0.25, 0.75], action: ?Action): [number, number] => {
  if (action && action.type === 'SET_INTERVAL') {
    return action.payload;
  }
  return state;
};

const domain = (state = [0, 1], action: ?Action): [number, number] => {
  if (action && action.type === 'SET_DOMAIN') {
    return action.payload;
  }
  return state;
};

const amplitudeScale = (state = 1, action: ?Action): number => {
  if (action && action.type === 'SET_AMPLITUDE_SCALE') {
    return action.payload;
  }
  return state;
};

export const boundsReducer: (State, Action) => State = (
  state = {
    interval: interval(),
    domain: domain(),
    amplitudeScale: amplitudeScale(),
  },
  action
) => ({
  interval: interval(state.interval, action),
  domain: domain(state.domain, action),
  amplitudeScale: amplitudeScale(state.amplitudeScale, action),
});
