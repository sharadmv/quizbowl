var express = require('express');
var Bridge = require('../../mqb-prototype/js/bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({host:'localhost',port:8090,apiKey:"abcdefgh"});
var Dao = require('./dao.js').Dao;
var dao = new Dao('localhost','root','narsiodeyar1','quizbowl');
var app = express.createServer();
app.use(express.static('../public/static/'));
app.enable('jsonp callback');
app.set('view engine', 'ejs');
app.set('views','../public/views/');
app.listen(1337);
bridge.ready(function(){
    console.log("Connected to Bridge");
    bridge.publishService("dao",dao);
    bridge.getService("dao", function(dao) { 
      dao.search({answer:"dickens"},function(results){
        //console.log(results)
        }
        )});
    });
app.get('/api/search', function (req,res){
    dao.search(req.query, function(result){
      res.json(result);
      });
    });
app.get('/',function(req,res){
    res.render('home');
    });
