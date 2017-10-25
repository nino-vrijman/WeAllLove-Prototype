const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const PORT = process.env.PORT || 3000;

const five = require('johnny-five');

const EVENTS = {
  MOTION_CHANGED: 'motion changed'
}

app.use('/', express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/plus', function (req, res) {
  sendMessage(EVENTS.MOTION_CHANGED, { detectedMotion: true });
  res.send({ action: 'plus', success: true });
});

app.post('/min', function (req, res) {
  sendMessage(EVENTS.MOTION_CHANGED, { detectedMotion: false });
  res.send({ action: 'min', success: true });
});

http.listen(PORT, () => {
  console.log(`Server: app listening on port ${PORT}`);
});

io.on('connection', function (socket) {
  console.log('Socket: client connected');
});

const BOARD_COM_PORT = "COM5";
const board = new five.Board({
  port: BOARD_COM_PORT
});

board.on('ready', function () {
  console.log('Arduino: board ready!');

  let led = new five.Led(13);
  let motion = new five.Motion({
    pin: 2,
    freq: 500
  });

  motion.on('calibrated', function () {
    console.log('Motion sensor: calibrated');
  });

  motion.on('data', function (event) {
    if (event.detectedMotion) {
      led.on();
      sendMessage(EVENTS.MOTION_CHANGED, { detectedMotion: true });
    } else {
      led.off();
      sendMessage(EVENTS.MOTION_CHANGED, { detectedMotion: false });
    }
  });
});

function sendMessage(event, data) {
  io.emit(event, data);
}