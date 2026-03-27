const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CondoItem = sequelize.define(
    'CondoItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      total_quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
      created_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'condo_items',
      timestamps: true,
    }
  );

  CondoItem.associate = (models) => {
    CondoItem.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    CondoItem.hasMany(models.ReservationItem, { foreignKey: 'condo_item_id', as: 'reservationItems' });
  };

  return CondoItem;
};
