const { Holiday } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

const list = async ({ month, year }) => {
  const where = {};
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    where.date = { [Op.between]: [start, end] };
  }
  return Holiday.findAll({ where, order: [['date', 'ASC']] });
};

const getById = async (id) => {
  const holiday = await Holiday.findByPk(id);
  if (!holiday) throw ApiError.notFound('Feriado nao encontrado');
  return holiday;
};

const create = async (data, userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(data.date) < today) throw ApiError.unprocessable('Data nao pode estar no passado');

  const records = [{ ...data, created_by: userId }];

  if (data.recurring) {
    const base = new Date(data.date);
    const nextYear = new Date(base);
    nextYear.setFullYear(base.getFullYear() + 1);
    records.push({
      ...data,
      date: nextYear.toISOString().split('T')[0],
      created_by: userId,
    });
  }

  return Holiday.bulkCreate(records, { returning: true });
};

const update = async (id, data) => {
  const holiday = await getById(id);
  await holiday.update(data);
  return holiday.reload();
};

const remove = async (id) => {
  const holiday = await getById(id);
  await holiday.destroy();
};

module.exports = { list, getById, create, update, remove };
