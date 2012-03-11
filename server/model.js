var http = require('http');
var xml = require('node-xml');
var natural= require('natural');
natural.PorterStemmer.attach();
var Model = {
User:function(name) {
       this.name = name;
     },
Ticker:function(name, text){
         this.name = name;
         this.text = text;
       },
Room:function(name,password,handler) {
       this.users = [];
       this.password=password;
       this.name = name;
       this.join = function(user,password, callback) {
         if (this.users.indexOf(user)==-1) {
           if (password==this.password){
            this.users.push(user);
            user.room = this;
            callback({joined:true,'user':user.name,message:"joined ["+this.name+"] successfully"});
           } else {
             callback({joined:false,'user':user.name,message:"incorrect password"});
           }
         } else {
           callback({joined:true,'user':user,message:"already part of ["+this.name+"]"});
         }
       }
       this.leave = function(user, callback) {
         if (this.users.indexOf(user)!=-1){
           this.users.pop(user);
           user.room = null;
           callback({'user':user,message:"left ["+this.name+"] successfully"});
         } else {
           callback({'user':user,message:"is not part of the room"});
         }
       }
       this.handler = handler;
     },
Game:function(room) {
       this.start = function(questions) {
       }
     },
Util:{
tidy:function(str){
	var r = str.toLowerCase();
	r = r.replace(new RegExp(/\r\t\n/g),"");
        r = r.replace(new RegExp(/[àáâãäå]/g),"a");
        r = r.replace(new RegExp(/æ/g),"ae");
        r = r.replace(new RegExp(/ç/g),"c");
        r = r.replace(new RegExp(/[èéêë]/g),"e");
        r = r.replace(new RegExp(/[ìíîï]/g),"i");
        r = r.replace(new RegExp(/ñ/g),"n");                
        r = r.replace(new RegExp(/[òóôõö]/g),"o");
        r = r.replace(new RegExp(/œ/g),"oe");
        r = r.replace(new RegExp(/[ùúûü]/g),"u");
        r = r.replace(new RegExp(/[ýÿ]/g),"y");
        return r.trim();
},
checkAnswer:function(answer,canon,callback){
              console.log(answer,canon);
              answer = this.tidy(answer);
              canon = this.tidy(canon);
              this.spellcheck(answer,function(ans){
                  actual = answer.split(" ");
                  checked = ans.trim().split(" ");
                  correct = true;
                  splitc = canon.split(" ");
                  splittoken = canon.tokenizeAndStem();
                  for (var word in actual){
                  correct = correct && (splitc.indexOf(actual[word])!=-1);
                  }
                  correct = correct && (actual.length>0);
                  if (!correct){
                  correct = true;
                  actual = answer.tokenizeAndStem();
                  for (var word in actual){
                  correct = correct && (splittoken.indexOf(actual[word])!=-1);
                  }
                  correct = correct && (actual.length>0);
                  }
                  if (!correct) {
                  correct = true;
                  for (var word in checked){
                    correct = correct && (splitc.indexOf(checked[word])!=-1);
                  }
                  correct = (correct && checked.length>0);
                  }
                  if (!correct) {
                    correct = true;
                    checked = ans.tokenizeAndStem();
                    for (var word in checked){
                      correct = correct && (splittoken.indexOf(actual[word])!=-1);
                    }
                    correct = (correct && checked.length>0);
                  }
                  callback(correct);
              });
            },
spellcheck:function(text,callback){
             var post_domain = 'www.google.com';
             var post_port = 80;
             var post_path = "/tbproxy/spell?lang=en&amp;hl=en";
             var data = '<?xml version="1.0" encoding="utf-8" ?>';
             data +='<spellrequest textalreadyclipped="0" ignoredups="0" ignoredigits="0" ignoreallcaps="0"><text>';
             data += text;
             data += '</text></spellrequest>';
             var element;
             var length;
             var post_options = {
host: post_domain,
      port: post_port,
      path: post_path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
             };
             var post_req;
             var element;
             post_req = http.request(post_options, function(re) {
                 var subs = [];
                 var sub = {};
                 var end;
                 re.setEncoding('utf8');
                 re.on('data', function (chunk) {
                   var parser = new xml.SaxParser(function(cb) {
                     cb.onStartDocument(function() {

                       });
                     cb.onEndDocument(function() {

                       });
                     cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
                       if (elem == "c"){
                       element = "c";
                       sub = {};
                       sub.offset = attrs[0][1];
                       sub.len = attrs[1][1];
                       }
                       });
                     cb.onEndElementNS(function(elem, prefix, uri) {
                       if (elem == "spellresult"){
                       for (i=subs.length-1;i>=0;i--){
                       //looping through backwards to avoid offset errors
                       end = text.substring(parseInt(subs[i].offset)+parseInt(subs[i].len));
                       text = text.substring(0,subs[i].offset);
                       text = text+subs[i].value+end;
                       }
                       callback(text.toLowerCase().trim());
                       }
                       parser.pause();// pause the parser
                       setTimeout(function (){parser.resume();}, 200); //resume the parser
                       });
                     cb.onCharacters(function(chars) {
                         if (element == "c"){
                         sub.value = chars.split("\t")[0];
                         subs.push(sub);
                         }
                         });
                     cb.onCdata(function(cdata) {
                         });
                     cb.onComment(function(msg) {
                         });
                     cb.onWarning(function(msg) {
                         });
                     cb.onError(function(msg) {
                         });
                   });
                   parser.parseString(chunk);
                 });
             });
             post_req.write(data);
             post_req.end();

           }
     }
}
module.exports = Model;
