import React, { Component } from 'react';
import io from 'socket.io-client';
import Timer from './Timer';
import ChatApp from './ChatApp'

const socket = io('localhost:3002');

class GameScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
        user: this.props.location.state.nickName,
        room: this.props.location.state.roomName,
        message: "",
    }
  }

  handleChange = (e) => {
    this.setState({
        [e.target.id]: e.target.value
    })
  }
  
  componentDidMount = () =>  {
    socket.emit("access", this.state);
  }
    
  handleClick = (e) =>  {
    socket.emit("message", this.state);
    this.setState({message: ''})
  }

  startGame = (e) => {

  }

  render() {
        
    return (
      <div data-role="page" id="chatpage">
          <div data-role="header">
              <h1><p>방 이름: &nbsp;
                  <span id="roomName">{this.props.location.state.roomName}</span>
                  </p>
              </h1>
              <h1>
                  <p>현재 인원: &nbsp;
                  <span id="userCount">0</span>
                  &nbsp;명</p>
              </h1>
              <button onClick={this.startGame}>시작</button>
              <Timer roomName={this.state.room} socket={socket}/>
          </div>

          <div data-role="content">
              <input value={this.state.message} id="message" onChange={this.handleChange}/>
              <input type="button" id="submit" value="입력" onClick={this.handleClick}/>
              <ul>
                  <ChatApp socket={socket}/>
              </ul>
          </div>
      </div>
    );
  }
}

export default GameScreen;

// class ChatApp extends React.Component {
//   constructor (props) {
//     super(props)
//     this.state = {
//       logs: []
//     }
//   }

//   componentDidMount () {
//     socket.on('message', (obj) => {
//       const logs2 = this.state.logs;
//       obj.key = 'key_' + (this.state.logs.length + 1);
//       console.log(obj);
//       logs2.unshift(obj);
//       this.setState({logs: logs2});
//     })
//   }
//   render () {
//     const messages = this.state.logs.map(e => (
//       <div key={e.key}>
//         <span>{e.user}</span>
//         <span>: {e.message}</span>
//         <p style={{clear: 'both'}} />
//       </div>
//     ))
//     return (
//       <div>{messages}</div>
//     )
//   }
// }