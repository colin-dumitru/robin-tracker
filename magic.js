var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cors = require('cors'),

    pg = require('pg'),
    client = new pg.Client(process.env.DATABASE_URL),

    LRU = require("lru-cache"),
    roomCache = LRU({
        max: 100000
    }),

    MIN_CONFIRMATION = parseInt(process.env.MIN_CONFIRMATION || "2"),
    ROOM_CLEANUP_REFRESH_PERIOD = 5 * 60 * 1000,
    ROOM_EXPIRATION_TIMEOUT = 30 * 60 * 1000,
    MAX_ROOMS_TO_RETURN = 500;

app.use(bodyParser.json());
app.use(cors());

client.connect(function (err) {
    if (err) throw err;
});

app.post('/update', function (req, res) {
    var numberOfMembers = req.body.num_members || 0,
        roomName = (req.body.room_name || "").substr(0, 200),
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log("Received request to update %s:%s from %s", roomName, numberOfMembers, ip);

    updateRoom(roomName, numberOfMembers, ip);

    res.end("OK");
});

app.get('/rooms', function (req, res) {
    client.query(
        'SELECT * FROM rooms ORDER BY participants DESC LIMIT $1', [MAX_ROOMS_TO_RETURN],
        function (err, response) {
            if (err) {
                console.error(err);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(response.rows));
            }
        }
    );
});

var server = app.listen(process.env.PORT || 8080, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Minimum confirmation: %d", MIN_CONFIRMATION);
    console.log("Server starting http://%s:%s ...", host, port);
});

setInterval(cleanOldRooms, ROOM_CLEANUP_REFRESH_PERIOD);

function cleanOldRooms() {
    var oldestAcceptedHeartbeat = new Date(Date.now() - ROOM_EXPIRATION_TIMEOUT);

    console.log("Cleaning old rooms...");

    client.query(
        'DELETE FROM rooms WHERE heartbeat < $1', [oldestAcceptedHeartbeat],
        function (err, result) {
            if (err) {
                console.error(err);
            } else {
                console.log("Deleted %s expired rooms", result.rowCount);
            }
        }
    );
}

function updateRoom(roomName, numberOfMembers, ip) {
    var cacheKey = (numberOfMembers + ":" + roomName),
        confirmations = roomCache.get(cacheKey) || [];

    if (confirmations.indexOf(ip) === -1) {
        confirmations.push(ip);
    }

    if (confirmations.length >= MIN_CONFIRMATION) {
        updateConfirmation(roomName, numberOfMembers);
    }
    roomCache.set(cacheKey, confirmations);
}

function updateConfirmation(roomName, numberOfMembers) {
    var currentTimestamp = new Date();

    console.log("Minimum number of confirmations passed, storing update for %s", roomName);

    client.query(
        'UPDATE rooms SET heartbeat = $2, participants = $3 WHERE id = $1', [roomName, currentTimestamp, numberOfMembers],
        function (err, result) {
            if (err) {
                console.error(err);
            } else if (result.rowCount === 0) {
                insertNewConfirmation(roomName, numberOfMembers, currentTimestamp);
            }
        });
}

function insertNewConfirmation(roomName, numberOfMembers, currentTimestamp) {
    client.query(
        'INSERT INTO rooms VALUES ($1, $2, $3)', [roomName, currentTimestamp, numberOfMembers],
        function (err) {
            if (err) {
                console.error(err);
            }
        }
    );
}