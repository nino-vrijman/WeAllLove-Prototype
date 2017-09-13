const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const PORT = process.env.PORT || 3000;

app.use('/', express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

http.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

io.on('connection', function (socket) {
  console.log('Socket: client connected');
});

const BOARD_COM_PORT = "COM5";
let five = require('johnny-five');
let board = new five.Board({ port: BOARD_COM_PORT });

board.on('ready', function () {
  console.log('Arduino: board ready!');

  let led = new five.Led(13);
  let motion = new five.Motion({
    pin: 2,
    freq: 500
  });

  motion.on("calibrated", function () {
    console.log("calibrated");
  });

  motion.on('data', function (event) {
    if (event.detectedMotion) {
      led.on();
      sendMessage('motion changed', { detectedMotion: true });
    } else {
      led.off();
      sendMessage('motion changed', { detectedMotion: false });
    }
  });
});

function sendMessage(event, data) {
  io.emit(event, data);
}