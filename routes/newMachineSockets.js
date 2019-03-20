// The function will take `io` as a parameter
module.exports = (io) => {
    // make router instance
    const router = require("express").Router();
    // make Pool-connection instance
    const pool = require("./pool");
    // Get all the machines
    let machines = null;
    (() => utilities.getAllMachines(pool).then((result) => machines = result))();
    // activator users
    let activatorUsers = [];
    
    // Implement Sockets
    io.on("connection", socket => {
        
        // event for machine to get registered as active
        socket.on("registerMachine", payload => {
            console.log("payload", payload);
            console.log("socket Id", socket.id);
            const { channel } = payload;
            // Searching for machine in the machines array
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(_channel == channel) {
                        machines[hosteild][channel].socketId = socket.id;
                        machines[hosteild][channel]._status = "active";
                    }
                }
            }
            io.emit("refresh", { machines });
        });

        // event the machine to verify that it has started by the user
        socket.on("machine_started", (payload) => {
            console.log("payload", payload);
            // make it running and register the user for it
            const { channel, user, timer } = payload;
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
                        break;
                    }
                }
            }
            // remove user from the activators list
            activatorUsers = activatorUsers.filter(_user => _user != user);
            io.emit("refresh", { machines });
        });

         // event the machine to verify that it has stopped by the user
         socket.on("machine_stopped", (payload) => {
            console.log("payload", payload);
            // make it running and register the user for it
            const { channel, user } = payload;
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(_channel == channel && machines[hosteild][_channel]._status == "busy" ) {
                        machines[hosteild][channel] = {
                            ...machines[hosteild][channel],
                            _status: "active",
                            socketId: null,
                            user: null, 
                            timer: null
                        };
                        break;
                    }
                }
            }
            io.emit("refresh", { machines });
        });

        // event for machine to keep the timer in sync
        socket.on("tick", (payload) => {
            console.log("payload", payload);
            const { channel, timer } = payload;
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(_channel == channel) {
                        machines[hosteild][channel].timer = timer;
                        break;
                    }
                }
            }
            io.emit("refresh", { machines });
        });

        // event for users to turn-on the machine
        socket.on("machine_on", (payload) => {
            console.log("payload", payload);
            const { user, channel } = payload;
            // check user in activatorUsers
            if(activatorUsers.indexOf(user) != -1) {
                io.emit('error_while_turning_machine_on', {
                    status: false,
                    message: "You are in queue",
                    channel, 
                    user
                });
            }
            // This is validate the user and check cycles at the same time
            const getCyclesLeft = `select cycles_left from account where userid = ?`;
            pool.query(getCyclesLeft, user, (err, result) => {
                if(err || (result && result[0] && result[0].cycles_left > 0)) {
                    console.log('err', err);
                    io.emit('error_while_turning_machine_on', {
                        status: false,
                        message: "User account not found",
                        channel, 
                        user
                    });
                }
                // checking if machine is free, if true then make it in progress
                for(let hosteild in machines) {
                    for(let _channel in machines[hosteild]) {
                        if(_channel == channel) {
                            if(machines[hosteild][channel] != "active") {
                                io.emit('error_while_turning_machine_on', {
                                    status: false,
                                    message: "Machine is not free",
                                    channel, 
                                    user
                                });
                            }
                            else {
                                const timeoutId = setTimeout(() => {
                                    machines[hosteild][channel]._status = "inactive";
                                    activatorUsers = activatorUsers.filter(_user => _user != user);
                                });
                                machines[hosteild][channel] = {
                                    ...machines[hosteild][channel],
                                    _status: "inProgress",
                                    timeoutId
                                }
                            }
                            break;
                        }
                    }
                }
                io.emit("turn_machine_on", { channel, user });
            });
        });

        // disconnected event for machines
        socket.on("disconnect", () => {
            console.log(`disconnecting client`, socket.id);
            for(let hosteild in machines) {
                for(let _channel in machines[hosteild]) {
                    if(machines[hosteild][_channel].socketId == socket.id) {
                        machines[hosteild][channel]._status = "inactive";
                        break;
                    }
                }
            }
            io.emit("refresh", { machines });
            socket.disconnect(true);
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
    })

    return router;
};

const utilities = {
    getAllMachines: (pool) => {
        return new Promise((resolve, reject) => {
            const getAllMachines = `SELECT * FROM machine;`;
            pool.query(getAllMachines, (err, machines) => {
                if (err) {
                    console.log("utilities -> getAllMachines", err);
                    resolve(null);
                }
                const result = {};
                for (let i = 0; i < machines.length; i++) {
                    const { hostelid, channel } = machines[i];
                    // for every machine check if the key of hostelid exist, if not then add one
                    if (!result[hostelid]) {
                        result[hostelid] = { [channel]: machines[i] };
                    }
                    // if it exist then simply add into it
                    else {
                        result[hostelid][channel] = { 
                            ...machines[i], 
                            _status: 'inactive', 
                            user: null,
                            socketId: null,
                            timer: null
                        };
                    }
                }
                resolve(result);
            });
        })
    }
}