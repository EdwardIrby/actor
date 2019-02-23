/* eslint-disable no-console */
/* eslint-disable no-return-assign */
/* eslint-disable no-restricted-syntax */

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { watchableMessageStore } from './watchableMessageStore.js';
/** @param {function} _init */
export const actor = _init => {
  const init = _init || (async () => {});
  const initPromise = () => Promise.resolve().then(() => init());
  return /** @param {string} message */ message => (message === 'initPromise'
  ? initPromise
  : console.error(`Message not handled: ${message}`));
};

const messageStore = watchableMessageStore('ACTOR-MESSAGES');
/**
 * @param {string} actorName The name this actor will listen to.
 * @param {function} _behavior The actor implementation that can process messages.
 * @param {boolean} [purgeExistingMessages=false] Whether any messages that arrived before this
 *    actor was ready should be discarded.
 * @return {Promise} A promise which, once resolved, provides a callback that can be
 * invoked to remove this actor from the system.
 */
export async function hookup(actorName, _behavior, purgeExistingMessages = false) {
  const behavior = _behavior();
  await behavior('initPromise')();
  messageStore('resetCursor')();
  purgeExistingMessages && await messageStore('popMessages')(actorName);
  const hookdown = messageStore('subscribe')(actorName, /** @param {Array} messages */ messages => {
    for (const message of messages) {
      try {
        behavior(message.handler)(message.detail);
      } catch (e) {
        console.error(e);
      }
    }
  });
  return async () => {
    hookdown();
    await messageStore('popMessages')(actorName);
  };
}
/** @param {string} actorName */
export const lookup = actorName => {
  /** @param {string} handler */
  const send = handler => async message => {
    await messageStore('pushMessage')({ recipient: actorName, handler, detail: message });
  };
  /**
   * @returns {function}
   */
  return send;
};

export const initializeQueues = async () => {
  await messageStore('popMessages')('*');
};
