import { expect } from 'chai';

import {
  actor,
  hookup,
  lookup,
  initializeQueues,
} from './actor.js';

const noop = () => {};
describe('actor', () => {
  let hookdown;
  beforeEach(async () => {
    await initializeQueues();
  });
  afterEach(async () => {
    if (hookdown) {
      await hookdown();
    }
  });
  it('can hookup, lookup, and send a message', async () => {
    const ignoringActor = () => {
      const dummy = () => {
        noop();
      };
      const base = actor();
      return message => (
          message === 'dummy'
          ? dummy
          : base(message)
      );
    };
    hookdown = await hookup('ignoring', ignoringActor);
    const ignoring = await lookup('ignoring');
    ignoring('dummy')();
  });
  it('can call lookup before hookup', async () => {
    const ignoringActor = () => {
      const dummy = () => {
        noop();
      };
      const base = actor();
      return message => (
          message === 'dummy'
          ? dummy
          : base(message)
      );
    };
    const ignoring = await lookup('ignoring');
    hookdown = await hookup('ignoring', ignoringActor);
    ignoring('dummy')();
  });
  it('re-traverses messages after hookup', async () => {
    let ignoringHookdown;
    const lateActor = () => {
      const dummy = () => {
        noop();
      };
      const base = actor();
      return message => (
        message === 'dummy'
        ? dummy
        : base(message)
      );
    };
    const ignoringActor = () => {
      const dummy = () => {
        setTimeout(async () => {
          const lateHookdown = await hookup('late', lateActor);
          hookdown = async () => {
            await ignoringHookdown();
            await lateHookdown();
          };
        }, 100);
      };
      const base = actor();
      return message => (
        message === 'dummy'
        ? dummy
        : base(message)
      );
    };
    const late = await lookup('late');
    late('dummy')();
    const ignoring = await lookup('ignoring');
    ignoring('dummy')();
    ignoringHookdown = await hookup('ignoring', ignoringActor);
  });
  it('const assignment finishes before init() is run', async () => {
    const ignoringActor = () => {
      const propsProcessed = true;
      const constructorDone = true;
      const init = async () => {
        expect(propsProcessed).to.equal(true);
        expect(constructorDone).to.equal(true);
      };
      const base = actor(init);
      return message => base(message);
    };
    hookdown = await hookup('ignoring', ignoringActor);
  });
});

describe('initializeQueues', () => {
  let hookdown;
  beforeEach(async () => {
    await initializeQueues();
  });
  afterEach(async () => {
    if (hookdown) {
      await hookdown();
    }
  });
  it('deletes old messages', async () => {
    await new Promise(async (resolve, reject) => {
      const ignoring = await lookup('ignoring');
      ignoring('dummy')();
      const ignoringActor = () => {
        const dummy = () => {
          reject(Error('Message got delivered anyway'));
        };
        const base = actor();
        return message => (
          message === 'dummy'
          ? dummy
          : base(message)
        );
      };
      await initializeQueues();
      hookdown = await hookup('ignoring', ignoringActor);
      setTimeout(resolve, 100);
    });
  });
});
