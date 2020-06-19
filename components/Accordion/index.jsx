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
    if (expanded[key] && expanded[key].expanded) {
      setExpanded({
        ...expanded,
        [key]: {
          ...expanded[key].data,
          expanded: false
        }
      });
    } else {
      setExpanded({
        ...expanded,
        [key]: {
          data,
          expanded: true
        }
      });
    }
  };

  const handleSelect = (key, result) => {
    if (selected[result.id]) {
      delete selected[result.id];
      setSelected({
        ...selected
      });
    } else {
      setSelected({
        ...selected,
        [result.id]: result
      });
    }
    console.log(selected)
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
            {expanded[key] && expanded[key].expanded && (
              <ul className={className("grit42-accordion__items")}>
                {expanded[key].data.map((result, index) => (
                  <li
                    className={className("grit42-accordion__items__item", {
                      "grit42-accordion__items__item--selected":
                        selected[result.id]
                    })}
                    key={`${result.name}-${index}`}
                    onClick={event => {
                      event.stopPropagation();
                      handleSelect(key, result);
                    }}
                  >
                    {result.name}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};
