const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckoutForm = sequelize.define(
    'CheckoutForm',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      reservation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'reservations', key: 'id' },
      },
      submitted_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      approved_by: {
        type: DataTypes.UUID,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
      },
      key_returned: { type: DataTypes.BOOLEAN, defaultValue: false },
      notes: { type: DataTypes.TEXT },
      observations: { type: DataTypes.TEXT },
    },
    {
      tableName: 'checkout_forms',
      timestamps: true,
    }
  );

  CheckoutForm.associate = (models) => {
    CheckoutForm.belongsTo(models.Reservation, { foreignKey: 'reservation_id', as: 'reservation' });
    CheckoutForm.belongsTo(models.User, { foreignKey: 'submitted_by', as: 'submitter' });
    CheckoutForm.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
  };

  return CheckoutForm;
};
