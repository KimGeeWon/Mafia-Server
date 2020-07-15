import React, { Component } from 'react';

var socket = null;

class PlayerList extends Component {
    constructor (props) {
        super(props)
        this.state = {
            room: this.props.room,
            userList: [],
        }
    }

    componentDidMount() {
        socket = this.props.socket;

        socket.on("lists", (list) => {
            this.setState({userList: list});
        });
    }

    render() {
        const lists1 = this.state.userList.slice(0, 4).map(e => (
            <td>{e}</td>
        ));
        const lists2 = this.state.userList.slice(4, 8).map(e => (
            <td>{e}</td>
        ));
        const lists3 = this.state.userList.slice(8, 12).map(e => (
            <td>{e}</td>
        ));
        return (
            <table>
              <tr>
                {lists1}
              </tr>
              <tr>
                {lists2}
              </tr>
              <tr>
                {lists3}
              </tr>
            </table>
        )
    }
}

export default PlayerList;