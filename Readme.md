# actor (experimental)
 A fork of google's [actor-helper](https://github.com/PolymerLabs/actor-helpers). This variant uses a functional object patttern versus a es6 class pattern found in google's reference implementation.

 ## To-do
 Figure out how to handle a bug that appears when two actors share the same name/address. Addresses are not stored in indexeddb, only messages. While the messages contain a recipient key value pair it seems a pain to have to iterate through every message before hoooking up an actor. Also this alone wouldn't handle re-traverses or late hookup edge cases. We discovered this bug when experiementing with the [zora](https://github.com/lorenzofox3/zora) test library in the browser.
