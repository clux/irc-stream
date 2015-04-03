var IrcStream = require(process.env.IRCSTREAM_COV ? '../irc-stream-cov' : '../');
var Client = require('irc').Client;
var sulfur = require('sulfur');
var Smell = require('smell');
var EE = require('events').EventEmitter;

// [Server, (client, irc-stream)] helper class
function Connection(istreamOpts) {
  EE.call(this);
  // 1. set up irc server
  this.ircd = require('ircdkit')({
    requireNickname: true
  });
  this.ircd.listen(6667);
  this.log = new Smell();
  sulfur.absorb(this.log, 'ircd');
  this.bot = null;
  this.person = null;
  var self = this;
  this.ircd.on('connection', function (c) {
    c.on('authenticated', function () {
      self.log.info(c.mask + " connected");
      self[c.nickname === 'bot' ? 'bot' : 'person'] = c;
    });

    c.on('PRIVMSG', function (target, message) {
      // bot sends to person, person sends to bot:
      //self.log.info('server handle "' + message + '" for', target);
      var dest = self[self.bot.id === c.id ? 'person' : 'bot'];
      dest.send(':' + c.nickname + ' PRIVMSG ' + target + ' :' + message);
    });

    c.on('disconnected', function () {
      self.log.info(c.mask + " disconnected.");
    });
  });

  // both client use the same irc client options
  var ircOpts = { channel: [ '#test' ] };

  // 2. connect the ircStream `bot` to the server
  this.istream = new IrcStream('localhost', 'bot', ircOpts, istreamOpts);
  sulfur.absorb(this.istream.log, 'irc-stream');

  // 3. connect the irc.Client `dude` to the server
  this.istream.bot.on('registered', function () {
    self.client = new Client('localhost', 'dude', ircOpts);
    self.client.addListener('error', function () {});

    self.resps = [];
    self.client.addListener('message', function (from, to, message) {
      self.resps.push({ from: from, to: to, message: message});
    });
    self.client.addListener('registered', function () {
      self.emit('ready', self.istream, self.client);
    });
  });
}
Connection.prototype = new EE();

Connection.prototype.close = function () {
  this.client.disconnect();
  this.istream.bot.disconnect();
  this.ircd.close();
};

// -------------------------------------------------------------

exports.pmsAndParticipate = function (t) {
  var istreamOpts = {
    answerPms: true,
    participationChance: 1
  };
  var conn = new Connection(istreamOpts);

  // send messages from person to bot when ready
  conn.on('ready', function (istream, person) {
    person.say('bot', 'getting this?');
    person.say('#test', 'bot: hi');
    person.say('#test', 'participate');

    setTimeout(function () {
      // intercept in istream just afterwards
      var m1 = istream.read();
      var excp1 = { user: 'dude', name: 'dude', message: 'getting this?'};
      t.deepEqual(m1, excp1, 'pm read');

      var m2 = istream.read();
      var excp2 = { user: '#test:dude', name: 'dude', message: 'hi' };
      t.deepEqual(m2, excp2, 'chan message read');

      var m3 = istream.read();
      var excp3 = { user: "#test:dude", name: "dude", message: "participate" };
      t.deepEqual(m3, excp3, 'unrelated participation message read');

      var m4 = istream.read();
      t.equal(m4, null, 'no fourth message');

      conn.close();
      t.done();
    }, 500);
  });
};

exports.ignoreChannel = function (t) {
  var istreamOpts = {
    ignoreChannel: true
  };
  var conn = new Connection(istreamOpts);

  // send messages from person to bot when ready
  conn.on('ready', function (istream, person) {
    person.say('bot', 'getting this?');
    person.say('#test', 'bot: hi');
    person.say('#test', 'participate');

    setTimeout(function () {
      // intercept in istream just afterwards
      var m1 = istream.read();
      t.deepEqual(m1, null, 'ignoring pms and chan');

      conn.close();
      t.done();
    }, 500);
  });
};

exports.defaultOptsResponses = function (t) {
  var istreamOpts = {};
  var conn = new Connection(istreamOpts);

  // send messages from person to bot when ready
  conn.on('ready', function (istream, person) {
    person.say('#test', 'bot: hi');
    person.say('#test', 'participate');
    person.say('bot', 'getting this?');

    setTimeout(function () {
      // intercept in istream just afterwards
      var m1 = istream.read();
      var excp1 = { user: '#test:dude', name: 'dude', message: 'hi' };
      t.deepEqual(m1, excp1, 'chan message read on default');

      var m2 = istream.read();
      t.deepEqual(m2, null, 'not participating');

      var m3 = istream.read();
      t.deepEqual(m3, null, 'ignoring pms');

      var m4 = istream.read();
      t.equal(m4, null, 'no fourth message');

      // write responses from bot to person finally
      istream.write({ user: 'dude', message: 'bonk' });
      istream.write({ user: '#test:dude', message: 'really?'});
      istream.write({ user: '#test:dude', message: 'that is insane'});
      setTimeout(function () {
        var resps = conn.resps;
        var r1 = { from: 'bot', to: 'dude', message: 'bonk' };
        var r2 = { from: 'bot', to: '#test', message: 'dude: really?'};
        var r3 = { from: 'bot', to: '#test', message: 'that is insane'};
        t.deepEqual(resps[0], r1, 'pm to person');
        t.deepEqual(resps[1], r2, 'chan msg 1 to person (highlighted)');
        t.deepEqual(resps[2], r3, 'chan msg 2 to person (not highlighted)');

        conn.close();
        t.done();
      }, 500);
    }, 500);
  });
};


exports.neverHighlight = function (t) {
  var istreamOpts = {
    neverHighlight: true
  };
  var conn = new Connection(istreamOpts);

  // send messages from person to bot when ready
  conn.on('ready', function (istream) {
    // write messages from bot to person
    istream.write({ user: 'dude', message: 'bonk' });
    istream.write({ user: '#test:dude', message: 'really?'});
    istream.write({ user: '#test:dude', message: 'that is insane'});
    setTimeout(function () {
      var resps = conn.resps;
      var r1 = { from: 'bot', to: 'dude', message: 'bonk' };
      var r2 = { from: 'bot', to: '#test', message: 'really?'};
      var r3 = { from: 'bot', to: '#test', message: 'that is insane'};
      t.deepEqual(resps[0], r1, 'pm to person');
      t.deepEqual(resps[1], r2, 'chan msg 1 to person (not highlighted)');
      t.deepEqual(resps[2], r3, 'chan msg 2 to person (same)');

      conn.close();
      t.done();
    }, 500);
  });
};

exports.alwaysHighlight = function (t) {
  var istreamOpts = {
    alwaysHighlight: true
  };
  var conn = new Connection(istreamOpts);

  // send messages from person to bot when ready
  conn.on('ready', function (istream) {
    // write messages from bot to person
    istream.write({ user: 'dude', message: 'bonk' });
    istream.write({ user: '#test:dude', message: 'really?'});
    istream.write({ user: '#test:dude', message: 'that is insane'});
    setTimeout(function () {
      var resps = conn.resps;
      var r1 = { from: 'bot', to: 'dude', message: 'bonk' };
      var r2 = { from: 'bot', to: '#test', message: 'dude: really?'};
      var r3 = { from: 'bot', to: '#test', message: 'dude: that is insane'};
      t.deepEqual(resps[0], r1, 'pm to person');
      t.deepEqual(resps[1], r2, 'chan msg 1 to person (highlight)');
      t.deepEqual(resps[2], r3, 'chan msg 2 to person (highlight again)');

      conn.close();
      t.done();
    }, 500);
  });
};
