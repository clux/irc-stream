# irc-stream [![Build Status](https://secure.travis-ci.org/clux/irc-stream.png)](http://travis-ci.org/clux/irc-stream)
irc-stream is a minimalistic, streaming bot wrapper for the [irc module](https://npmjs.org/package/irc).

irc-stream will relay any combination of the following:

- channel messages addressed to the desired client name (default on)
- pms (default off)

These messages are available as a readable stream, and can thus be piped into a writable stream.
Messages can be written like for a writable stream, and messages sent will be sent in the channel/pm.


## Usage
Ideally, use it with [gu](https://npmjs.org/package/gu):

```javascript
var ircStream = require('irc-stream')(ircModuleArgs);
var gu = require('gu')(scriptPath, scriptFiles);

ircStream.pipe(gu).pipe(ircStream);
```

The first three `irc-stream` arguments are simply passed through to the [irc module](https://npmjs.org/package/irc). [Standing on the shoulders of giants](http://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants).

TODO: reveal extra args

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
