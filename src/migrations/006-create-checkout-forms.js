'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('checkout_forms', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      reservation_id: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'reservations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      submitted_by: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      approved_by: {
        type: DataTypes.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
      },
      key_returned: { type: DataTypes.BOOLEAN, defaultValue: false },
      notes: { type: DataTypes.TEXT },
      observations: { type: DataTypes.TEXT },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('checkout_forms', ['status']);
    await queryInterface.addIndex('checkout_forms', ['reservation_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('checkout_forms');
  },
};
