'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('reservation_items', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      reservation_id: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'reservations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      condo_item_id: {
        type: DataTypes.UUID, allowNull: false,
        references: { model: 'condo_items', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      quantity_requested: { type: DataTypes.INTEGER, allowNull: false },
      quantity_returned: { type: DataTypes.INTEGER, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('reservation_items');
  },
};
