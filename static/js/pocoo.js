$(function() {
  var MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(/ /);
  var MENTION_QUERIES = [
    [['pocoo'], [], []],
    [['PocooTeam'], [], []],
    [['pygments'], [], []],
    [['sphinx'], ['documentation', 'docs', 'python', 'pocoo']],
    [['jinja'], ['pocoo', 'werkzeug', 'flask', 'mitsuhiko', 'python', 'django']],
    [['werkzeug'], ['pocoo', 'jinja', 'flask', 'mitsuhiko', 'python', 'django']],
    [['flask'], ['code', 'dev', 'python', 'py', 'micro', 'mitsuhiko',
                'framework', 'django', 'jinja', 'werkzeug', 'documentation',
                'app'], ['vodka', 'sale', 'oz', 'ml']],
  ];

  function getOrdinal(num) {
    if (num % 100 >= 10 && num % 100 <= 20)
      return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function formatTime(d) {
    if (typeof d === 'string')
      d = new Date(d);
    var diff = ((new Date).getTime() - d.getTime()) / 1000;
    if (diff < 60)
      return 'just now';
    if (diff < 3600) {
      var n = Math.floor(diff / 60);
      return n + ' minute' + (n == 1 ? '' : 's') + ' ago';
    }
    if (diff < 43200) {
      var n = Math.floor(diff / 3600);
      return n + ' hour' + (n == 1 ? '' : 's') + ' ago';
    }
    return MONTHS[d.getMonth()] + ' ' + d.getDate() +
           getOrdinal(d.getDate()) + ' ' + d.getFullYear();
  }

  function appendTweet(container, tweet) {
    var user = tweet.from_user || tweet.user.screen_name;
    $('<div class=tweet></div>')
      .append($('<a class=username></a>')
        .text(user)
        .attr('href', 'http://twitter.com/' + user))
      .append($('<span class=text></span>')
        .html(' ' + tweet.text + ' — '))
      .append($('<a class=time></span>')
        .attr('href', 'http://twitter.com/' + user + '/status/' + tweet.id)
        .text(formatTime(tweet.created_at)))
      .appendTo(container);
  }

  function displayLatestTweets(container) {
    container.html('<p>Tweets are loading ...');
    $.getJSON('http://api.twitter.com/1/statuses/user_timeline.json' +
              '?screen_name=PocooProject&callback=?', function(tweets) {
      container.empty();
      for (var i = 0, n = Math.min(5, tweets.length); i < n; i++)
        appendTweet(container, tweets[i]);
    });
  }

  function displayLatestMentions(container) {
    container.html('<p>Mentions are loading ...');
    var received = [];

    function eligable(r, tweet) {
      var text = tweet.text.toLowerCase();
      for (var i = 0; i < r.required.length; i++)
        if (text.indexOf(r.required[i]) < 0)
          return false;
      for (var i = 0; i < r.negative.length; i++)
        if (text.indexOf(r.negative[i]) >= 0)
          return false;
      for (var i = 0; i < r.optional.length; i++)
        if (text.indexOf(r.optional[i]) >= 0)
          return true;
      return r.optional.length == 0;
    }

    function tweetListed(id, tweets) {
      for (var i = 0; i < tweets.length; i++)
        if (tweets[i].id === id)
          return true;
      return false;
    }

    function processResults() {
      var tweets = [];
      for (var i = 0; i < received.length; i++) {
        var r = received[i];
        for (var j = 0; j < r.results.length; j++) {
          var tweet = r.results[j];
          if (eligable(r, tweet) && !tweetListed(tweet.id, tweets))
            tweets.push(tweet);
        }
      }
      tweets.sort(function(a, b) {
        var d1 = new Date(a.created_at);
        var d2 = new Date(b.created_at);
        return (d1 < d2) - (d1 > d2);
      });

      container.empty();
      for (var i = 0, n = Math.min(20, tweets.length); i < n; i++)
        appendTweet(container, tweets[i]);
    }

    for (var i = 0, n = MENTION_QUERIES.length; i != n; i++) {
      var
        required = MENTION_QUERIES[i][0],
        optional = MENTION_QUERIES[i][1],
        negative = MENTION_QUERIES[i][2];
      $.getJSON('http://search.twitter.com/search.json?callback=?', {
        q:              required.join(' ') + ' ' + optional.join(' OR '),
        result_type:    'mixed',
        rpp:            30
      }, function(data) {
        received.push({
          required: required,
          optional: optional,
          negative: negative,
          results: data.results
        });
        if (received.length >= MENTION_QUERIES.length)
          processResults();
      });
    }
  }

  function makeSimpleSlideshow(container) {
    container.addClass('slideshow').hide().slideDown('slow');
    $('a', container).each(function() {
      $(this).attr('title', $('img', this).attr('alt'));
    }).clone().appendTo(container);
    var links = $('a', container).wrapAll('<div class=items></div>');
    var items = $('div.items', container);
    var firstLink = $(links[0]);
    var lastLink = $(links[links.length / 2 - 1]);
    var pixels = lastLink.offset().left - firstLink.offset().left + lastLink.width();

    function scroll() {
      items.animate({left: -pixels + 'px'}, pixels * 30, 'linear', function() {
        items.css('left', '0px');
        scroll();
      });
    }
    scroll();
  }

  var tweets = $('div.latest-tweets');
  if (tweets.length > 0)
    displayLatestTweets(tweets);
  var mentions = $('div.latest-mentions');
  if (mentions.length > 0)
    displayLatestMentions(mentions);
  var powered = $('div.pocoo-powered');
  if (powered.length > 0)
    makeSimpleSlideshow(powered);
});
