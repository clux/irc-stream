var IrcStream = require(process.env.IRCSTREAM_COV ? '../irc-stream-cov' : '../');
var Client = require('irc').Client;
var sulfur = require('sulfur');
var Smell = require('smell');

function Server() {
  this.ircd = require('ircdkit')({
    requireNickname: true
  });
  this.ircd.listen(6667);
  this.log = new Smell();
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
}

Server.prototype.close = function () {
  this.ircd.close();
};

Server.prototype.registerClient = function (bot) {
  this.bot = bot;
};



exports.everythingOn =  function (t) {
  var ircOpts = { channel: [ '#test' ] };
  //var ircOptsDebug = { channel: [ '#test' ], debug: true };

  // 1. set up an IRC server
  var server = new Server();
  sulfur.absorb(server.log, 'ircd');

  // 2. connect the ircStream `bot` to the server
  var istreamOpts = {
    answerPms: true,
    participationChance: 1
  };
  var istream = new IrcStream('localhost', 'bot', ircOpts, istreamOpts);
  sulfur.absorb(istream.log, 'irc-stream');

  // 3. connect a normal IRC `person` to the server
  var person = new Client('localhost', 'dude', ircOpts);
  person.addListener('error', function () {});

  var cleanup = function () {
    person.disconnect();
    istream.bot.disconnect();
    server.close();
  };

  // 4. say something from `person` to `bot` when ready
  person.addListener('registered', function () {
    person.say('bot', 'getting this?');
    person.say('#test', 'bot: hi');
    person.say('#test', 'participate');
    setTimeout(function () {
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

      // write responses
      istream.write({ user: 'dude', message: 'resp' });
      istream.write({ user: '#test:dude', message: 'really?'}); // should highlight
      istream.write({ user: '#test:dude', message: 'that is insane'}); // should not
    }, 50);
  });

  // 5. collect responses
  var resps = [];
  person.addListener('message', function (from, to, message) {
    resps.push({ from: from, to: to, message: message});
  });

  // 6. verify responses
  setTimeout(function () {
    var r1 = { from: 'bot', to: 'dude', message: 'resp' };
    var r2 = { from: 'bot', to: '#test', message: 'dude: really?'};
    var r3 = { from: 'bot', to: '#test', message: 'that is insane'};
    t.deepEqual(resps[0], r1, 'response 1 to person');
    t.deepEqual(resps[1], r2, 'response 2 to person');
    t.deepEqual(resps[2], r3, 'response 3 to person');
    cleanup();
    t.done();
  }, 150);
};
