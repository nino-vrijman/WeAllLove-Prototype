$(function () {
    var socket = io();

    socket.on('motion changed', function (data) {
        onSensorUpdate(data);
    });
});