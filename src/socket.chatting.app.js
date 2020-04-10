// 모듈을 추출한다. - http://localhost:3000
var http = require("http");
var fs = require("fs");
var socketio = require("socket.io");

// 웹 서버를 생성한다.
var server = http.createServer(function(request, response) {

    // HTMLPage.html 파일을 읽는다.
    fs.readFile("node_chatting.html", function(error, data) {
        if(error) { 
            console.log(error); 
        }
        else { 
            response.writeHead(200, {"Content-Type" : "text/html"});
            response.end(data);
        }
    });
    
}).listen(3000, function() {
    console.log("Server Running at http://127.0.0.1:3000");
});

function randomRole(data, count) {
    const jobList = checkPerson(count);
    const randNum = new Array(count);

    // 0: 플레이어 수 // 1: 시민 // 2: 마피아
    var _people = [count, count, 0];

    // 중복 안되는 난수 생성
    for(var i=0; i<count; i++){
        randNum[i] = Math.floor(Math.random() * count);

        for(var j = 0; j < i; j++){
            if(randNum[i] == randNum[j]){
                i = i - 1;
                break;
            }
        }
    }

    // 난수 값에 따라 역할 부여
    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room) {
            loginIds[num]['role'] = insertRole(jobList[randNum[num]]);
            if(loginIds[num]['role'] === "마피아") {
                _people[1]--;
                _people[2]++;
            }
        }
    }

    roomIds[checkRoomIds(data.room)]['citizen'] = _people[1];
    roomIds[checkRoomIds(data.room)]['mafia'] = _people[2];
}

function checkLoginIds(room, name) {
    for(var num in loginIds) {
        if(loginIds[num]['room'] === room && loginIds[num]['user'] === name) {
            return num;
        } 
    }

    return false;
}

function checkRoomIds(room) {

    for(var num in roomIds) {
        if(roomIds[num]['room'] === room) {
            return num;
        } 
    }

    return false;
}

function abilityCast(data, survivor, citizen) {

    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room && loginIds[num]['targeted'] === true) {
            if(loginIds[num]['healed'] === true) {
                io.to(data.room).emit("mafia", loginIds[num]['user'], true);
            }
            else {
                io.to(data.room).emit("mafia", loginIds[num]['user'], false);
                loginIds[num]['status'] = 1;
                survivor--;
                citizen--;
            }
        }

        loginIds[num]['do_role'] = false;
        loginIds[num]['targeted'] = false;
        loginIds[num]['healed'] = false;
    }

    roomIds[checkRoomIds(data.room)]['survivor'] = survivor;
    roomIds[checkRoomIds(data.room)]['citizen'] = citizen;
}

function voteCast(data) {

    var elect;
    var tie_vote;
    var compare = 0;

    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room) {
            if(loginIds[num]['vote'] > compare) {
                elect = loginIds[num]['user'];
                compare = loginIds[num]['vote'];
                tie_vote = false;
            }
            else if(loginIds[num]['vote'] === compare) {
                tie_vote = true;
            }
        }

        loginIds[num]['vote'] = 0;
        loginIds[num]['do_vote'] = false;
    }

    if(tie_vote) {
        elect = "";

        io.to(data.room).emit("voteCast", elect, tie_vote);

        roomIds[checkRoomIds(data.room)]['elect'] = elect;
        roomIds[checkRoomIds(data.room)]['tie_vote'] = tie_vote;

        return 1;
    }

    roomIds[checkRoomIds(data.room)]['elect'] = elect;
    roomIds[checkRoomIds(data.room)]['tie_vote'] = tie_vote;

    return 4;
}

function oppositeCast(data) {

    const name = roomIds[checkRoomIds(data.room)]['elect'];

    const role = loginIds[checkLoginIds(data.room, name)]['role'];

    const num = checkLoginIds(data.room, name);

    const vote = loginIds[num]['vote'];

    if(vote > 0) {
        loginIds[num]['status'] = 1;
        roomIds[checkRoomIds(data.room)]['survivor']--;
        if(role === "마피아") {
            roomIds[checkRoomIds(data.room)]['mafia']--;
        }
        else {
            roomIds[checkRoomIds(data.room)]['citizen']--;
        }
        io.to(data.room).emit("oppositeCast", 1, name);
    }
    else if(vote === 0) {
        io.to(data.room).emit("oppositeCast", 0, name);
    }
    else if(vote === 0) {
        io.to(data.room).emit("oppositeCast", -1, name);
    }
}

function checkRole(data, socket) {
    var myself;
    var target;
    var name = data.message.substring(1, data.message.length);

    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room && loginIds[num]['user'] === data.name) {
            var myself = loginIds[num];
        } 

        if(loginIds[num]['room'] === data.room && loginIds[num]['user'] === name) {
            var target = loginIds[num];
        } 
    }

    if(myself.do_role === true) {
        socket.emit("used");
    }
    else {
        switch(myself.role) {
            case "마피아": mafiaAbility(target, myself, socket); break;
            case "경찰": policeAbility(name, target.role, socket); break;
            case "의사": doctorAbility(target, myself, socket); break;
            default: io.to(loginIds[checkLoginIds(data.room, data.name)]['socket']).emit("none", myself.user);
        }
    
        myself.do_role = true;
    }
}

