const express=require('express');
const router=express.Router();
const pool=require('./pool');

router.get('/machine_status', (req, res) => {
    res.render('machineReports/machineStatus');
})
//for check machine status
router.get('/machine_status_json',(req,res)=>{
    const query = `select m.id,m.name,(select c.name from city c where c.id=m.cityid) as city ,(select h.name from hostel h where h.id=m.hostelid) as hostel, m.status,m.channel,(select u.name from user u where u.id=m.activator_user) as user from machine m`;
    pool.query(query,(err,result)=>{
        if(err)
        {
            res.status(500).json([]);
        }
        else
        {
        res.status(200).json({result})
        }
    })
})
router.get('/cycle_use',(req,res)=>{
    res.render('machineReports/cycleUse');
    
})
router.get('/cycle_use_json',(req,res)=>{
    const query=`select c.id,(select u.name from user u where u.id=c.userid) as user,c.userid,c.date from cycle_use_history c ORDER BY c.id DESC`;
    pool.query(query,(err,result)=>{
             if (err) 
             {
                 res.status(500).json([]);
             } 
             else 
             {
                 res.status(200).json({result})
             }
    })
})
module.exports=router