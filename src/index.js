import React, { Component } from 'react';
import { render } from 'react-dom';
import './style.css';

import Accordion from './components/Accordion';
import Data from './dummy.json';

import SidebarLayout from './Layouts/LeftSidebar';

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: 'React',
      selected: [],
    };
  }

  getSelected = (selected) => {
    this.setState({ selected });
  };

  render() {
    return (
      <div className="demo">
        <SidebarLayout
          sidebar={
            <div>
              <Accordion
                getSelected={this.getSelected}
                headline="Setups"
                data={Data.data}
                groupBy="setup_id__name"
              />
              <h1>More content here</h1>
              <h1>More content here</h1>
              <h1>More content here</h1>
            </div>
          }
          content={<div>Some content here</div>}
        />
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
