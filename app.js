const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const session = require('express-session');
const { info } = require('console');
const bodyParser = require('body-parser');
const { stdin } = require('process');

PORT = process.env.PORT||3000;
mongoose.connect('mongodb://localhost:27017/Student', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch((error) => {
    console.log('MongoConnection error:', error); // Log any connection errors
});

const db = mongoose.connection;
const StudentSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Student = mongoose.model('Student', StudentSchema);
const app = express();
app.set('view engine' , 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(session({secret:'secret' , resave:false , saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new localStrategy((username, password, done) => {
      Student.findOne({ username: username })
        .exec()
        .then((students) => {
          if (!students) {
            return done(null, false, { message: "Incorrect username" });
          }
          if (students.password !== password) {
            return done(null, false, { message: "Incorrect password" });
          }
          return done(null, students);
        })
        .catch((err) => {
          return done(err);
        });
    })
  );


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    Student.findById(id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  });


function isAuthenticated (req , res , next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

app.get('/' , (req , res) => {
    res.render('login');
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log('User not found');
            return res.redirect('/'); // Redirect to login page if user is not found
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            console.log("user logged in: ", user);
            return res.redirect('/dashboard'); // Redirect to dashboard upon successful login
        });
    })(req, res, next);
});

app.get('/dashboard' , isAuthenticated , (req , res) =>{
    res.render('dashboard' , {user:req.user});
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.listen(PORT,()=>{
    console.log(`srever is running on port ${PORT}`);
});
