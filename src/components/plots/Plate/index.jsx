import * as d3 from 'd3';
import DragSelect from 'dragselect';
import React, { useEffect, useRef, useState } from 'react';
import './style.css';
import {
  addZeroPad,
  COLORS,
  SELECTORS,
  createLabels,
  yToWell,
  addEventListener,
  getFirstCharacter,
} from './utils';

import { useDidMountEffect, usePrevious } from '../../../custom_hooks';

export default (props) => {
  const d3Container = useRef(null);
  const [state] = useState({
    series: props.data,
  });

  const [selectedUnit, setSelectedUnit] = useState(props.properties[0] || {});
  const [heatMap, setHeatMap] = useState({
    mode: 'linear',
    enabled: false,
  });

  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const width = 450 - margin.left - margin.right;
  const height = 150 - margin.top - margin.bottom;

  /**
   * A handler for property selection. Sets the selected object in local state by accessing it
   * through index. The object currently contains the value (which is the original property name)
   * from the actual well object and wether the selected entry can display the heat map.
   *
   * @param {*} event
   */
  const handlePropertySelect = (event) => {
    const { index } = event.target.options[event.target.selectedIndex].dataset;
    setSelectedUnit(props.properties[index]);
  };

  const handleHeatMapMode = (event) => {
    setHeatMap({ ...heatMap, mode: event.target.value });
  };

  /**
   * Toggles the heat map on and off.
   * @param {*} event
   *
   * @return {undefined} - Nothing
   */
  const toggleHeatMap = (event) => {
    setHeatMap({ ...heatMap, enabled: event.target.checked });
  };

  /**
   * Creates an instance of DragSelect and adds event listeners to X and Y axis labels and also,
   * a listener for drag selection. X and Y axis listeners are listening for double click on the
   * respective labels.
   *
   * Selection is handled in a data driven way and in all circumstances relies fully on the DragSelect
   * module.
   *
   * @param {*} rectangles
   */
  const addSelectionListeners = (rectangles) => {
    const ds = new DragSelect({
      selectables: document.querySelectorAll(`.${SELECTORS.SVG} rect`),
      callback: (data) => {
        props.onSelect(
          data.map((rect) => ({
            ...rect.__data__,
            index: +Number(rect.getAttribute('index')),
          })),
        );
      },
    });

    addEventListener(`.${SELECTORS.Y_AXIS_LABELS}`, `.${SELECTORS.TICK}`, 'dblclick', (value) => {
      const selected = rectangles.filter((item) => value === getFirstCharacter(item.well));
      ds.addSelection(selected._groups[0], true);
    });

    addEventListener(`.${SELECTORS.X_AXIS_LABELS}`, `.${SELECTORS.TICK}`, 'dblclick', (value) => {
      const { xAxis } = getGridDimensions();
      const column = parseInt(value, 10);
      const selected = rectangles.filter((_, i) => {
        return i % xAxis === xAxis - (xAxis - column + 1);
      });
      ds.addSelection(selected._groups[0], true);
    });
  };

  const createSVG = (container) => {
    return d3
      .select(container)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 450 450`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  };

  const createXAxis = (svg) => {
    const xAxis = d3.scaleBand().range([0, width]).domain(getXLabels()).padding(0.01);

    svg
      .append('g')
      .attr('class', SELECTORS.X_AXIS_LABELS)
      .call(d3.axisTop(xAxis))
      .call((g) => g.select(`.${SELECTORS.DOMAIN}`).remove())
      .call((g) => g.selectAll(SELECTORS.LINE).remove());

    /**
     * Currently, at the time of writing, d3js API doesn't provide any "pre-selection"
     * features to disable creation of domain and line before they are actually rendered.
     * That being said, it's only possible in the "post-selection" way, meaning, they are
     * unnecessarily rendered and then removed afterwards. While not a major thing, if the API
     * provides such functionality in the future, it would be nice to implement it.
     */

    return xAxis;
  };

  const createYAxis = (svg) => {
    const yAxis = d3.scaleBand().range([0, height]).domain(getYLabels()).padding(0.01);

    svg
      .append('g')
      .attr('class', SELECTORS.Y_AXIS_LABELS)
      .call(d3.axisLeft(yAxis))
      .call((g) => g.select(`.${SELECTORS.DOMAIN}`).remove())
      .call((g) => g.selectAll(SELECTORS.LINE).remove());

    return yAxis;
  };

  const getXLabels = () => {
    return createLabels(props.xLabels, getGridDimensions().xAxis, addZeroPad);
  };

  const getYLabels = () => {
    return createLabels(props.yLabels, getGridDimensions().yAxis, yToWell);
  };

  const getRectangleColor = (d, minMax) => {
    const heatMapColorScale = d3
      .scaleLinear()
      .domain(d3.range(0, 1, 1.0 / (COLORS.heat.length - 1)))
      .range(COLORS.heat);

    if (d.bogus === 1) {
      return COLORS.bogus;
    } else {
      if (heatMap.enabled) {
        if (heatMap.mode === 'linear') {
          return heatMapColorScale(
            d3.scaleLinear().domain(minMax).range([0, 1])(d[selectedUnit.value]),
          );
        } else if (heatMap.mode === 'logarithmic') {
          return heatMapColorScale(
            d3.scaleLog().domain(minMax).range([0, 1])(d[selectedUnit.value]),
          );
        }
      } else {
        if (COLORS.named[d['welllayout__name']]) {
          return COLORS.named[d['welllayout__name']]['bg'];
        } else {
          return COLORS.named['blank']['bg'];
        }
      }
    }
  };

  const getMinMax = () =>
    d3.extent(state.series, (d) => {
      if (!d.bogus && d[selectedUnit.value]) {
        return +Number(d[selectedUnit.value]);
      }
    });

  /**
   * Appends the title element inside of the rectangle which is shown on mouse hover
   * @url http://bl.ocks.org/ilyabo/1339996
   * @param {*} rectangles
   */
  const setRectangleHoverText = (rectangles) => {
    function sigFig(val, digits = 3) {
      if (Number(val) < 100) {
        return Number(Number(val).toPrecision(digits));
      } else {
        return Number(Number(val).toFixed(0));
      }
    }

    rectangles.append('svg:title').text((d) => {
      let txt = '';
      props.parameters.forEach((parameter) => {
        const {
          name,
          safe_name,
          entity,
          data_type_id__is_entity,
          data_type_id__name,
          postfix,
        } = parameter;

        txt += `${name}: `;
        if (data_type_id__is_entity) {
          if (entity === 'FormatObject') {
            txt += d[`${safe_name}__alt_name`];
          } else if (entity === 'Compound') {
            txt += d[`${safe_name}__origin_compound_name`];
          } else {
            txt += d[`${safe_name}__name`];
          }
        } else if (data_type_id__name === 'numeric') {
          let value = Number(d[safe_name]);

          if (value < 0.01) {
            value = value.toExponential(2);
          } else {
            value = sigFig(value, 3);
          }
          if (safe_name === 'concentration') {
            value = `${value} mM`;
          }
          txt += value;
        } else {
          txt += d[safe_name] || '';
        }
        if (postfix) {
          txt += ` ${postfix}`;
        }
        txt += '\n';
      });
      return txt;
    });
  };

  /**
   * Creates the groups and inside of groups, text and rectangle elements
   *
   * @param {object} svg - D3 selection object
   * @param {function} xAxis - Scale function
   * @param {*} yAxis - Scale function
   *
   * @return {object} - D3 Selection
   */
  const createRectangles = (svg, xAxis, yAxis) => {
    console.log(xAxis);
    const minMax = getMinMax();
    const group = svg.selectAll(SELECTORS.RECT).data(state.series).enter().append('g');
    const rectangles = group.append(SELECTORS.RECT);

    group
      .append('text')
      .attr('x', (d) => xAxis(d.well.substr(1)) + xAxis.bandwidth() / 2)
      .attr('y', (d) => yAxis(getFirstCharacter(d.well)) + yAxis.bandwidth() / 2)
      .classed(SELECTORS.RECT_TEXT, true)
      .text((d) => d[selectedUnit.value]);

    rectangles
      .attr('index', (_, i) => i)
      .attr('x', (d) => xAxis(d.well.substr(1)))
      .attr('y', (d) => yAxis(getFirstCharacter(d.well)))
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', xAxis.bandwidth())
      .attr('height', yAxis.bandwidth());

    rectangles.style('fill', (d) => getRectangleColor(d, minMax));

    return rectangles;
  };

  /**
   * Called whenever some of the internal state variables change. For example, whenever user
   * enables a heatmap or does any operation that has to apply different colors to rectangles
   * 
   @return {undefined} - Nothing
   */
  const recolor = () => {
    const svg = d3.select(d3Container.current).selectAll(SELECTORS.RECT);
    const minMax = getMinMax();
    svg
      .transition()
      .duration(1000)
      .style('fill', (d) => getRectangleColor(d, minMax));
  };

  /**
   * Calculates the dynamic font-size based on the text length and the grid y axis length
   * @url https://bl.ocks.org/mbostock/1846692
   * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextContentElement
   * @param {SVGTextContentElement} textNode - An actual text element
   * @param {number} y - Vertical grid size
   * @returns {string} - Font size in pixels
   */
  const getDynamicFontSize = (textNode, y) => {
    const size = Math.min(2 * y, ((2 * y - 8) / textNode.getComputedTextLength()) * 24);
    return size > 12 ? 12 : `${size}px`;
  };

  /**
   * Updates the texts inside of groups based on the selected property in the state.
   *
   * @return {undefined} - Nothing
   */
  const setGroupText = () => {
    const group = d3.select(d3Container.current).selectAll(`.${SELECTORS.RECT_TEXT}`);
    group
      .text((d) => d[selectedUnit.value])
      .style('font-size', function (d) {
        const { yAxis } = getGridDimensions();
        return getDynamicFontSize(this, yAxis);
      });
  };

  /**
   * Returns the dimension of a Grid. If the gridDimensions object is not provided via props,
   * grid size will be avaluated based on the data length, which usually defaults to one of the
   * value pairs which are hardcoded inside the switch statement.
   *
   * @returns {object} An object with two properties, xAxis and yAxis
   */
  const getGridDimensions = () => {
    const { xAxis, yAxis } = props.gridDimensions || {};
    if (!xAxis || !yAxis) {
      switch (state.series.length) {
        case 96:
          return { xAxis: 12, yAxis: 8 };
        case 384:
          return { xAxis: 24, yAxis: 16 };
        case 1536:
          return { xAxis: 48, yAxis: 32 };
        default:
          return { xAxis: 12, yAxis: 8 };
      }
    } else {
      return { xAxis, yAxis };
    }
  };

  /**
   * Ran on initial render only
   */
  useEffect(() => {
    if (!state.series.length || !d3Container.current) {
      return;
    }

    const svg = createSVG(d3Container.current);
    const xAxis = createXAxis(svg);
    const yAxis = createYAxis(svg);
    const rectangles = createRectangles(svg, xAxis, yAxis);
    addSelectionListeners(rectangles);

    setRectangleHoverText(rectangles);
  }, []);

  const previousSelected = usePrevious(selectedUnit.value);
  const previousHeatMapMode = usePrevious(heatMap.mode);
  const previousHeatMapEnabled = usePrevious(heatMap.enabled);

  /**
   * Ran whenever provided dependencies change. "useDidMountEffect" custom hook is used because we
   * don't want this effect to run on initial render. Inside of this effect, we compare the previous
   * and the current state and react accordingly.
   */
  useDidMountEffect(() => {
    if (selectedUnit.value !== previousSelected) {
      setGroupText();
    }

    if (heatMap.enabled && !selectedUnit.canDisplayHeatMap) {
      /**
       * If user enables a heatmap for a specific entry and then switches back to an entry
       * that cannot display a heatmap, we want to revert the heatmap state to disabled.
       */
      setHeatMap({ ...heatMap, enabled: false });
      return;
    }

    if (
      heatMap.enabled !== previousHeatMapEnabled ||
      (heatMap.enabled &&
        (selectedUnit.value !== previousSelected || heatMap.mode !== previousHeatMapMode))
    ) {
      recolor();
    }
  }, [heatMap.enabled, heatMap.mode, selectedUnit.value]);

  return (
    <div className={SELECTORS.CONTAINER}>
      <form>
        <select onChange={handlePropertySelect}>
          {props.properties.map((option, index) => (
            <option key={option.name} data-index={index} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
        {selectedUnit.canDisplayHeatMap && (
          <>
            <label htmlFor="show_heatmap">Show Heatmap</label>
            <input onChange={toggleHeatMap} type="checkbox" name="show_heatmap" />
            <select onChange={handleHeatMapMode}>
              <option value="linear">Linear</option>
              <option value="logarithmic">Logarithmic</option>
            </select>
          </>
        )}
      </form>
      <svg className={SELECTORS.SVG} ref={d3Container} />
    </div>
  );
};
