import {
  actor,
  hookup,
  lookup,
  initializeQueues,
} from './actor.js';

suite('actor module', () => {
  let hookdown;
  setup(async () => {
    await initializeQueues();
  });
  teardown(async () => {
    if (hookdown) {
      await hookdown();
    }
  });
  test('can hookup, lookup, and send a message', async () => {
    const result = await new Promise(async resolve => {
      const ignoringActor = () => {
        const dummy = () => {
          resolve('success');
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
    assert.equal(result, 'success');
  });
  test('can call lookup before hookup', async () => {
    const result = await new Promise(async resolve => {
      const ignoringActor = () => {
        const dummy = () => {
          resolve('success');
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
    assert.equal(result, 'success');
  });
  test('re-traverses messages after hookup', async () => {
    const result = await new Promise(async resolve => {
      let ignoringHookdown;
      const lateActor = () => {
        const dummy = () => {
          resolve('success');
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
    assert.equal(result, 'success');
  });
  test('deletes old messages', async () => {
    const result = await new Promise(async (resolve, reject) => {
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
      setTimeout(resolve, 100, 'success');
    });
    assert.deepEqual(result, 'success');
  });
});
