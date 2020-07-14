import React, { Component } from 'react';
import style from "../css/ChatApp.module.css"
import "../css/chat.css"

var socket = null;

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
      logs2.push(obj);
      this.setState({logs: logs2});
    }
  
    componentDidMount () {
        socket = this.props.socket;

        socket.on('message', (obj, role) => {
            const logs2 = this.state.logs;
            obj.key = 'key_' + (this.state.logs.length + 1);
            obj.class = role;
            if(role === "마피아") {
              obj.class = 'mafia';
            }
            logs2.push(obj);
            this.setState({logs: logs2});
            console.log(logs2);
        })

        socket.on('broad', (obj) => {
            this.broadCast(obj);
        })

        socket.on('clear-chat', () => {
          this.setState({logs: []});
        })

        socket.on('gameEnd', (win) => {
          const message = this.state.logs;

          message.push ({
            key: 'key_' + (this.state.logs.length + 1),
            className: "broad",
            user: "",
            message: `게임이 ${win}의 승리로 종료되었습니다!`
          })

          this.setState({logs: message});
        })

        socket.on('vote', (name, do_vote) => {
          if(do_vote) {
            alert("이미 투표를 하셨습니다.");
          }
          else {
            this.broadCast({
              class : "vote", 
              message : `${name}님 한 표!`
            });
          }
        })
    }
    render () {
      const messages = this.state.logs.map(e => (
        <div key={e.key} className={e.class} id={style.chat}>
          <span>{e.user}</span>
          <span> {e.message}</span>
        </div>
      ))
      return (
        <div>{messages}</div>
      )
    }
  }

  export default ChatApp;