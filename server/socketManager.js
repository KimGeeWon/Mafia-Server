var io = require('./server').io;

var loginIds = new Array();
var roomIds = new Array();

const mafiaFunc = require("./funcHandler");

function checkRoomIds(room) {

    for(var num in roomIds) {
        if(roomIds[num]['room'] === room) {
            return num;
        } 
    }

    return false;
}

function checkLoginIds(room, name) {
    for(var num in loginIds) {
        if(loginIds[num]['room'] === room && loginIds[num]['user'] === name) {
            return num;
        } 
    }

    return false;
}

function copyIds(ids) {
    loginIds = JSON.parse(JSON.stringify(ids.loginId));
    if(ids.roomId != null) {
        roomIds = ids.roomId;
    }
}

module.exports = (io) => {
    io.on('connection', (socket) => { // 웹소켓 연결 시
      console.log('Socket initiated!');

        // 채팅방 입시 실행
        socket.on("access", function(data) {

            console.log(data);

            if(!checkRoomIds(data.room)) {
                roomIds.push({
                    room : data.room, // 방 이름
                    check_start : 0, // 0: 시작 X, 1: 시작
                    day : 0, // 0: 시작 X, 1: 밤, 2: 낮, 3: 재판 4: 최후의 발언 5: 찬/반
                    time : 0, // 밤: 25초, 낮: 생존자 * 15초, 재판: 15초, 최후의 발언: 15초, 찬/반: 10초
                    survivor : 0, // 시간 계산 용 생존자의 수
                    citizen : 0, // 시민의 수
                    mafia : 0, // 마피아의 수
                    elect : "", // 투표 당선자
                    tie_vote : false, // 투표가 동점인지 확인 // 0: 동점 X // 1: 동점 O
                });
            }

            socket.join(data.room);

            loginIds.push({
                room : data.room,   // 접속한 채팅방의 이름
                socket : socket.id, // 생성된 socket.id
                user : data.user,   // 접속자의 유저의 이름
                role : null,        // 접속자의 능력
                do_role : false,    // 능력을 사용했는지 안 했는지 여부
                status : 0,         // 0: 생존, 1: 사망
                healed : false,     // 의사에게 힐을 받았는지 여부
                targeted : false,   // 마피아에게 타겟이 됐는지 여부
                do_vote : false,    // 투표를 한 여부
                vote : 0          // 투표 수
            });

            // 사용자가 페이지 새로고침시 loginIds 변수에 값이 누적되지 않게 동일한 사용자의 socket.id 값을 삭제한다.
            // for(var num in loginIds) {

            //     // 사용자 이름이 같으면서, 기존소켓아이디와 현재 소켓아이디가 다른 값이 있는지 찾아낸다.
            //     if(loginIds[num]['user'] == data.name && loginIds[num]['socket'] != socket.id) {
                
            //         // loginIds의 해당 순서의 값을 삭제한다.
            //         loginIds.splice(num, 1);
            //     }
            // }

            // 클라이언트의 Contact 이벤트를 실행하여 입장한 사용자의 정보를 출력한다.
            // io.sockets.in(data.room).emit("contact", {
            //       count : io.sockets.adapter.rooms[data.room].length
            //     , name : data.name
            //     , message : data.name + "님이 채팅방에 들어왔습니다."
            // });
        });

        socket.on("message", function(data) {

            if(data.message.startsWith('/')) {

                switch(day) {
                    case 1: ids = mafiaFunc.checkRole(data, loginIds, io); break;
                    case 3: ids = mafiaFunc.votePerson(data, loginIds, io); break;
                    case 5: ids = mafiaFunc.oppositePerson(data, loginIds, roomIds, io); break;
                    default: break;
                }

                copyIds(ids);

                // loginIds[checkLoginIds(data.room, data.user)]['role'] = "마피아";

                // var ids;

                // ids = mafiaFunc.checkRole(data, loginIds, io);

                // copyIds(ids);

                // console.log(loginIds);
            }

            io.sockets.in(data.room).emit("message", data);
        })

        socket.on("timer", function(roomName) {
            io.sockets.in(roomName).emit("timer");
        });
    });
};

// module.exports = function(socket) {
//     console.log("사용자 접속");

//     // 채팅방 입시 실행
//     socket.on("access", function(data) {

//         // if(!checkRoomIds(data.room)) {
//         //     roomIds.push({
//         //         room : data.room, // 방 이름
//         //         check_start : 0, // 0: 시작 X, 1: 시작
//         //         day : 0, // 0: 시작 X, 1: 밤, 2: 낮, 3: 재판 4: 최후의 발언 5: 찬/반
//         //         time : 0, // 밤: 25초, 낮: 생존자 * 15초, 재판: 15초, 최후의 발언: 15초, 찬/반: 10초
//         //         survivor : 0, // 시간 계산 용 생존자의 수
//         //         citizen : 0, // 시민의 수
//         //         mafia : 0, // 마피아의 수
//         //         elect : "", // 투표 당선자
//         //         tie_vote : false, // 투표가 동점인지 확인 // 0: 동점 X // 1: 동점 O
//         //     });
//         // }

//         console.log(data);

//         socket.join(data.room);

//         // loginIds.push({
//         //     room : data.room,   // 접속한 채팅방의 이름
//         //     socket : socket.id, // 생성된 socket.id
//         //     user : data.name,   // 접속자의 유저의 이름
//         //     role : null,        // 접속자의 능력
//         //     do_role : false,    // 능력을 사용했는지 안 했는지 여부
//         //     status : 0,         // 0: 생존, 1: 사망
//         //     healed : false,     // 의사에게 힐을 받았는지 여부
//         //     targeted : false,   // 마피아에게 타겟이 됐는지 여부
//         //     do_vote : false,    // 투표를 한 여부
//         //     vote : 0          // 투표 수
//         // });

//         // 사용자가 페이지 새로고침시 loginIds 변수에 값이 누적되지 않게 동일한 사용자의 socket.id 값을 삭제한다.
//         // for(var num in loginIds) {

//         //     // 사용자 이름이 같으면서, 기존소켓아이디와 현재 소켓아이디가 다른 값이 있는지 찾아낸다.
//         //     if(loginIds[num]['user'] == data.name && loginIds[num]['socket'] != socket.id) {
               
//         //         // loginIds의 해당 순서의 값을 삭제한다.
//         //         loginIds.splice(num, 1);
//         //     }
//         // }

//         // 클라이언트의 Contact 이벤트를 실행하여 입장한 사용자의 정보를 출력한다.
//         // io.sockets.in(data.room).emit("contact", {
//         //       count : io.sockets.adapter.rooms[data.room].length
//         //     , name : data.name
//         //     , message : data.name + "님이 채팅방에 들어왔습니다."
//         // });
//     });

//     socket.on("message", function(data) {

//         console.log(data.data);

//         console.log(data.data.room);

//         //socket.emit("message", data);

//         //io.sockets.in(data.room).emit("message", data.data);

//         socket.emit("message", data.data);
//     })
// }