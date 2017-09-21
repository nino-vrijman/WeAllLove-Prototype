const makeSendMessage = io => (event, data) => {
    io.emit(event, data);
}

module.exports = {
    makeSendMessage
}