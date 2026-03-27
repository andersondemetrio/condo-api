'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('Admin@1234', 12);
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Síndico Admin',
        email: 'admin@condominio.com',
        password_hash: hash,
        role: 'ADMIN',
        is_syndic: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@condominio.com' });
  },
};
