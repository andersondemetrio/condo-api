const { CondoItem, ReservationItem, Reservation } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

const list = async (date) => {
  const items = await CondoItem.findAll({ order: [['name', 'ASC']] });

  if (!date) return items;

  return Promise.all(
    items.map(async (item) => {
      const used = await ReservationItem.sum('quantity_requested', {
        where: { condo_item_id: item.id },
        include: [
          {
            model: Reservation,
            as: 'reservation',
            where: { date, status: { [Op.notIn]: ['REJECTED', 'CANCELLED'] } },
            required: true,
          },
        ],
      });
      return { ...item.toJSON(), available_quantity: item.total_quantity - (used || 0) };
    })
  );
};

const getById = async (id) => {
  const item = await CondoItem.findByPk(id);
  if (!item) throw ApiError.notFound('Item nao encontrado');
  return item;
};

const create = async (data, userId) => {
  return CondoItem.create({ ...data, created_by: userId });
};

const update = async (id, data) => {
  const item = await getById(id);
  await item.update(data);
  return item.reload();
};

module.exports = { list, getById, create, update };
