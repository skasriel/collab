/*
 * Serve content over a socket
 */

module.exports = function (socket) {

  /*setInterval(function () {
    socket.emit('send:message', {
      time: (new Date()).toString()
    });
  }, 1000);*/


  // broadcast a user's message to other users
  // Works but not in use: I decided the server should broadcast based on relevant changes, without the client needing to send anything first. 
  socket.on('send:message', function (data) {
    console.log("Received message: "+data+" will broadcast "+data.message);
    socket.broadcast.emit('send:message', {
      user: "test",
      text: data.message
    });
  });

};
