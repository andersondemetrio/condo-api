
// Mock models
jest.mock('../models', () => ({
  Reservation: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Holiday: { findOne: jest.fn() },
  ReservationItem: { sum: jest.fn(), bulkCreate: jest.fn() },
  CondoItem: { findByPk: jest.fn() },
  User: { findByPk: jest.fn() },
  CheckoutForm: {},
  sequelize: {},
}));

jest.mock('../services/email.service', () => ({
  sendReservationConfirmed: jest.fn().mockResolvedValue(true),
  sendReservationPending: jest.fn().mockResolvedValue(true),
  sendReservationApproved: jest.fn().mockResolvedValue(true),
  sendReservationRejected: jest.fn().mockResolvedValue(true),
  sendReservationCancelled: jest.fn().mockResolvedValue(true),
}));

const {
  assertFutureDate,
  assertNotHoliday,
  assertAreaAvailable,
  assertUserNoDoubleBooking,
  assertItemsAvailable,
  approve,
  reject,
  cancel,
  create,
} = require('../services/reservation.service');

const { Reservation, Holiday, ReservationItem, CondoItem, User } = require('../models');

const FUTURE_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
})();

const PAST_DATE = '2020-01-01';

const mockReservation = (overrides = {}) => ({
  id: 'res-001',
  user_id: 'user-001',
  area_type: 'COURT',
  date: FUTURE_DATE,
  status: 'CONFIRMED',
  start_time: '10:00',
  end_time: '12:00',
  update: jest.fn().mockResolvedValue(true),
  reload: jest.fn().mockResolvedValue(true),
  toJSON: jest.fn().mockReturnThis(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// ── assertFutureDate ──────────────────────────────────────────────
describe('assertFutureDate', () => {
  test('nao lanca erro para data futura', () => {
    expect(() => assertFutureDate(FUTURE_DATE)).not.toThrow();
  });

  test('lanca ApiError 422 para data passada', () => {
    expect(() => assertFutureDate(PAST_DATE)).toThrow(
      expect.objectContaining({ statusCode: 422 })
    );
  });

  test('lanca ApiError 422 para data de hoje', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(() => assertFutureDate(today)).toThrow(
      expect.objectContaining({ statusCode: 422 })
    );
  });
});

// ── assertNotHoliday ─────────────────────────────────────────────
describe('assertNotHoliday', () => {
  test('nao lanca erro quando nao e feriado', async () => {
    Holiday.findOne.mockResolvedValue(null);
    await expect(assertNotHoliday(FUTURE_DATE)).resolves.not.toThrow();
  });

  test('lanca ApiError 422 quando e feriado', async () => {
    Holiday.findOne.mockResolvedValue({ id: 'h-001', name: 'Natal' });
    await expect(assertNotHoliday(FUTURE_DATE)).rejects.toMatchObject({ statusCode: 422 });
  });
});

// ── assertAreaAvailable ───────────────────────────────────────────
describe('assertAreaAvailable', () => {
  test('nao lanca erro quando area esta livre', async () => {
    Reservation.findOne.mockResolvedValue(null);
    await expect(assertAreaAvailable('COURT', FUTURE_DATE)).resolves.not.toThrow();
  });

  test('lanca ApiError 409 quando area ja esta reservada', async () => {
    Reservation.findOne.mockResolvedValue(mockReservation());
    await expect(assertAreaAvailable('COURT', FUTURE_DATE)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('funciona para todos os tipos de area', async () => {
    Reservation.findOne.mockResolvedValue(mockReservation());
    for (const area of ['COURT', 'KIOSK', 'PARTY_ROOM']) {
      await expect(assertAreaAvailable(area, FUTURE_DATE)).rejects.toMatchObject({ statusCode: 409 });
    }
  });
});

// ── assertUserNoDoubleBooking ─────────────────────────────────────
describe('assertUserNoDoubleBooking', () => {
  test('nao lanca erro quando usuario nao tem reserva no dia', async () => {
    Reservation.findOne.mockResolvedValue(null);
    await expect(assertUserNoDoubleBooking('user-001', FUTURE_DATE)).resolves.not.toThrow();
  });

  test('lanca ApiError 409 quando usuario ja tem reserva no dia', async () => {
    Reservation.findOne.mockResolvedValue(mockReservation());
    await expect(assertUserNoDoubleBooking('user-001', FUTURE_DATE)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

// ── assertItemsAvailable ──────────────────────────────────────────
describe('assertItemsAvailable', () => {
  test('nao lanca erro quando itens disponiveis', async () => {
    CondoItem.findByPk.mockResolvedValue({ id: 'item-001', name: 'Cadeira', total_quantity: 20 });
    ReservationItem.sum.mockResolvedValue(5);

    await expect(
      assertItemsAvailable([{ condo_item_id: 'item-001', quantity_requested: 10 }], FUTURE_DATE)
    ).resolves.not.toThrow();
  });

  test('lanca ApiError 409 quando quantidade excede disponivel', async () => {
    CondoItem.findByPk.mockResolvedValue({ id: 'item-001', name: 'Cadeira', total_quantity: 10 });
    ReservationItem.sum.mockResolvedValue(8);

    await expect(
      assertItemsAvailable([{ condo_item_id: 'item-001', quantity_requested: 5 }], FUTURE_DATE)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('lanca ApiError 404 quando item nao existe', async () => {
    CondoItem.findByPk.mockResolvedValue(null);

    await expect(
      assertItemsAvailable([{ condo_item_id: 'nao-existe', quantity_requested: 1 }], FUTURE_DATE)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── create ────────────────────────────────────────────────────────
describe('create', () => {
  const mockUser = { id: 'user-001', name: 'Maria', email: 'maria@test.com' };

  beforeEach(() => {
    Holiday.findOne.mockResolvedValue(null);
    Reservation.findOne.mockResolvedValue(null);
    User.findByPk.mockResolvedValue(mockUser);
  });

  test('Quadra cria com status CONFIRMED', async () => {
    const created = mockReservation({ status: 'CONFIRMED' });
    Reservation.create.mockResolvedValue(created);
    Reservation.findByPk.mockResolvedValue({ ...created, items: [], user: mockUser });

    const result = await create(
      { area_type: 'COURT', date: FUTURE_DATE, items: [] },
      'user-001'
    );

    expect(Reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'CONFIRMED', area_type: 'COURT' })
    );
  });

  test('PARTY_ROOM cria com status PENDING', async () => {
    const created = mockReservation({ area_type: 'PARTY_ROOM', status: 'PENDING' });
    Reservation.create.mockResolvedValue(created);
    Reservation.findByPk.mockResolvedValue({ ...created, items: [], user: mockUser });

    await create({ area_type: 'PARTY_ROOM', date: FUTURE_DATE, items: [] }, 'user-001');

    expect(Reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' })
    );
  });

  test('lanca 422 em data passada', async () => {
    await expect(
      create({ area_type: 'COURT', date: PAST_DATE, items: [] }, 'user-001')
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  test('lanca 422 em feriado', async () => {
    Holiday.findOne.mockResolvedValue({ name: 'Natal' });
    await expect(
      create({ area_type: 'COURT', date: FUTURE_DATE, items: [] }, 'user-001')
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  test('lanca 409 quando area ja reservada', async () => {
    Reservation.findOne.mockResolvedValue(mockReservation());
    await expect(
      create({ area_type: 'COURT', date: FUTURE_DATE, items: [] }, 'user-001')
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ── approve ───────────────────────────────────────────────────────
describe('approve', () => {
  test('aprova reserva PENDING e muda status', async () => {
    const res = mockReservation({ status: 'PENDING' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: { email: 'x@x.com', name: 'X' } });
    User.findByPk.mockResolvedValue({ email: 'x@x.com', name: 'X' });

    await approve('res-001');

    expect(res.update).toHaveBeenCalledWith({ status: 'CONFIRMED' });
  });

  test('lanca 422 ao tentar aprovar reserva ja CONFIRMED', async () => {
    const res = mockReservation({ status: 'CONFIRMED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: {} });

    await expect(approve('res-001')).rejects.toMatchObject({ statusCode: 422 });
  });
});

// ── reject ────────────────────────────────────────────────────────
describe('reject', () => {
  test('rejeita reserva PENDING com motivo', async () => {
    const res = mockReservation({ status: 'PENDING' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: { email: 'x@x.com', name: 'X' } });
    User.findByPk.mockResolvedValue({ email: 'x@x.com', name: 'X' });

    await reject('res-001', 'Motivo valido');

    expect(res.update).toHaveBeenCalledWith({
      status: 'REJECTED',
      rejection_reason: 'Motivo valido',
    });
  });

  test('lanca 422 ao rejeitar reserva nao-PENDING', async () => {
    const res = mockReservation({ status: 'CANCELLED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: {} });

    await expect(reject('res-001', 'motivo')).rejects.toMatchObject({ statusCode: 422 });
  });
});

// ── cancel ────────────────────────────────────────────────────────
describe('cancel', () => {
  const adminUser = { id: 'admin-001', role: 'ADMIN' };
  const residentUser = { id: 'user-001', role: 'RESIDENT' };

  test('ADMIN cancela qualquer reserva', async () => {
    const res = mockReservation({ status: 'CONFIRMED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: { email: 'x@x.com', name: 'X' } });
    User.findByPk.mockResolvedValue({ email: 'x@x.com', name: 'X' });

    await cancel('res-001', adminUser);
    expect(res.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
  });

  test('RESIDENT cancela propria reserva futura', async () => {
    const res = mockReservation({ user_id: 'user-001', status: 'CONFIRMED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: { email: 'x@x.com', name: 'X' } });
    User.findByPk.mockResolvedValue({ email: 'x@x.com', name: 'X' });

    await cancel('res-001', residentUser);
    expect(res.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
  });

  test('RESIDENT nao pode cancelar reserva de outro usuario', async () => {
    const res = mockReservation({ user_id: 'outro-user-999', status: 'CONFIRMED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: {} });

    await expect(cancel('res-001', residentUser)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('RESIDENT nao pode cancelar reserva passada', async () => {
    const res = mockReservation({ user_id: 'user-001', status: 'CONFIRMED', date: PAST_DATE });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: {} });

    await expect(cancel('res-001', residentUser)).rejects.toMatchObject({ statusCode: 422 });
  });

  test('nao pode cancelar reserva ja CANCELLED', async () => {
    const res = mockReservation({ status: 'CANCELLED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: {} });

    await expect(cancel('res-001', adminUser)).rejects.toMatchObject({ statusCode: 422 });
  });

  test('nao pode cancelar reserva ja FINISHED', async () => {
    const res = mockReservation({ status: 'FINISHED' });
    Reservation.findByPk.mockResolvedValue({ ...res, items: [], user: {} });

    await expect(cancel('res-001', adminUser)).rejects.toMatchObject({ statusCode: 422 });
  });
});
