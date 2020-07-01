import React, { Component } from 'react';

var socket = null;

class ChatApp extends Component {
    constructor (props) {
      super(props)
      this.state = {
        logs: []
      }
    }
  
    componentDidMount () {
        socket = this.props.socket;

        socket.on('message', (obj, role) => {
            const logs2 = this.state.logs;
            obj.key = 'key_' + (this.state.logs.length + 1);
            if(role === "마피아") {
              obj.class = 'mafia';
            }
            else {
              obj.class = 'citizen';
            }
            logs2.unshift(obj);
            this.setState({logs: logs2});
        })

        socket.on('contact', (obj) => {
            const logs2 = this.state.logs;
            obj.key = 'key_' + (this.state.logs.length + 1);
            logs2.unshift(obj);
            this.setState({logs: logs2});
        })

        socket.on('clear-chat', (obj) => {
          this.setState({logs: []});
      })
    }
    render () {
      const messages = this.state.logs.map(e => (
        <div key={e.key} className={e.class}>
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