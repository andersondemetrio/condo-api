const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('ADMIN', 'OPERATOR', 'RESIDENT'), allowNull: false },
      phone: { type: DataTypes.STRING },
      sex: { type: DataTypes.ENUM('M', 'F', 'OTHER') },
      age: { type: DataTypes.INTEGER, validate: { min: 0, max: 120 } },
      block: { type: DataTypes.STRING },
      apartment: { type: DataTypes.STRING },
      photo_url: { type: DataTypes.STRING },
      is_syndic: { type: DataTypes.BOOLEAN, defaultValue: false },
      mandate_date: { type: DataTypes.DATEONLY },
      company: { type: DataTypes.STRING },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'users',
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['password_hash'] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  User.addHook('beforeCreate', async (user) => {
    if (user.password_hash) {
      user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
  });

  User.addHook('beforeUpdate', async (user) => {
    if (user.changed('password_hash') && user.password_hash) {
      user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
  });

  User.prototype.checkPassword = function (plain) {
    return bcrypt.compare(plain, this.password_hash);
  };

  User.associate = (models) => {
    User.hasMany(models.Reservation, { foreignKey: 'user_id', as: 'reservations' });
    User.hasMany(models.CheckoutForm, { foreignKey: 'submitted_by', as: 'submittedForms' });
    User.hasMany(models.CheckoutForm, { foreignKey: 'approved_by', as: 'approvedForms' });
    User.hasMany(models.Holiday, { foreignKey: 'created_by', as: 'holidays' });
    User.hasMany(models.CondoItem, { foreignKey: 'created_by', as: 'condoItems' });
  };

  return User;
};
