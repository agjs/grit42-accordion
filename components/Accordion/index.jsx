import React, { useState, useEffect, useRef } from "react";
import { Icon, Position, Tooltip } from "@blueprintjs/core";
import { groupBy } from "lodash";
import className from "classnames";

import "./style.scss";

export default props => {
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});
  const [cursor, setCursor] = useState(0);

  const expanderRef = useRef(null);

  const groupedBySetup = groupBy(props.data, props.groupBy);
  const expandersLength = Object.keys(groupedBySetup).length;

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

  const setFocus = e => {
    event.preventDefault();
    if (e.keyCode === 38) {
      if (cursor === 0) {
        /**
         * If at first expander and up key is pressed, go to the end
         */
        setCursor(expandersLength - 1);
      } else {
        setCursor(cursor - 1);
      }
    } else if (e.keyCode === 40) {
      if (cursor === expandersLength) {
        /**
         * If at last expander and down key is pressed, jump to the start
         */
        setCursor(0);
      } else {
        setCursor(cursor + 1);
      }
    }

     if (e.keyCode === 32) {
       if(expanderRef.current) {
         expanderRef.current.click()
       }
     }

  };

  useEffect(() => {
    if (expanderRef.current !== null) {
      expanderRef.current.focus();
    }
  }, [cursor]);

  useEffect(() => {
    props.getSelected(Object.values(selected));
  }, [selected]);

  return (
    <>
      <ul className="grit42-accordion" onKeyDown={setFocus}>
        <h4 className="grit42-accordion__headline">
          <div className="grit42-accordion__headline__icons">
            {isSelected && <Icon onClick={handleDeselectAll} icon="select" />}
            {isExpanded ? (
              <Icon onClick={uncollapse} icon="minimize" />
            ) : (
              <Icon onClick={collapse} icon="maximize" />
            )}
          </div>
        </h4>
        {Object.keys(groupedBySetup).map((key, expanderIndex) => {
          const selectedLength = Object.values(selected).filter(
            item => item.setup_id__name === key
          ).length;

          const isExpanded = expanded[key] && expanded[key].expanded;
          const showSelectedCount = !isExpanded && selectedLength > 0;

          return (
            <li
              className={className("grit42-accordion__expander")}
              onClick={event => handleExpand(key, groupedBySetup[key])}
              ref={cursor === expanderIndex ? expanderRef : null}
              onKeyPress={event => {
                event.stopPropagation();
                console.log('what')
                if (event.which === 32) {
                  handleExpand(key, groupedBySetup[key]);
                }
              }}
              key={key}
              tabIndex={expanderIndex}
            >
              <div
                className={className("grit42-accordion__expander__title", {
                  "grit42-accordion__expander__title--count": showSelectedCount
                })}
              >
                <span>{key}</span>
                {showSelectedCount && <span>{`${selectedLength}`}</span>}
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
                        <div
                          className={className(
                            "grit42-accordion__items__item__content"
                          )}
                        >
                          {!canSelect ? (
                            <Tooltip
                              content="Only entries from a single setup can be selected at once."
                              position={Position.LEFT}
                            >
                              {result.name}
                            </Tooltip>
                          ) : (
                            result.name
                          )}
                        </div>
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
