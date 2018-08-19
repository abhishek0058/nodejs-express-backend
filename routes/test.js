var express = require('express')
var router = express.Router();
var PubNub = require('pubnub')

const pubnub = new PubNub({
    publishKey : 'pub-c-41a12f2d-6208-45aa-aa2b-bb08116d820c',
    subscribeKey : 'sub-c-c0ef660a-9ece-11e8-9a7c-62794ce13da1'
})

const channel = "numericrp";

router.get('/on', (req, res) => {
    pubnub.publish({
        channel: channel,
        message: 'on'
    }, function(status, response) {
        if (status.error) {
            console.log(status)
        } else {
            console.log("message Published w/ timetoken", response.timetoken)
        }
        res.end
    });
})

router.get('/off', (req, res) => {
    pubnub.publish({
        channel: channel,
        message: 'off'
    }, function(status, response) {
        if (status.error) {
            console.log(status)
        } else {
            console.log("message Published w/ timetoken", response.timetoken)
        }
        res.end
    });
})
