const express = require("express");
const router = express.Router();
const pool = require("./pool");

const tableName = "machine";

router.get("/ByCityAndHostel/:cityid/:hostelid", (req, res) => {
  const { cityid, hostelid } = req.params;
  const query = `select *, 
            (select name from hostel where id = machine.hostelid) as hostelname,
            (select name from city where id = machine.cityid) as cityname 
        from machine where cityid = ? and hostelid = ?`;
  pool.query(query, [cityid, hostelid], (err, result) => {
    if (err) {
      console.log(err);
      res.json({ result: [] });
    } else {
      //console.log(result)
      res.json({ result });
    }
  });
});

router.get("/", (req, res) => {
  res.render("machine/machine");
});

router.post("/new", (req, res) => {
  const query = `insert into ${tableName} set ? `;
  pool.query(query, req.body, err => {
    if (err) {
      console.log(err);
      res.json({ result: false });
    } else {
      res.json({ result: true });
    }
  });
});

router.get("/all", (req, res) => {
  const query = `select *, 
            (select name from city where id = ${tableName}.cityid) as cityname, 
            (select name from hostel where id = ${tableName}.hostelid) as hostelname
        from ${tableName}`;

  pool.query(query, (err, result) => {
    if (err) {
      console.log(err);
      res.json({ result: false });
    } else {
      console.log(result);
      
      res.json({ result });
    }
  });
});

router.get("/single/:id", (req, res) => {
  const { id } = req.params;
  pool.query(`select * from ${tableName} where id = ?`, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.json({ result: false });
    } else {
      res.json({ result });
    }
  });
});

router.post(`/edit`, (req, res) => {
  const { id } = req.body;
  const query = `update ${tableName} set ? where id = ? `;
  pool.query(query, [req.body, id], err => {
    if (err) {
      console.log(err); 
      res.json({ result: false });
    } else {
      res.json({ result: true });
    }
  });
});

router.get("/delete/:id", (req, res) => {
  const { id } = req.params;
  pool.query(`delete from ${tableName} where id = ?`, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.json({ result: false });
    } else {
      res.json({ result: true });
    }
  });
});


router.get("/timer/:channel", (req, res) => {
  const { channel } = req.params;
  const fetchTimer = `select * from timer where minutes_left > 1 and channel = ? order by id desc limit 1`
  pool.query(fetchTimer, [channel], (err, result) => {
    if(err) {
      console.log("fetch timer error", err);
    }
    else {
      console.log("fetch timer -> ", channel, (result.length ? result[0].minutes_left : null));
      res.json(result);
    }
  })
})
router.get('/change_cyle_time', (req, res) => {
  res.render("machine/change_cycle_time");
})

router.get("/change_cycle/:machineid/:cycle_time", (req, res) => {
  const {
    machineid,
    cycle_time
  } = req.params;
  cycle={cycle_time:cycle_time}
  const query = `update ${tableName} set ? where id = ? `;
  pool.query(query, [cycle, machineid], (err, result) => {
    console.log(query.sql);
    
     if (err) {
      console.log(err);
      res.json({ result: false });
    } else {
      res.json({ result: true });
    }
  })
})


module.exports = router;
