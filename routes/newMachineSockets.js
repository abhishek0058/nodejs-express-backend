const POPUP = {
    machineStarted: "machineStarted",
    machineStopped: "machineStopped"
};

// The function will take `io` as a parameter
module.exports = (io) => {
    // make router instance
    const router = require("express").Router();
    // make Pool-connection instance
    const pool = require("./pool");
    // Get all the machines
    let machines = null;
    (() => 
        utilities
            .getAllMachines(pool)
            .then((result) => machines = result)
            .catch(err => console.log("error", err))
    )();
    // activator users
    let activatorUsers = [];
    
    // TODO: make a function which takes channel as parameter and sets the state of the machine in the machines array

    // Implement Sockets
    io.on("connection", socket => {
        
        // event for machine to get registered as active
        socket.on("registerMachine", payload => {
            console.log("registerMachine -> payload", payload);
            console.log("socket Id", socket.id);
            const channel = payload._channel;
            const { timeObj } = payload;
            // Searching for machine in the machines array
            let selectHostelId = null;
            for(let hosteild in machines) {
                // console.log('registerMachine -> hostelid', hosteild);
                for(let _channel in machines[hosteild]) {
                    // console.log("registerMachine -> channel", _channel)
                    if(_channel == channel) {
                        const { timer, user } = machines[hosteild][channel];
                        machines[hosteild][channel]._status = "active";
                        machines[hosteild][channel].socketId = socket.id;
                        if(timeObj) {
                            machines[hosteild][channel]._status = "busy";
                            machines[hosteild][channel].timer = timeObj;
                        }
                        else if(timer) {
                            io.emit("reset_previouse_state", { channel, timer, user });
                            machines[hosteild][channel]._status = "busy";
                        }
                        selectHostelId = hosteild;
                        console.log("new machine", machines[hosteild][channel]);
                        // make an entry in database
                        const query = `insert into machine_status(channel, status, time) values(?, ?, now())`;
                        pool.query(query, [_channel, 'on'], (_err_) => {
                            if(_err_) {
                                console.log("error during submitting machine_status, -> ON", _err_);
                            }
                            else {
                                console.log('status added in the database');
                            }
                        });
                    }
                }
            }
            io.emit("refresh", { machines, selectHostelId });
        });

        // event the machine to verify that it has started by the user
        socket.on("machine_started", (payload) => {
            console.log("payload", payload);
            // make it running and register the user for it
            const { user } = payload;
            const channel = payload._channel;
            const timer = payload.timeObj;
            let selectHostelId = null;
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(_channel == channel && machines[hosteild][_channel]._status == "inProgress" ) {
                        const { timeoutId } = machines[hosteild][channel];
                        if(timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        machines[hosteild][channel] = {
                            ...machines[hosteild][channel],
                            _status: "busy",
                            user,
                            timer,
                            timeoutId: null
                        };
                        selectHostelId = hosteild;
                        break;
                    }
                }
            }
            // remove user from the activators list
            activatorUsers = activatorUsers.filter(_user => _user != user);
            io.emit("refresh", { machines, selectHostelId });
            io.emit("show_pop_up", { user, type: POPUP.machineStarted });
        });

         // event the machine to verify that it has stopped by the user
         socket.on("machine_stopped", (payload) => {
            console.log("payload", payload);
            // make it running and register the user for it
            const channel = payload._channel;
            let selectHostelId = null, user = null;
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(_channel == channel && machines[hosteild][_channel]._status == "busy" ) {
                        user = machines[hosteild][channel].user; 
                        machines[hosteild][channel] = {
                            ...machines[hosteild][channel],
                            _status: "active",
                            user: null, 
                            timer: null
                        };
                        selectHostelId = hosteild;
                        console.log("changing machine status", machines[hosteild][channel]);
                        break;
                    }
                }
            }
            io.emit("refresh", { machines, selectHostelId });
            io.emit("show_pop_up", { user, type: POPUP.machineStopped });
        });

        // event for machine to keep the timer in sync
        socket.on("tick", (payload) => {
            const timer = payload.timeObj;
            const channel = payload._channel;
            let selectHostelId = null;
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(_channel == channel) {
                        machines[hosteild][channel].timer = timer;
                        selectHostelId = hosteild;
                        break;
                    }
                }
            }
            io.emit("refresh", { machines, selectHostelId });
        });

        // event for users to turn-on the machine
        socket.on("machine_on", (payload) => {
            console.log("payload", payload);
            const { user, channel } = payload;
            // check user in activatorUsers
            if(activatorUsers.indexOf(user) != -1) {
                io.emit('error_while_turning_machine_on', {
                    status: false,
                    message: "You are already in queue",
                    channel, 
                    user
                });
                return;
            }
            // This is validate the user and check cycles at the same time
            const getCyclesLeft = `select cycles_left from account where userid = ?`;
            pool.query(getCyclesLeft, [user], (err, result) => {
                if(err || (result && result[0] && result[0].cycles_left == 0)) {
                    console.log('err', err);
                    io.emit('error_while_turning_machine_on', {
                        status: false,
                        message: "Not enough cycles in the account",
                        channel, 
                        user
                    });
                    return;
                }
                const deductCycle = `update account set cycles_left = cycles_left - 1 where userid = ${user};`;
                
                pool.query(deductCycle, (_error, _result_) => {
                    console.log("deductCycle", _result_);
                });
                
                const insertCycleHistory = `insert into cycle_use_history (userid, channel, date) values(?, ?, NOW());`;
                pool.query(insertCycleHistory, [user, channel], (_error, _result_) => {
                    if(_error) {
                     console.log("insertCycleHistory -> _error", _error);   
                    }
                    else {
                    console.log("insertCycleHistory", _result_);
                    }
                })

                // checking if machine is free, if true then make it in progress
                for(let hosteild in machines) {
                    for(let _channel in machines[hosteild]) {
                        if(_channel == channel) {
                            if(machines[hosteild][channel]._status != "active") {
                                io.emit('error_while_turning_machine_on', {
                                    status: false,
                                    message: "Machine is not free",
                                    channel,
                                    user
                                });
                                return;
                            }
                            else {
                                const timeoutId = setTimeout(() => {
                                    // TODO: don't set it as active, instead emit an event for machine to check it's state
                                    // machines[hosteild][channel]._status = "active";
                                    activatorUsers = activatorUsers.filter(_user => _user != user);
                                }, 10000);
                                machines[hosteild][channel] = {
                                    ...machines[hosteild][channel],
                                    _status: "inProgress",
                                    timeoutId
                                };
                                let cycle_time = machines[hosteild][channel].cycle_time;;
                                io.emit("turn_machine_on", { channel, user, cycle_time });
                            }
                            break;
                        }
                    }
                }
            });
        });

        // disconnected event for machines
        socket.on("disconnect", () => {
            console.log(`disconnecting client`, socket.id);
            let selectHostelId = null;
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(machines[hosteild][_channel].socketId == socket.id) {
                        console.log("disconnecting machine from the server -> chaning status", machines[hosteild][_channel])
                        machines[hosteild][_channel]._status = "inactive";
                        selectHostelId = hosteild;
                        // make an entry in database
                        const query = `insert into machine_status(channel, status, time) values(?, ?, now())`;
                        pool.query(query, [_channel, 'off'], (err, result) => {
                            if(err) {
                                console.log("error during submitting machine_status", err);
                            }
                            else {
                                console.log('status added in the database');
                            }
                        });
                        break;
                    }
                }
            }
            io.emit("refresh", { machines, selectHostelId });
            // socket.disconnect(true);
        });
    });

    router.get('/getAllMachines/:hostelid', (req, res) => {
        const { hostelid } = req.params;
        // If hostelid exist in the machines object then send machines else an empty object
        if(machines[hostelid]) {
            return res.json({
                result: machines[hostelid],
                message: true
            });
        }
        return res.json({
            result: null,
            message: "Hostel not found"
        });
    });

    router.get('/', (req,res) => {
        res.json({ machines });
    });

    router.get('/popup/:user/:type', (req, res) => {
        const { user, type } = req.params;
        io.emit("show_pop_up", { user, type });
    })

    router.get('/refreshMachineList', (req, res) => {
        utilities.refreshMachineList(pool, machines)
        .then(result => {
            console.log('/refreshMachineList -> result', result);
            res.send(`${result.length} machines will going to add to the current list. ${JSON.stringify(result)}`)
        })
        .catch(err => {
            console.log('/refreshMachineList -> err', err)
            res.json(err);            
        });
    });

    return router;
};

