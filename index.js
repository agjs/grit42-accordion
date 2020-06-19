import React, { Component } from "react";
import { render } from "react-dom";
import "./style.css";

import Accordion from "./components/Accordion";
import Data from "./dummy.json";

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: "React"
    };
  }

  getSelected = selected => {
    console.log(selected);
  };

  render() {
    return (
      <Accordion
        getSelected={this.getSelected}
        data={Data.data}
        groupBy="setup_id__name"
      />
    );
  }
}

render(<App />, document.getElementById("root"));
