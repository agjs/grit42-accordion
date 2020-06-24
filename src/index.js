import React, { useState } from 'react';
import { render } from 'react-dom';
import './style.css';

import PlateView from './components/plots/Plate';

import dummy from './test.json';

import { DATA_SET_SERIES, parameters } from './dummy/index';

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
      <PlateView
        onSelect={onSelected}
        data={DATA_SET_SERIES}
        parameters={parameters}
        properties={[
          { name: '% Effect', value: 'effect', canDisplayHeatMap: false },
          { name: 'Compound', value: 'compound', canDisplayHeatMap: true },
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
            value: 'signal_wo_background',
            canDisplayHeatMap: true,
          },
          {
            name: 'Unit',
            value: 'unit',
            canDisplayHeatMap: false,
          },
          {
            name: 'Well Layout',
            value: 'welllayout',
            canDisplayHeatMap: true,
          },
        ]}
      />
    </div>
  );
};

render(<App />, document.getElementById('root'));
