const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Hash password with high performance PBKDF2 (Native C++ bound in Node)
 * @param {string} password 
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`pbkdf2$${salt}$${derivedKey.toString('hex')}`);
    });
  });
};

/**
 * Compare password supporting both legacy bcryptjs and native PBKDF2
 * @param {string} enteredPassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
const comparePassword = async (enteredPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  
  if (hashedPassword.startsWith('pbkdf2$')) {
    const parts = hashedPassword.split('$');
    const salt = parts[1];
    const hash = parts[2];
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(enteredPassword, salt, 1000, 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey.toString('hex') === hash);
      });
    });
  }
  
  // Fallback to bcryptjs for legacy users
  try {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  } catch (err) {
    console.error('Bcrypt comparison error:', err);
    return false;
  }
};

module.exports = {
  hashPassword,
  comparePassword
};
