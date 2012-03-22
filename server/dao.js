var Client = require('mysql').Client;
var client = new Client();
var pageLength = 10;
var cache={};
var totalcount = 0;
var Dao = function(host, user, password, database){
  client.host = host;
  client.user = user;
  client.password = password;
  client.database = database;
  this.tossup = {}; 
  client.query("select count(*) from tossups",function(err,results,fields){
      if (!err){
      totalcount = results[0]['count(*)'];
      } else {
      console.log(err);
      }
      });
  tossup = this.tossup;
  this.user = {};
  this.rating = {};
  this.reader= {};
  this.tossup.get = function(pKey, callback){
    client.query("select * from tossups where pKey='"+util.escapeSql(pKey)+"'", function(err, result, field){
        if (!err) {
        callback(result[0]);
        } else {
        console.log(err);
        }
        });
  }
  this.tossup.search = function(temp, callback) {

    if (temp.params) {
      obj = temp.params;
    } else {
      obj = {};
    } 
    var query = "";
    if (obj['condition']!==undefined && obj['answer']!==undefined){
      if (obj['condition']=="all"){
        query += "(t.answer like '%" + util.escapeSql(obj['answer']).replace(/ /g,'%') +"%' or t.question like '%" + obj['answer'].replace(/ /g,'%')+"%')";	
      } else if (obj['condition']=="question") {
        query +="(t.question like '%"+util.escapeSql(obj['answer']).replace(/ /g,'%') + "%')";
      } else if (obj['condition']=="answer") {
        query += "(t.answer like '%"+util.escapeSql(obj['answer']).replace(/ /g,'%')+"%')";
      }
    } else {
      if (obj['answer']!==undefined){
        query += "(t.answer like '%" + util.escapeSql(obj['answer']).replace(/ /g,'%')+"%')";
      } else {
        query += "(t.answer like '%%')";
      }
      if (obj['question'] !== undefined){
        query += " and (t.question like '%" + util.escapeSql(obj['question']).replace(/ /g,'%') + "%')";
      }
    }
    if (obj['tournament']!==undefined){
      query = util.addQueryTerm(query,'t.tournament',obj['tournament'],'=',true);
    }
    if (obj['round']!==undefined){
      query = util.addQueryTerm(query,'t.round',obj['round'],'=',true);
    }
    if (obj['year']!==undefined){
      query = util.addQueryTerm(query,'t.year',obj['year'],'=',false);
    }
    if (obj['category']!==undefined){
      query = util.addQueryTerm(query,'t.category',obj['category'],'=',true);
    }
    if (obj['questionNum']!==undefined){
      query = util.addQueryTerm(query,'t.question_num',obj['questionNum'],'=',false);
    }
    if (obj['difficulty']!==undefined){
      query = util.addQueryTerm(query,'t.difficulty',obj['difficulty'],'=',true);
    }
    limitstring = "";
    console.log(obj['random']);
    if (obj['random']=='true'){
      countstring = 'select count(id) from tossups t where '+query;
      client.query(countstring, function(err, results, fields){
          if (!err){
          c = results[0]['count(id)'];
          var offset = Math.floor(Math.random()*c);
          var limit = '1';
          if (obj['limit']){
          limit = obj['limit'];
          }
          querystring = 'select t.tournament,t.year,t.question, t.answer, t.round, t.question_num, t.difficulty, t.pKey,t.category, t.accept from tossups t where '+query+' limit '+limit+' offset '+offset;
          client.query(querystring,function selectCb(err,results,fields){
            if (!err) {
            callback({'count':limit,'offset':offset,'results':results});
            } else{ 
            console.log(err);
            callback({offset:0,results:[]});
            }
            });
          } else {
          console.log(err);
          }
          });
    } else {	
      query += " group by t.pKey";
      if (obj['sort'] == undefined || obj['sort'] == 'date') {
        query += " order by year desc, tournament asc, round asc,question_num asc";
      } else if (obj['sort'] == 'rating') {
        query += " order by sum(r.rating) desc";
      }
      if (obj['offset']!==undefined) {
        limitstring += " limit "+pageLength+" offset "+obj['offset'];
      } else {
        limitstring += " limit "+pageLength;
      }
      querystring = 'select t.tournament,t.year,t.question, t.answer, t.round, t.question_num, t.difficulty, t.pKey,t.category, t.accept from tossups t where '+query+limitstring;
      countstring = 'select count(*) from tossups t where '+query;
      client.query(countstring,function(err,results,fields){
          if (!err) {
          count = results.length;
          client.query(querystring,function selectCb(err,results,fields){
            if (!err) {
            if (!obj['offset'])
            obj['offset']=0; 
            callback({'count':count,'offset':obj['offset'],'results':results});
            } else{ 
            console.log(err);
            callback({offset:0,results:[]});
            }
            });
          } else {
          console.log(err);
          callback({offset:0,results:[]});
          }
          });
    }
  }
  this.data = function(callback) {
    client.query('select count(*) from tossups', function selectCb(err,results,fields){
        var num_tossups = results[0]['count(*)'];
        client.query('select count(*) from usernames', function selectCb(err, results, fields){
          var num_users = results[0]['count(*)'];
          client.query('select count(*) from scores', function selectCb(err, results, fields){
            var num_scores = results[0]['count(*)'];
            client.query('select distinct year,tournament from tossups order by year desc, tournament asc', function selectCb(err, results, fields){
              var tournaments = results;
              client.query('select distinct year from tossups', function selectCb(err, results, fields){
                var years = results;
                client.query('select distinct difficulty from tossups', function selectCb(err,results,fields){
                  var difficulties = results;
                  client.query('select distinct category from tossups', function selectCb(err, results, fields){
                    var categories = results
                    data = {}; 
                    data['data'] = {};
                    data['data']['numScores'] = num_scores;
                    data['data']['numQuestions'] = num_tossups;
                    data['data']['numUsers'] = num_users;
                    data['data']['difficulties'] = util.convertMapToList(difficulties,'difficulty');
                    data['data']['years'] = util.convertMapToList(years,'year');
                    data['data']['categories'] = util.convertMapToList(categories,'category');
                    data['data']['tournaments'] = util.convertDoubleMapToList(tournaments,'year','tournament');
                    callback(data);
                    });
                  });
                });
            });
          });
        });
    });
  }
  this.reader.answer = function(user, obj, callback) {
    client.query("insert into single (user,score,correct,answer,pKey) values (?,?,?,?,?)",[user.fbId,obj.score,obj.correct,obj.answer,obj.pKey], function(err, info){
        if (err){
        console.log(err);
        } else {
        tossup.get(obj.pKey, function(question) {
          callback({user:user,action:{'correct':obj.correct,'score':obj.score, 'answer':question.answer}});
          });
        }
        });

  }
  this.user.get = function(id,callback) {
    client.query('select * from user where fb_id="'+id+'"', function(err,result,field){
        if (err){
        console.log(err);
        } else {
        callback(result);
        }
        });
  };
  this.user.login = function(user, callback){
    client.query("select * from user where username = '"+user.username+"' and fb_id = '"+user.fbId+"'", function(err, result, field){
        if (err) {
        console.log(err); 
        } else {
        console.log(result);
        if (result.length==1){
        callback(true);
        } else if (result.length == 0){
        callback(false);
        } else {
        console.log("AAAAH EXPLODEY FATAL ERROR");
        }
        }
        });
  }
  this.user.create = function(user, callback){
    client.query("insert into user(username, email, fb_id) values('"+user.username+"','"+user.email+"','"+user.fbId+"')", function(err, result, info){
        if (!err){
        callback({status:"success",message:null,code:1337});
        }
        else {
        callback({status:"failure",message:err,code:100});
        }
        });
  }
  this.user.stats = function(user, callback){

  }
  this.rating.add = function(obj,callback){
    client.query("select * from ratings where user='"+obj.username+"' and question = '"+util.escapeSql(obj.question)+"'",function selectCb(err,result,fields){
        if (result.length!=0){
        client.query("update ratings set rating = "+obj.value+" where user='"+obj.username+"' and question = '"+util.escapeSql(obj.question)+"'",function selectCb(err,result,fields){
          if (!err){
          callback(true);
          } else {
          console.log(err);
          }
          });

        } else {
        client.query("insert into ratings(rating,user,question) values ("+value+",'"+username+"','"+question.replace(/'/g,"''")+"')", function selectCb(err,result,fields){
          if (!err){
          callback(true);
          } else {
          console.log(err);
          }
          });
        }
        });
  }
}
var util = {
escapeSql:function(str) {
            return str.replace(/'/g,"''").replace(/\\/g,'\\\\');
          },
addQueryTerm:function(str,param,value,comp,quotes){
               values = value.split("|");
               str += " and (";
               delimiter = "";
               for (i=0;i<values.length;i++){
                 str += delimiter;
                 if (param == "t.tournament"){
                   str+="((t.year = "+values[i].substring(0, 4).trim()+") and ";
                   str+="(t.tournament like '%"+values[i].substring(5).trim().replace(/ /g,'%')+"%'))";
                 } else {
                   if (!quotes){
                     separator = "";
                   } else {
                     separator = "'";
                   }
                   str+="("+param+" "+comp+" "+separator+values[i]+separator+")";
                 }
                 delimiter = " or ";
               }
               str+=")";
               return str;
             },
convertMapToList:function(obj,term){
                   var arr = [];
                   for (i=0;i<obj.length;i++){
                     arr[i] = obj[i][term];
                   }
                   return arr;
                 },
convertDoubleMapToList:function(obj,t1,t2){
                         var arr = [];
                         for (i=0;i<obj.length;i++){
                           arr[i] = obj[i][t1]+" "+obj[i][t2];
                         }
                         return arr;
                       }
}
exports.Dao = Dao;
