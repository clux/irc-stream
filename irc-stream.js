var Client = require('irc').Client;
var Duplex = require('stream').Duplex;
var trials = require('trials');
var Smell = require('smell');

function IrcStream(server, name, ircOpts, opts) {
  if (!(this instanceof IrcStream)) {
    return new IrcStream(server, name, ircOpts, opts);
  }
  Duplex.call(this, { objectMode: true });
  this.opts = opts || {};
  this.log = new Smell();

  var self = this;

  if (this.opts.announcerMode && this.opts.conversationMode) {
    throw new Error("announcerMode and conversationMode are mutually exclusive");
  }

  // keep the bot instance public if people want to get at it
  this.bot = new Client(server, name, ircOpts || {});
  if (!this.opts.allErrors) {
    this.bot.addListener('error', function () {}); // never usually care about errors
  }

  // listen for pms if option set (can do that immediately)
  if (this.opts.answerPms) {
    this.bot.addListener('pm', function (nick, msg) {
      var o = {user: nick, name: nick, message: msg};
      self.log.info("Incoming PM: %j", o);
      self.push(o);
    });
  }

  // start listening in channel for messages to ourselves
  // but only after we have registered so we know what name we have
  this.bot.addListener('registered', function (data) {
    name = data.args[0]; // actual irc name

    var addressedReg = new RegExp('^' + name + '[\\s,\\:](.*)', 'i');
    if (self.opts.ignoreChannel) {
      return;
    }
    // respond directly in channel - to anything matching addressedReg
    self.bot.addListener('message#', function (from, to, text) {
      var msg = '';
      if (addressedReg.test(text)) {
        msg = text.match(addressedReg)[1].trim();
      }
      else if (trials.bernoulli(self.opts.participationChance || 0)) {
        msg = text.trim();
      }
      if (msg) {
        var o = {user: to + ':' + from, name: from, message: msg};
        self.log.info("Incoming Chan: %j", o);
        self.push(o);
      }
    });
  });
}
IrcStream.prototype = Object.create(Duplex.prototype);

IrcStream.prototype._write = function (obj, enc, cb) {
  this.log.info("Outgoing: %j", obj);
  if (obj.user == null || obj.message == null) {
    throw new Error("Improper object written to IrcStream");
  }
  if (!obj.user || obj.user.indexOf(':') < 0) {
    this.bot.say(obj.user, obj.message);
  }
  else {
    var split = obj.user.split(':');
    var chan = split[0];
    var user = split[1];
    // always highlight in conversationMode, never in announcerMode
    // if none of the modes, then highlight only on new target
    var doHighLight = this.lastUser !== obj.user || this.opts.conversationMode;
    if (!this.opts.announcerMode && doHighLight) {
      this.bot.say(chan, user + ': ' + obj.message);
    }
    else {
      this.bot.say(chan, obj.message); // dont highlight (announcer || !doHighlight)
    }
    this.lastUser = obj.user;
  }
  cb();
};

IrcStream.prototype._read = function () {};

module.exports = IrcStream;
