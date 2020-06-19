import React, { useState, useEffect } from "react";
import { groupBy } from "lodash";
import className from "classnames";

import "./style.scss";

export default props => {
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});

  const groupedBySetup = groupBy(props.data, props.groupBy);

  const handleExpand = (key, data) => {
    if (expanded[key] && expanded[key].expanded) {
      setExpanded({
        ...expanded,
        [key]: {
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

  const collapse = () => {
    const expanded = {};
    // TODO: Use reduce here
    Object.keys(groupedBySetup).forEach(key => {
      expanded[key] = {
        data: groupedBySetup[key],
        expanded: true
      };
    });

    setExpanded({
      ...expanded
    });
  };

  const uncollapse = () => {
    setExpanded({});
  };

  const isSelected = Object.keys(selected).length > 0;
  const isExpanded = Object.keys(expanded).find(key => expanded[key].expanded);

  /**
   * A result is selectable if either no selections are still made or if the item that's being selected is the part of the same setup as already selected results. In simple words, only items from the same setup can be selected.
   */
  const isSelectable = result => {
    const selectedLength = Object.keys(selected).length;
    return (
      selectedLength === 0 ||
      (selectedLength > 0 &&
        Object.values(selected).filter(r => r.setup_id === result.setup_id)
          .length > 0)
    );
  };

  useEffect(() => {
    props.getSelected(Object.values(selected));
  }, [selected]);

  return (
    <>
      {isExpanded ? (
        <button onClick={uncollapse}>Uncollapse</button>
      ) : (
        <button onClick={collapse}>Collapse</button>
      )}
      {isSelected && <button onClick={handleDeselectAll}>Deselect all</button>}
      <ul className="grit42-accordion">
        {Object.keys(groupedBySetup).map(key => {
          const selectedLength = Object.values(selected).filter(
            item => item.setup_id__name === key
          ).length;

          const isExpanded = expanded[key] && expanded[key].expanded;
          const showSelectedCount = !isExpanded && selectedLength > 0;

          return (
            <li
              className={className("grit42-accordion__expander")}
              onClick={event => handleExpand(key, groupedBySetup[key])}
              key={key}
            >
              <div className={className("grit42-accordion__expander__title")}>
                <span>{key}</span>
                {showSelectedCount && <span>{`${selectedLength} selected`}</span>}
              </div>
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
