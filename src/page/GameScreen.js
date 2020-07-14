import React, { Component } from 'react';
import io from 'socket.io-client';
import Timer from './Timer';
import ChatApp from './ChatApp'
import style from "../css/GameScreen.module.css"

const socket = io('localhost:3002');

class GameScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
        user: this.props.location.state.nickName,
        room: this.props.location.state.roomName,
        message: "",
        userCount: 1
    }
  }
  
  componentDidMount = () =>  {
    socket.emit("access", this.state);

    socket.on("access", (count) => {
      this.setState({userCount: count});
    });

    socket.on("none", (name) => {
      alert(`${name} 님은 없는 유저입니다.`);
    })
  }

  inputChange = (e) => {
    this.setState({
        [e.target.id]: e.target.value
    })
  }
    
  inputClick = (e) =>  {
    socket.emit("message", this.state);
    this.setState({message: ''})
  }

  inputPress = (e) =>  {
    if (e.key === 'Enter') {
      socket.emit("message", this.state);
      this.setState({message: ''})
    }
  }

  startGame = (e) => {
    socket.emit("start", this.state.room);
  }

  clearChat = (e) => {
    socket.emit("clear-chat", this.state.room);
  }

  render() {
        
    const { inputChange, inputClick, startGame, inputPress} = this;
    return (
      <div id="chatpage" className={style.wrapper}>
          <div className={style.sidebar}>
              <h1>
                  <p>방 이름</p>
                  <p id="roomName">{this.props.location.state.roomName}</p>
                  <hr></hr>
              </h1>
              <h1>
                  <p>현재 인원</p>
                  <p id="userCount">{this.state.userCount}</p>
                  <hr></hr>
              </h1>
              <input type="button" onClick={startGame} className={style.startGame} value="게임 시작"/>
              <hr></hr>
              <Timer roomName={this.state.room} socket={socket}/>
          </div>

          <div className={style.slice}></div>

          <div className={style.chat}>
              <ChatApp socket={socket} user={this.state.user}/>
          </div>

          <div className={style.chat_wrapper}>
              <input value={this.state.message} id="message" onChange={inputChange} onKeyPress={inputPress} className={style.input}/>
              <input type="button" id="submit" value="입력" onClick={inputClick} className={style.apply}/>
          </div>
      </div>
    );
  }
}

export default GameScreen;