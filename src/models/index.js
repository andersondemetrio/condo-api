const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.url, config);

const db = {};

db.User = require('./User')(sequelize);
db.Reservation = require('./Reservation')(sequelize);
db.Holiday = require('./Holiday')(sequelize);
db.CondoItem = require('./CondoItem')(sequelize);
db.ReservationItem = require('./ReservationItem')(sequelize);
db.CheckoutForm = require('./CheckoutForm')(sequelize);

// Run all associations
Object.values(db).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
