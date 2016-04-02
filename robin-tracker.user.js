// ==UserScript==
// @match https://www.reddit.com/robin/*
// ==/UserScript==

// Instructions:
// 	1. Go to any reddit page (preferrably https://www.reddit.com)
// 	2. Copy and paste this script in the browser console
// 	3. Leave the page opened

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