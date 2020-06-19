import React, { Component } from "react";
import { render } from "react-dom";
import "./style.css";

import Accordion from "./components/Accordion";
import Data from "./dummy.json";

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: "React",
      selected: []
    };
  }

  getSelected = selected => {
    this.setState({ selected });
  };

  render() {
    return (
      <>
        <Accordion
          getSelected={this.getSelected}
          data={Data.data}
          groupBy="setup_id__name"
        />
        {this.state.selected.length > 0 && (
          <div className="demo">
            <h1>Demo - Selected</h1>
            <pre>
              {this.state.selected.map(item => {
                return JSON.stringify(item, undefined, 2);
              })}
            </pre>
          </div>
        )}
      </>
    );
  }
}

render(<App />, document.getElementById("root"));
