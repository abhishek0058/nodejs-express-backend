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

  const removeActivatorUser = `update machine set activator_user = '' where channel = ?;`;

  const pubnub = new PubNub({
    publishKey: "pub-c-39811f57-53a9-4f4d-8aaa-83631e8f34c9",
    subscribeKey: "sub-c-99a0ff36-0419-11e9-ba8a-aef4d14eb57e",
  });

  function makeArrayOfStrings(result) {
    let ch = [];
    for (let i = 0; i < result.length; i++) {
      ch.push(result[i].channel);
    }
    return ch;
  }

  function refresh(channels) {
    try {
      pubnub.subscribe({
        channels: channels
      });
    } catch(err) {
      console.log("refresh -> ", errr)
    }
  }

  function publishChecks(channels) {
    console.log(channels);
    for (let i = 0; i < channels.length; i++) {
      try {
        pubnub.publish({
          message: "check," + i,
          channel: channels[i]
        },
        function(status, response) {
          if (status.error) {
            console.log("publishChecks", status);
          } else {
            console.log("message Published w/ timetoken", response.timetoken);
          }
        });
      } catch(err) {
        console.log("publish Checks", err)
      }
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
      if (err)  {
        console.log("emitFreshStatus -> makeMachineActiveIfNotBusy", err);
      }
      else {
        pool.query(query, [channel, channel], (err, result) => {
          if (err) console.log(err);
          else io.sockets.emit("newMachines", { result: result });
        });
      }
    });
  }

  pool.query(`${makeMachinesInActive};select channel from machine;`, (err, result) => {
    console.log("Subscribing channels");
    if (err) {
      console.log(err);
      refresh([]);
    } else {
      refresh(makeArrayOfStrings(result[1]));
    }
  });

  router.get("/ByCityAndHostel/:cityid/:hostelid", (req, res) => {
    const { cityid, hostelid } = req.params;
    publishForUser(cityid, hostelid);
    const query = `${makeMachinesInActive};select *, 
                  (select name from hostel where id = machine.hostelid) as hostelname,
                  (select name from city where id = machine.cityid) as cityname 
              from machine where cityid = ? and hostelid = ?`;
    pool.query(query, [cityid, hostelid], (err, result) => {
      if (err) {
        console.log(err);
        res.json({ result: [] });
      } else {
        res.json({ result: result[1] });
      }
    });
  });

  pubnub.addListener({
    message: function(data) {
      // console.log("addListener", data);
      const { message, channel } = data;

      const type = message.split("#")[0];
      const restOfTheData = message.split("#")[1];
      
      if (type == "TURNEDON") {
        emitFreshMachinesStatusAfterTurningOn(io, channel, restOfTheData);
        startTimer(io, channel, restOfTheData);
      }
      else if (type == "TURNEDOFF") {
        emitFreshMachinesStatusAfterTurningOff(io, channel);
      }
      else if (type == "TRUE") {
        console.log("machine " + channel + " is active");
        emitFreshStatus(io, channel);
      }
      else if(type == "MON") {
        io.emit('machineIsOn', {
          userid,
          channel
        });
      }
      else if(type == "MOFF") {
        const userid = message.split("#")[1];
        const channel = message.split("#")[2];
        const minutesLeft = message.split("#")[3];
        const recordId = message.split("#")[4];
        pool.query('insert into machine_off_status(main_recordid, created_at) values(?,?)', [recordId, new Date()], (err, result) => {
          if(err) {
            console.log("err", err)
          } else {
            console.log("record is saved");
          }
        })
        io.emit('machineISOff', {
          userid,
          channel
        });
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
            console.log("machineOn", status);
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
            console.log("machineOff", status);
          } else {
            // pool.query(
            //   machineBusy + query,
            //   ["active", info.machineid, info.cityid, info.hostelid],
            //   (err, result) => {
            //     if (err) console.log(err);
            //     else io.sockets.emit("newMachines", { result: result[1] });
            //   }
            // );
            console.log("message Published w/ timetoken", response.timetoken);
          }
        }
      );
    });

    //io.sockets.emit('serverSpeaks', "Hello Clients I am Server")
  });

  const updateTimerInDataBase = (io, minutesLeft, recordId, userid, channel) => {
    console.log('updateTimerInDataBase -> minutesLeft', minutesLeft)
    const updateMinutesLeftQuery = 'update timer set minutes_left = ?, last_updated_at = ? where id = ?';
    pool.query(updateMinutesLeftQuery, [minutesLeft, new Date(), recordId], (err, result) => {
      if (err) {
        console.log('updateTimerInDataBase', err);
        // throw err;
      } else {
        io.emit('timerUpdated', {
          timer: minutesLeft,
          userid,
          channel
        });
      }
    })
    // console.log('updateTimerInDataBase', minutesLeft, recordId)
  }

  const startTimer = (io, channel, userid) => {
    let minutesLeft = 90;
    const insertTimerQuery = 'insert into timer(channel, userid, minutes_left, created_at) values(?,?,?,?)';
    pool.query(insertTimerQuery, [channel, userid, minutesLeft, new Date()], (err, result) => {
      if (err) {
        console.log('startTimer', err);
        // throw err;
      } else {
        // console.log('startTimer', minutesLeft, result)
        io.emit('startTimer', {
          timer: minutesLeft,
          userid,
          channel
        });
        const recordId = result.insertId;
        const _this = this;
        console.log("here we got record id", recordId);

        const singleIteration = 60000; // 1 minute
        const totalTime = 60000 * 90; // 90 minutes
        
        const intervalRef = setInterval(() => {
          try {
            pubnub.publish({
                channel: channel,
                message: `ms,${userid}#${channel}#${minutesLeft}#${recordId}`
              },
              function (status, response) {
                if (status.error) {
                  console.log("intervalRef", status);
                }
              }
            );
          } catch (err) {
            console.log("startTimer -> PUBNUB UPDATE", err)
          }
          updateTimerInDataBase(io, --minutesLeft, recordId, userid, channel)
        }, singleIteration);

        setTimeout(() => {
          clearInterval(intervalRef);
          TurnMachineOFF(channel, userid);
          io.emit('stopTimer', {
            timer: "0",
            userid,
            channel
          });
        }, totalTime);
      }
    })
  }

  const TurnMachineOFF = (channel, userid) => {
    try {
      pubnub.publish({
          channel: channel,
          message: `off,${userid}`
        },
        function (status, response) {
          if (status.error) {
            console.log("TurnMachineOFF", status);
          }
        }
      );
    } catch (err) {
      console.log("TurnMachineOFF", err)
    }
  }

  return router;
};
