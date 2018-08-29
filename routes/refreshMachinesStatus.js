module.exports = () => {

    var pool = require('./pool')
    var PubNub = require('pubnub')

    const pubnub = new PubNub({
        publishKey : 'pub-c-41a12f2d-6208-45aa-aa2b-bb08116d820c',
        subscribeKey : 'sub-c-c0ef660a-9ece-11e8-9a7c-62794ce13da1'
    })
    
    

}