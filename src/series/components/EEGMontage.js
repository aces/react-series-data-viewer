// @flow

import * as R from "ramda";
import React from "react";
import {connect} from "react-redux";
import {scaleLinear} from "d3-scale";
import {Group} from "@visx/group";
import ResponsiveViewer from "./ResponsiveViewer";
import type { Electrode} from "../../series/store/types";
import {setHidden} from "../../series/store/state/montage";

type Props = {
  electrodes: Electrode[],
  hidden: number[],
  setHidden: (number[]) => void
};

const svgStyles = {
  electrodeButton: {
    size: 10
  }
};

const EEGMontage = ({ electrodes, hidden, setHidden }: Props) => {
  const scaleX = scaleLinear;
  const ElectrodeButton = ({ electrode }) => {
    const top = scaleX();
    return <Group />;
  };
  return (
    <ResponsiveViewer>
      <Group />
    </ResponsiveViewer>
  );
};

EEGMontage.defaultProps = {
  montage: [],
  hidden: []
};

export default connect(
  state => ({
    hidden: state.montage.hidden,
    electrodes: state.montage.electrodes
  }),
  (dispatch: any => void) => ({
    setHidden: R.compose(
      dispatch,
      setHidden
    )
  })
)(EEGMontage);
