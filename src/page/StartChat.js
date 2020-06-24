import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class startChat extends Component {

    state = {
        nickName: '',
        roomName: ''
    }

    handleChange = (e) => {
        this.setState({
            [e.target.id]: e.target.value
        })
    }

    render() {
        return (
            <div data-role="page">
                <div data-role="header">
                    <h1>Mafia Game</h1>
                </div>
                <div data-role="content">
                    <h3>입장할 방의 이름과 닉네임을 지정해 주세요</h3>
                    <div data-role="fieldcontain">
                        <label for="textinput">방 이름</label>
                        <input value={this.state.roomName} onChange={this.handleChange} id="roomName" />
                    </div>
                    <div data-role="fieldcontain">
                        <label for="textinput">닉 네임</label>
                        <input value={this.state.nickName} onChange={this.handleChange} id="nickName" />
                    </div>
                    <Link to={{
                        pathname: `/GameScreen`,
                        state: {
                            roomName: this.state.roomName,
                            nickName: this.state.nickName
                        }}}>
                        <input type ="button" id="startChatting" value="채팅 시작"/>
                    </Link>
                </div>
                <div>{this.state.roomName} {this.state.nickName}</div>
            </div>
        );
    }
}

export default startChat;