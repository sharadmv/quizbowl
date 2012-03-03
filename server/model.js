var Model = {
  User:function(name, password) {
    this.name = name;
    this.password = password;
  },
  Ticker:function(name, text){
    this.name = name;
    this.text = text;
  },
  Room:function(name) {
    this.users = [];
    this.name = name;
    this.join = function(user, callback) {
      if (users.indexOf(user)!=-1) {
        users.push(user);
        callback({'user':user,message:"joined ["+this.name+"] successfully"});
      } else {
        callback({'user':user,message:"already part of ["+this.name+"]"});
      }
  },
  Game:function(room) {
  }
}
exports = Model;
