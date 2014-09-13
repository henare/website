(function($, STS, io) {

  // GET TWEETS

  ScrollHandler.addTrigger('#load-tweets', bringInTweets);

  function bringInTweets()
  {
    io.api('tweets', STS.options.TWEETS_READ_URL, null, function(tweets) {
      STS.events.onTweetsLoad(tweets);
    });
    ScrollHandler.removeTrigger(bringInTweets);
  }

  var tweetTemplate = $('#tweet-template').html();

  function onTweetsLoaded(tweetdata)
  {
    console.log('tweets:', tweetdata);
    _.each(tweetdata.latest, function(tweets, type) {
      if(type === 'celebrities') {
        tweets = _.uniq(tweets, 'handle');

        _.each(tweets, function(tweet) {
          $('#tweet-board').append(_.template(tweetTemplate, tweet));
        });
      };
    });

    $('.tweets-support-total').numberSpinner('set', tweetdata.total);

    $('#tweet-board img').tooltipster();

    recenterTweetGrid();
  }

  //----------------------------------------------------------------------------
  //  layout

  function recenterTweetGrid() // find max tweet dimension (tweets are floated left)
  {
    var maxR = 0, tweets = $('#tweet-board .tweet');
    if (!tweets.length) {
      return;
    }

    tweets.each(function() {
      var r = $(this).outerWidth() + $(this).position().left;

      if (r > maxR) {
        maxR = r;
      } else {
        return false;
      }
    });

    $('#tweet-board').css('width', maxR);
  }

  $(window).on('resize', function(e) {
    $('#tweet-board').css('width', '');
  });
  $(window).on('resize', debounce(recenterTweetGrid));

  //----------------------------------------------------------------------------
  //  exports

  STS.events.onTweetsLoad = onTweetsLoaded;

})(jQuery, STS, STS.app);
