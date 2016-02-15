const bindings = require('bindings')('argon2');
const crypto = require('crypto');

const defaults = Object.freeze({
  timeCost: 3,
  memoryCost: 12,
  parallelism: 1,
  argon2d: false
});

const limits = Object.freeze(bindings.limits);

const fail = (message, reject) => {
  'use strict';

  const error = new Error(message);

  if (typeof reject === 'function') {
    process.nextTick(() => {
      reject(error);
    });
  } else {
    throw error;
  }
};

const validate = (salt, options, resolve, reject) => {
  'use strict';

  if (!Buffer.isBuffer(salt) || salt.length < 8) {
    fail('Invalid salt, must be a buffer with 8 or more bytes.', reject);
    return false;
  }

  // TODO: replace var with const https://github.com/tapjs/node-tap/issues/236
  for (var key of Object.keys(limits)) {
    var max = limits[key].max, min = limits[key].min, value = options[key];
    if (!Number.isInteger(value) || value > max || value < min) {
      fail(`Invalid ${key}, must be an integer between ${min} and ${max}.`, reject);
      return false;
    }
  }

  if (typeof resolve === 'function') {
    resolve();
  }

  return true;
};

module.exports = {
  defaults, limits,

  hash (plain, salt, options) {
    'use strict';

    options = Object.assign({}, options || defaults);

    return new Promise(validate.bind(this, salt, options))
      .then(() => bindings.hash(plain, salt, options.timeCost,
          options.memoryCost, options.parallelism, options.argon2d));
  },

  hashSync (plain, salt, options) {
    'use strict';

    console.warn('The synchronous API is deprecated, use ES6 await instead.');
    options = Object.assign({}, options || defaults);

    if (validate(salt, options)) {
      return bindings.hashSync(plain, salt, options.timeCost,
        options.memoryCost, options.parallelism, options.argon2d);
    }
  },

  generateSalt (length) {
    'use strict';

    length = typeof length === 'undefined' ? 16 : length;
    return new Promise((resolve, reject) => {
      crypto.randomBytes(length, (err, salt) => {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        return resolve(salt);
      });
    });
  },

  generateSaltSync (length) {
    'use strict';

    console.warn('The synchronous API is deprecated, use ES6 await instead.');
    length = typeof length === 'undefined' ? 16 : length;
    return crypto.randomBytes(length);
  },

  verify (hash, plain) {
    'use strict';

    return bindings.verify(hash, plain, /argon2d/.test(hash));
  },

  verifySync (hash, plain) {
    'use strict';

    console.warn('The synchronous API is deprecated, use ES6 await instead.');
    return bindings.verifySync(hash, plain, /argon2d/.test(hash));
  }
};
