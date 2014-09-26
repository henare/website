
// -- require vendor/bootstrap.min


















// -- require randoms


// -- require takeover




var legislators = {}; // Too lazy to pass this variable around to modals ATM - TODO

(function($, io, opts) {

var
  LEGISLATORS_LOCATOR_URL = STS.options.LEGISLATORS_LOCATOR_URL,

  TWEETS_READ_URL     = STS.options.TWEETS_READ_URL,
  STATS_READ_URL      = STS.options.STATS_READ_URL,
  SHARES_READ_URL     = STS.options.SHARES_READ_URL,

  SEND_EMAIL_URL      = STS.options.SEND_EMAIL_URL,
  LOG_URL_BASE      = STS.options.LOG_URL_BASE,

  MAP_START_SHADING = 100;   // this many actions to occur before we begin weighted shading of the campaign stats map

// Start up scripts
$(function() {

  // ----------------- POP OVERS ----------------------------

  $('.metric').tooltipster();

  // ----------------- MODALS ----------------------------

  $('body').on('click', '.contact .call-action', function (e) {
/* :TODO: need more data first
    var legislatorId = $(e.currentTarget).parents('.legislator').attr('data-legislator-id');
    var legislator = legislators[legislatorId];
    var callModalTemplate = $('#call-modal-template').html();
    //$('#call-modal-container').html(_.template(callModalTemplate, legislator));
    //$('#call-modal-container .modal').modal();
    var takeoverContent = _.template(callModalTemplate, legislator);
    takeover(takeoverContent);
*/

    var legislatorId = $(e.currentTarget).parents('[data-legislator-id]').attr('data-legislator-id');

    io.api('log', {url: LOG_URL_BASE, method: 'POST'}, {
      'event' : 'calls',
      legislators: legislatorId,
      repeat : Cookie.has('called-' + legislatorId)
    }, function(d) {});
    Cookie.set('called-' + legislatorId, 1);
  });

  $('body').on('click', '.contact .email-action', function (e) {
/* :TODO: need confirmation of legality first
    var legislatorId = $(e.currentTarget).parents('.legislator').attr('data-legislator-id');
    var legislator = legislators[legislatorId];
    var emailModalTemplate = $('#email-modal-template').html();
    //$('#email-modal-container').html(_.template(emailModalTemplate, legislator));
    //$('#email-modal-container .modal').modal();

    var takeoverContent = _.template(emailModalTemplate, legislator);
    takeover(takeoverContent);
*/

    var legislatorId = $(e.currentTarget).parents('[data-legislator-id]').attr('data-legislator-id');

    io.api('log', {url: LOG_URL_BASE, method: 'POST'}, {
      'event' : 'emails',
      legislators: legislatorId,
      repeat : Cookie.has('emailed-' + legislatorId)
    }, function(d) {});
    Cookie.set('emailed-' + legislatorId, 1);
  });

  $('body').on('click', '.contact .tweets-action', function (e) {
    var legislatorId = $(e.currentTarget).parents('[data-legislator-id]').attr('data-legislator-id');

    io.api('log', {url: LOG_URL_BASE, method: 'POST'}, {
      'event' : 'tweets',
      legislators: legislatorId,
      repeat : Cookie.has('tweeted-' + legislatorId)
    }, function(d) {});
    Cookie.set('tweeted-' + legislatorId, 1);
  });

  $('body').on('click', '.contact .facebooks-action', function (e) {
    var legislatorId = $(e.currentTarget).parents('[data-legislator-id]').attr('data-legislator-id');

    io.api('log', {url: LOG_URL_BASE, method: 'POST'}, {
      'event' : 'facebooks',
      legislators: legislatorId,
      repeat : Cookie.has('facebooked-' + legislatorId)
    }, function(d) {});
    Cookie.set('facebooked-' + legislatorId, 1);
  });

  // ----------------- SMOOTH SCROLL ----------------------------

  $('body').on('click', 'a[href^="#"]', function(e) {
    var link = $(this).attr('href');
    STS.anim.scrollToEl($(link), 0.3, function() {
      window.location.hash = link;
    });
    e.preventDefault();
  });

  // ---------- bring in metrics -----------

  var loadedGlobals, loadedStats, socialStats;

  ScrollHandler.addTrigger('#load-stats', bringInStats);
  TweenLite.set(".stats .metric", { transform: "scaleX(0)", opacity: 0 });

  function bringInStats()
  {
    if (!statsLoaded()) {
      setTimeout(bringInStats, 100);
    } else {
      animateStats();
    }

    ScrollHandler.removeTrigger(bringInStats);
  }

  function animateStats()
  {
    TweenMax.staggerFromTo(".stats .metric", 0.2, { transform: "scaleX(0)", opacity: 0 }, { transform: "scaleX(1)", opacity: 1 }, 0.2);

    $('.email-total').numberSpinner('set', loadedGlobals.emails || 0);
    $('.call-total').numberSpinner('set', loadedGlobals.calls || 0);
    $('.view-total').numberSpinner('set', loadedGlobals.views || 0);
    $('.facebook-total').numberSpinner('set', socialStats.facebook || 0);
    $('.google-total').numberSpinner('set', socialStats.googleplus || 0);
    $('.twitter-total').numberSpinner('set', socialStats.twitter || 0);

    // shade the stats map if we have enough stats for it to say something
    var grandtotal = STS.getTotal(loadedGlobals);
    if (grandtotal > MAP_START_SHADING) {
      STS.CampaignMap.shadeWardStats(grandtotal, loadedStats);
    }
  }

  function statsLoaded()
  {
    return loadedGlobals !== undefined && loadedStats !== undefined && socialStats !== undefined;
  }

  function onStatsLoaded(data)
  {
    var globals, i, l, rep;

    for (i = 0, l = data.length; i < l && (rep = data[i]); ++i) {
      if (rep._id === 'overall_totals') {
        globals = rep;
        break;
      }
    }

    // update numbers if we've already shown the stats
    if (statsLoaded()) {
      $('.email-total').numberSpinner('set', globals.emails || 0);
      $('.call-total').numberSpinner('set', globals.calls || 0);
      $('.view-total').numberSpinner('set', globals.views || 0);

      // shade the stats map if we have enough stats for it to say something
      var grandtotal = STS.getTotal(globals);
      if (grandtotal > MAP_START_SHADING) {
        STS.CampaignMap.shadeWardStats(grandtotal, data);
      }
    }

    loadedStats = data;
    loadedGlobals = globals;
  }

  function onSharesLoaded(stats)
  {
    // assign social stats for stats section (deferred until animated in)
    socialStats = stats;

    // apply to share panels
    var shares = $('.share');
    $('.facebook-total', shares).numberSpinner('set', socialStats.facebook || 0);
    $('.google-total', shares).numberSpinner('set', socialStats.googleplus || 0);
    $('.twitter-total', shares).numberSpinner('set', socialStats.twitter || 0);
  }

  // ------------------------------ LOAD DATA ----------------------------------

  // GET AGGREGATE TOTALS

  io.api('stats', STATS_READ_URL, null, onStatsLoaded);

  // GET SOCIAL TOTALS

  io.api('shares', SHARES_READ_URL, null, onSharesLoaded);

  // init live counter widgets

  $('.email-total, .call-total, .view-total, .facebook-total, .google-total, .twitter-total').addClass('number-spinner').numberSpinner({
      min_digits: 6
    });
  $('.tweets-support-total').addClass('number-spinner').numberSpinner();

  // LOG INITIAL VIEW

  io.api('log', {url: LOG_URL_BASE, method: 'POST'}, {'event' : 'views'}, function(d) {});

  // -------------------------------- EXPORTS ----------------------------------

  STS.events.onStatsLoad = onStatsLoaded;
  STS.events.onSharesLoad = onSharesLoaded;

  STS.getTotal = function(stats)
  {
    return (stats.emails || 0) + (stats.calls || 0) + (stats.views || 0) + (stats.tweets || 0) + (stats.facebooks || 0);
  };

});

// window resize

$(window).on('resize', debounce(function(e) {
  var $this, val, opts;

  // redraw spinners
  $('.number-spinner').each(function() {
    $this = $(this);
    val = $this.numberSpinner('get');
    opts = $this.numberSpinner('options');
    $this.numberSpinner('destroy');
    $this.numberSpinner(opts).numberSpinner('set', val);
  });
}));

})(jQuery, STS.app, STS.options);
