var Client = require('mysql').Client;
var client = new Client();
var Dao = function(host, user, password, database){
  client.host = host;
  client.user = user;
  client.password = password;
  client.database = database;
  this.get = function(pKey, callback){
    client.query("select * from tossups where pKey='"+pKey+"'", function(err, result, field){
        if (!err) {
        callback(result[0]);
        } else {
        console.log(err);
        }
        });
    this.search = function(obj, callback) {
      var query = "";
      if (obj['condition']!==undefined && obj['answer']!==undefined){
        if (obj['condition']=="all"){
          query += "(t.answer like '%" + obj['answer'].replace(/ /g,'%') +"%' or t.question like '%" + obj['answer'].replace(/ /g,'%')+"%')";	
        }
      } else {
        if (obj['answer']!==undefined){
          query += "(t.answer like '%" + obj['answer'].replace(/ /g,'%')+"%')";
        } else {
          query += "(t.answer like '%%')";
        }
        if (obj['question'] !== undefined){
          query += " and (t.question like '%" + obj['question'].replace(/ /g,'%') + "%')";
        }
      }
      if (obj['tournament']!==undefined){
        query = util.addQueryTerm(query,'t.tournament',obj['tournament'],'like');
      }
      if (obj['round']!==undefined){
        query = util.addQueryTerm(query,'t.round',obj['round'],'like');
      }
      if (obj['year']!==undefined){
        query = util.addQueryTerm(query,'t.year',obj['year'],'=');
      }
      if (obj['category']!==undefined){
        query = util.addQueryTerm(query,'t.category',obj['category'],'like');
      }
      if (obj['questionNum']!==undefined){
        query = util.addQueryTerm(query,'t.question_num',obj['questionNum'],'like');
      }
      if (obj['difficulty']!==undefined){
        query = util.addQueryTerm(query,'t.difficulty',obj['difficulty'],'like');
      }
      query += " group by t.pKey";
      if (obj['random']!==undefined){
        if (obj['random']=='true'){
          if (obj['limit']!==undefined){
            query += " order by rand() limit "+obj['limit'];
          } else {
            query += " order by rand() limit 1";
          }
        }
      } else {	
        if (obj['limit']!==undefined){
          query += " limit "+obj['limit'];
        } else {
          query += " order by year desc, tournament asc, round asc,question_num asc";
        }
      }
      if (obj['username']!==undefined){
        querystring = 'select t.tournament,t.year,t.question, t.answer, t.round, t.question_num, t.difficulty, t.pKey,t.category, t.accept, sum(r.rating) rating,(select rating from ratings where user="'+obj['username']+'" and question=t.pKey) user_rating from tossups t left outer join ratings r on t.pKey = r.question where '+query;
      } else {
        querystring = 'select t.tournament,t.year,t.question, t.answer, t.round, t.question_num, t.difficulty, t.pKey,t.category, t.accept, sum(r.rating) rating from tossups t left outer join ratings r on t.pKey = r.question where '+query;
      }
      client.query(querystring,function selectCb(err,results,fields){
          if (!err) {
          callback(results);
          } else{ 
          callback(err);
          }
          });
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
    this.answerReader = function(username, pKey, correct, score, callback) {
      client.query("insert into scores (username,score,correct,answer,question) values ('"+username+"','"+score+"',"+correct+",'"+util.escapeSql(answer)+"','"+util.escapeSql(pKey)+"')", function(err, info){
          if (err){
          console.log(err);
          } else {
          this.get(pKey, function(question) {
            callback({name:username,action:{'correct':correct,'score':score, 'answer':question.answer}});
            });
          }
          });

    }
  }
  var util = {
escapeSql:function(str) {
            return str.replace(/'/g,"''").replace(/\\/g,'\\\\');
          },
addQueryTerm:function(str,param,value,comp){
               values = value.split("|");
               str += " and (";
               delimiter = "";
               for (i=0;i<values.length;i++){
                 str += delimiter;
                 if (param == "t.tournament"){
                   str+="((t.year = "+values[i].substring(0, 4).trim()+") and ";
                   str+="(t.tournament like '%"+values[i].substring(5).trim().replace(/ /g,'%')+"%'))";
                 } else {
                   if (comp=="="){
                     separator = "";
                   } else {
                     separator = "'";
                   }
                   str+="("+param+" "+comp+" "+separator+values[i].replace(/ /g,"%")+separator+")";
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
