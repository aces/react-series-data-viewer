// @flow

import {createAction} from 'redux-actions';

export const SET_INTERVAL = 'SET_INTERVAL';
export const setInterval = createAction(SET_INTERVAL);

export const SET_DOMAIN = 'SET_DOMAIN';
export const setDomain = createAction(SET_DOMAIN);

export type Action =
  | {type: 'SET_INTERVAL', payload: [number, number]}
  | {type: 'SET_DOMAIN', payload: [number, number]};

export type State = {
  interval: [number, number],
  domain: [number, number]
};

const interval = (state = [0.25, 0.75], action: ?Action): [number, number] => {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case SET_INTERVAL: {
      return action ? action.payload : state;
    }
    default: {
      return state;
    }
  }
};

const domain = (state = [0, 1], action: ?Action): [number, number] => {
  switch (action && action.type) {
    case SET_DOMAIN: {
      return action ? action.payload : state;
    }
    default: {
      return state;
    }
  }
};

export const boundsReducer: (State, Action) => State = (
  state = {interval: interval(), domain: domain()},
  action
) => ({
  interval: interval(state.interval, action),
  domain: domain(state.domain, action),
});
