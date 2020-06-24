const express = require('express');
const app = express();
const api = require('./routes/index');
const server = require("http").createServer(app);
const bodyParser = require('body-parser');
const cors = require('cors');

const PORT = 3002;

// 소켓 서버를 만든다.
//const io = require("socket.io")(server);

var io = module.exports = require("socket.io")(server);

const socketManager = require('./socketManager');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use('/api', api);

socketManager(io);

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));