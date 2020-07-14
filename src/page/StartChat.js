import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import style from "../css/StartChat.module.css"

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
            <div className={style.box}>
                <div className={style.container}>
                    <h1>E v e r y M a f i a</h1>
                        <div>
                            <input type="text" value={this.state.roomName} onChange={this.handleChange} id="roomName" className={style.room} placeholder="Room Name" autocomplete="off"/>
                        </div>
                        <div>
                            <input type="text" value={this.state.nickName} onChange={this.handleChange} id="nickName" className={style.name} placeholder="Nick Name" autocomplete="off"/>
                        </div>
                        <Link to={{
                            pathname: `/GameScreen`,
                            state: {
                                roomName: this.state.roomName,
                                nickName: this.state.nickName
                            }}}>
                            <input type="button" id="startChatting" value="채팅 시작" className={style.start}/>
                        </Link>
                </div>
            </div>
        );
    }
}

export default startChat;