$(function () {
    var socket = io();

    socket.on('motion changed', function (data) {
        onSensorUpdate(data);
    });

    socket.on('kinect input', function (data) {
        console.log(data.percentage);
        onKinectInput(data.percentage);
    });

    socket.on('restart', function () {
        window.location.reload();
    });

    function sendMeterPercentage(percentage) {
        socket.emit('percentage', percentage);
    }

    window.sendMeterPercentage = sendMeterPercentage;
});