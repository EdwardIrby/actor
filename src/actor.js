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

export const actor = _init => {
  const init = _init || (async () => {});
  const initPromise = () => Promise.resolve().then(() => init());
  return message => (message === 'initPromise'
  ? initPromise
  : console.log(`Message not handled: ${message}`));
};

const messageStore = watchableMessageStore('ACTOR-MESSAGES');

export async function hookup(actorName, _behavior, { purgeExistingMessages = false } = {}) {
  const behavior = _behavior();
  await behavior('initPromise')();
  messageStore('resetCursor')();
  purgeExistingMessages && await messageStore('popMessages')(actorName);
  const hookdown = messageStore('subscribe')(actorName, messages => {
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

export const lookup = actorName => {
  const send = handler => async message => {
    await messageStore('pushMessage')({ recipient: actorName, handler, detail: message });
  };
  return handler => send(handler);
};

export const initializeQueues = async () => {
  await messageStore('popMessages')('*');
};
