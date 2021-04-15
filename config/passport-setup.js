const passport = require('passport');
const StravaStrategy = require('passport-strava-oauth2').Strategy;
const dotenv = require('dotenv');
dotenv.config()
const {Users} = require('../models');


passport.serializeUser((user, done) => {
    done(null, user.user_strava_id);
});

passport.deserializeUser((id, done) => {
    Users.findAll({
        where: {
            user_strava_id: id
        }
    }).then((user) => {
        done(null, user);
    })
});


passport.use(new StravaStrategy({
    // options for strategy
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: "/auth/strava/redirect"
    }, (accessToken, refreshToken, profile, done) => {
        // check if user exists
        Users.findAndCountAll({
            where: {
                user_strava_id: profile.id
            }
        }).then(data => {
            console.log(profile)
            if (data.count > 0) {
                console.log(`user is ${profile._json.username}, id#: ${profile.id}`)
                Users.update({ access_token: accessToken }, {
                    where: {
                        user_strava_id: profile.id
                    }
                }).then(updatedData => {
                    Users.findAndCountAll({
                        where: {
                            user_strava_id: profile.id
                        }
                    }).then(data => {
                        done(null, data.rows[0]._previousDataValues)
                    })
                })
            }
            else {
                const newUser = {
                    user_name: profile._json.username,
                    user_strava_id: profile.id,
                    user_first: profile.name.givenName,
                    user_last: profile.name.familyName,
                    user_photo: profile._json.profile,
                    access_token: accessToken,
                    user_city: profile._json.city,
                    user_state: profile._json.state
                }
                Users.create(newUser).then(data => {
                    done(null, newUser)
                })
            }
        })
    })  
);

module.exports = passport;