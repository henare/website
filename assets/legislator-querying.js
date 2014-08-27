window.LegislatorQuery || (window.LegislatorQuery = {});

(function($, io) {

$(function() {

  // ----------------- GEO-BASED ----------------------

  // jiggle the location box somewhat to draw attention back
  function showLocationInfoTip()
  {
    var icon = $('.postcode-steps .actions .fa')[0],
      tl = new TimelineLite();

    tl.fromTo(icon, 0.5, {
      top: -100,
      opacity: 0
    }, {
      top: 0,
      opacity: 1,
      ease: Bounce.easeOut,
      onComplete : function() {
        var iconClone = $(icon).clone(),
          iconOffset = $(icon).position();

        iconClone.css($.extend(iconOffset, {position: 'absolute'})).insertBefore(icon);
        TweenLite.fromTo(iconClone, 0.4, {opacity: 0.5}, {opacity: 0, transform: "scale(2.5)"});
      }
    });
  }

  function askLocation()
  {
    if (!("geolocation" in navigator)) {
      return;
    }

    showLocationInfoTip();

    navigator.geolocation.getCurrentPosition(function(position) {
      hideLegislatorSearch();
      $.ajax({
        url: 'http://legislators-locator.herokuapp.com/',
        jsonp: "callback",
        dataType: "jsonp",
        data: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        // work with the response
        success: renderLegislators
      });
    }, function() {
      // :TODO:
      console.error("Geo fail");
    });

    ScrollHandler.removeTrigger(askLocation);
  }

  window.ScrollHandler.addTrigger('#request-location', askLocation);

  // ----------------- POSTCODE LOOKUP ----------------------

  $('.postcode-lookup').on('submit', function(ev){
    hideLegislatorSearch();
    var postcode = $('input', $(ev.currentTarget)).val();
    $.ajax({
      url: 'http://legislators-locator.herokuapp.com/',
      jsonp: "callback",
      dataType: "jsonp",
      data: {
          postcode: postcode
      },
      // work with the response
      success: function( response ) {
          renderLegislators(response);
          console.log( response ); // server response
      }
    });
    return false;
  });
});

// -------------------- RENDERING ----------------------

var legislatorTemplate = $('#legislator-template').html();

function renderLegislators(reps) {
  var container = $('.legislators');

  legislators = reps;

  _.each(legislators, function (legislator) {
  	legislator.image || (legislator.image = '');	// avoid template errors with missing data :TODO: fallback image
    container.append(_.template(legislatorTemplate, legislator));
  });

  TweenLite.fromTo(container[0], 0.8, {height: 0}, {height: measureH(container), onComplete: function(e) {
  	container.css('height', 'auto');
  }});
  TweenMax.staggerFromTo(".legislators .legislator", 0.3, { transform: "scaleY(0)", opacity: 0 }, { transform: "scaleY(1)", opacity: 1 }, 0.2);

  $('.contact li').popover({
    trigger: 'hover',
    container: 'body',
    placement: 'top'
  });

  container.find('.number-spinner').numberSpinner();

  var legislatorIds = _.map(reps, function(r) { return r.member_id; });

  // request legislator counts
  io.emit('stats', {legislators: legislatorIds})

  // log event to the server
  io.emit('log', {
    'event' : 'views',
    'legislators' : legislatorIds.join(',')
  });
};

function setLegislatorCounts(stats)
{
  var wrapper;

  _.each(stats, function(member) {
    wrapper = $('.legislator[data-legislator-id="' + member._id + '"]');

    wrapper.find('.legislator-views').numberSpinner('set', member.views || 0);
    wrapper.find('.legislator-calls').numberSpinner('set', member.calls || 0);
    wrapper.find('.legislator-emails').numberSpinner('set', member.emails || 0);
    wrapper.find('.legislator-tweets').numberSpinner('set', member.tweets || 0);
    wrapper.find('.legislator-facebooks').numberSpinner('set', member.facebooks || 0);
  });
}

function hideLegislatorSearch()
{
  var div = $('.postcode-steps');
  div.css('height', div.height());
  TweenLite.to(div[0], 0.4, {opacity: 0, height: 0, onComplete: function() {
    div.remove();
  }});
}

// EXPORTS
STS.events.onLegislatorStats = setLegislatorCounts;

})(jQuery, STS.app);