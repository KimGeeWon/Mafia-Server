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

    console.log(randNum);

    // 난수 값에 따라 역할 부여
    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room) {
            loginIds[num]['role'] = insertRole(jobList[randNum[num]]);
        }
    }
}

function checkLoginIds(room, name) {
    for(var num in loginIds) {
        if(loginIds[num]['room'] === room && loginIds[num]['user'] === name) {
            return num;
        } 
    }

    return false;
}

function abilityCast(data) {
    for(var num in loginIds) {
        if(loginIds[num]['room'] === data.room && loginIds[num]['targeted'] === true) {
            if(loginIds[num]['healed'] === true) {
                io.to(data.room).emit("mafia", loginIds[num]['user'], 1);
                survivor--;
            }
            else {
                io.to(data.room).emit("mafia", loginIds[num]['user'], 0);
                loginIds[num]['status'] = 1;
            }
        }

        loginIds[num]['targeted'] = false;
        loginIds[num]['healed'] = false;
    }
}

function checkRole(data, socket) {
    var myself;
    var target;
    var name = data.message.substring(1, data.message.length);

    console.log(data);

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
            case "의사": doctorAbility(target, sockets); break;
            default: socket.emit("none", myself.user);
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

function doctorAbility(target, socket) {

    target.healed = true;
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
        case 3: jobList = [0, 1, 2]; break;
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
        case 1: return 25;
        case 2: if(survivor === 0) return 30; return survivor * 15;
        case 3: return 15;
        case 4: return 15;
        case 5: return 10;
    }
}

function votePerson(data) {
    const num = checkLoginIds(data.room, data.message.substring(1, data.message.length));

    if(num) {
        loginIds[num]['vote']++;
        loginIds[num]['do_vote'] = 1;
    }
    else {
        io.to(room).emit("none", name);
    }
}

// 소켓 서버를 만든다.
var io = socketio.listen(server);

// 접속한 사용자의 방이름, 사용자명, socket.id값을 저장할 전역변수
const loginIds = new Array();

io.sockets.on("connection", function(socket) {

    // 0: 시작 X, 1: 시작
    var check_start = 0;
    // 0: 시작 X, 1: 밤, 2: 낮, 3: 재판 4: 최후의 발언 5: 찬/반
    var day = 0;
    // 밤: 25초, 낮: 생존자 * 15초, 재판: 15초, 최후의 발언: 15초, 찬/반: 10초
    var time = 0;
    // 생존자의 수
    var survivor = 0;
    // 
    // var roomIds = new Array();

    // 채팅방 입시 실행
    socket.on("access", function(data) {

        // 시작한 방은 입장 불가
        if(!check_start) {
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
    
            //console.log(loginIds);
    
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

        // 0: 시작 X, 1: 밤, 2: 낮, 3: 재판 4: 최후의 발언 5: 찬/반
        switch(_day) {
            case 1: abilityCast(data); day = 2; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
            case 2: day = 3; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
            case 3: day = 4; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
            case 4: day = 5; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
            case 5: day = 1; time = setTime(day, survivor); io.to(data.room).emit("timer", time, day); break;
        }
    });

    socket.on("start", function(room) {
        
        survivor = io.sockets.adapter.rooms[room].length;
        day = 1;
        time = setTime(day, survivor);
        check_start = 1;

        io.to(room).emit("timer", time, day);
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

        while(1) {

            if(data.message.startsWith('!')) {

                // switch(day) {
                //     case 1: checkRole(data, socket); break;
                //     case 3: votePerson(data); break;
                //     case 5: break;
                //     default: break;
                // }

                checkRole(data, socket);

                break;
            }
    
            if(data.message === "시작" && check_start === 0) {
                randomRole(data, io.sockets.adapter.rooms[data.room].length);
    
                io.to(data.room).emit("start");

                break;
            }
    
            if(data.message === "마피아") {
                loginIds[checkLoginIds(data.room, data.name)]['role'] = "마피아";
                break;
            }
            
            if(data.message === "사망") {
                loginIds[checkLoginIds(data.room, data.name)]['status'] = 1;
                break;
            }
            
            if(data.message === "부활") {
                loginIds[checkLoginIds(data.room, data.name)]['status'] = 0;
                io.to(data.room).emit("broad", data);
                break;
            }

            if(data.message === "asdf") {
                console.log("check_start : " + check_start);
                console.log("day : " + day);
                console.log("survivor : " + survivor);
                console.log("role: " + loginIds[checkLoginIds(data.room, data.name)]['role']);
            }

            console.log("asdf");
            console.log(day);
    
            if(loginIds[checkLoginIds(data.room, data.name)]['status'] === 0 && day !== 1) {
                console.log("status 0");
                for(var num in loginIds) {
                    if(loginIds[num]['room'] === data.room) {
                        io.to(loginIds[num]['socket']).emit("message", data, loginIds[checkLoginIds(data.room, data.name)]['role'], loginIds[checkLoginIds(data.room, data.name)]['status'], day);
                    } 
                }
                break;
            }

            if(loginIds[checkLoginIds(data.room, data.name)]['status'] === 1) {
                console.log("status 1");
                for(var num in loginIds) {
                    if(loginIds[num]['room'] === data.room && loginIds[num]['status'] === 1) {
                        io.to(loginIds[num]['socket']).emit("message", data, loginIds[checkLoginIds(data.room, data.name)]['role'], loginIds[checkLoginIds(data.room, data.name)]['status'], day);
                    } 
                }
                break;
            }

            if(loginIds[checkLoginIds(data.room, data.name)]['role'] === "마피아" && day === 1) {
                console.log("마피아");
                for(var num in loginIds) {
                    if(loginIds[num]['room'] === data.room && loginIds[num]['role'] === "마피아") {
                        io.to(loginIds[num]['socket']).emit("message", data, loginIds[checkLoginIds(data.room, data.name)]['role'], loginIds[checkLoginIds(data.room, data.name)]['status'], day);
                    }
                }
                break;
            }

            break;
        }
    });
});