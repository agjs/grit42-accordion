import React, { useState, useEffect, useRef } from 'react';
import { Icon, Position, Tooltip } from '@blueprintjs/core';
import { groupBy } from 'lodash';
import className from 'classnames';

import './style.scss';

const KEY_CODES = {
  SPACE: 32,
  ENTER: 13,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
};

export default (props) => {
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState({});
  const [pointer, setPointer] = useState(0);

  const expanderRef = useRef(null);

  const groupedBySetup = groupBy(props.data, props.groupBy);

  const handleExpand = (key, data, expanderIndex) => {
    setPointer(expanderIndex);
    if (expanded[key] && expanded[key].expanded) {
      setExpanded({
        ...expanded,
        [key]: {
          expanded: false,
        },
      });
    } else {
      setExpanded({
        ...expanded,
        [key]: {
          data,
          expanded: true,
        },
      });
    }
  };

  const handleSelect = (key, result) => {
    if (selected[result.id]) {
      delete selected[result.id];
      setSelected({
        ...selected,
      });
    } else {
      setSelected({
        ...selected,
        [result.id]: result,
      });
    }
  };

  const handleDeselectAll = () => {
    setSelected({});
  };

  const collapse = () => {
    const expanded = {};
    Object.keys(groupedBySetup).forEach((key) => {
      expanded[key] = {
        data: groupedBySetup[key],
        expanded: true,
      };
    });

    setExpanded({
      ...expanded,
    });
  };

  const uncollapse = () => {
    setExpanded({});
  };

  const isSelected = Object.keys(selected).length > 0;
  const isExpanded = Object.keys(expanded).find((key) => expanded[key].expanded);

  /**
   * A result is selectable if either no selections are still made or if the item that's being selected is the part of the same setup as already selected results. In simple words, only items from the same setup can be selected.
   */
  const isSelectable = (result) => {
    const selectedLength = Object.keys(selected).length;
    return (
      selectedLength === 0 ||
      (selectedLength > 0 &&
        Object.values(selected).filter((r) => r.setup_id === result.setup_id).length > 0)
    );
  };

  const handleKeyPress = (e, length, isExpanded, expanderIndex, itemIndex, key) => {
    switch (e.keyCode) {
      case KEY_CODES.ARROW_UP:
        if (pointer === 0) {
          setPointer(length - 1);
        } else {
          if (isExpanded) {
            if (!itemIndex) {
              setPointer(expanderIndex - 1);
            } else if (itemIndex === 1) {
              setPointer(expanderIndex);
            } else {
              setPointer(`${key}-${itemIndex - 1}`);
            }
          } else {
            setPointer(expanderIndex - 1);
          }
        }
        return;
      case KEY_CODES.ARROW_DOWN:
        if (isExpanded) {
          if (itemIndex === length) {
            setPointer(expanderIndex + 1);
          } else if (typeof pointer === 'number') {
            setPointer(`${key}-1`);
          } else {
            setPointer(`${key}-${itemIndex + 1}`);
          }
        } else {
          setPointer(expanderIndex + 1);
        }
        return;
      case KEY_CODES.SPACE:
      case KEY_CODES.ENTER:
        if (expanderRef.current) {
          expanderRef.current.click();
        }
        return;
      default:
        return null;
    }
  };

  const setFocus = (e) => {
    if (!expanderRef.current || !expanderRef.current.attributes) {
      return;
    }

    const {
      'data-expander-key': key,
      'data-expander-index': expanderIndex,
      'data-item-index': itemIndex,
    } = expanderRef.current.attributes || {};

    const expandersLength = Object.keys(groupedBySetup).length;
    const isExpanded = expanded[key.value] && expanded[key.value].expanded;
    const length = isExpanded
      ? expanded[key.value] && expanded[key.value].data.length
      : expandersLength;

    handleKeyPress(
      e,
      length,
      isExpanded,
      +Number(expanderIndex.value),
      itemIndex && +Number(itemIndex.value),
      key.value,
    );
  };

  useEffect(() => {
    if (expanderRef.current !== null) {
      expanderRef.current.focus();
    } else {
      /**
       * If on the last element in the list and keyDown is pressed, reset the pointer back to the beginning
       */
      setPointer(0);
    }
  }, [pointer, expanded, expanderRef.current]);

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
            (item) => item.setup_id__name === key,
          ).length;

          const isExpanded = expanded[key] && expanded[key].expanded;
          const showSelectedCount = !isExpanded && selectedLength > 0;

          return (
            <li
              className={className('grit42-accordion__expander')}
              onClick={(_) => handleExpand(key, groupedBySetup[key], expanderIndex)}
              ref={pointer === expanderIndex ? expanderRef : null}
              key={key}
              tabIndex={expanderIndex}
              data-expander-key={key}
              data-expander-index={expanderIndex}
            >
              <div
                className={className('grit42-accordion__expander__title', {
                  'grit42-accordion__expander__title--count': showSelectedCount,
                })}
              >
                <span>{key}</span>
                {showSelectedCount && <span>{`${selectedLength}`}</span>}
              </div>
              {expanded[key] && expanded[key].expanded && (
                <ul className={className('grit42-accordion__items')}>
                  {expanded[key].data.map((result, itemIndex) => {
                    const canSelect = isSelectable(result);
                    const index = `${key}-${itemIndex + 1}`;
                    return (
                      <li
                        data-expander-key={key}
                        data-expander-index={expanderIndex}
                        data-item-index={itemIndex + 1}
                        ref={pointer === index ? expanderRef : null}
                        className={className('grit42-accordion__items__item', {
                          'grit42-accordion__items__item--selected': selected[result.id],
                          'grit42-accordion__items__item--keyboard-hover': pointer === index,
                          'grit42-accordion__items__item--unselectable': !canSelect,
                        })}
                        key={`${result.name}-${itemIndex}`}
                        onClick={
                          canSelect
                            ? (event) => {
                                event.stopPropagation();
                                handleSelect(key, result);
                              }
                            : (event) => event.stopPropagation()
                        }
                      >
                        <div className={className('grit42-accordion__items__item__content')}>
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
