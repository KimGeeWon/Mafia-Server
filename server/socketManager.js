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

function checkLoginIds(room, user) {
    for(var num in loginIds) {
        if(loginIds[num]['room'] === room && loginIds[num]['user'] === user) {
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
            io.to(data.room).emit("broad", {
                class: "msg-container msg-center",
                id: "contact", 
                message : data.user + " 님이 방에 들어왔습니다."
            });

            io.to(data.room).emit("access", io.sockets.adapter.rooms[data.room].length, data.user);
            
            var lists = [];

            for(var num in loginIds) {
                if(loginIds[num]['room'] === data.room) {
                    lists.push(loginIds[num]['user']);
                }
            }

            io.to(data.room).emit("lists", lists);
        });

        socket.on("disconnect", function() {
            var room = "";
            var user = "";
            var count = 0;

            console.log(1234);

            // disconnect 이벤트중 socket.io의 정보를 꺼내는데는 에러가 발생하고,
            // 실행중인 node.js Application이 종료된다.
            // 이에따라 try ~ catch ~ finally 로 예외처리해준다.
            try {
                // 생성된 방의 수만큼 반복문을 돌린다.
                for(var key in io.sockets.adapter.rooms) {
    
                    // loginIds 배열의 값만큼 반복문을 돌린다.
                    var members = loginIds.filter(function(data) {
                        return data.room === key;
                    });
       
                    // 현재 소켓 방의 length와 members 배열의 갯수가 일치하지 않는경우
                    if(io.sockets.adapter.rooms[key].length != members.length) {
                   
                        // 반복문으로 loginIds에 해당 socket.id값의 존재 여부를 확인한다.
                        for(var num in loginIds) {
    
                            // 일치하는 socket.id의 정보가 없을경우 그 사용자가 방에서 퇴장한것을 알 수 있다.
                            if(io.sockets.adapter.rooms[key].sockets.hasOwnProperty(loginIds[num]['socket']) == false) {
    
                                // 퇴장한 사용자의 정보를 변수에 담는다.
                                room = key;
                                user = loginIds[num]['user'];
    
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
    
                // 클라이언트의 Contact 이벤트를 실행하여 입장한 사용자의 정보를 출력한다.
                io.sockets.in(room).emit("broad", {
                    class: "msg-container msg-center",
                    id: "contact", 
                    message : user + " 님이 방에서 퇴장했습니다."
                });

                io.to(room).emit("access", io.sockets.adapter.rooms[room].length, user);
                
                var lists = [];

                for(var num in loginIds) {
                    if(loginIds[num]['room'] === room) {
                        lists.push(loginIds[num]['user']);
                    }
                }

                io.to(room).emit("lists", lists);
            }
        });

        socket.on("start", (room) => {

            // 게임 시작시 능력 분배
            ids = mafiaFunc.randomRole(room, io.sockets.adapter.rooms[room].length, loginIds, roomIds);

            copyIds(ids);

            // 날, 시간, 게임 시작 여부 변수
            roomIds[checkRoomIds(room)]['day'] = 1;
            roomIds[checkRoomIds(room)]['time'] = mafiaFunc.setTime(1, io.sockets.adapter.rooms[room].length);
            roomIds[checkRoomIds(room)]['check_start'] = 1;

            var user = new Array();

            // 전체 채팅 청소
            io.to(room).emit("clear-chat");

            // 게임 시작 공지 팝업
            
            io.to(room).emit("broad", {
                class: "msg-container msg-center",
                id: "start", 
                message : `게임이 시작됐습니다!`
            });

            // 사용자의 능력을 팝업
            for(var num in loginIds) {
                if(loginIds[num]['room'] === room) {
                    io.to(loginIds[num]['socket']).emit("broad", {
                        class: "msg-container msg-center",
                        id: "start", 
                        message : `당신은 ${loginIds[num]['role']} 입니다`
                    });

                    // user.push({
                    //     user: loginIds[num]['user'],
                    //     role: loginIds[num]['role']
                    // });
                }
            }

            // // 유저 리스트 팝업
            // io.to(data.room).emit("listPop", user);

            // // 게임 타이머 시작
            io.to(room).emit("timer", roomIds[checkRoomIds(room)]['time'], "밤");
        })

        socket.on("message", function(data) {
            try {
                var role = loginIds[checkLoginIds(data.room, data.user)]['role'];
                var alive = loginIds[checkLoginIds(data.room, data.user)]['alive'];
                var day = roomIds[checkRoomIds(data.room)]['day'];
                var elect = roomIds[checkRoomIds(data.room)]['elect'];
    
                if(data.message.startsWith('/')) {
    
                    switch(day) {
                        case 1: ids = mafiaFunc.checkRole(data, loginIds, io); break;
                        case 3: ids = mafiaFunc.votePerson(data, loginIds, io); break;
                        case 5: ids = mafiaFunc.oppositePerson(data, loginIds, roomIds, io); break;
                        default: break;
                    }
    
                    copyIds(ids);
                }
                else {
                    // 죽은 사람이 채팅을 치는 경우
                    if(alive == false) {
                        for(var num in loginIds) {
                            if(loginIds[num]['room'] === data.room && loginIds[num]['alive'] === false) {
                                io.to(loginIds[num]['socket']).emit("message", data, "dead");
                            }
                        }
                    }
                    // 밤인 경우
                    else if(day == 1) {
                        // 마피아가 채팅을 치는 경우
                        if(role == "마피아") {
                            for(var num in loginIds) {
                                if(loginIds[num]['room'] === data.room && loginIds[num]['role'] === "마피아") {
                                    io.to(loginIds[num]['socket']).emit("message", data, "mafia");
                                }
                            }
                        }
                    }
                    // 최후의 반론일 경우
                    else if(day == 4) {
                        for(var num in loginIds) {
                            if(loginIds[num]['room'] === data.room && elect === data.user) {
                                io.to(loginIds[num]['socket']).emit("message", data, "citizen");
                            } 
                        }
                    }
                    // 그 이외 나머지
                    else {
                        io.sockets.in(data.room).emit("message", data, "citizen");
                    }
                }
            }
            catch(e) {
                console.log(e);
            }
        })

        socket.on("timer", function(room) {

            try {
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
    
                        var endData = mafiaFunc.checkGameEnd(room, loginIds, roomIds, io);
    
                        if(endData.isEnd) {  
                            copyIds(endData);
    
                            end = true;
                            
                            break; 
                        };
    
                        time = mafiaFunc.setTime(day, survivor); 
                        
                        io.to(room).emit("timer", time, "낮"); 
                        
                        break; 
        
                    // 낮 -> 투표
                    case 2: 
                        day = 3; 
                        
                        time = mafiaFunc.setTime(day, survivor); 
    
                        io.to(room).emit("timer", time, "투표"); 

                        io.to(room).emit("broad", {
                            class: "msg-container msg-center",
                            id: "contact", 
                            message : "투표 시간이 되었습니다."
                        });
                        
                        break;
        
                    // 투표 -> 최후의 반론
                    case 3: 
                        ids = mafiaFunc.voteCast(room, loginIds, roomIds, io);

                        day = ids.day;

                        copyIds(ids);
                    
                        time = mafiaFunc.setTime(day, survivor); 
                    
                        if(day === 1) {
                            io.to(room).emit("timer", time, "밤");
                        }
                        else {
                            var elect = roomIds[checkRoomIds(room)]['elect'];

                            io.to(room).emit("timer", time, "최후의 반론");

                            io.to(room).emit("broad", {
                                class: "msg-container msg-center",
                                id: "contact", 
                                message : `${elect}님의 최후의 반론`
                            });
                        }
                        
                        break;
        
                    // 최후의 반론 -> 찬/반
                    case 4: 
                        day = 5; 
    
                        time = mafiaFunc.setTime(day, survivor); 
    
                        io.to(room).emit("timer", time, "찬성/반대"); 

                        io.to(room).emit("broad", {
                            class: "msg-container msg-center",
                            id: "contact", 
                            message : `찬반 투표 시간입니다.`
                        });
                        
                        break;
        
                    // 찬/반 -> 밤
                    case 5: 
                        day = 1; 

                        ids = mafiaFunc.oppositeCast(room, loginIds, roomIds, io);

                        copyIds(ids); 
                        
                        var endData = mafiaFunc.checkGameEnd(room, loginIds, roomIds, io);

                        if(endData.isEnd) {  
                            copyIds(endData);

                            end = true;
                            
                            break; 
                        };
    
                        time = mafiaFunc.setTime(day, survivor); 
    
                        io.sockets.in(room).emit("timer", time, "밤");

                        io.to(room).emit("broad", {
                            class: "msg-container msg-center",
                            id: "contact", 
                            message : `밤이 되었습니다.`
                        });
                }
    
                if(!end) {
                    roomIds[checkRoomIds(room)]['day'] = day;
                    roomIds[checkRoomIds(room)]['time'] = time;
                    roomIds[checkRoomIds(room)]['survivor'] = survivor;
                    roomIds[checkRoomIds(room)]['citizen'] = citizen;
                }
            }
            catch(e) {
                console.log(e);
            }
        });

        socket.on("clear-chat", function(room) {
            io.sockets.in(room).emit("clear-chat");
        })
    });
};