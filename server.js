const express = require('express');
const PORT = process.env.PORT || 8080;
const app = express();
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const passportSetup = require('./config/passport-setup');
const cookieSession = require('cookie-session');
const passport = require('passport')
const dotenv = require('dotenv');
dotenv.config()
const db = require('./models')

app.use(express.static('public'));

// Set Handlebars.
const exphbs = require('express-handlebars');

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(cookieSession({
  // cookie lasts a day
  maxAge: 24 * 60 * 60 * 1000,
  keys: [process.env.cookieKey]
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// setup routes
app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)

// Import routes and give the server access to them.
app.get('/', (req, res) => {
  res.render('index')
})

app.get('/main', (req, res) => {
  res.render('main')
})

app.get('/about', (req, res) => {
  res.render('about')
})


// Start our server so that it can begin listening to client requests.
db.sequelize.sync().then(()=> {
  app.listen(PORT, () =>
    console.log(`Server listening on: http://localhost:${PORT}`))
})

