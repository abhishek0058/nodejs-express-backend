const router = require('express').Router();
const utils = require('./utils.js');
const { celebrate, Joi } = require('celebrate');

router.get('/userHistory', (req, res) => {
    res.render('userReports/userHistory');
})

router.get('/userHistory/:userId', celebrate({
    params: ({
        userId: Joi.string().required()
    })
}), async (req, res) => {
    try {
        const { userId } = req.params;
        // all three of them wants userid
        const getPackageHistory = `select ph.id, ph.date, ph.amount, p.name from purchase_history ph inner join package p on p.id = ph.packageid where ph.userid = ?;`
        const getCycleUseHistory = `select * from cycle_use_history ch where ch.userid = ?;`
        const getUserDetails = `select u.id, u.name, email, mobile, h.name as hostel, c.name as city from user u inner join hostel h on h.id = u.hostelid inner join city c on c.id = u.cityid where u.id = ?`; 
        // Fetching user information. If no info then raise an error
        const user = await utils.executeQuery(getUserDetails, [userId]);
        if(!user || !user.length) return res.boom.badRequest("User not found");

        const purchaseHistory = await utils.executeQuery(getPackageHistory, [userId]);
        const cycleHistory = await utils.executeQuery(getCycleUseHistory, [userId]);

        res.json({ user: user[0], purchaseHistory, cycleHistory });

    } catch(err) {
        console.log("userHistory -> ", err);
        res.boom.internal(err);
    }
});


module.exports = router;


