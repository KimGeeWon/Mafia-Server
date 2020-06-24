import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { StartChat, GameScreen } from './page';

class App extends Component {

  // componentDidMount() {
  //   fetch('http://localhost:3002/api')
  //       .then(res=>res.json())
  //       .then(data=>this.setState({greeting: data.banana}));
  // }

  render() {
    // const {greeting} = this.state;

    // console.log(greeting);

    return (
      <div>
        <Router>
          <Switch>
            <Route exact path="/" component={StartChat}/>
            <Route path="/GameScreen" component={GameScreen}/>
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;