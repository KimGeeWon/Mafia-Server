import React, { Component } from 'react';

class Chat extends Component {
    constructor (props) {
        super(props)
        this.state = {
          logs: []
        }
      }
      // 컴포넌트가 마운트됐을 때 --- (※5)
      componentDidMount () {
        // 실시간으로 로그를 받게 설정
        // socket.on('chat-msg', (obj) => {
        //     const logs2 = this.state.logs
        //     obj.key = 'key_' + (this.state.logs.length + 1)
        //     console.log(obj)
        //     logs2.unshift(obj) // 로그에 추가하기
        //     this.setState({logs: logs2})
        // })
      }
      render () {
        // 로그를 사용해 HTML 요소 생성 --- (※6)
        const messages = this.state.logs.map(e => (
          <div key={e.key}>
            <span>{e.name}</span>
            <span>: {e.message}</span>
            <p style={{clear: 'both'}} />
          </div>
        ))
        return (
         <div>{messages}</div>
        )
      }
}

export default Chat;