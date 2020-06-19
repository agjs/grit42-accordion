import React, { useState } from "react";
import { groupBy } from "lodash";
import className from "classnames";

import "./style.scss";

/**
 * Items which belong to different setups cannot be selected
 * So a smart thing to do would be to gray out some of the selection
 * if user has selected specific setup
 * e.g. if I choose 3 items from 1 setup, items from other setups should be
 * grayed out with a tooltip explaining why
 */

export default props => {
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});

  const groupedBySetup = groupBy(props.data, "setup_id__name");

  const handleExpand = (key, data) => {
    if (expanded[key] && expanded[key].selected) {
      setExpanded({
        ...expanded,
        [key]: {
          data,
          selected: false
        }
      });
    } else {
      setExpanded({
        ...expanded,
        [key]: {
          data,
          selected: true
        }
      });
    }
  };

  const handleSelect = event => {
    event.stopPropagation();
    console.log("selecting");
  };

  return (
    <ul className="grit42-accordion">
      {Object.keys(groupedBySetup).map(key => {
        return (
          <li
            className={className("grit42-accordion__expander")}
            onClick={event => handleExpand(key, groupedBySetup[key])}
            key={key}
          >
            <span className={className("grit42-accordion__expander__title")}>
              {key}
            </span>
            {expanded[key] && expanded[key].selected && (
              <ul>
                {expanded[key].data.map(li => (
                  <li onClick={handleSelect}>{li.name}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};
