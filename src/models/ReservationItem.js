const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReservationItem = sequelize.define(
    'ReservationItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      reservation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'reservations', key: 'id' },
      },
      condo_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'condo_items', key: 'id' },
      },
      quantity_requested: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      quantity_returned: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'reservation_items',
      timestamps: true,
    }
  );

  ReservationItem.associate = (models) => {
    ReservationItem.belongsTo(models.Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
    ReservationItem.belongsTo(models.CondoItem, { foreignKey: 'condo_item_id', as: 'condoItem' });
  };

  return ReservationItem;
};
