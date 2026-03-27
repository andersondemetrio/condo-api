'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('users', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('ADMIN', 'OPERATOR', 'RESIDENT'), allowNull: false },
      phone: { type: DataTypes.STRING },
      sex: { type: DataTypes.ENUM('M', 'F', 'OTHER') },
      age: { type: DataTypes.INTEGER },
      block: { type: DataTypes.STRING },
      apartment: { type: DataTypes.STRING },
      photo_url: { type: DataTypes.STRING },
      is_syndic: { type: DataTypes.BOOLEAN, defaultValue: false },
      mandate_date: { type: DataTypes.DATEONLY },
      company: { type: DataTypes.STRING },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
