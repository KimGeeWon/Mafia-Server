import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import "../css/StartChat.css"

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
            <div className="box">
                <div className="container">
                    <h1>Ｍａｆｉａ Ｇａｍｅ</h1>
                    <div className="content">
                        <div>
                            <input type="text" value={this.state.roomName} onChange={this.handleChange} id="roomName" />
                        </div>
                        <div>
                            <input type="text" value={this.state.nickName} onChange={this.handleChange} id="nickName" />
                        </div>
                        <Link to={{
                            pathname: `/GameScreen`,
                            state: {
                                roomName: this.state.roomName,
                                nickName: this.state.nickName
                            }}}>
                            <input type="button" id="startChatting" value="채팅 시작"/>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default startChat;