const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const open = require("open");

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
  secret: "Anirudh Mondal",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin_anindita:project2023@cluster0.pi8kdja.mongodb.net/examprepDB", {useNewUrlParser: true});

const aboutContent = "This website has been created to collectively record the experiences of students in exams and their methods of preparation in different subjects.";

const examSchema = mongoose.Schema({

  username: String,
  subject: String,
  year: String,
  article: String,
});

const userSchema = mongoose.Schema({

  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user",userSchema);

const Exam = mongoose.model("Exam",examSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(process.env.PORT || 3000, function(){

  console.log("Server started at port 3000");
});

app.get("/",function(req,res){

  Exam.find({},function(err,results){

    console.log(results);
    if(!err)
    {
      res.render("home",{content:results,response:res});
    }
  })

});

app.get("/about",function(req,res){

  res.render("about",{content:aboutContent,response:res});
});

app.get("/posts/:post_id",function(req,res){

  const required = req.params.post_id;

  Exam.find({_id:required},function(err,result){

    if(!err)
    {
      res.render("post",{post:result[0]});
    }
  });
});
app.get("/login",function(req,res){

      if(req.isAuthenticated())
      {
        res.redirect("/yourPage/"+req.user.username);
      }
      else
      {
        res.render("login",{response:res});
      }
});

app.get("/register",function(req,res){

  if(req.isAuthenticated())
  {
    res.redirect("/yourPage/"+req.user.username);
  }
  else
  {
    res.render("register",{response:res});
  }
});

app.get("/yourPage/:email",function(req,res){

    if(req.isAuthenticated() && req.user.username===req.params.email){

        Exam.find({username:req.params.email},function(err,results){
          if(err)
          {
            console.log(err);
          }
          else
          {
            res.render("yourPage",{content:results,username:req.params.email,response:res});
          }
        });
    }
    else{
      res.redirect("/login");
    }
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register",function(req,res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err) {
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/yourPage/"+req.body.username);
      });
    }
  });

});

app.post("/login",function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      passport.authenticate("local")(req,res,function(){

        res.redirect("/yourPage/"+req.body.username);
      });
      }
  });
});
app.post("/compose/:username",function(req,res){

  const post = new Exam ({

    username: req.params.username,
    year: req.body.year,
    subject: _.startCase(req.body.subject),
    article: req.body.article
  });
  post.save(function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.redirect("/yourPage/"+req.params.username);
    }
  });

});
app.post("/posts/:id",function(req,res){

  Exam.find({_id:id},function(e,results){
    if(e)
    {
      console.log(e);
    }
    else
    {
     res.render("post",{post:results[0]});
    }
  });
});
app.post("/edit",function(req,res){
  const id = req.body.id;
  console.log(id);
  if(req.isAuthenticated())
  {
    Exam.find({_id:id},function(e,results){
      if(e)
      {
        console.log(e);
      }
      else
      {
       res.render("edit",{post:results[0],response:res});
      }
    });
  }
  else
  {
    res.redirect("/login");
  }
});
app.post("/edit/:id",function(req,res){
  const filter = {_id:req.params.id};
  const update = {subject:req.body.subject, year:req.body.year, article:req.body.article};
  Exam.findOneAndUpdate(filter,update,function(err,result){
    if(err)
    {
      console.log(err);
    }
    else{
      res.redirect("/yourPage/"+req.body.username);
    }
  });
});
app.post("/delete/:id",function(req,res){
  Exam.findByIdAndDelete(req.params.id,function(err,result){
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.redirect("/yourPage/"+result.username);
    }
  })
})

app.post("/search",function(req,res){

  const searchOption = req.body.searchOption.toString();
  console.log(searchOption);
  res.redirect("/"+searchOption);
});

app.get("/:topic",function(req,res){

  const required = req.params.topic;
  console.log(required);
  Exam.find({$or:[{year:required},{subject:new RegExp(required,"i")},{username:new RegExp(req.params.topic,"i")}]},function(err,results){

    if(err)
    {
        console.log(err);
    }
    else
    {
      console.log(results);
      res.render("home",{content:results,response:res});
    }
   });
});