const utilities = {
    getAllMachines: (pool) => {
        return new Promise((resolve, reject) => {
            const getAllMachines = `SELECT m.*, 
                (select name from hostel where id = m.hostelid) as hostelname,
                (select name from city where id = m.cityid) as cityname
            FROM machine m;`;
            pool.query(getAllMachines, (err, machines) => {
                if (err) {
                    console.log("utilities -> getAllMachines", err);
                    reject(err);
                    return;
                }
                const result = {};
                for (let i = 0; i < machines.length; i++) {
                    const { hostelid, channel } = machines[i];
                    // for every machine check if the key of hostelid exist, if not then add one
                    if (!result[hostelid]) {
                        result[hostelid] = {};
                    }
                    // then simply add into it
                    result[hostelid][channel] = { 
                        ...machines[i],
                        _status: 'inactive', 
                        user: null,
                        socketId: null,
                        timer: null
                    };
                }
                resolve(result);
            });
        })
    },
    refreshMachineList: (pool, machines) => {
        return new Promise((resolve, reject) => {
            const ids = [];
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    ids.push(machines[hosteild][_channel].id);
                }
            }
            const refreshQuery = `SELECT m.*, 
                (select name from hostel where id = m.hostelid) as hostelname,
                (select name from city where id = m.cityid) as cityname
            FROM machine m where id not in (${ids.toString()});`;

            pool.query(refreshQuery, (err, result) => {
                if(err) {
                    console.log('err in refreshQuery', err);
                    return reject(err);
                }
                else {
                    return resolve(result);
                }
            });
        });
    }
}
