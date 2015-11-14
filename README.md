# irc-stream
[![npm status](http://img.shields.io/npm/v/irc-stream.svg)](https://www.npmjs.org/package/irc-stream)
[![build status](https://secure.travis-ci.org/clux/irc-stream.svg)](http://travis-ci.org/clux/irc-stream)
[![dependency status](https://david-dm.org/clux/irc-stream.svg)](https://david-dm.org/clux/irc-stream)
[![coverage status](http://img.shields.io/coveralls/clux/irc-stream.svg)](https://coveralls.io/r/clux/irc-stream)

irc-stream is a minimalistic, streaming bot wrapper for the [irc module](https://npmjs.org/package/irc).

irc-stream will relay any combination of the following:

- channel messages addressed to the client (default on)
- pms (default off)

These messages are available as a readable stream, and can thus be piped into a writable stream.
Messages can be written like for a writable stream, and messages sent will be sent in the channel/pm.


## Usage
Ideally, use it with [gu](https://npmjs.org/package/gu) as both a readable and writable stream:

```js
var ircStream = require('irc-stream')(ircServer, ircName, ircModuleOpts, ircStreamOpts);
var gu = require('gu')(scriptPath, scriptFiles);

ircStream.pipe(gu).pipe(ircStream);
```

Where the first three `irc-stream` arguments are simply passed through to the [irc module](https://npmjs.org/package/irc).

Alternatively you could use it as just a readable stream or a writable stream. See [flight-stream](https://github.com/clux/flight-stream) for an example as using it as a writable stream only.


## Options
The fourth argument control how we listen on IRC. By default the following options are all disabled or zero:

```js
{
  allErrors: Boolean, // manually handle `irc` error events
  ignoreChannel: Boolean, // ignore channel directed messages
  answerPms: Boolean, // respond to private messages
  neverHighlight: Boolean // never highlight channel responses
  alwaysHighlight: Boolean // always highlight channel responses
  participationChance: Number // probability to respond without being addressed
}
```

NB: Can only do one of `neverHighlight` and `alwaysHighlight`. By default, `irc-stream` will highlight the channel recipient on the first message only.

## Installation

```sh
$ npm install irc-stream
```

## License
MIT-Licensed. See LICENSE file for details.
