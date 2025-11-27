#!/usr/bin/env node

/**
 * Generate a secure JWT secret
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a secure random 64-byte (512-bit) secret
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n========================================');
console.log('🔐 Generated JWT Secret');
console.log('========================================\n');
console.log(secret);
console.log('\n========================================');
console.log('📋 Next Steps:');
console.log('========================================');
console.log('1. Copy the secret above');
console.log('2. Add it to backend/.env:');
console.log('   JWT_SECRET=' + secret);
console.log('3. Add it to frontend/.env.local:');
console.log('   JWT_SECRET=' + secret);
console.log('4. Restart both frontend and backend servers');
console.log('5. All users will need to sign in again');
console.log('\n⚠️  Keep this secret secure and never commit it to git!\n');