function policeAbility(name, role, socket) {
    
    socket.emit("police", name, role);
}

function mafiaAbility(target, myself, socket) {
    
    target.targeted = true;

    socket.emit("who", target.user, myself.role);
}

function doctorAbility(target, myself, socket) {

    target.healed = true;

    socket.emit("who", target.user, myself.role);
}

function insertRole(data) {
    switch(data) {
        case 0: return "시민"
        case 1: return "마피아"
        case 2: return "경찰"
        case 3: return "의사"
    }
}

function checkPerson(count) {
    var jobList = new Array();

    switch(count) {
        case 1: jobList = [1]; break;
        case 2: jobList = [2, 1]; break;
        case 3: jobList = [3, 1, 2]; break;
        case 4: jobList = [0, 1, 2, 3]; break;
        case 5: jobList = [0, 0, 1, 2, 3]; break;
        case 6: jobList = [0, 0, 0, 1, 2, 3]; break;
        case 7: jobList = [0, 0, 0, 0, 1, 2, 3]; break;
        case 8: jobList = [0, 0, 0, 0, 1, 1, 2, 3]; break;
    }

    return jobList;
}

function setTime(day, survivor) {
    
    // 밤: 25초, 낮: 생존자 * 15초, 재판: 15초, 최후의 발언: 15초, 찬/반: 10초
    switch(day) {
        case 1: return 10;
        case 2: return 15;//survivor * 15;
        case 3: return 15;
        case 4: return 15;
        case 5: return 10;
    }
}

function votePerson(data) {
    const name = data.message.substring(1, data.message.length);
    const num = checkLoginIds(data.room, name);

    if(num === false) {
        io.to(data.room).emit("none", name);
    }
    else if(loginIds[checkLoginIds(data.room, data.name)]['do_vote']) {
         io.to(loginIds[checkLoginIds(data.room, data.name)]['socket']).emit(
             "vote", name, loginIds[num]['do_vote']);
    }
    else {
        io.to(data.room).emit("vote", name, loginIds[checkLoginIds(data.room, data.name)]['do_vote']);

        loginIds[num]['vote']++;
        loginIds[checkLoginIds(data.room, data.name)]['do_vote'] = true;
    }
}

function oppositePerson(data) {
    
    const opposite = data.message.substring(1, data.message.length);
    const num = checkLoginIds(data.room, roomIds[checkRoomIds(data.room)]['elect']);

    if(loginIds[checkLoginIds(data.room, data.name)]['do_vote']) {

        io.to(loginIds[checkLoginIds(data.room, data.name)]['socket']).emit("opposite", opposite, loginIds[checkLoginIds(data.room, data.name)]['do_vote']);
    }
    else if(opposite === "찬성") {
        io.to(data.room).emit("opposite", opposite, loginIds[checkLoginIds(data.room, data.name)]['do_vote']);

        loginIds[num]['vote']++;
        loginIds[checkLoginIds(data.room, data.name)]['do_vote'] = true;
    }
    else if(opposite === "반대") {
        io.to(data.room).emit("opposite", opposite, loginIds[checkLoginIds(data.room, data.name)]['do_vote']);

        loginIds[num]['vote']--;
        loginIds[checkLoginIds(data.room, data.name)]['do_vote'] = true;
    }
}
``
function initGame(data) {

    console.log("게임 초기화");

    roomIds[checkRoomIds(data.room)]['check_start'] = 0;
    roomIds[checkRoomIds(data.room)]['day'] = 0;
    roomIds[checkRoomIds(data.room)]['time'] = 0;
    roomIds[checkRoomIds(data.room)]['survivor'] = 0;
    roomIds[checkRoomIds(data.room)]['citizen'] = 0;
    roomIds[checkRoomIds(data.room)]['mafia'] = 0;
    roomIds[checkRoomIds(data.room)]['elect'] = "";
    roomIds[checkRoomIds(data.room)]['tie_vote'] = false;

    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room) {
            loginIds[num]['role'] = null;
            loginIds[num]['do_role'] = false;
            loginIds[num]['status'] = 0;
            loginIds[num]['healed'] = false;
            loginIds[num]['targeted'] = false;
            loginIds[num]['do_vote'] = false;
            loginIds[num]['vote'] = 0;
        }
    }
}

function checkGameEnd(data) {
    var result = false;
    const mafia = roomIds[checkRoomIds(data.room)]['mafia'];
    const citizen = roomIds[checkRoomIds(data.room)]['citizen'];

    if(mafia >= citizen) {
        initGame(data);
        result = true;
        io.to(data.room).emit("initGame", "마피아");
    }
    else if(mafia === 0) {
        initGame(data);
        result = true;
        io.to(data.room).emit("initGame", "시민");
    }

    console.log(result);

    return result;
}

