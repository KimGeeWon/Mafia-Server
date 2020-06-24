import React, { Component } from 'react';

var socket = null;

class Timer extends Component {
    state = {
        minutes: 0,
        seconds: 3,
        room: this.props.roomName
    }

    timer = (e) => {
        clearInterval(this.myInterval);
        this.myInterval = setInterval(() => {
            const { seconds, minutes } = this.state

            if (seconds > 0) {
                this.setState(({ seconds }) => ({
                    seconds: seconds - 1
                }))
            }
            if (seconds === 0) {
                if (minutes === 0) {
                    clearInterval(this.myInterval)
                    socket.emit("timer", this.state.room);
                } else {
                    this.setState(({ minutes }) => ({
                        minutes: minutes - 1,
                        seconds: 59
                    }))
                }
            } 
        }, 1000)
    }

    componentDidMount() {
        socket = this.props.socket;

        socket.on("timer", () => {
            this.setState({minutes: 0, seconds: 4})
            
            this.timer();
        })

        //this.timer();
    }

    componentWillUnmount() {
        clearInterval(this.myInterval)
    }

    timerClick = (e) => {
        this.setState({seconds: 3})
        this.timer();
    }

    render() {
        const { minutes, seconds } = this.state
        return (
            <div>
                { minutes === 0 && seconds === 0
                    ? <h1>Busted!</h1>
                    : <h1>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</h1>
                }

                <button onClick={this.timerClick}>타이머</button>
            </div>
        )
    }
}

export default Timer;