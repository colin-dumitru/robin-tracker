var express = require('express'),
    app = express(),
    bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post('/update', function (req, res) {
    var numberOfMembers = req.params.num_members,
        rooName = req.params.room_name;
    
    console.log(req.body);
    
    res.end("OK");
})

var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Server starting http://%s:%s ...", host, port);
});
