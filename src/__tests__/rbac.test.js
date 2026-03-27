const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

jest.mock('../models', () => ({
  User: {
    scope: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
    create: jest.fn(),
  },
  Reservation: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }) },
  Holiday: { findAll: jest.fn().mockResolvedValue([]), findOne: jest.fn(), findByPk: jest.fn(), bulkCreate: jest.fn() },
  ReservationItem: { sum: jest.fn(), bulkCreate: jest.fn() },
  CondoItem: { findAll: jest.fn().mockResolvedValue([]), findByPk: jest.fn() },
  CheckoutForm: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn().mockResolvedValue([]) },
  sequelize: { authenticate: jest.fn() },
}));

jest.mock('../services/email.service', () => ({
  sendReservationConfirmed: jest.fn(),
  sendReservationPending: jest.fn(),
  sendReservationApproved: jest.fn(),
  sendReservationRejected: jest.fn(),
  sendReservationCancelled: jest.fn(),
  sendCheckoutApproved: jest.fn(),
  sendCheckoutRejected: jest.fn(),
}));

// Helper: gera token JWT para testes
const makeToken = (role, id = 'user-test-001') => {
  return jwt.sign(
    { id, email: `${role.toLowerCase()}@test.com`, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

describe('RBAC — controle de acesso por role', () => {
  // GET /api/users — apenas ADMIN
  describe('GET /api/users', () => {
    test('ADMIN acessa lista de usuarios', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`);
      expect(res.status).toBe(200);
    });

    test('OPERATOR recebe 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${makeToken('OPERATOR')}`);
      expect(res.status).toBe(403);
    });

    test('RESIDENT recebe 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`);
      expect(res.status).toBe(403);
    });

    test('sem token recebe 401', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  // POST /api/users/resident — apenas ADMIN
  describe('POST /api/users/resident', () => {
    const payload = {
      name: 'Novo Morador',
      email: 'novo@test.com',
      password: 'Senha@1234',
    };

    test('OPERATOR nao pode criar morador (403)', async () => {
      const res = await request(app)
        .post('/api/users/resident')
        .set('Authorization', `Bearer ${makeToken('OPERATOR')}`)
        .send(payload);
      expect(res.status).toBe(403);
    });

    test('RESIDENT nao pode criar morador (403)', async () => {
      const res = await request(app)
        .post('/api/users/resident')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`)
        .send(payload);
      expect(res.status).toBe(403);
    });
  });

  // GET /api/users/:id — ADMIN acessa qualquer, RESIDENT so o proprio
  describe('GET /api/users/:id', () => {
    const { User } = require('../models');

    test('RESIDENT acessa proprio perfil', async () => {
      const myId = 'my-user-id';
      User.findByPk.mockResolvedValue({
        id: myId, name: 'Eu', email: 'eu@test.com', role: 'RESIDENT', active: true,
      });

      const res = await request(app)
        .get(`/api/users/${myId}`)
        .set('Authorization', `Bearer ${makeToken('RESIDENT', myId)}`);
      expect(res.status).toBe(200);
    });

    test('RESIDENT nao acessa perfil de outro usuario (403)', async () => {
      const res = await request(app)
        .get('/api/users/outro-usuario-id')
        .set('Authorization', `Bearer ${makeToken('RESIDENT', 'meu-id')}`);
      expect(res.status).toBe(403);
    });

    test('ADMIN acessa qualquer perfil', async () => {
      User.findByPk.mockResolvedValue({
        id: 'qualquer-id', name: 'Alguem', email: 'alguem@test.com', role: 'RESIDENT', active: true,
      });

      const res = await request(app)
        .get('/api/users/qualquer-id')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`);
      expect(res.status).toBe(200);
    });
  });

  // GET /api/reservations — ADMIN e OPERATOR
  describe('GET /api/reservations', () => {
    test('ADMIN lista reservas', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`);
      expect(res.status).toBe(200);
    });

    test('OPERATOR lista reservas', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${makeToken('OPERATOR')}`);
      expect(res.status).toBe(200);
    });

    test('RESIDENT recebe 403 no listing geral', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`);
      expect(res.status).toBe(403);
    });
  });

  // PATCH /api/reservations/:id/approve — ADMIN e OPERATOR
  describe('PATCH /api/reservations/:id/approve', () => {
    test('RESIDENT nao pode aprovar reserva (403)', async () => {
      const res = await request(app)
        .patch('/api/reservations/res-001/approve')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`);
      expect(res.status).toBe(403);
    });
  });

  // GET /api/holidays — todos autenticados
  describe('GET /api/holidays', () => {
    test('RESIDENT acessa feriados', async () => {
      const res = await request(app)
        .get('/api/holidays')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /api/holidays — ADMIN e OPERATOR
  describe('POST /api/holidays', () => {
    test('RESIDENT nao pode criar feriado (403)', async () => {
      const res = await request(app)
        .post('/api/holidays')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`)
        .send({ name: 'Feriado Teste', date: '2027-12-25', type: 'NATIONAL' });
      expect(res.status).toBe(403);
    });
  });

  // GET /api/checkout-forms/pending — ADMIN e OPERATOR
  describe('GET /api/checkout-forms/pending', () => {
    test('RESIDENT nao acessa lista de conferencias pendentes (403)', async () => {
      const res = await request(app)
        .get('/api/checkout-forms/pending')
        .set('Authorization', `Bearer ${makeToken('RESIDENT')}`);
      expect(res.status).toBe(403);
    });

    test('OPERATOR acessa conferencias pendentes', async () => {
      const res = await request(app)
        .get('/api/checkout-forms/pending')
        .set('Authorization', `Bearer ${makeToken('OPERATOR')}`);
      expect(res.status).toBe(200);
    });
  });

  // Rota inexistente
  describe('Rotas inexistentes', () => {
    test('retorna 404 para rota nao mapeada', async () => {
      const res = await request(app)
        .get('/api/nao-existe')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`);
      expect(res.status).toBe(404);
    });
  });
});
