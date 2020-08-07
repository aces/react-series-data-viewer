import { tsvParse } from "d3-dsv";
import React, { Component } from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { createEpicMiddleware } from "redux-observable";
import thunk from "redux-thunk";
import { fetchJSON, fetchText } from "src/ajax";
import { rootReducer, rootEpic } from "src/series/store";
import {
  setChannels,
  setEpochs,
  setDatasetMetadata,
  emptyChannels
} from "src/series/store/state/dataset";
import { setDomain, setInterval } from "src/series/store/state/bounds";
import "bootstrap/dist/css/bootstrap.min.css";

class EEGLabSeriesProvider extends Component {
  constructor(props: Props) {
    super(props);
    const epicMiddleware = createEpicMiddleware();

    // $FlowFixMe There is a problem with the type definitions of redux's createStore function.
    this.store = createStore(
      rootReducer,
      applyMiddleware(thunk, epicMiddleware)
    );

    epicMiddleware.run(rootEpic);

    window.EEGLabSeriesProviderStore = this.store;

    const { chunkDirectoryURLs, epochsTableURLs, limit } = props;

    const chunkUrls =
      chunkDirectoryURLs instanceof Array
        ? chunkDirectoryURLs
        : [chunkDirectoryURLs];

    const racers = (fetcher, urls, route = "") =>
      urls.map(url =>
        fetcher(`${url}${route}`)
          .then(json => ({ json, url }))
          // if request fails don't resolve
          .catch(error => {
            console.error(error);
            return new Promise(resolve => {});
          })
      );

    Promise.race(racers(fetchJSON, chunkUrls, "/index.json")).then(
      ({ json, url }) => {
        const { channelMetadata, shapes, timeInterval, seriesRange } = json;
        this.store.dispatch(
          setDatasetMetadata({
            chunkDirectoryURL: url,
            channelMetadata,
            shapes,
            timeInterval,
            seriesRange,
            limit
          })
        );
        this.store.dispatch(setChannels(emptyChannels(this.props.limit, 1)));
        this.store.dispatch(setDomain(timeInterval));
        this.store.dispatch(setInterval(timeInterval));
      }
    );

    const epochUrls =
      epochsTableURLs instanceof Array ? epochsTableURLs : [epochsTableURLs];

    Promise.race(racers(fetchText, epochUrls)).then(text => {
      if (!(typeof text.json === 'string' || text.json instanceof String)) return;
      this.store.dispatch(
        setEpochs(
          tsvParse(text.json).map(({ onset, duration, trial_type }) => ({
            onset: parseFloat(onset),
            duration: parseFloat(duration),
            type: trial_type,
            channels: "all"
          }))
        )
      );
    });
  }
  render() {
    return <Provider store={this.store}>{this.props.children}</Provider>;
  }
}

EEGLabSeriesProvider.defaultProps = {
  limit: 6
};

export default EEGLabSeriesProvider;
