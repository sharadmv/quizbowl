function TeamObj(name, maxPlayers) {
  // properties
  this.name;
  this.userArcs; 
  this.maxPlayers;

  // methods
  this.addArc;
  this.addUser;
  this.removeUser;
  this._getArcByUserId;
  this._getNextSeat;
}


function UserArc(obj) {
  // properties
  this.rShape;
  this.rText;
  this.rSeparator;
  this.team;
  this.teamUserIndex;
  this.hasUser;
  this.attributes : {
    name  : {
      shape : {/* attributes */},
      text : {/* attributes */}
    }
  };
  this.currAttr;
  this.userId;

  // methods
  this.setAttr;
  this.addUser;
  this.removeUser;
  this.buzz;
  this.answered;
}
    // separator attributes
    rSeparator.attr({
      stroke : '#C3B5E8',
      'stroke-width' : 1,
      'stroke-opacity':0.3
    }).toFront();

    // style the player arc
    rShape.attr({
      fill: '#000', 
      'stroke-width':0
    });

