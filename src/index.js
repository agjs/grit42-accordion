import React, { useState } from 'react';
import { render } from 'react-dom';
import './style.css';

import PlatePlot from './components/plots/Plate';

import dummy from './test.json';
import { parameters } from './dummy/index';

const App = () => {
  const [data] = useState(dummy);

  const onSelected = (selected) => {
    if (!selected.length) {
      return;
    }
    console.log(selected);
  };
  return (
    <div>
      <PlatePlot
        onSelect={onSelected}
        plotData={data}
        parameters={parameters}
        properties={[
          { name: '% Effect', value: 'effect', canDisplayHeatMap: false },
          { name: 'Compound', value: 'compound', canDisplayHeatMap: false },
          { name: 'Concentration', value: 'concentration', canDisplayHeatMap: true },
          {
            name: 'Concentration Normalized',
            value: 'concentration_normalized',
            canDisplayHeatMap: false,
          },
          {
            name: 'Signal',
            value: 'signal',
            canDisplayHeatMap: true,
          },
          {
            name: 'Singal without background % (delta F)',
            value: 'singal_without_background',
            canDisplayHeatMap: true,
          },
          {
            name: 'Unit',
            value: 'unit',
            canDisplayHeatMap: false,
          },
          {
            name: 'Well Layout',
            value: 'well_layout',
            canDisplayHeatMap: false,
          },
        ]}
      />
    </div>
  );
};

render(<App />, document.getElementById('root'));
