const express = require('express');
const router = express.Router();
const pool = require('./pool');
const { celebrate, Joi } = require('celebrate');

router.get('/machine_status', (req, res) => {
    res.render('machineReports/machineStatus');
});

//for check machine status
router.get('/machine_status_json', (req, res) => {
    const query = `select m.id,m.name,(select c.name from city c where c.id=m.cityid) as city ,(select h.name from hostel h where h.id=m.hostelid) as hostel, m.status,m.channel,(select u.name from user u where u.id=m.activator_user) as user from machine m`;
    pool.query(query, (err, result) => {
        if(err) res.status(500).json([]);
        else res.status(200).json({result})
    });
});

router.get('/cycle_use', (req, res) => {
    res.render('machineReports/cycleUse');
});

router.get('/cycle_use_json', (req, res) => {
    const query=`select c.id,(select u.name from user u where u.id=c.userid) as user,c.userid,c.date from cycle_use_history c ORDER BY c.id DESC`;
    pool.query(query,(err,result)=>{
        if (err) res.status(500).json([]);
        else res.status(200).json({result});
    });
});

router.get('/machine_cycle_use', (req, res) => {
    res.render('machineReports/machineCycleUse');
});

router.get('/machine-full-report/:type/:channel', celebrate({
    params: Joi.object().keys({
        type: Joi.string().required(),
        channel: Joi.string().required()
    })
}), (req, res) => {
    try {
        const { type, channel } = req.params;
        if(['last-week', 'last-month', 'last-year'].indexOf(type) == -1) {
            return res.boom.badRequest("Time duration is invalid");
        }

        const _date = internals.makeQueryForDateInternal(type);

        const query = `SELECT 
            u.id as userId, c.id as recordId, name, mobile, date  
            FROM cycle_use_history c inner join user u on u.id = c.userid 
            where channel = ? and date > ${_date} order by c.id`;
        
        pool.query(query, [channel], (err, result) => {
            if(err) return res.boom.internal("Internal error occurred");
            res.json({ result });
        });
    } catch(error) {
        console.log("error", error);
        return res.json({ result: null, status: false, message: 'Internal error' });
    }
});

module.exports = router;

const internals = {
    makeQueryForDateInternal: (type) => {
        try {
            switch(type) {
                case 'last-week':
                    return `DATE_ADD(CURDATE(), INTERVAL -1 WEEK)`;
                case 'last-month':
                    return `DATE_ADD(CURDATE(), INTERVAL -1 MONTH)`
                case 'last-year':
                    return `DATE_ADD(CURDATE(), INTERVAL -1 YEAR)`

                default:
                    return null;
            }
        } catch (err) {
            console.log("makeQueryForDateInternal ->", err);
            return null;
        }
    }
}