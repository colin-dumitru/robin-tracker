// ==UserScript==
// @match https://www.reddit.com/robin/*
// ==/UserScript==

setInterval(sendUpdate, 5 * 60 * 1000);
sendUpdate();

function sendUpdate() {
    $.get("https://www.reddit.com/robin")
        .then(function (body) {
            var numMembers = body.match("robin_user_list.*?\\[(.*?)\\]")[1].split('"name":').length + 1,
                roomName = body.match('robin_room_name":.*?"(.*?)"')[1].substr(0, 200);

            $.post("https://robin-tracker.herokuapp.com/update", {
                "room_name": roomName,
                "num_members": numMembers
            });
        });
}