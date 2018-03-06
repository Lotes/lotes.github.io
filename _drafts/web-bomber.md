---
layout: post
title: Bookmarklet: Web-bomber
---
A couple of years ago, I was interested in developing [bookmarklets](https://de.m.wikipedia.org/wiki/Bookmarklet). My goal was to empower the user to destroy the current website just by tipping on it with his finger or mouse.

IMAGE... a window with use case clicking

I took the destruction animation from the Game boy title "The legend of Zelda - Links awakening". As typical for bookmarklets, all media was embedded as BASE64 URL string.

The key feature is the disappearing of the letters after the explosion. The trick is to traverse the document tree down to text nodes. Each text node will be replaced by a list of span node holding one character each.

All letter spans will be saved in a collision tree.

## TODO

* [ ] enable/disable feature
* [ ] chain reactions, oil weapon
* [ ] involve images... burning down or so...
* [ ] collision tree