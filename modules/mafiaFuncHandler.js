// 접속한 사용자의 방이름, 사용자명, socket.id값을 저장할 전역변수
var loginId = new Array();

// room의 day, time 등을 저장할 전역변수
var roomId = new Array();

module.exports.randomRole = function randomRole(data, count, loginIds, roomIds) {

    loginId = loginIds;
    roomId = roomIds;

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

    roomId[checkRoomIds(data.room, roomId)]['citizen'] = _people[1];
    roomId[checkRoomIds(data.room, roomId)]['mafia'] = _people[2];

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

function checkRoomIds(room, roomId) {

    for(var num in roomId) {
        if(roomId[num]['room'] === room) {
            return num;
        } 
    }

    return false;
}