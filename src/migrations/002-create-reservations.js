'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('reservations', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      area_type: { type: DataTypes.ENUM('COURT', 'KIOSK', 'PARTY_ROOM'), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      start_time: { type: DataTypes.TIME },
      end_time: { type: DataTypes.TIME },
      guests: { type: DataTypes.INTEGER, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'FINISHED', 'CANCELLED'),
        defaultValue: 'CONFIRMED',
      },
      notes: { type: DataTypes.TEXT },
      rejection_reason: { type: DataTypes.TEXT },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('reservations', ['date']);
    await queryInterface.addIndex('reservations', ['status']);
    await queryInterface.addIndex('reservations', ['user_id']);
    await queryInterface.addIndex('reservations', ['area_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reservations');
  },
};
