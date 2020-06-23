import * as d3 from 'd3';
import DragSelect from 'dragselect';
import React, { useEffect, useRef, useState } from 'react';
import { DATA_SET_SERIES } from '../../../dummy';
import './style.css';
import { addZeroPad, COLORS, createLabels, yToWell } from './utils';

import { useDidMountEffect } from '../../../custom_hooks';

export default (props) => {
  const d3Container = useRef(null);
  const [state] = useState({
    series: DATA_SET_SERIES,
  });

  const [selectedUnit, setSelectedUnit] = useState(props.properties[0] || {});
  const [heatMap, setHeatMap] = useState({
    mode: 'linear',
    enabled: false,
  });

  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const width = 450 - margin.left - margin.right;
  const height = 150 - margin.top - margin.bottom;

  const handlePropertySelect = (event) => {
    const { index } = event.target.options[event.target.selectedIndex].dataset;
    setSelectedUnit(props.properties[index]);
  };

  const toggleHeatMap = (event) => {
    setHeatMap({ ...heatMap, enabled: event.target.checked });
  };

  const setEventListeners = (container) => {
    d3.selectAll('.tick').on('click', (value) => console.log(value));
  };

  const setSelectables = () =>
    new DragSelect({
      selectables: document.querySelectorAll('.grit42-plate-plot__svg rect'),
      callback: (data) => {
        props.onSelect(
          data.map((rect) => ({
            ...rect.__data__,
            index: +Number(rect.getAttribute('index')),
          })),
        );
      },
    });

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
      .call(d3.axisTop(xAxis))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('line').remove());

    return xAxis;
  };

  const createYAxis = (svg) => {
    const yAxis = d3.scaleBand().range([0, height]).domain(getYLabels()).padding(0.01);

    svg
      .append('g')
      .call(d3.axisLeft(yAxis))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('line').remove());

    return yAxis;
  };

  const getXLabels = () => {
    return createLabels(props.xLabels, getGridDimensions().xAxis, addZeroPad);
  };

  const getYLabels = () => {
    return createLabels(props.yLabels, getGridDimensions().yAxis, yToWell);
  };

  const getRectangleColor = (d, minMax) => {
    const getHeatColor = d3
      .scaleLinear()
      .domain(d3.range(0, 1, 1.0 / (COLORS.heat.length - 1)))
      .range(COLORS.heat);

    if (d.bogus === 1) {
      return COLORS.bogus;
    } else {
      if (heatMap.enabled) {
        if (heatMap.mode === 'linear') {
          return getHeatColor(d3.scaleLinear().domain(minMax).range([0, 1])(d[selectedUnit.value]));
        } else {
          return getHeatColor(d3.scaleLog().domain(minMax).range([0, 1])(d[selectedUnit.value]));
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

  const setRectHoverText = (rectangles) => {
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

  const createRectangles = (svg, xAxis, yAxis) => {
    const minMax = getMinMax();
    const rectangles = svg.selectAll('rect').data(state.series).enter().append('rect');

    rectangles
      .attr('index', (_, i) => i)
      .attr('x', (d) => xAxis(d.well.substr(1)))
      .attr('y', (d) => yAxis(d.well.charAt(0)))
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('width', xAxis.bandwidth())
      .attr('height', yAxis.bandwidth());

    rectangles.style('fill', (d) => getRectangleColor(d, minMax));

    return rectangles;
  };

  const recolor = () => {
    const svg = d3.select(d3Container.current).selectAll('rect');
    const minMax = getMinMax();
    svg.style('fill', (d) => getRectangleColor(d, minMax));
  };

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

  useEffect(() => {
    if (!props.plotData || !d3Container.current) {
      return;
    }

    const svg = createSVG(d3Container.current);
    const xAxis = createXAxis(svg);
    const yAxis = createYAxis(svg);
    const rectangles = createRectangles(svg, xAxis, yAxis);

    setRectHoverText(rectangles);
    setEventListeners();
    setSelectables();
  }, []);

  useDidMountEffect(() => {
    recolor();
  }, [heatMap.enabled, heatMap.mode, selectedUnit.value]);

  return (
    <div className="grit42-plate-plot">
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
            <select>
              <option>Linear</option>
              <option>Logarithmic</option>
            </select>
          </>
        )}
      </form>
      <svg className="grit42-plate-plot__svg" ref={d3Container} />
    </div>
  );
};
