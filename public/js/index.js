$(function () {
    var socket = io();

    socket.on('motion changed', function (data) {
        onSensorUpdate(data);
    });

    socket.on('kinect input', function (data) {
        console.log(data.percentage);
        onKinectInput(data.percentage);
    })

    function sendMeterPercentage(percentage) {
        socket.emit('percentage updated', percentage);
    }

    window.sendMeterPercentage = sendMeterPercentage;
});