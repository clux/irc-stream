# irc-stream [![Build Status](https://secure.travis-ci.org/clux/irc-stream.png)](http://travis-ci.org/clux/irc-stream) [![Dependency Status](https://david-dm.org/clux/irc-stream.png)](https://david-dm.org/clux/irc-stream)

irc-stream is a minimalistic, streaming bot wrapper for the [irc module](https://npmjs.org/package/irc).

irc-stream will relay any combination of the following:

- channel messages addressed to the desired client name (default on)
- pms (default off)

These messages are available as a readable stream, and can thus be piped into a writable stream.
Messages can be written like for a writable stream, and messages sent will be sent in the channel/pm.


## Usage
Ideally, use it with [gu](https://npmjs.org/package/gu) as both a readable and writable stream:

```javascript
var ircStream = require('irc-stream')(ircServer, ircName, ircModuleOpts, ircStreamOpts);
var gu = require('gu')(scriptPath, scriptFiles);

ircStream.pipe(gu).pipe(ircStream);
```

Where the first three `irc-stream` arguments are simply passed through to the [irc module](https://npmjs.org/package/irc).

Alternatively you could use it as just a readable stream or a writable stream. See [flight-stream](https://github.com/clux/flight-stream) for an example as using it as a writable stream only.


## Options
The fourth argument dictate how we listen on IRC:

```js
{
  allErrors: Boolean, // ignore all error events to the `irc` client - default `true`
  noChan: Boolean,    // ignore channel directed messages - default `false`
  answerPms: Boolean, //  respond to private messages - default `true`
  announcerMode: Boolean // don't respond directly in channel - default `false`
  conversationMode: Boolean // always respond directly in channel - default `false`
  participationChance: Number // percentage probability to respond without being addressed - default `0`
}
```

NB: Can only do one of `announcerMode` and `conversationMode`.

## Installation

```bash
$ npm install irc-stream --save
```

## Running tests
Install development dependencies

```bash
$ npm install
```

Run the tests

```bash
$ npm test
```

## License
MIT-Licensed. See LICENSE file for details.
