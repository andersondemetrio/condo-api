const { Op } = require('sequelize');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const list = async ({ role, search, block, page = 1, limit = 20 }) => {
  const where = { active: true };
  if (role) where.role = role;
  if (block) where.block = block;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { apartment: { [Op.iLike]: `%${search}%` } },
    ];
  }
  const offset = (page - 1) * limit;
  const { count, rows } = await User.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [['name', 'ASC']],
  });
  return { total: count, page: Number(page), pages: Math.ceil(count / limit), data: rows };
};

const getById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('Usuário não encontrado');
  return user;
};

const create = async (data, role) => {
  const exists = await User.findOne({ where: { email: data.email } });
  if (exists) throw ApiError.conflict('E-mail já cadastrado');
  return User.create({ ...data, password_hash: data.password, role });
};

const update = async (id, data) => {
  const user = await getById(id);
  if (data.password) {
    data.password_hash = data.password;
    delete data.password;
  }
  await user.update(data);
  return user.reload();
};

const deactivate = async (id) => {
  const user = await getById(id);
  await user.update({ active: false });
};

const updatePhoto = async (id, photoUrl) => {
  const user = await getById(id);
  await user.update({ photo_url: photoUrl });
  return user.reload();
};

module.exports = { list, getById, create, update, deactivate, updatePhoto };
