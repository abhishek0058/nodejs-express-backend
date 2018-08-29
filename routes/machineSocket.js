module.exports = function(io) {
  var app = require("express");
  var router = app.Router();
  var PubNub = require("pubnub");
  var email = require("./email");
  const pool = require("./pool");

  const machineBusy = `UPDATE machine SET status = CASE WHEN status = 'active' THEN 'busy' WHEN status = 'busy' THEN 'active' ELSE status END where channel = ?;`;

  const query = `select *, (select name from hostel where id = machine.hostelid) as hostelname, 
    (select name from city where id = machine.cityid) as cityname  from machine where 
    cityid = (select cityid from machine where channel = ?) and hostelid = (select hostelid from machine where channel = ?);`;

  const makeMachineActiveIfNotBusy = `update machine set status = "active" where channel = ? and status != "busy";`
  const makeMachineActive = `update machine set status = "active" where channel = ?;`;
  const makeMachinesInActive = `update machine set status = "inactive" where status != "busy"`;
  const makeMachineBusy =
    'update machine set status = "busy" where channel = ?;';

  const paymentFromAccount = `update account set cycles_left = cycles_left - 1 where userid = ?;`;
  const activator_user = `update machine set activator_user = ? where channel = ?;`;
  const insertCycleHistory = `insert into cycle_use_history (userid, date) values (?, '${new Date().toString()}');`;

  const removeActivatorUser = `update machine set activator_user = 0 where channel = ?;`;

  const pubnub = new PubNub({
    publishKey: "pub-c-41a12f2d-6208-45aa-aa2b-bb08116d820c",
    subscribeKey: "sub-c-c0ef660a-9ece-11e8-9a7c-62794ce13da1"
  });

  function makeArrayOfStrings(result) {
    let ch = [];
    for (let i = 0; i < result.length; i++) {
      ch.push(result[i].channel);
    }
    return ch;
  }

  function refresh(channels) {
    pubnub.subscribe({
      channels: channels
    });
  }

  function publishChecks(channels) {
    console.log(channels);
    for (let i = 0; i < channels.length; i++) {
      pubnub.publish({
        message: "check," + i,
        channel: channels[i]
      });
    }
  }

  function publishForUser(cityid, hostelid) {
    const getChannelsQuery = `select channel from machine where cityid = ? and hostelid = ?`;
    pool.query(getChannelsQuery, [cityid, hostelid], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        publishChecks(makeArrayOfStrings(result));
      }
    });
  }

  function emitFreshMachinesStatusAfterTurningOn(io, channel, userid) {
    const bigQuery =
      makeMachineBusy +
      paymentFromAccount +
      activator_user +
      insertCycleHistory +
      query;
    const args = [channel, userid, userid, channel, userid, channel, channel];
    try {
      pool.query(bigQuery, args, (err, result) => {
        if (err) console.log(err);
        else {
          io.sockets.emit("newMachines", { result: result[4] });
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  function emitFreshMachinesStatusAfterTurningOff(io, channel) {
    try {
      pool.query(
        makeMachineActive + removeActivatorUser + query,
        [channel, channel, channel, channel],
        (err, result) => {
          if (err) console.log(err);
          else {
            io.sockets.emit("newMachines", { result: result[2] });
          }
        }
      );
    } catch (e) {
      console.log(e);
    }
  }

  function emitFreshStatus(io, channel) {
    pool.query(makeMachineActiveIfNotBusy, [channel], (err, result) => {
      if (err) throw err;
      pool.query(query, [channel, channel], (err, result) => {
        if (err) console.log(err);
        else io.sockets.emit("newMachines", { result: result });
      });
    });
  }

  pool.query(`${makeMachinesInActive};select channel from machine;`,(err, result) => {
      if (err) {
        console.log(err);
        refresh([]);
      } else {
        refresh(makeArrayOfStrings(result[1]));
      }
    }
  );

  router.get("/ByCityAndHostel/:cityid/:hostelid", (req, res) => {
    const { cityid, hostelid } = req.params;
    publishForUser(cityid, hostelid);
    const query = `select *, 
                  (select name from hostel where id = machine.hostelid) as hostelname,
                  (select name from city where id = machine.cityid) as cityname 
              from machine where cityid = ? and hostelid = ?`;
    pool.query(query, [cityid, hostelid], (err, result) => {
      if (err) {
        console.log(err);
        res.json({ result: [] });
      } else {
        res.json({ result });
      }
    });
  });


  pubnub.addListener({
    message: function(data) {
      const { message, channel } = data;
      console.log(message)

      const type = message.split("#")[0];
      const userid = message.split("#")[1];

      if (type == "TURNEDON") {
        emitFreshMachinesStatusAfterTurningOn(io, channel, userid);
      } else if (type == "TURNEDOFF") {
        emitFreshMachinesStatusAfterTurningOff(io, channel);
      } else if (message == "TRUE") {
        console.log("machine " + channel + " is active");
        emitFreshStatus(io, channel);
      }
    }
  });


  io.on("connection", socket => {
    console.log("New User connected", socket.id);

    socket.on("disconnect", () => {
        console.log(`disconnecting client`, socket.id)
        socket.disconnect(true);
    })

    socket.on("machineOn", info => {
        console.log(info)
      pubnub.publish(
        {
          channel: info.channel,
          message: `on,${info.userid}`
        },
        function(status, response) {
          if (status.error) {
            console.log(status);
          } else {
            console.log("message Published w/ timetoken", response.timetoken);
          }
        }
      );
    });

    socket.on("machineOff", info => {
      console.log("turning machine off with cahnnel id - " + info.channel);
      pubnub.publish(
        {
          channel: info.channel,
          message: `off,${info.userid}`
        },
        function(status, response) {
          if (status.error) {
            console.log(status);
          } else {
            pool.query(
              machineBusy + query,
              ["active", info.machineid, info.cityid, info.hostelid],
              (err, result) => {
                if (err) console.log(err);
                else io.sockets.emit("newMachines", { result: result[1] });
              }
            );
            console.log("message Published w/ timetoken", response.timetoken);
          }
        }
      );
    });

    //io.sockets.emit('serverSpeaks', "Hello Clients I am Server")
  });

  return router;
};
