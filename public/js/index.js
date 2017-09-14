$(function () {
    var socket = io();

    socket.on('motion changed', function (data) {
        onSensorUpdate(data);
    });

    function sendMeterPercentage(percentage) {
        socket.emit('percentage updated', percentage);
    }

    window.sendMeterPercentage = sendMeterPercentage;
});