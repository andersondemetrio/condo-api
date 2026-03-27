const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reservation = sequelize.define(
    'Reservation',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      area_type: {
        type: DataTypes.ENUM('COURT', 'KIOSK', 'PARTY_ROOM'),
        allowNull: false,
      },
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
    },
    {
      tableName: 'reservations',
      timestamps: true,
      indexes: [
        { fields: ['date'] },
        { fields: ['status'] },
        { fields: ['user_id'] },
        { fields: ['area_type'] },
      ],
    }
  );

  Reservation.associate = (models) => {
    Reservation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Reservation.hasMany(models.ReservationItem, { foreignKey: 'reservation_id', as: 'items' });
    Reservation.hasOne(models.CheckoutForm, { foreignKey: 'reservation_id', as: 'checkoutForm' });
  };

  return Reservation;
};
