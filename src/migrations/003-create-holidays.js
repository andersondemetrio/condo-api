'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('holidays', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      type: { type: DataTypes.ENUM('NATIONAL', 'LOCAL', 'CUSTOM'), defaultValue: 'CUSTOM' },
      recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_by: {
        type: DataTypes.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('holidays', ['date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('holidays');
  },
};
