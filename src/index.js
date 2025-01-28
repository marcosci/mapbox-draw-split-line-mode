import { default as splitLineMode } from "./mode.js";
import { default as drawStyles } from "./customDrawStyles.js";
import * as Constants from "./constants";

import { passing_draw_line_string } from "mapbox-gl-draw-passing-mode";
import SelectFeatureMode from "mapbox-gl-draw-select-mode";
import { modeName, passingModeName } from "./constants";

export { splitLineMode };
export { drawStyles };
export { Constants };

export default function SplitLineMode(modes) {
  return {
    ...SelectFeatureMode(modes),
    [passingModeName]: passing_draw_line_string,
    [modeName]: splitLineMode,
  };
}
