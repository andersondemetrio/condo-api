
jest.mock('../models', () => ({
  CondoItem: { findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  ReservationItem: { sum: jest.fn() },
  Reservation: {},
  User: {},
  Holiday: {},
  CheckoutForm: {},
  sequelize: {},
}));

const { assertItemsAvailable } = require('../services/reservation.service');
const condoItemService = require('../services/condo-item.service');
const { CondoItem, ReservationItem } = require('../models');

const FUTURE_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return d.toISOString().split('T')[0];
})();

beforeEach(() => jest.clearAllMocks());

describe('availableQty — logica de disponibilidade', () => {
  test('available = total - reservado', async () => {
    CondoItem.findAll.mockResolvedValue([
      { id: 'item-1', name: 'Cadeira', total_quantity: 20, toJSON: () => ({ id: 'item-1', name: 'Cadeira', total_quantity: 20 }) },
    ]);
    ReservationItem.sum.mockResolvedValue(8);

    const result = await condoItemService.list(FUTURE_DATE);
    expect(result[0].available_quantity).toBe(12);
  });

  test('available = total quando nenhuma reserva', async () => {
    CondoItem.findAll.mockResolvedValue([
      { id: 'item-1', name: 'Mesa', total_quantity: 10, toJSON: () => ({ id: 'item-1', name: 'Mesa', total_quantity: 10 }) },
    ]);
    ReservationItem.sum.mockResolvedValue(0);

    const result = await condoItemService.list(FUTURE_DATE);
    expect(result[0].available_quantity).toBe(10);
  });

  test('available = 0 quando totalmente reservado', async () => {
    CondoItem.findAll.mockResolvedValue([
      { id: 'item-1', name: 'Forno', total_quantity: 1, toJSON: () => ({ id: 'item-1', name: 'Forno', total_quantity: 1 }) },
    ]);
    ReservationItem.sum.mockResolvedValue(1);

    const result = await condoItemService.list(FUTURE_DATE);
    expect(result[0].available_quantity).toBe(0);
  });

  test('reserva com qty maior que disponivel lanca 409', async () => {
    CondoItem.findByPk.mockResolvedValue({ id: 'item-1', name: 'Talher', total_quantity: 10 });
    ReservationItem.sum.mockResolvedValue(8);

    await expect(
      assertItemsAvailable([{ condo_item_id: 'item-1', quantity_requested: 5 }], FUTURE_DATE)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('reserva com qty exatamente disponivel e permitida', async () => {
    CondoItem.findByPk.mockResolvedValue({ id: 'item-1', name: 'Cadeira', total_quantity: 10 });
    ReservationItem.sum.mockResolvedValue(6);

    await expect(
      assertItemsAvailable([{ condo_item_id: 'item-1', quantity_requested: 4 }], FUTURE_DATE)
    ).resolves.not.toThrow();
  });
});

describe('condoItemService.create', () => {
  test('cria item com dados validos', async () => {
    const newItem = { id: 'item-new', name: 'Espeto', total_quantity: 5 };
    CondoItem.create.mockResolvedValue(newItem);

    const result = await condoItemService.create({ name: 'Espeto', total_quantity: 5 }, 'user-001');
    expect(CondoItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Espeto', total_quantity: 5, created_by: 'user-001' })
    );
    expect(result.name).toBe('Espeto');
  });
});

describe('condoItemService.update', () => {
  test('atualiza item existente', async () => {
    const mockItem = {
      id: 'item-1',
      name: 'Cadeira',
      total_quantity: 20,
      update: jest.fn().mockResolvedValue(true),
      reload: jest.fn().mockResolvedValue({ id: 'item-1', name: 'Cadeira Nova', total_quantity: 30 }),
    };
    CondoItem.findByPk.mockResolvedValue(mockItem);

    const result = await condoItemService.update('item-1', { name: 'Cadeira Nova', total_quantity: 30 });
    expect(mockItem.update).toHaveBeenCalledWith({ name: 'Cadeira Nova', total_quantity: 30 });
  });

  test('lanca 404 para item inexistente', async () => {
    CondoItem.findByPk.mockResolvedValue(null);
    await expect(condoItemService.update('nao-existe', { name: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
