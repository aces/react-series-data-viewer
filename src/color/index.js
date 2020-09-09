import * as R from 'ramda';
import {scaleOrdinal} from 'd3-scale';
import {schemeCategory10, schemeSet3} from 'd3-scale-chromatic';

export const colorOrder = scaleOrdinal(R.concat(schemeCategory10, schemeSet3));
