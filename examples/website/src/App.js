import React, { Component } from 'react';
import {client} from '@jeffriggle/ipc-bridge-client';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      native: false
    }
  }

  componentDidMount() {
    if (client.available) {
      this.setState({native: true});
      return;
    }

    client.on(client.availableChanged, this.ipcStateChanged.bind(this));
  }

  ipcStateChanged(state) {
    this.setState({native: state});
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          Simple Website
        </header>
        <div className="body-item">
          This is a simple website that stands on its own.
        </div>
        {this.state.native && <div className="body-item">However with electron it can have super powers.<button onClick={this.onbuttonClicked.bind(this)}>Click me!</button></div>}
      </div>
    );
  }

  onbuttonClicked() {
    client.sendMessage('showpopup', {message: 'Hello electron!'});
  }
}

export default App;
