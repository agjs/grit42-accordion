import React, { Component } from "react";
import { render } from "react-dom";
import "./style.css";

import Accordion from "./components/Accordion";
import Data from './dummy.json';

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: "React"
    };
  }

  render() {
    return <Accordion data={Data.data} />;
  }
}

render(<App />, document.getElementById("root"));
