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

  if (this.opts.neverHighlight && this.opts.alwaysHighlight) {
    throw new Error("neverHighlight and alwaysHighlight are mutually exclusive");
  }

  // keep the bot instance public if people want to get at it
  this.bot = new Client(server, name, ircOpts || {});
  if (!this.opts.allErrors) {
    this.bot.on('error', function () {}); // never usually care about errors
  }

  // listen for pms if option set (can do that immediately)
  if (this.opts.answerPms) {
    this.bot.on('pm', function (nick, msg) {
      var o = { user: nick, message: msg };
      self.log.info("Incoming PM: %j", o);
      self.push(o);
    });
  }

  // start listening in channel for messages to ourselves
  // but only after we have registered so we know what name we have
  this.bot.on('registered', function (data) {
    name = data.args[0]; // actual irc name

    var addressedReg = new RegExp('^' + name + '[\\s,\\:](.*)', 'i');
    if (self.opts.ignoreChannel) {
      return;
    }
    // respond directly in channel - to anything matching addressedReg
    self.bot.on('message#', function (from, chan, text) {
      var msg = '';
      if (addressedReg.test(text)) {
        msg = text.match(addressedReg)[1].trim();
      }
      else if (trials.bernoulli(self.opts.participationChance || 0)) {
        msg = text.trim();
      }
      if (msg) {
        var o = {user: from, channel: chan, message: msg};
        self.log.info("Incoming Chan: %j", o);
        self.push(o);
      }
    });
  });
}
IrcStream.prototype = Object.create(Duplex.prototype);

IrcStream.prototype.highlight = function (user, msg) {
  // if not in any highlight modes, then only on new target
  var shouldHighLight = this.lastUser !== user || this.opts.alwaysHighlight;
  var doHighlight = !this.opts.neverHighlight && shouldHighLight;
  this.lastUser = user;
  return doHighlight ? user + ': ' + msg : msg;
};

IrcStream.prototype._write = function (obj, enc, cb) {
  this.log.info("Outgoing: %j", obj);
  if (obj.user == null || obj.message == null) {
    throw new Error("Improper object written to IrcStream");
  }
  if (!obj.channel) {
    this.bot.say(obj.user, obj.message);
  }
  else {
    this.bot.say(obj.channel, this.highlight(obj.user, obj.message));
  }
  cb();
};

IrcStream.prototype._read = function () {};

IrcStream.prototype.close = function (reason, cb) {
  this.bot.disconnect(reason || 'bye', cb);
};

module.exports = IrcStream;
