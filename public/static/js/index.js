var baseURL = "http://ec2-50-19-22-175.compute-1.amazonaws.com:1337/api";
var dao;


var searchInMiddle = true;

$(document).ready( function() {
  bridge = new Bridge({host: '50.19.22.175', port: 8091, apiKey: "abcdefgh"});
  bridge.ready(function(){
    console.log("bridge ready");
    bridge.getService('dao',function(obj){
      console.log("In sevice");
      dao = obj;
    });
  });
  
  $("#home-search-button").click( function() {
    jQuery.getJSON(baseURL + "/tossup.search?callback=?", {answer: 'dickens'}, function(response) {
      console.log(response);     
      if( searchInMiddle) {
        homeMoveSearchToTop();
      }
    });
  });



});

var homeMoveSearchToTop = function() {
  $("#home-title").css('margin', '26px 40px')
    .css('font-size', '34px')
    .css('float', 'left');
  $("#home-form").css('float', 'left')
    .css('margin', '17px 0')
    $("#home-search-field").css('float', 'left')
    .css('padding-top', '4px')
    .css('margin', '0 20px');
  $("#home-search-button").css('float', 'left')
    .css('margin', '3px 10px');
  searchInMiddle = false;
}
