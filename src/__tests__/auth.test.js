const request = require('supertest');
const app = require('../app');

// Mock do Sequelize/models para nao precisar de banco real nos testes
jest.mock('../models', () => {
  const mockUser = {
    id: 'user-uuid-001',
    name: 'Joao Silva',
    email: 'joao@test.com',
    role: 'RESIDENT',
    active: true,
    password_hash: '$2a$12$hashedpassword',
    toJSON: () => ({
      id: 'user-uuid-001',
      name: 'Joao Silva',
      email: 'joao@test.com',
      role: 'RESIDENT',
      active: true,
    }),
    checkPassword: jest.fn(),
    update: jest.fn(),
  };

  return {
    User: {
      scope: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
      create: jest.fn(),
    },
    Reservation: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    Holiday: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() },
    ReservationItem: { sum: jest.fn(), bulkCreate: jest.fn() },
    CondoItem: { findAll: jest.fn(), findByPk: jest.fn() },
    CheckoutForm: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    sequelize: { authenticate: jest.fn(), close: jest.fn() },
    _mockUser: mockUser,
  };
});

jest.mock('../services/email.service', () => ({
  sendReservationConfirmed: jest.fn(),
  sendReservationPending: jest.fn(),
  sendReservationApproved: jest.fn(),
  sendReservationRejected: jest.fn(),
  sendReservationCancelled: jest.fn(),
  sendReservationReminder: jest.fn(),
  sendCheckoutApproved: jest.fn(),
  sendCheckoutRejected: jest.fn(),
}));

const { User, _mockUser } = require('../models');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/login', () => {
  test('retorna tokens com credenciais validas', async () => {
    User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(_mockUser) });
    _mockUser.checkPassword.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@test.com', password: 'Senha@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  test('retorna 401 com senha errada', async () => {
    User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(_mockUser) });
    _mockUser.checkPassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@test.com', password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('retorna 401 com usuario inexistente', async () => {
    User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@test.com', password: 'qualquer' });

    expect(res.status).toBe(401);
  });

  test('retorna 403 com usuario inativo', async () => {
    const inactiveUser = { ..._mockUser, active: false, checkPassword: jest.fn().mockResolvedValue(true) };
    User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(inactiveUser) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@test.com', password: 'Senha@1234' });

    expect(res.status).toBe(403);
  });

  test('retorna 400 com email invalido', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao-e-email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('retorna 400 sem campos obrigatorios', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  test('retorna novo accessToken com refreshToken valido', async () => {
    // Primeiro faz login para pegar refresh token real
    User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(_mockUser) });
    _mockUser.checkPassword.mockResolvedValue(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@test.com', password: 'Senha@1234' });

    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  test('retorna 401 com refreshToken invalido', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token.invalido.aqui' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('retorna dados do usuario com token valido', async () => {
    User.scope.mockReturnValue({ findOne: jest.fn().mockResolvedValue(_mockUser) });
    _mockUser.checkPassword.mockResolvedValue(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@test.com', password: 'Senha@1234' });

    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('role');
  });

  test('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('retorna 401 com token expirado/invalido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.invalido');

    expect(res.status).toBe(401);
  });
});
