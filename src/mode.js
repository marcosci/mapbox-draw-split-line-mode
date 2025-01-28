import MapboxDraw from "@mapbox/mapbox-gl-draw";

let geojsonTypes = MapboxDraw.constants.geojsonTypes;
let events = MapboxDraw.constants.events;

import lineSplit from "@turf/line-split";
import booleanDisjoint from "@turf/boolean-disjoint";
import combine from "@turf/combine";
import flatten from "@turf/flatten";
import { featureCollection } from "@turf/helpers";

import {
  modeName,
  passingModeName,
  highlightPropertyName,
  defaultOptions,
} from "./constants";

const SplitLineMode = {
  onSetup: function () {
    let featureIds = [];
    let highlightColor = defaultOptions.highlightColor;

    const api = this._ctx.api;

    const featuresToSplit = [];
    const selectedFeatures = this.getSelected();

    // Get the selected feature(s) as GeoJSON
    if (selectedFeatures.length !== 0) {
      featuresToSplit.push.apply(
        featuresToSplit,
        selectedFeatures
          .filter(
            (f) =>
              f.type === geojsonTypes.LINE_STRING ||
              f.type === geojsonTypes.MULTI_LINE_STRING,
          )
          .map((f) => f.toGeoJSON()),
      );
    } else {
      return defaultOptions.onSelectFeatureRequest();
    }

    const state = {
      options: {
        highlightColor,
      },
      featuresToSplit,
      api,
    };

    /// `onSetup` job should complete for this mode to work.
    /// so `setTimeout` is used to bupass mode change after `onSetup` is done executing.
    setTimeout(this.drawAndSplit.bind(this, state), 0);
    this.highlighFeatures(state);

    return state;
  },

  drawAndSplit: function (state) {
    const { api, options } = state;

    try {
      this.changeMode(passingModeName, {
        onDraw: (cuttingLineString) => {
          const newLine = [];
          state.featuresToSplit.forEach((el) => {
            if (booleanDisjoint(el, cuttingLineString)) {
              console.info(`Line was outside of Line ${el.id}`);
              newLine.push(el);
              return;
            }
            // split the line
            const splitLines = lineSplit(el, cuttingLineString);
            splitLines.id = el.id;
            newLine.push(splitLines);
          });

          let collected = featureCollection(
            newLine.flatMap((featureColl) => featureColl.features),
          );
          let comb_lines = combine(collected).features[0];

          console.log(state.featuresToSplit[0])
          comb_lines.id = state.featuresToSplit[0].id;

          console.log(comb_lines)
          api.add(comb_lines);

          this.fireUpdate(comb_lines);
          this.highlighFeatures(state, false);
        },
        onCancel: () => {
          this.highlighFeatures(state, false);
        },
      });
    } catch (err) {
      console.error("🚀 ~ file: mode.js ~ line 116 ~ err", err);
    }
  },

  toDisplayFeatures: function (state, geojson, display) {
    display(geojson);
  },

  highlighFeatures: function (state, shouldHighlight = true) {
    const color = shouldHighlight ? state.options.highlightColor : undefined;

    state.featuresToSplit.forEach((f) => {
      state.api.setFeatureProperty(f.id, highlightPropertyName, color);
    });
  },

  fireUpdate: function (newF) {
    this.map.fire(events.UPDATE, {
      action: modeName,
      features: newF,
    });
  },
};

export default SplitLineMode;