// 소켓 서버를 만든다.
var io = socketio.listen(server);

// 접속한 사용자의 방이름, 사용자명, socket.id값을 저장할 전역변수
const loginIds = new Array();

// room의 day, time 등을 저장할 전역변수
var roomIds = new Array();

io.sockets.on("connection", function(socket) {

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

        // 시작한 방은 입장 불가
        if(!roomIds[checkRoomIds(data.room)]['check_start']) {
            socket.join(data.room);

            loginIds.push({
                  socket : socket.id // 생성된 socket.id
                , room : data.room   // 접속한 채팅방의 이름
                , user : data.name   // 접속자의 유저의 이름
                , role : null        // 접속자의 능력
                , do_role : false    // 능력을 사용했는지 안 했는지 여부
                , status : 0         // 0: 생존, 1: 사망
                , healed : false     // 의사에게 힐을 받았는지 여부
                , targeted : false   // 마피아에게 타겟이 됐는지 여부
                , do_vote : false    // 투표를 한 여부
                , vote : 0           // 투표 수
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
                count : io.sockets.adapter.rooms[data.room].length, 
                name : data.name, 
                message : data.name + "님이 채팅방에 들어왔습니다."
            });
        }
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
                count : count, 
                name : name, 
                message : name + "님이 채팅방에서 나갔습니다."
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
                case 1: day = 2; abilityCast(data, survivor, citizen); if(checkGameEnd(data)) { end = true; break; }; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
    
                // 낮 -> 재판
                case 2: day = 3; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
    
                // 재판 -> 최후의 발언
                case 3: day = voteCast(data); time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
    
                // 최후의 발언 -> 찬/반
                case 4: day = 5; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
    
                // 찬/반 -> 밤
                case 5: day = 1; oppositeCast(data); if(checkGameEnd(data)){ end = true; break; }; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
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

        // 전체에게 Message 이벤트를 발생시킨다.
        // io.to(data.room).emit("message", data);

        // 자신에게만 Message 이벤트를 발생시킨다.
        // socket.emit("message", data);

        // 특정 인물에게만 Message 이벤트를 발생시킨다.
        // io.to(loginIds[num]['socket']).emit("message", data);

        // status - 0: 생존, 1: 사망
        // day    - 0: 시작 X, 1: 밤, 2: 낮, 3: 재판 4: 최후의 발언 5: 찬/반

        try {

            var role = loginIds[checkLoginIds(data.room, data.name)]['role'];
            var status = loginIds[checkLoginIds(data.room, data.name)]['status'];
            var day = roomIds[checkRoomIds(data.room)]['day'];
    
            while(1) {

                if(data.message.startsWith('!')) {
                    
                    switch(day) {
                        case 1: checkRole(data, socket); break;
                        case 3: votePerson(data); break;
                        case 5: oppositePerson(data); break;
                        default: break;
                    }

                    break;
                }
        
                if(data.message === "시작" && roomIds[checkRoomIds(data.room)]['check_start'] === 0) {
                    randomRole(data, io.sockets.adapter.rooms[data.room].length);

                    roomIds[checkRoomIds(data.room)]['survivor'] = io.sockets.adapter.rooms[data.room].length;
                    roomIds[checkRoomIds(data.room)]['day'] = 1;
                    roomIds[checkRoomIds(data.room)]['time'] = setTime(1, io.sockets.adapter.rooms[data.room].length);
                    roomIds[checkRoomIds(data.room)]['check_start'] = 1;

                    var user = new Array();

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room) {
                            io.to(loginIds[num]['socket']).emit("role", loginIds[num]['role']);

                            user.push({
                                name: loginIds[num]['user']
                            });
                        }
                    }

                    console.log(user);

                    io.to(data.room).emit("start", user);

                    io.to(data.room).emit("timer", roomIds[checkRoomIds(data.room)]['time'], 
                    roomIds[checkRoomIds(data.room)]['day']);

                    break;
                }

                if(day === 4) {
                    console.log("최후의 발언");

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room && roomIds[checkRoomIds(data.room)]['elect'] === data.name) {
                            io.to(loginIds[num]['socket']).emit("message", data, role, status, day);
                        }
                        else {
                            socket.emit("last");
                            break;
                        }
                    }
                    break;
                }
        
                if(status === 0 && day !== 1) {
                    console.log("status 0");

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room) {
                            io.to(loginIds[num]['socket']).emit("message", data, role, status, day);
                        } 
                    }

                    break;
                }

                if(status === 1) {
                    console.log("status 1");

                    for(var num in loginIds) {
                        if(loginIds[num]['room'] === data.room && loginIds[num]['status'] === 1) {
                            io.to(loginIds[num]['socket']).emit("message", data, role, status, day);
                        } 
                    }

                    break;
                }

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