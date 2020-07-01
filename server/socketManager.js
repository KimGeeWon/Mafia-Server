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
                alive : true,         // true: 생존, false: 사망
                healed : false,     // 의사에게 힐을 받았는지 여부
                targeted : false,   // 마피아에게 타겟이 됐는지 여부
                do_vote : false,    // 투표를 한 여부
                vote : 0          // 투표 수
            });

            // 클라이언트의 Contact 이벤트를 실행하여 입장한 사용자의 정보를 출력한다.
            io.sockets.in(data.room).emit("contact", {
                user : "알람", 
                message : data.user + "님이 채팅방에 들어왔습니다."
            });

            io.sockets.in(data.room).emit("access", io.sockets.adapter.rooms[data.room].length);
        });

        socket.on("start", (room) => {
            console.log(room);

            // 게임 시작시 능력 분배
            ids = mafiaFunc.randomRole(room, io.sockets.adapter.rooms[room].length, loginIds, roomIds);

            copyIds(ids);

            // 날, 시간, 게임 시작 여부 변수
            roomIds[checkRoomIds(room)]['day'] = 1;
            roomIds[checkRoomIds(room)]['time'] = mafiaFunc.setTime(1, io.sockets.adapter.rooms[room].length);
            roomIds[checkRoomIds(room)]['check_start'] = 1;

            var user = new Array();

            // // 전체 채팅 청소
            // io.to(data.room).emit("clear");

            // // 게임 시작 공지 팝업
            // io.to(data.room).emit("start");

            // // 사용자의 능력을 팝업
            // for(var num in loginIds) {
            //     if(loginIds[num]['room'] === data.room) {
            //         io.to(loginIds[num]['socket']).emit("role", loginIds[num]['role']);

            //         user.push({
            //             name: loginIds[num]['user'],
            //             role: loginIds[num]['role']
            //         });
            //     }
            // }

            // // 유저 리스트 팝업
            // io.to(data.room).emit("listPop", user);

            // // 게임 타이머 시작
            io.to(room).emit("timer", roomIds[checkRoomIds(room)]['time'], "밤");
        })

        socket.on("message", function(data) {

            var role = loginIds[checkLoginIds(data.room, data.user)]['role'];
            var alive = loginIds[checkLoginIds(data.room, data.user)]['alive'];
            var day = roomIds[checkRoomIds(data.room)]['day'];
            var elect = roomIds[checkRoomIds(data.room)]['elect'];

            if(data.message == "ㅁㄴㅇㄹ") {
                console.log(roomIds);
                console.log(loginIds);
            }

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
            else {
                io.sockets.in(data.room).emit("message", data);
            }
        })

        socket.on("timer", function(room) {

            var day = roomIds[checkRoomIds(room)]['day'];
            var time = roomIds[checkRoomIds(room)]['time'];
            var survivor = roomIds[checkRoomIds(room)]['survivor'];
            var citizen = roomIds[checkRoomIds(room)]['citizen'];
            var mafia = roomIds[checkRoomIds(room)]['mafia'];

            var end = false;

            switch(day) {
                // 밤 -> 낮
                case 1: 
                    day = 2;

                    ids = mafiaFunc.abilityCast(room, survivor, citizen, loginIds, roomIds, io); 

                    copyIds(ids);

                    console.log(ids);

                    var endData = mafiaFunc.checkGameEnd(room, loginIds, roomIds, io);

                    console.log(endData);

                    if(endData.isEnd) {  
                        copyIds(endData);

                        end = true;
                        
                        break; 
                    };

                    time = mafiaFunc.setTime(day, survivor); 
                    
                    io.to(room).emit("timer", time, "낮"); 
                    
                    break; 
    
                // 낮 -> 재판
                case 2: 
                    day = 3; 
                    
                    time = mafiaFunc.setTime(day, survivor); 

                    io.to(room).emit("timer", time, "재판"); 
                    
                    break;
    
                // 재판 -> 최후의 발언
                case 3: 
                    day = 4;
                
                    time = mafiaFunc.setTime(day, survivor); 
                
                    io.to(room).emit("timer", time, "최후의 발언"); 
                    
                    break;
    
                // 최후의 발언 -> 찬/반
                case 4: 
                    day = 5; 

                    time = mafiaFunc.setTime(day, survivor); 

                    io.to(room).emit("timer", time, "찬성/반대"); 
                    
                    break;
    
                // 찬/반 -> 밤
                case 5: 
                    day = 1; 

                    time = mafiaFunc.setTime(day, survivor); 

                    io.sockets.in(room).emit("timer", time, "밤");
            }

            if(!end) {
                roomIds[checkRoomIds(room)]['day'] = day;
                roomIds[checkRoomIds(room)]['time'] = time;
                roomIds[checkRoomIds(room)]['survivor'] = survivor;
                roomIds[checkRoomIds(room)]['citizen'] = citizen;
            }
        });

        socket.on("clear-chat", function(room) {
            io.sockets.in(room).emit("clear-chat");
        })
    });
};