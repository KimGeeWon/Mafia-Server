module.exports.randomRole = function randomRole(data, count, loginId, roomId) {

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
        if(loginId[num]['room'] === data.room) {
            loginId[num]['role'] = insertRole(jobList[randNum[num]]);
            if(loginId[num]['role'] === "마피아") {
                _people[1]--;
                _people[2]++;
            }
        }
    }

    roomId[checkRoomId(data.room, roomId)]['citizen'] = _people[1];
    roomId[checkRoomId(data.room, roomId)]['mafia'] = _people[2];
    roomId[checkRoomId(data.room, roomId)]['survivor'] = count;

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
        if(loginId[num]['room'] === data.room && loginId[num]['user'] === data.name) {
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
            case "경찰": policeAbility(name, target.role, io); break;
            case "의사": doctorAbility(target, myself, io); break;
            default: io.to(loginId[checkLoginId(data.room, data.name, loginId)]['socket']).emit("none", myself.user);
        }
    
        myself.do_role = true;
    }

    return  {
        loginId: loginId
    };
}

function mafiaAbility(target, myself, io) {
    
    target.targeted = true;

    io.to(myself['socket']).emit("who", target.user, myself.role);
}

function policeAbility(name, role, io) {

    io.to(myself['socket']).emit("police", name, role);
}

function doctorAbility(target, myself, io) {

    target.healed = true;

    io.to(myself['socket']).emit("who", target.user, myself.role);
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
    const me = checkLoginId(data.room, data.name, loginId);

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

    if(loginId[checkLoginId(data.room, data.name, loginId)]['do_vote']) {

        io.to(loginId[checkLoginId(data.room, data.name, loginId)]['socket']).emit("opposite", opposite, loginId[checkLoginId(data.room, data.name, loginId)]['do_vote']);
    }
    else if(opposite === "찬성") {

        io.to(data.room).emit("opposite", opposite, loginId[checkLoginId(data.room, data.name, loginId)]['do_vote']);

        loginId[num]['vote']++;
        loginId[checkLoginId(data.room, data.name, loginId)]['do_vote'] = true;
    }
    else if(opposite === "반대") {
        io.to(data.room).emit("opposite", opposite, loginId[checkLoginId(data.room, data.name, loginId)]['do_vote']);

        loginId[num]['vote']--;
        loginId[checkLoginId(data.room, data.name, loginId)]['do_vote'] = true;
    }

    return {
        loginId: loginId,
        roomId: null
    }
}

module.exports.checkGameEnd = function checkGameEnd(data, loginId, roomId, io) {
    var isEnd = false;
    const mafia = roomId[checkRoomId(data.room, roomId)]['mafia'];
    const citizen = roomId[checkRoomId(data.room, roomId)]['citizen'];

    if(mafia >= citizen) {
        isEnd = true;
        io.to(data.room).emit("initGame", "마피아");
    }
    else if(mafia === 0) {
        isEnd = true;
        io.to(data.room).emit("initGame", "시민");
    }
    else {
        return {
            isEnd: isEnd
        }
    }

    var Id = initGame(data, loginId, roomId);

    loginId = JSON.parse(JSON.stringify(Id.loginId));
    roomId = Id.roomId;

    return {
        isEnd: isEnd,
        loginId: loginId,
        roomId: roomId
    }
}

function initGame(data, loginId, roomId) {

    console.log("게임 초기화");

    roomId[checkRoomId(data.room, roomId)]['check_start'] = 0;
    roomId[checkRoomId(data.room, roomId)]['day'] = 0;
    roomId[checkRoomId(data.room, roomId)]['time'] = 0;
    roomId[checkRoomId(data.room, roomId)]['survivor'] = 0;
    roomId[checkRoomId(data.room, roomId)]['citizen'] = 0;
    roomId[checkRoomId(data.room, roomId)]['mafia'] = 0;
    roomId[checkRoomId(data.room, roomId)]['elect'] = "";
    roomId[checkRoomId(data.room, roomId)]['tie_vote'] = false;

    for(var num in loginId) {
        if(loginId[num]['room'] === data.room) {
            loginId[num]['role'] = null;
            loginId[num]['do_role'] = false;
            loginId[num]['status'] = 0;
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

module.exports.abilityCast = function abilityCast(data, survivor, citizen, loginId, roomId, io) {

    for(var num in loginId) {
        if(loginId[num]['room'] === data.room && loginId[num]['targeted'] === true) {
            if(loginId[num]['healed'] === true) {
                io.to(data.room).emit("mafia", loginId[num]['user'], true);
            }
            else {
                io.to(data.room).emit("mafia", loginId[num]['user'], false);
                loginId[num]['status'] = 1;
                survivor--;
                citizen--;
            }
        }

        loginId[num]['do_role'] = false;
        loginId[num]['targeted'] = false;
        loginId[num]['healed'] = false;
    }

    roomId[checkRoomId(data.room, roomId)]['survivor'] = survivor;
    roomId[checkRoomId(data.room, roomId)]['citizen'] = citizen;

    return {
        loginId: loginId,
        roomId: roomId
    }
}

module.exports.voteCast = function voteCast(data, loginId, roomId, io) {

    var elect = "";
    var tie_vote;
    var compare = 0;

    for(var num in loginId) {
        if(loginId[num]['room'] === data.room) {
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

        io.to(data.room).emit("voteCast", elect, tie_vote);

        roomId[checkRoomId(data.room, roomId)]['elect'] = elect;

        roomId[checkRoomId(data.room, roomId)]['tie_vote'] = tie_vote;

        return {
            day: 1,
            loginId: loginId,
            roomId: roomId
        }
    }

    roomId[checkRoomId(data.room, roomId)]['elect'] = elect;

    roomId[checkRoomId(data.room, roomId)]['tie_vote'] = tie_vote;

    io.to(data.room).emit("voteCast", elect, tie_vote);

    return {
        day: 4,
        loginId: loginId,
        roomId: roomId
    }
}

module.exports.setTime = function setTime(day, survivor) {
    
    // 밤: 25초, 낮: 생존자 * 15초, 재판: 15초, 최후의 발언: 15초, 찬/반: 10초
    switch(day) {
        case 1: return 5;//10;
        case 2: return 5;//15;//survivor * 15;
        case 3: return 5;//15;
        case 4: return 5;//15;
        case 5: return 5;//10;
    }
}