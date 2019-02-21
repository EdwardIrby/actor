/* eslint-disable no-console */
/* eslint-disable no-return-assign */
/* eslint-disable no-restricted-globals */

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


import { _throw } from '@dxworks/utils';
// This interval needs to be strictly longer than the time it takes to paint
// 1 frame. E.g. this value needs to be higher than 16ms. Otherwise, the
// IDB connection will starve and run into an endless loop.
const POLLING_INTERVAL = 50;
const DB_PREFIX = 'ACTOR-DATABASE';
const OBJECT_STORE_NAME = 'LIST';
/**
 * A messageStore that can read and write to a specific objectStore in an
 * IndexedDB database. This class is used to implement message passing for
 * actors and is generally not intended to be used for other use cases.
 *
 * To retrieve messages from the store for a recipient, use
 * {@link watchableMessageStore~popMessages}. To subscribe to newly added
 * messages for a recipient, use {@link watchableMessageStore~subscribe}.
 * To store a new message for a recipient, use
 * {@link watchableMessageStore~pushMessage}.
 * @param {string} _name
 */
export const watchableMessageStore = _name => {
  const name = _name;
  const objStoreName = OBJECT_STORE_NAME;
  const dbName = `${DB_PREFIX}.${name}`;

  let lastCursorId = 0;
  const resetCursor = () => (lastCursorId = 0);

  const init = () => new Promise((resolve, reject) => {
    const connection = indexedDB.open(dbName);
    connection.onerror = () => {
      reject(connection.error);
    };
    connection.onsuccess = () => {
      resolve(connection.result);
    };
    connection.onupgradeneeded = () => {
      !connection
        .result
        .objectStoreNames
        .contains(objStoreName) &&
      connection
        .result
        .createObjectStore(objStoreName, {
          autoIncrement: true,
        });
    };
  });
  const database = init();

  const bcc = ('BroadcastChannel' in self) && new BroadcastChannel(name);
  /**
   * Retrieve all messages for a specific recipient. You can specify with
   * `keepMessage` whether to keep messages after they are processed by
   * the recipient.
   *
   * @param {string} recipient The name of the recipient.
   * @param {boolean} [keepMessage=false] Whether to keep any messages after the recipient has
   *    processed the message.
   */
  const popMessages = async (recipient, keepMessage = false) => {
    const transaction = (await database).transaction(objStoreName, 'readwrite');
    const cursorRequest = transaction
      .objectStore(objStoreName)
      .openCursor(IDBKeyRange.lowerBound(lastCursorId, true));
    return new Promise((resolve, reject) => {
      const messages = [];
      cursorRequest.onerror = () => {
        reject(cursorRequest.error);
      };
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        const addToMessages = value => {
          messages.push(value);
          (!keepMessage) && cursor.delete();
        };
        const updateLastCursorId = () => {
          const { value } = cursor;
          (value.recipient === recipient || recipient === '*') &&
            addToMessages(value);
          cursor.continue();
          lastCursorId = cursor.key;
        };
        cursor
        ? updateLastCursorId()
        : resolve(messages);
      };
    });
  };
  /**
   * Store a message with a recipient.
   *
   * @param {{recipient: string, handler: string , detail}} message The message to store with a recipient and a detail.
   */
  const pushMessage = async message => {
    (message.recipient === '*') && _throw('Can’t send a message to reserved name "*"');
    const transaction = (await database).transaction(objStoreName, 'readwrite');
    return new Promise((resolve, reject) => {
      transaction.onerror = () => {
        reject(transaction.error);
      };
      transaction.oncomplete = () => {
        bcc && bcc.postMessage({ recipient: message.recipient });
        resolve();
      };
      transaction.objectStore(objStoreName).add(message);
    });
  };
  /**
   * @param {string} recipient The name of the recipient.
   * @param {function} callback The callback that is invoked with all new messages.
  */
  const subscribeWithBroadcastChannel = (recipient, callback) => {
    const channel = new BroadcastChannel(name);
    const retrieveRecipientMessages = async () => {
      const messages = await popMessages(recipient);
      (messages.length > 0) && callback(messages);
    };
    const channelCallback = async evt => {
      const ping = evt.data;
      (ping.recipient === recipient) && await retrieveRecipientMessages();
    };
    channel.addEventListener('message', channelCallback);
    // Check for already stored messages immediately
    channelCallback(new MessageEvent('message', { data: { recipient } }));
    return () => {
      channel.close();
    };
  };
  /**
   * @param {string} recipient The name of the recipient.
   * @param {function} callback The callback that is invoked with all new messages.
  */
  const subscribeWithPolling = (recipient, callback) => {
    let timeout = -1;
    const pollCallback = async () => {
      const messages = await popMessages(recipient);
      (messages.length > 0) && callback(messages);
      timeout = setTimeout(pollCallback, POLLING_INTERVAL);
    };
    timeout = setTimeout(pollCallback, POLLING_INTERVAL);
    return () => {
      self.clearTimeout(timeout);
    };
  };
  /**
   * Add a callback whenever a new message arrives for the recipient.
   * Depending on the functionality of your browser, this will either use
   * `BroadcastChannel` for fine-grained notification timing. If the browser
   * does not implement `BroadcastChannel`, it falls back to use a polling
   * mechanism. The polling timeout is specified by {@link POLLING_INTERVAL}.
   * @param {string} recipient The name of the recipient.
   * @param {function} callback The callback that is invoked with all new messages.
  */
  const subscribe = (recipient, callback) => (
    ('BroadcastChannel' in self)
      ? subscribeWithBroadcastChannel(recipient, callback)
      : subscribeWithPolling(recipient, callback)
  );
  return /** @param {string} message */ message => (
    message === 'resetCursor'
    ? resetCursor
    : message === 'init'
    ? init
    : message === 'popMessages'
    ? popMessages
    : message === 'pushMessage'
    ? pushMessage
    : message === 'subscribeWithBroadcastChannel'
    ? subscribeWithBroadcastChannel
    : message === 'subscribeWithPolling'
    ? subscribeWithPolling
    : message === 'subscribe'
    ? subscribe
    : console.log(`Message not handled: ${message}`)
  );
};
