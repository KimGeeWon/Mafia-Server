import React, { Component } from 'react';
import style from "../css/ChatApp.module.css"
import "../css/chat.css"

var socket = null;
var user = "";

class ChatApp extends Component {
    constructor (props) {
      super(props)
      this.state = {
        logs: []
      }
    }

    broadCast = (obj) => {
      const logs2 = this.state.logs;
      obj.key = 'key_' + (this.state.logs.length + 1);
      obj.box = "msg-box-broad";
      logs2.push(obj);
      this.setState({logs: logs2});
    }
  
    componentDidMount () {
        socket = this.props.socket;
        user = this.props.user;

        socket.on('message', (obj, role) => {
            const logs2 = this.state.logs;
            obj.key = 'key_' + (this.state.logs.length + 1);
            obj.class = `msg-container msg-remote`;
            obj.box = "msg-box";
            if(obj.user == user) {
              obj.class = `msg-container msg-self`;
            }
            obj.id = role;
            logs2.push(obj);
            this.setState({logs: logs2});
        })

        socket.on('broad', (obj) => {
            this.broadCast(obj);
        })

        socket.on('clear-chat', () => {
            this.setState({logs: []});
        })

        socket.on('vote', (name, do_vote) => {
          if(do_vote) {
            alert("이미 투표를 하셨습니다.");
          }
          else {
            this.broadCast({
              class: "msg-container msg-center",
              id: "vote", 
              message : `${name}님 한 표!`
            });
          }
        })
    }
    render () {
      const messages = this.state.logs.map(e => (
        <div key={e.key} className={e.class} id={e.id}>
          <div className={e.box}>
            <div className="flr">
              <div className="messages">
                <p className="name" id={e.id}>
                  {e.user}
                </p>
                <p className="msg" id={e.id}>
                  {e.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))
      return (
        <div>
          {messages}
        </div>
      )
    }
  }

  export default ChatApp;