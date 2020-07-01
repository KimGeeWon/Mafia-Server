import React, { Component } from 'react';

var socket = null;
var start = false;

class Timer extends Component {
    state = {
        status: "",
        minutes: 0,
        seconds: 0,
        room: this.props.roomName
    }

    timer = (e) => {
        clearInterval(this.myInterval);
        start = true;
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

        socket.on("timer", (time, stat) => {
            var min = 0;
            var sec = 0;

            while(1) {
                if(time >= 60) {
                    min++;
                    time -= 60;
                }
                else {
                    sec = time;
                    break;
                }
            }

            this.setState({minutes: min, seconds: sec, status: stat});
            
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
                <h1>{this.state.status}</h1>
                { minutes === 0 && seconds === 0
                    ? start === true ? <h1>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</h1> : <h1></h1>
                    : <h1>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</h1>
                }

                <button onClick={this.timerClick}>타이머</button>
            </div>
        )
    }
}

export default Timer;