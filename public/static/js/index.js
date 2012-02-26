var baseURL = "http://ec2-50-19-22-175.compute-1.amazonaws.com:80/api";


var searchInMiddle = true;

$(document).ready( function() {
  /*
  bridge = new Bridge({host: '50.19.22.175', port: 8091, apiKey: "abcdefgh"});
  bridge.ready(function(){
    console.log("bridge ready");
    bridge.getService('dao',function(obj){
      console.log("In sevice");
      dao = obj;
    });
  });*/

  $("#home-search-input").keypress( function(event) {
    if (event.which == 13) {
      homeSearch();
    }
  });
  
  $("#home-search-button").click( homeSearch);

});

var homeSearch = function() {
  $("#home-search-loading").css("visibility", "visible");
  jQuery.getJSON(baseURL + "/tossup.search?callback=?", {answer: $("#home-search-input").val()}, function(response) {
    $("#home-search-loading").css("visibility", "hidden");
    console.log(response);     
    if( searchInMiddle) {
      homeMoveSearchToTop();
      $("#home-result-refine").css("visibility", "visible");
    }
    homeLoadResults(response);
  });

}


var homeMoveSearchToTop = function() {
  $("#home-title").css('margin', '26px 40px')
    .css('font-size', '34px')
    .css('float', 'left');
  $("#home-form").css('float', 'left')
    .css('margin', '17px 0')
    $("#home-search-field").css('float', 'left')
    .css('padding-top', '4px')
    .css('margin', '0 10px');
  $("#home-search-button").css('float', 'left')
    .css('margin', '3px 0');
  searchInMiddle = false;
};

var homeLoadResults = function(results) {
  var resultContainer = $("#home-results");
  resultContainer.html("");
  var resultDiv, curResult, info, source;
  for(var i = 0; i < results.length; i++) {
    var curResult = results[i];
    resultContainer.append('<div id="home-result' + i + '" class="home-result"></div>');
    resultDiv = $("#home-result" + i);
    resultDiv.append('<div class="home-result-info"></div>');
    info = $("#home-result" + i + " .home-result-info");
    info.append('<div class="home-result-category">'+curResult.category + '</div>');
    info.append('<div class="home-result-difficulty">'+curResult.difficulty+'</div>');
    info.append('<div class="home-result-rating">'+curResult.rating+'</div>');
    resultDiv.append('<div class="home-result-question">'+curResult.question+'</div>');
    resultDiv.append('<div class="home-result-answer">'+curResult.answer+'</div>');
    resultDiv.append('<div class="home-result-source"></div>');
    source = $('#home-result'+i+" .home-result-source");
    source.append('<div class="home-result-question-num">'+curResult.question_num+"</div>");
    source.append('<div class="home-result-round">'+curResult.round+"</div>");
    source.append('<div class="home-result-tournament">'+curResult.tournament+"</div>");
    source.append('<div class="home-result-year">'+curResult.year+"</div>");
  }
};
