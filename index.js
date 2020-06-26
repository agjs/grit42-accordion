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
          headline="Setups"
          data={Data.data}
          groupBy="setup_id__name"
        />
      </>
    );
  }
}

render(<App />, document.getElementById("root"));
