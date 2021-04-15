const router = require('express').Router();
const passport = require('passport');

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/logout', (req, res) => {
    req.logout();
    res.render('index');
});

router.get('/strava', passport.authenticate('strava'),
    function (req, res) {
        
    });


//   callback route for strava to redirect to
router.get('/strava/redirect', passport.authenticate('strava', { failureRedirect: '/login' }), (req, res) => {
    // res.send(req.user)
    res.redirect('/profile/')
})

module.exports = router;