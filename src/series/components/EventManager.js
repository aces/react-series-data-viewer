// @flow

import React from 'react';
import type {Epoch as EpochType} from '../store/types';
import {connect} from 'react-redux';
import {setTimeSelection} from '../store/state/timeSelection';
import * as R from 'ramda';
import {toggleEpoch, updateActiveEpoch} from '../store/logic/filterEpochs';

type Props = {
  timeSelection: ?[number, number],
  epochs: EpochType[],
  filteredEpochs: number[],
  setTimeSelection: [?number, ?number] => void,
  toggleEpoch: number => void,
  updateActiveEpoch: ?number => void,
  interval: [number, number],
};

const EventManager = ({
  epochs,
  filteredEpochs,
  toggleEpoch,
  updateActiveEpoch,
  interval,
}: Props) => {
  return (
    <>
      <div className="panel panel-primary event-list">
        <div className="panel-heading">
          Events in timeline view
        </div>
        <div
          className="panel-body"
          style={{padding: 0}}
        >
          <div
            className="list-group"
            style={{
              maxHeight: '450px',
              overflowY: 'scroll',
              marginBottom: 0,
            }}
          >
            {[...Array(epochs.length).keys()].filter((index) =>
              epochs[index].onset + epochs[index].duration > interval[0]
              && epochs[index].onset < interval[1]
            ).map((index) => {
              const epoch = epochs[index];
              const visible = filteredEpochs.includes(index);
              return (
                <div
                  key={index}
                  className='list-group-item list-group-item-action'
                  style={{
                    position: 'relative',
                  }}
                >
                  {epoch.type} <br/>
                  {epoch.onset}{epoch.duration > 0
                  && ' - ' + (epoch.onset + epoch.duration)}
                  <button
                    data-toggle="button"
                    aria-pressed={visible}
                    type="button"
                    className={(visible ? 'active ' : '')
                      + 'btn btn-xs'}
                    onClick={() => toggleEpoch(index)}
                    onMouseEnter={() => updateActiveEpoch(index)}
                    onMouseLeave={() => updateActiveEpoch(null)}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '15px',
                      display: 'block',
                    }}
                  >
                    <i className={'glyphicon glyphicon-eye-' + (visible ? 'open' : 'close')}></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

EventManager.defaultProps = {
  timeSelection: null,
  epochs: [],
  filteredEpochs: [],
};

export default connect(
  (state)=> ({
    timeSelection: state.timeSelection,
    epochs: state.dataset.epochs,
    filteredEpochs: state.dataset.filteredEpochs,
    interval: state.bounds.interval,
  }),
  (dispatch: (any) => void) => ({
    setTimeSelection: R.compose(
      dispatch,
      setTimeSelection
    ),
    toggleEpoch: R.compose(
      dispatch,
      toggleEpoch
    ),
    updateActiveEpoch: R.compose(
      dispatch,
      updateActiveEpoch
    ),
  })
)(EventManager);
