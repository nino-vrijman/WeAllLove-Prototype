const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const PORT = process.env.PORT || 3000;

const { makeSendMessage } = require('./websocket.js');
const sendMessage = makeSendMessage(io);

app.use('/', express.static(path.join(__dirname, 'public')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/control', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/control.html'));
});

app.post('/plus', function (req, res) {
  sendMessage('motion changed', { detectedMotion: true });
  res.send({ action: 'plus', success: true });
});

app.post('/min', function (req, res) {
  sendMessage('motion changed', { detectedMotion: false });
  res.send({ action: 'min', success: true });
});

app.post('/restart', (req, res) => {
  sendMessage('restart', {});
  res.send({ action: 'restart', success: true });
})

http.listen(PORT, () => {
  console.log(`Server: app listening on port ${PORT}`);
});

io.on('connection', function (socket) {
  console.log('Socket: client connected');
  socket.on('percentage', function (data) {
    console.log(`Current percentage: ${data}`);
  });
});

const Kinect2 = require('kinect2');
const kinect = new Kinect2();

const { calculatePercentage } = require('./calculate-percentage.js');
const { throttle } = require('./util.js');

if (kinect.open()) {
  console.log("Kinect: Opened");

  kinect.on('bodyFrame', throttle(onKinectInput, 500));

  let bodyStates = {};
  let amountOfTrackedBodies = 0;

  function onKinectInput(data) {
    let trackedBodies = data.bodies.filter(body => body.tracked);
    amountOfTrackedBodies = trackedBodies.length;

    trackedBodies.forEach(body => {
      onBodyFrameTracked(body);
    });

    let amountDancing = 0;
    for (var trackingId in bodyStates) {
      // If a body that has been tracked in the past isn't in the collection of bodies that is currently being tracked it can't be dancing.
      if (trackedBodies.findIndex(body => body.trackingId == trackingId) == -1) {
        bodyStates[trackingId].isDancing = false;
      }

      if (bodyStates[trackingId].isDancing) {
        amountDancing++;
      }
    }

    let trackedBodyStates = [];
    trackedBodies.forEach(trackedBody => {
      trackedBodyStates.push(bodyStates[trackedBody.trackingId]);
    });

    // if (trackedBodyStates.length === 0) {
    //   return;
    // }

    const amountOfTrackedBodiesDancing = trackedBodyStates.filter(trackedBodyState => trackedBodyState.isDancing).length;
    const calculateAverage = values => values.reduce((sum, currentValue) => sum += currentValue, 0) / ((values.length) || 1);

    let kinectData = {
      amountTracked: amountOfTrackedBodies,
      amountDancing: amountOfTrackedBodiesDancing,
      averageDeltaX: calculateAverage(trackedBodyStates.map(trackedBodyState => trackedBodyState.averageDeltaX < 0 ? trackedBodyState.averageDeltaX * -1 : trackedBodyState.averageDeltaX)),
      averageDeltaY: calculateAverage(trackedBodyStates.map(trackedBodyState => trackedBodyState.averageDeltaY < 0 ? trackedBodyState.averageDeltaY * -1 : trackedBodyState.averageDeltaY))
    }
    // console.log(`Average delta X: ${testdata.averageDeltaX}\naverage delta Y: ${testdata.averageDeltaY}`);
    let calculatedPercentage = calculatePercentage(kinectData.amountTracked, kinectData.amountDancing, kinectData.averageDeltaX, kinectData.averageDeltaY);
    console.log(`Percentage: ${calculatedPercentage}`);
    sendMessage('kinect input', { percentage: calculatedPercentage });
    //console.log(`Amount tracking: ${amountOfTrackedBodies}, amount dancing: ${amountDancing}`);
  }

  function onBodyFrameTracked(bodyFrame) {
    const latestBodyFrameState = bodyStates[bodyFrame.trackingId];

    const getOrientationXAndY = joint => {
      return {
        orientationX: joint.orientationX,
        orientationY: joint.orientationY
      }
    }

    const currentBodyFrameJoints = bodyFrame.joints.map(getOrientationXAndY);

    let movement = {
      isDancing: false,
      averageDeltaX: 0,
      averageDeltaY: 0
    };

    // If the current bodyFrame hasn't been tracked before, it's movement can't be calculated.
    if (latestBodyFrameState) {
      movement = calculateMovementDifference(latestBodyFrameState.joints, currentBodyFrameJoints);
    }

    bodyStates[bodyFrame.trackingId] = {
      isDancing: movement.isDancing,
      joints: currentBodyFrameJoints,
      averageDeltaX: movement.averageDeltaX,
      averageDeltaY: movement.averageDeltaY
    }
  }

  function calculateMovementDifference(previousJointStates, currentJointStates) {
    const PERCENTAGE_MOVE_THRESHOLD = 20;

    const amountOfJoints = previousJointStates.length;
    let amountOfJointsMoved = 0;
    let totalDeltaX = 0;
    let totalDeltaY = 0;

    for (let i = 0; i < amountOfJoints; i++) {
      let prevOrientationX = previousJointStates[i].orientationX;
      let prevOrientationY = previousJointStates[i].orientationY;
      let currOrientationX = currentJointStates[i].orientationX;
      let currOrientationY = currentJointStates[i].orientationY;

      let deltaX = (((currOrientationX - prevOrientationX) / prevOrientationX) || 0) * 100;
      let deltaY = (((currOrientationY - prevOrientationY) / prevOrientationY) || 0) * 100;
      if (deltaX > PERCENTAGE_MOVE_THRESHOLD || deltaX < (PERCENTAGE_MOVE_THRESHOLD * -1)) {
        amountOfJointsMoved++;
        // todo: uuuuhm uuuhm, opslaan van hoeveel movement er is
      }

      if (deltaY > PERCENTAGE_MOVE_THRESHOLD || deltaY < (PERCENTAGE_MOVE_THRESHOLD * -1)) {
        amountOfJointsMoved++;
      }

      totalDeltaX += deltaX;
      totalDeltaY += deltaY;
    }

    // if (amountOfJointsMoved > 15) {
    // 	console.log('dancing');
    // } else {
    // 	console.log('not dancing');
    // }

    return {
      isDancing: amountOfJointsMoved > 10,
      averageDeltaX: totalDeltaX / amountOfJoints,
      averageDeltaY: totalDeltaY / amountOfJoints
    };
  }

  kinect.openBodyReader();
}