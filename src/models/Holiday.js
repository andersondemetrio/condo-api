const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Holiday = sequelize.define(
    'Holiday',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      type: {
        type: DataTypes.ENUM('NATIONAL', 'LOCAL', 'CUSTOM'),
        defaultValue: 'CUSTOM',
      },
      recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
      created_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
    },
    {
      tableName: 'holidays',
      timestamps: true,
      indexes: [{ fields: ['date'] }],
    }
  );

  Holiday.associate = (models) => {
    Holiday.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return Holiday;
};
