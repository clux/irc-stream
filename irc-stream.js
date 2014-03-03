var Client = require('irc').Client;
var Duplex = require('stream').Duplex;
//var log = require('logule').init(module);

// opts.noChan, opts.answerPms, opts.allErrors
function IrcStream(server, name, ircOpts, opts) {
  if (!(this instanceof IrcStream)) {
    return new IrcStream(server, name, ircOpts, opts);
  }
  Duplex.call(this, {objectMode: true});
  ircOpts = ircOpts || {};
  opts = opts || {};
  this.opts = opts;
  this.opts.participationChance = this.opts.participationChance | 0;

  if (this.opts.announcerMode && this.opts.conversationMode) {
    throw new Error("announcerMode and conversationMode are mutually exclusive");
  }

  // keep the bot instance public if people want to get at it
  this.bot = new Client(server, name, ircOpts);
  if (!opts.allErrors) {
    this.bot.addListener('error', function () {}); // never usually care about errors
  }

  // respond directly - in channel - to anything matching chanReg
  var registerChanHandler = function () {
    if (!opts.noChan) {
      var chanReg = new RegExp('^' + name + '[\\s,\\:](.*)');
      this.bot.addListener('message', function (from, to, msg) {
        var reply = false;
        var content = '';

        // check if we're addressed
        if (chanReg.test(msg)) {
          content = msg.match(chanReg)[1];
          reply = true;
        }

        // check if we should reply without being addressed
        if (!reply) {
          var prob = Math.floor(Math.random() * 100) + 1;
          if (this.opts.participationChance >= prob) {
            reply = true;
            content = msg;
          }
        }

        // check if we should reply
        if (!reply)
          return;

        content = content.trim();
        if (!content) {
          return; // empty statement
        }
        if (content) {
          var o = {user: to + ':' + from, name: from, message: content};
          //log.trace("IrcStream departure Chan: %j", o);
          this.push(o);
        }
      }.bind(this));
    }
  }.bind(this);

  this.bot.addListener('registered', function (data) {
    name = data.args[0];
    registerChanHandler(); // will listen on the name given
  });

  // optionally listen for pms
  if (opts.answerPms) {
    this.bot.addListener('pm', function (nick, msg) {
      var o = {user: nick, name: nick, message: msg};
      //log.trace("IrcStream departure PM: %j", o);
      this.push(o);
    }.bind(this));
  }
}
IrcStream.prototype = Object.create(Duplex.prototype);

IrcStream.prototype._write = function (obj, enc, cb) {
  //log.trace("IrcStream arrival: %j", obj);
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
