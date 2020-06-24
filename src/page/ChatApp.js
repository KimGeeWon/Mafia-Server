import React, { Component } from 'react';

var socket = null;

class ChatApp extends React.Component {
    constructor (props) {
      super(props)
      this.state = {
        logs: []
      }
    }
  
    componentDidMount () {
        socket = this.props.socket;

        socket.on('message', (obj) => {
            const logs2 = this.state.logs;
            obj.key = 'key_' + (this.state.logs.length + 1);
            console.log(obj);
            logs2.unshift(obj);
            this.setState({logs: logs2});
        })

        socket.on('contact', (obj) => {
            const logs2 = this.state.logs;
            obj.key = 'key_' + (this.state.logs.length + 1);
            console.log(obj);
            logs2.unshift(obj);
            this.setState({logs: logs2});
        })
    }
    render () {
      const messages = this.state.logs.map(e => (
        <div key={e.key}>
            <span>{e.user}</span>
            <span> - {e.message}</span>
            <p style={{clear: 'both'}} />
        </div>
      ))
      return (
        <div>{messages}</div>
      )
    }
  }

  export default ChatApp;