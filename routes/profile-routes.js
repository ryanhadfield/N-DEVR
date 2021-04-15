const router = require('express').Router();
const stravaApi = require('strava-v3');
const stravaPassport = require('../config/passport-setup')
const { Users } = require('../models');
const { Activities } = require('../models')
const { Op } = require("sequelize");
const { response } = require('express');


const authCheck = (req, res, next) => {
    // checks if user is logged in
    if (!req.user) {
        // if user is not logged in
        res.redirect('/auth/login');
    }
    else {
        next();
    }
}

router.get('/searchParticipants/:userId', (req, res) => {
    Users.findAll({
        where: {
            user_strava_id: req.params.userId
        }
    }).then((response) => {
        res.json(response)
    })
})

router.delete('/api/deleteActivity/:id', (req, res) => {
    const id = req.params.id;
    console.log(id)
    Activities.destroy({
        where: {
            id: id
        }
    })

})

router.get('/', authCheck, (req, res) => {
    Activities.findAll({
        where: {
            activity_participants: {
                [Op.substring]: req.user[0]._previousDataValues.user_strava_id
            }
        },
    }).then((response) => {
        let activityArray = [];
        for (let i = 0; i < response.length; i++) {
            activityArray.push(response[i].dataValues)
        }
        const hbsObject = {
            user: req.user[0]._previousDataValues,
            activities: activityArray
        }
        res.render('profile', hbsObject);
    })
})

router.get('/activity', (req, res) => {
    const hbsObject = {
        user: req.user[0]._previousDataValues,
    }
    res.render('activity', hbsObject)

})

router.get('/activity/:coords/:activityType', (req, res) => {
    var args = ({
        bounds: req.params.coords,
        activity_type: req.params.activityType
    });
    var callback = function (error, data, response) {
        if (error) {
            console.error(error);
        } else {
            res.json(data)
        }
    };

    // Pulls access token from database to access strava segments API
    const strava = new stravaApi.client(req.user[0]._previousDataValues.access_token)

    strava.segments.explore(args, callback)
});

router.get('/segment/:stream', (req, res) => {
    const id = req.params.stream;
    const keys = ['distance', 'latlng', 'altitude'];
    const key_by_type = true;
    let args = ({
        id: id,
        types: keys,
        key_by_type: key_by_type
    })

    var callback = function (error, data, response) {
        if (error) {
            console.error(error);
        } else {
            res.json(data)
        }
    };

    const strava = new stravaApi.client(req.user[0]._previousDataValues.access_token)
    strava.streams.segment(args, callback)

})

router.get('/viewActivity/:id', (req, res) => {
    Activities.findAll({
        where: {
            id: req.params.id
        }
    }).then((response) => {
        console.log(response[0].dataValues)
        res.render('activityViewer', response[0].dataValues)
    })
})

router.get('/getActivity/:id', (req, res) => {
    Activities.findAll({
        where: {
            id: req.params.id
        }
    }).then((response) => {
        res.json(response)
    })
})

router.post('/api/createActivity/', (req, res) => {
    Activities.create({
        activity_type: req.body.activity_type,
        activity_segments: req.body.activity_segments,
        total_distance: req.body.total_distance,
        total_elevationGain: req.body.total_elevationGain,
        total_elevationLoss: req.body.total_elevationLoss,
        activity_name: req.body.activity_name,
        activity_desc: req.body.activity_desc,
        activity_date: req.body.activity_date,
        activity_time: req.body.activity_time,
        activity_gear: req.body.activity_gear,
        activity_meeting_location: req.body.activity_meeting_location,
        activity_participants: req.body.activity_participants,
        UserId: req.body.userId
    })
})

router.get('/segmentInfo/:segmentId', (req, res) => {
    const args = ({
        id: req.params.segmentId
    })
    var callback = function (error, data, response) {
        if (error) {
            console.error(error);
        } else {
            res.json(data)
        }
    };

    const strava = new stravaApi.client(req.user[0]._previousDataValues.access_token)
    strava.segments.get(args, callback)

})

router.get('/userSearch/:name', (req, res) => {
    const name = req.params.name.split("&")
    Users.findAll({
        where: {
            user_first: name[0],
            user_last: name[1]
        }
    }).then((response) => {
        res.json(response)
    })
})

module.exports = router;