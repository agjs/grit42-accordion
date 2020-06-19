import React, { useState, useEffect } from "react";
import { groupBy } from "lodash";
import className from "classnames";

import "./style.scss";

/**
 * Items which belong to different setups cannot be selected
 * So a smart thing to do would be to gray out some of the selection
 * if user has selected specific setup
 * e.g. if I choose 3 items from 1 setup, items from other setups should be
 * grayed out with a tooltip explaining why
 *
 * I should add some indicators when something inside of some setup is selected. In the current implementation, that can become confusing because you can select items and minimize the group, not really seeing what is selected and where
 *
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
  };

  const handleDeselectAll = () => {
    setSelected({});
  };

  const isSelected = Object.keys(selected).length > 0;

  /**
   * A result is selectable if either no selection are still made or if the item that's being selected is the part of the same setup as already selected results. In simple words, only items from the same setup can be selected.
   */
  const isSelectable = result => {
    return (
      Object.keys(selected).length === 0 ||
      (Object.keys(selected).length > 0 &&
        Object.values(selected).filter(r => r.setup_id === result.setup_id)
          .length > 0)
    );
  };

  // {isSelected && <button onClick={handleDeselectAll}>Deselect all</button>}

  useEffect(() => {
    props.getSelected(Object.values(selected));
  }, [selected]);

  return (
    <>
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
                  {expanded[key].data.map((result, index) => {
                    const canSelect = isSelectable(result);
                    return (
                      <li
                        className={className("grit42-accordion__items__item", {
                          "grit42-accordion__items__item--selected":
                            selected[result.id],
                          "grit42-accordion__items__item--unselectable": !canSelect
                        })}
                        key={`${result.name}-${index}`}
                        onClick={
                          canSelect
                            ? event => {
                                event.stopPropagation();
                                handleSelect(key, result);
                              }
                            : event => event.stopPropagation()
                        }
                      >
                        {result.name}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
};
