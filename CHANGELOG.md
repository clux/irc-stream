0.3.1 / 2015-11-15
==================
  * Added `.npmignore`

0.3.1 / 2015-05-08
==================
  * smell module now correctly in dependencies rather than devDependencies

0.3.0 / 2015-04-05
==================
  * Now uses the simpler `gu@0.5.0` stream specification
  * Explicit `close(reason, cb)` method that closes the `irc.Client`

0.2.0 / 2015-04-04
==================
  * PMs no longer trigger potentially two readable messages #3
  * Fixed `participationChance` being wrongly coerced to an integer
  * `announcerMode` renamed to `neverHighlight`
  * `conversationMode` renamed to `alwaysHighlight`
  * `answerPms` default is `false` (although this was the case before - wrong docs)

0.1.0 / 2015-04-03
==================
  * `participationChance` now a number in the range `0` to `1`
  * `noChan` option renamed to `ignoreChannel`
  * Module now has tests

0.0.8 / 2014-03-05
==================
  * Channel identification now case insensitive.

0.0.7 / 2014-03-03
==================
 * Added `participationChance` option (from @john-peterson)

0.0.6 / 2013-09-28
==================
 * Added `conversationMode` option

0.0.4 / 2013-09-27
==================
 * Added `announcerMode` to options

0.0.2 / 2013-09-26
==================
 * Document existing options - and pass them through

0.0.1 / 2013-09-13
==================
  * Initial version
