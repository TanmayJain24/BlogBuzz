require('dotenv').config();
const express = require("express");
const path = require("path");
const expressLayout = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const app = express();
const port = process.env.PORT || 4000;

// Middleware for parsing request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: 'Moksh@123',
    database: 'blogDatabase',
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
});

// Session setup
app.use(session({
    secret: '1234@abcd',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure: false, httpOnly: true, maxAge: 86400000 }
}));

// Make user available in EJS views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Templating engine setup
app.use(expressLayout);
app.set('layout', 'index');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./server/routes/main'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle 404 Errors
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
