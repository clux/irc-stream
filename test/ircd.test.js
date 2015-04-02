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
  var self = this;
  this.ircd.on('connection', function (c) {
    c.on('authenticated', function () {
      self.log.info(c.mask + " connected");
      if (c.nickname === 'bot') {
        self.bot = c;
      }
    });

    c.on('PRIVMSG', function (target, message) {
      // Ensure pms and chan messages in #test reach the bot:
      if ((target === 'bot' || target === '#test') && self.bot) {
        self.bot.send(':' + c.nickname + ' PRIVMSG ' + target + ' :' + message);
      }
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



exports.basic =  function (t) {
  var ircOpts = { channel: [ '#test' ] };

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
      var excp3 = {"user":"#test:dude","name":"dude","message":"participate"};
      t.deepEqual(m3, excp3, 'unrelated participation message read');

      var m4 = istream.read();
      t.equal(m4, null, 'no fourth message');

      person.disconnect();
      istream.bot.disconnect();
      server.close();
      t.done();
    }, 50);
  }).addListener('error', function () {});
};
