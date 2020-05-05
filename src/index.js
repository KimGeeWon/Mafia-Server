const express = require("express");
const app = express();
const fs = require("fs");
const server = require("http").createServer(app);

// 소켓 서버를 만든다.
const io = require("socket.io").listen(server);

const mafiaFunc = require("../modules/mafiaFuncHandler");

//const socketIOHandler = require('../modules/socketIO')(io);

const PORT = 3000;

app.get('/', (req, res) => {

    fs.readFile("./src/client.html", function(error, data) {
        if(error) { 
            console.log(error); 
        }
        else { 
            res.writeHead(200, {"Content-Type" : "text/html"});
            res.end(data);
        }
    });
});

app.get('/defaultImg', (req, res) => {

    fs.readFile("./img/default.png", function(error, data) {
        if(error) { 
            console.log(error); 
        }
        else { 
            res.writeHead(200, {"Content-Type" : "text/html"});
            res.end(data);
        }
    });
});

app.get('/mafiaImg', (req, res) => {

    fs.readFile("./img/mafia.png", function(error, data) {
        if(error) { 
            console.log(error); 
        }
        else { 
            res.writeHead(200, {"Content-Type" : "text/html"});
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}!`);
});

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

var start = 0;

// 접속한 사용자의 방이름, 사용자명, socket.id값을 저장할 전역변수
if(!start) {
    var loginIds = new Array();
}

start = 1;

// room의 day, time 등을 저장할 전역변수
var roomIds = new Array();

io.sockets.on("connection", function(socket) {

    // 채팅방 입시 실행
    socket.on("access", function(data) {

        // console.log(io.sockets.adapter.rooms);

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
            user : data.name,   // 접속자의 유저의 이름
            role : null,        // 접속자의 능력
            do_role : false,    // 능력을 사용했는지 안 했는지 여부
            status : 0,         // 0: 생존, 1: 사망
            healed : false,     // 의사에게 힐을 받았는지 여부
            targeted : false,   // 마피아에게 타겟이 됐는지 여부
            do_vote : false,    // 투표를 한 여부
            vote : 0          // 투표 수
      });

        // 사용자가 페이지 새로고침시 loginIds 변수에 값이 누적되지 않게 동일한 사용자의 socket.id 값을 삭제한다.
        for(var num in loginIds) {

            // 사용자 이름이 같으면서, 기존소켓아이디와 현재 소켓아이디가 다른 값이 있는지 찾아낸다.
            if(loginIds[num]['user'] == data.name && loginIds[num]['socket'] != socket.id) {
               
                // loginIds의 해당 순서의 값을 삭제한다.
                loginIds.splice(num, 1);
            }
        }

        // 클라이언트의 Contact 이벤트를 실행하여 입장한 사용자의 정보를 출력한다.
        io.sockets.in(data.room).emit("contact", {
              count : io.sockets.adapter.rooms[data.room].length
            , name : data.name
            , message : data.name + "님이 채팅방에 들어왔습니다."
        });
    });

    // 채팅방 퇴장시 실행(Node.js에서 사용자의 Disconnect 이벤트는 사용자가 방을 나감과 동시에 이루어진다.)
    socket.on("disconnect", function() {

        var room = "";
        var name = "";
        var socket = "";
        var count = 0;
       
        // disconnect 이벤트중 socket.io의 정보를 꺼내는데는 에러가 발생하고,
        // 실행중인 node.js Application이 종료된다.
        // 이에따라 try ~ catch ~ finally 로 예외처리해준다.
        try {
           
            // 생성된 방의 수만큼 반복문을 돌린다.
            for(var key in io.sockets.adapter.rooms) {

                // loginIds 배열의 값만큼 반복문을 돌린다.
                var members = loginIds.filter(function(chat) {
                    return chat.room === key;
                });
   
                // 현재 소켓 방의 length와 members 배열의 갯수가 일치하지 않는경우
                if(io.sockets.adapter.rooms[key].length != members.length) {
               
                    // 반복문으로 loginIds에 해당 socket.id값의 존재 여부를 확인한다.
                    for(var num in loginIds) {

                        // 일치하는 socket.id의 정보가 없을경우 그 사용자가 방에서 퇴장한것을 알 수 있다.
                        if(io.sockets.adapter.rooms[key].sockets.hasOwnProperty(loginIds[num]['socket']) == false) {

                            // 퇴장한 사용자의 정보를 변수에 담는다.
                            room = key;
                            name = loginIds[num]['user'];

                            // loginIds 배열에서 퇴장한 사용자의 정보를 삭제한다.
                            loginIds.splice(num, 1);
                        }
                    }
                   
                    // 해당 방의 인원수를 다시 구한다.
                    count = io.sockets.adapter.rooms[key].length;
                }
            }

        } catch(exception) {

            console.log(exception);

        } finally {

            // 클라이언트의 Contact 이벤트를 실행하여 이탈한 사용자가 누군지 알린다.
            io.sockets.in(room).emit("contact", {
                  count : count
                , name : name
                , message : name + "님이 채팅방에서 나갔습니다."
            });
           
        }
      });

      socket.on("day", function(_day, data) {

        try {
            var day = roomIds[checkRoomIds(data.room)]['day'];
            var time = roomIds[checkRoomIds(data.room)]['time'];
            var survivor = roomIds[checkRoomIds(data.room)]['survivor'];
            var citizen = roomIds[checkRoomIds(data.room)]['citizen'];
            var mafia = roomIds[checkRoomIds(data.room)]['mafia'];

            var end = false;

            switch(_day) {
                // 밤 -> 낮
                case 1: day = 2; /*abilityCast(data, survivor, citizen); if(checkGameEnd(data)) { end = true; break; };*/ 
                time = mafiaFunc.setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
    
                // 낮 -> 재판
                case 2: day = 3; 
                time = mafiaFunc.setTime(day, survivor); 
                io.to(data.room).emit("timer", time, day); break;
    
                // 재판 -> 최후의 발언
                case 3: /*day = voteCast(data);*/ time = mafiaFunc.setTime(day, survivor); 
                io.to(data.room).emit("timer", time, day); break;
    
                // 최후의 발언 -> 찬/반
                case 4: day = 5; 
                time = mafiaFunc.setTime(day, survivor); 
                io.to(data.room).emit("timer", time, day); break;
    
                // 찬/반 -> 밤
                case 5: day = 1; /*oppositeCast(data); if(checkGameEnd(data)){ end = true; break; };*/ 
                time = mafiaFunc.setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
            }

            if(!end) {
                roomIds[checkRoomIds(data.room)]['day'] = day;
                roomIds[checkRoomIds(data.room)]['time'] = time;
                roomIds[checkRoomIds(data.room)]['survivor'] = survivor;
                roomIds[checkRoomIds(data.room)]['citizen'] = citizen;
            }
        }
        catch (exception) {
            console.log(exception);
        }
    });

    // 메세지 전송 이벤트
    socket.on("message", function(data) {

        try {

            var role = loginIds[checkLoginIds(data.room, data.name)]['role'];
            var status = loginIds[checkLoginIds(data.room, data.name)]['status'];
            var day = roomIds[checkRoomIds(data.room)]['day'];

            while(1) {

                // 클라이언트의 Message 이벤트를 발생시킨다.
                //io.sockets.in(data.room).emit("message", data, role, status, day);

                if(data.message === "ㅁ") {

                    console.log("loginIds: ");
                    console.log(loginIds);

                    break;
                }

                if(data.message === "ㄴ") {
                    
                    console.log("status: ", status);
                    console.log("day: ", day);
                }

                if(data.message === "사망") {

                    loginIds[checkLoginIds(data.room, data.name)]['status'] = 1;

                    break;
                }

                if(data.message.startsWith('!')) {
                    // ids = mafiaFunc.checkRole(data, loginIds, io);

                    //ids = mafiaFunc.votePerson(data, loginIds, io);

                    ids = mafiaFunc.oppositePerson(data, loginIds, roomIds, io);

                    loginIds = JSON.parse(JSON.stringify( ids.loginId));

                    break;
                }

                if(data.message === "시작") {

                    roomIds[checkRoomIds(data.room)]['elect'] = "김지원";

                    // 게임 시작시 능력 분배
                    ids = mafiaFunc.randomRole(data, io.sockets.adapter.rooms[data.room].length, loginIds, roomIds);

                    loginIds = JSON.parse(JSON.stringify( ids.loginId));
                    roomIds = ids.roomId;

                    // 날, 시간, 게임 시작 여부 변수
                    roomIds[checkRoomIds(data.room)]['day'] = 1;
                    roomIds[checkRoomIds(data.room)]['time'] = mafiaFunc.setTime(1, io.sockets.adapter.rooms[data.room].length);
                    roomIds[checkRoomIds(data.room)]['check_start'] = 1;

                    var user = new Array();

                    // 게임 시작 후 이전 채팅 삭제
                    io.to(data.room).emit("start", user);

                    // 사용자의 능력을 팝업
                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room) {
                            io.to(loginIds[num]['socket']).emit("role", loginIds[num]['role']);

                            // user.push({
                            //     name: loginIds[num]['user']
                            // });
                        }
                    }

                    // 게임 타이머 시작
                    io.to(data.room).emit("timer", roomIds[checkRoomIds(data.room)]['time'], 
                    roomIds[checkRoomIds(data.room)]['day']);

                    break;
                }

                // 사망한 사람이 채팅을 칠 때
                if(status === 1) {
                    console.log("status 1");

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room && loginIds[num]['status'] === 1) {
                            io.to(loginIds[num]['socket']).emit("message", data, role, status, day);
                        }
                    }

                    break;
                }

                // 밤을 제외한 생존자들이 채팅을 칠 때
                if(day !== 1) {
                    console.log("status 0");

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room) {
                            io.to(loginIds[num]['socket']).emit("message", data, role, status, day);
                        } 
                    }

                    break;
                }

                // 마피아가 밤에 채팅할 경우
                if(role === "마피아" && day === 1) {
                    console.log("마피아");

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room && loginIds[num]['role'] === "마피아") {
                            io.to(loginIds[num]['socket']).emit("message", data, role, status, day);
                        }
                    }
                    break;
                }

                break;
            }
        }
        catch(exception) {

        }
    });
});