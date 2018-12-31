module.exports = function (io) {
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
  const insertCycleHistory = `insert into cycle_use_history (userid, channel, date) values (?, ?, '${new Date().toString()}');`;

  const removeActivatorUser = `update machine set activator_user = '' where channel = ?;`;

  const checkIfMachineIsInProcessOrBusy = `select inProcess, status from machine where channel = ?`;
  const makeMachineInProcess = `update machine set inProcess = "true" where channel = ?`;
  const makeMachineOutOfProcess = `update machine set inProcess = "false" where channel = ?`
  const getMachineCycleTime = `select cycle_time from machine where channel = ?`

  const pubnub = new PubNub({
    publishKey: process.env.PUBLISH_KEY,
    subscribeKey: process.env.SUBSCRIBER_KEY
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
    } catch (err) {
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
          function (status, response) {
            if (status.error) {
              console.log("publishChecks", status);
            } else {
              console.log("message Published w/ timetoken", response.timetoken);
            }
          });
      } catch (err) {
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
      query +
      makeMachineOutOfProcess;
    const args = [channel, userid, userid, channel, userid, channel, channel, channel, channel];
    try {
      pool.query(bigQuery, args, (err, result) => {
        if (err) console.log(err);
        else {
          io.sockets.emit("newMachines", {
            result: result[4]
          });
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
            io.sockets.emit("newMachines", {
              result: result[2]
            });
          }
        }
      );
    } catch (e) {
      console.log(e);
    }
  }

  function emitFreshStatus(io, channel) {
    pool.query(makeMachineActiveIfNotBusy, [channel], (err, result) => {
      if (err) {
        console.log("emitFreshStatus -> makeMachineActiveIfNotBusy", err);
      } else {
        pool.query(query, [channel, channel], (err, result) => {
          if (err) console.log(err);
          else io.sockets.emit("newMachines", {
            result: result
          });
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
    const {
      cityid,
      hostelid
    } = req.params;
    publishForUser(cityid, hostelid);
    const query = `${makeMachinesInActive};select *, 
                  (select name from hostel where id = machine.hostelid) as hostelname,
                  (select name from city where id = machine.cityid) as cityname 
              from machine where cityid = ? and hostelid = ?`;
    pool.query(query, [cityid, hostelid], (err, result) => {
      if (err) {
        console.log(err);
        res.json({
          result: []
        });
      } else {
        res.json({
          result: result[1]
        });
      }
    });
  });

  pubnub.addListener({
    message: function (data) {
      // console.log("addListener", data);
      const {
        message,
        channel
      } = data;

      const type = message.split("#")[0];
      const restOfTheData = message.split("#")[1];

      if (type == "TURNEDON") {
        emitFreshMachinesStatusAfterTurningOn(io, channel, restOfTheData);
        pool.query(getMachineCycleTime, channel, (err, resultTimer) => {
          if(err) {
            console.log("getMachineCycleTime ->", getMachineCycleTime);
            startTimer(io, channel, restOfTheData, 90);
          }
          else if(resultTimer && resultTimer.length) {
            const cycle_time = Number(resultTimer[0].cycle_time);
            startTimer(io, channel, restOfTheData, (cycle_time > 0 ? cycle_time : 90));
          }
        })
      } 
      else if (type == "TURNEDOFF") {
        emitFreshMachinesStatusAfterTurningOff(io, channel);
      } 
      else if (type == "TRUE") {
        console.log("machine " + channel + " is active");
        emitFreshStatus(io, channel);
      } 
      else if (type == "MON") {
        const userid = message.split("#")[1];
        const channel = message.split("#")[2];
        let minutesLeft = message.split("#")[3];
        const recordId = message.split("#")[4];
        const intervalRef = message.split("#")[5];

        pubnub.publish({
            channel: channel,
            message: `start_relay`
          },
          function (status, response) {
            if (status.error) {
              console.log("TurnMachineOFF", status);
            } else {
              console.log("started_relay", channel);
            }
          }
        );
        
        console.log("Number(minutesLeft)", Number(minutesLeft))

        if(Number(minutesLeft) >= 1)
          updateTimerInDataBase(io, --minutesLeft, recordId, userid, channel);

        io.emit('machineIsOn', {
          userid: message.split("#")[1],
          channel: message.split("#")[2]
        });

        if (Number(minutesLeft) <= 1) {
          console.log("Times up", minutesLeft);
          clearInterval(intervalRef);
          TurnMachineOFF(channel, userid);
          io.emit('stopTimer', {
            timer: "0",
            userid,
            channel
          });
        }
      } 
      else if (type == "MOFF") {
        const userid = message.split("#")[1];
        const channel = message.split("#")[2];

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

      console.log(info);
      pool.query(checkIfMachineIsInProcessOrBusy, [info.channel], (err, resultOfFirstQUery) => {
        if (err) {
          console.log("checkIfMachineIsInProcessOrBusy -> err", err);
          io.emit("error", {
            user: info.userid,
            channel: info.channel
          });
        } else if (
          resultOfFirstQUery &&
          resultOfFirstQUery.length &&
          resultOfFirstQUery[0].inProcess == "false" &&
          resultOfFirstQUery[0].status == "active"
        ) {
          pool.query(makeMachineInProcess, [info.channel], (err2, resultOfSecondQUery) => {
            if (err2) {
              console.log("resultOfSecondQUery -> err", info.channel, err);
              io.emit("error", {
                user: info.userid,
                channel: info.channel
              })
            } else {
              console.log("resultOfSecondQUery", resultOfSecondQUery);
              pubnub.publish({
                  channel: info.channel,
                  message: `on,${info.userid}`
                },
                function (status, response) {
                  if (status.error) {
                    console.log("machineOn", status);
                  } else {
                    console.log("message Published w/ timetoken", response.timetoken);
                  }
                }
              );
            }
          })
        } else {
          console.log("checkIfMachineIsNotBusy -> mcahine is inProcess", info.channel);
          io.emit("error", {
            user: info.userid,
            channel: info.channel
          });
        }
      })
    });

    socket.on("machineOff", info => {
      console.log("turning machine off with cahnnel id - " + info.channel);
      pubnub.publish({
          channel: info.channel,
          message: `off,${info.userid}`
        },
        function (status, response) {
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
    io.emit('timerUpdated', {
      timer: minutesLeft,
      userid,
      channel
    });
    pool.query(updateMinutesLeftQuery, [minutesLeft, new Date(), recordId], (err, result) => {
      if (err) {
        console.log('updateTimerInDataBase', err);
        // throw err;
      }
    });
    // console.log('updateTimerInDataBase', minutesLeft, recordId)
  }

  const startTimer = (io, channel, userid, cycle_time) => {
    let minutesLeft = cycle_time;
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
            const fetchMinutesLeftFromTimer = `select minutes_left from timer where id = ?`;
            pool.query(fetchMinutesLeftFromTimer, [recordId], (err, resultMinutesLeft) => {
              if (err) {
                console.log("fetchMinutesLeftFromTimer", err)
              } else {
                const refreshedMinutesLeft = resultMinutesLeft[0].minutes_left;
                console.log("refreshedMinutesLeft", refreshedMinutesLeft);
                pubnub.publish({
                    channel: channel,
                    message: `ms,${userid}#${channel}#${refreshedMinutesLeft}#${recordId}#${intervalRef}`
                  },
                  function (status, response) {
                    if (status.error) {
                      console.log("intervalRef", status);
                    }
                  }
                );
              }
            })

          } catch (err) {
            console.log("startTimer -> PUBNUB UPDATE", err)
          }
          // updateTimerInDataBase(io, --minutesLeft, recordId, userid, channel)
        }, singleIteration);

        // setTimeout(() => {
        //   clearInterval(intervalRef);
        //   TurnMachineOFF(channel, userid);
        //   io.emit('stopTimer', {
        //     timer: "0",
        //     userid,
        //     channel
        //   });
        // }, totalTime);
      }
    })
  }

  const TurnMachineOFF = (channel, userid) => {
    try {
      const MakingMachineInactiveAndFree = `update machine set status = "inactive", activator_user = "" where channel = ?`;
      pool.query(MakingMachineInactiveAndFree, [channel], (err, result) => {
        if (err) {
          console.log("TurnMachineOFF -> MakingMachineInactiveAndFree", err);
        } else {
          console.log("MakingMachineInactiveAndFree DONE");
        }
      })
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