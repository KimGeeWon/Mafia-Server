module.exports.randomRole = function randomRole(room, count, loginId, roomId) {

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
    for(var num in loginId) {
        if(loginId[num]['room'] === room) {
            loginId[num]['role'] = insertRole(jobList[randNum[num]]);
            if(loginId[num]['role'] === "마피아") {
                _people[1]--;
                _people[2]++;
            }
        }
    }

    roomId[checkRoomId(room, roomId)]['citizen'] = _people[1];
    roomId[checkRoomId(room, roomId)]['mafia'] = _people[2];
    roomId[checkRoomId(room, roomId)]['survivor'] = count;

    return { 
        loginId: loginId, 
        roomId: roomId
    };
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

function insertRole(data) {
    switch(data) {
        case 0: return "시민"
        case 1: return "마피아"
        case 2: return "경찰"
        case 3: return "의사"
    }
}

function checkRoomId(room, roomId) {

    for(var num in roomId) {
        if(roomId[num]['room'] === room) {
            return num;
        } 
    }

    return false;
}

module.exports.checkRole = function checkRole(data, loginId, io) {
    var myself;
    var target;
    var name = data.message.substring(1, data.message.length);

    for(var num in loginId) {
        if(loginId[num]['room'] === data.room && loginId[num]['user'] === data.user) {
            var myself = loginId[num];
        } 

        if(loginId[num]['room'] === data.room && loginId[num]['user'] === name) {
            var target = loginId[num];
        } 
    }

    if(myself.do_role === true) {
        socket.emit("used");
    }
    else {
        switch(myself.role) {
            case "마피아": mafiaAbility(target, myself, io); break;
            case "경찰": policeAbility(name, target.role, myself, io); break;
            case "의사": doctorAbility(target, myself, io); break;
            default: io.to(loginId[checkLoginId(data.room, data.user, loginId)]['socket']).emit("none", myself.user);
        }
    
        myself.do_role = true;
    }

    console.log(loginId);

    return  {
        loginId: loginId
    };
}

function mafiaAbility(target, myself, io) {
    
    target.targeted = true;

    io.to(myself['socket']).emit("broad", {
        class : "contact", 
        message: `${target.user}님을 저격중입니다.`
    });
}

function policeAbility(name, role, myself, io) {

    var message = "";

    if(role == "마피아") {
        message = `${name}님은 마피아가 맞습니다.`
    }
    else {
        message = `${name}님은 마피아가 아닙니다.`
    }

    io.to(myself['socket']).emit("broad", {
        class : "contact", 
        message
    });
}

function doctorAbility(target, myself, io) {

    target.healed = true;

    io.to(myself['socket']).emit("broad", {
        class : "contact", 
        message: `${target.user}님을 치료중입니다.`
    });
}

function checkLoginId(room, name, loginId) {

    for(var num in loginId) {
        if(loginId[num]['room'] === room && loginId[num]['user'] === name) {
            return num;
        } 
    }

    return false;
}

module.exports.votePerson = function votePerson(data, loginId, io) {

    const name = data.message.substring(1, data.message.length);
    const object = checkLoginId(data.room, name, loginId);
    const me = checkLoginId(data.room, data.user, loginId);

    if(object === false) {
        io.to(data.room).emit("none", name);
    }
    else if(loginId[me]['do_vote']) {
         io.to(loginId[me]['socket']).emit(
             "vote", name, loginId[object]['do_vote']);
    }
    else {
        io.to(data.room).emit("vote", name, loginId[me]['do_vote']);

        loginId[object]['vote']++;
        loginId[me]['do_vote'] = true;
    }

    return {
        loginId: loginId,
        roomId: null
    }
}

module.exports.oppositePerson = function oppositePerson(data, loginId, roomId, io) {
    
    const opposite = data.message.substring(1, data.message.length);

    const num = checkLoginId(data.room, 
        roomId[checkRoomId(data.room, roomId)]['elect'], loginId);

    if(loginId[checkLoginId(data.room, data.user, loginId)]['do_vote']) {

        io.to(loginId[checkLoginId(data.room, data.user, loginId)]['socket']).emit("opposite", opposite, loginId[checkLoginId(data.room, data.user, loginId)]['do_vote']);
    }
    else if(opposite === "찬성") {

        io.to(data.room).emit("broad", {
            class : "contact", 
            message : `누군가 찬성했습니다.`
        });

        loginId[num]['vote']++;
        loginId[checkLoginId(data.room, data.user, loginId)]['do_vote'] = true;
    }
    else if(opposite === "반대") {
        io.to(data.room).emit("broad", {
            class : "contact", 
            message : `누군가 반대했습니다.`
        });

        loginId[num]['vote']--;
        loginId[checkLoginId(data.room, data.user, loginId)]['do_vote'] = true;
    }

    return {
        loginId: loginId,
        roomId: null
    }
}

module.exports.checkGameEnd = function checkGameEnd(room, loginId, roomId, io) {
    var isEnd = false;
    const mafia = roomId[checkRoomId(room, roomId)]['mafia'];
    const citizen = roomId[checkRoomId(room, roomId)]['citizen'];

    if(mafia >= citizen) {
        isEnd = true;
        io.to(room).emit("gameEnd", "마피아");
    }
    else if(mafia === 0) {
        isEnd = true;
        io.to(room).emit("gameEnd", "시민");
    }
    else {
        return {
            isEnd: isEnd
        }
    }

    var Id = initGame(room, loginId, roomId);

    loginId = JSON.parse(JSON.stringify(Id.loginId));
    roomId = Id.roomId;

    return {
        isEnd: isEnd,
        loginId: loginId,
        roomId: roomId
    }
}

function initGame(room, loginId, roomId) {

    console.log("게임 초기화");

    roomId[checkRoomId(room, roomId)]['check_start'] = 0;
    roomId[checkRoomId(room, roomId)]['day'] = 0;
    roomId[checkRoomId(room, roomId)]['time'] = 0;
    roomId[checkRoomId(room, roomId)]['survivor'] = 0;
    roomId[checkRoomId(room, roomId)]['citizen'] = 0;
    roomId[checkRoomId(room, roomId)]['mafia'] = 0;
    roomId[checkRoomId(room, roomId)]['elect'] = "";
    roomId[checkRoomId(room, roomId)]['tie_vote'] = false;

    for(var num in loginId) {
        if(loginId[num]['room'] === room) {
            loginId[num]['role'] = "";
            loginId[num]['do_role'] = false;
            loginId[num]['alive'] = true;
            loginId[num]['healed'] = false;
            loginId[num]['targeted'] = false;
            loginId[num]['do_vote'] = false;
            loginId[num]['vote'] = 0;
        }
    }

    return {
        loginId: loginId,
        roomId: roomId
    }
}

module.exports.abilityCast = function abilityCast(room, survivor, citizen, loginId, roomId, io) {

    for(var num in loginId) {
        if(loginId[num]['room'] === room && loginId[num]['targeted'] === true) {
            if(loginId[num]['healed'] === true) {
                io.to(room).emit("broad", {
                    class : "contact", 
                    message : `${loginId[num]['user']}님이 의사의 치료를 받고 살아나셨습니다.`
                });
            }
            else {
                io.to(room).emit("broad", {
                    class : "contact", 
                    message : `${loginId[num]['user']}님이 처참하게 살해당했습니다.`
                });
                loginId[num]['alive'] = false;
                survivor--;
                citizen--;
            }
        }

        loginId[num]['do_role'] = false;
        loginId[num]['targeted'] = false;
        loginId[num]['healed'] = false;
    }

    roomId[checkRoomId(room, roomId)]['survivor'] = survivor;
    roomId[checkRoomId(room, roomId)]['citizen'] = citizen;

    return {
        loginId: loginId,
        roomId: roomId
    }
}

module.exports.voteCast = function voteCast(room, loginId, roomId, io) {

    var elect = "";
    var tie_vote;
    var compare = 0;

    for(var num in loginId) {
        if(loginId[num]['room'] === room) {
            if(loginId[num]['vote'] > compare) {
                elect = loginId[num]['user'];
                compare = loginId[num]['vote'];
                tie_vote = false;
            }
            else if(loginId[num]['vote'] === compare) {
                tie_vote = true;
            }
        }

        loginId[num]['vote'] = 0;
        loginId[num]['do_vote'] = false;
    }

    if(tie_vote) {
        elect = "";

        io.to(room).emit("broad", {
            class : "vote", 
            message : "동률표가 일어나 밤이 됐습니다."
        });

        roomId[checkRoomId(room, roomId)]['elect'] = elect;

        roomId[checkRoomId(room, roomId)]['tie_vote'] = tie_vote;

        return {
            day: 1,
            loginId: loginId,
            roomId: roomId
        }
    }

    roomId[checkRoomId(room, roomId)]['elect'] = elect;

    roomId[checkRoomId(room, roomId)]['tie_vote'] = tie_vote;

    io.to(room).emit("voteCast", elect, tie_vote);

    return {
        day: 4,
        loginId: loginId,
        roomId: roomId
    }
}

module.exports.oppositeCast = function oppositeCast(room, loginId, roomId, io) {

    const name = roomId[checkRoomId(room, roomId)]['elect'];

    const num = checkLoginId(room, name, loginId);

    const role = loginId[num]['role'];

    const vote = loginId[num]['vote'];

    if(vote > 0) {
        loginId[num]['alive'] = false;
        roomId[checkRoomId(room, roomId)]['survivor']--;
        if(role === "마피아") {
            roomId[checkRoomId(room, roomId)]['mafia']--;
        }
        else {
            roomId[checkRoomId(room, roomId)]['citizen']--;
        }
        
        io.to(room).emit("broad", {
            class : "contact", 
            message : `투표가 찬성으로 마무리되어 ${name}님이 처형되었습니다`
        });
    }
    else if(vote === 0) {
        io.to(room).emit("broad", {
            class : "contact", 
            message : `동률표가 일어나 투표가 마무리되었습니다.`
        });
    }
    else if(vote <= 0) {
        io.to(room).emit("broad", {
            class : "contact", 
            message : `투표가 반대로 마무리되었습니다.`
        });
    }

    return {
        loginId: loginId,
        roomId: roomId
    }
}

module.exports.setTime = function setTime(day, survivor) {
    
    // 밤: 25초, 낮: 생존자 * 15초, 재판: 15초, 최후의 발언: 15초, 찬/반: 10초
    switch(day) {
        case 1: return 10;
        case 2: return survivor * 15;
        case 3: return 15;
        case 4: return 15;
        case 5: return 10;
        // case 1: return 15;
        // case 2: return 10;//survivor * 15;
        // case 3: return 1;
        // case 4: return 1;
        // case 5: return 1;
    }
}