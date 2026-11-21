import { orderRepository } from "../repositories/order.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { ORDER_PRIORITY, ORDER_STATUS, USER_ROLES } from "../constants/index.js";
import { InvalidIdentifierError, InvalidStateError, OrderNotFoundError, UserNotFoundError, ValidationError } from "../errors/app-error.js";
import logger from "../logger/logger.js";
import { parsePagination, createPaginationMetadata } from "../utils/pagination.js";

const validId = (id) => typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
const validateId = (id) => { if (!validId(id)) throw new InvalidIdentifierError("pedido"); };

const validateOrder = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError("El cuerpo de la solicitud debe ser un objeto JSON.");
  }
  if (data.user === undefined || data.user === null || data.user === "") {
    throw new ValidationError("El usuario del pedido es obligatorio.");
  }
  if (!validId(data.user)) throw new InvalidIdentifierError("usuario");
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ValidationError("El pedido debe contener al menos un producto.");
  }
  if (data.items.length > 50) {
    throw new ValidationError("Un pedido no puede contener más de 50 ítems.");
  }
  for (const item of data.items) {
    if (!item || typeof item.productName !== "string" || !item.productName.trim() ||
        !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 ||
        !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
      throw new ValidationError("Cada ítem debe incluir productName, quantity entero positivo y unitPrice mayor que cero.");
    }
  }
  const address = data.shippingAddress;
  if (!address || ["street", "city", "province", "postalCode"].some(
    (field) => typeof address[field] !== "string" || !address[field].trim(),
  )) {
    throw new ValidationError("La dirección de envío debe incluir street, city, province y postalCode.");
  }
  const calculatedTotal = Number(data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0,
  ).toFixed(2));
  if (!Number.isFinite(Number(data.total)) || Number(data.total) <= 0 ||
      Math.abs(Number(data.total) - calculatedTotal) > 0.01) {
    throw new ValidationError("El total debe coincidir con la suma de los ítems.");
  }
  if (data.status !== undefined && !Object.values(ORDER_STATUS).includes(data.status)) {
    throw new InvalidStateError(data.status);
  }
  if (data.priority !== undefined && !Object.values(ORDER_PRIORITY).includes(data.priority)) {
    throw new ValidationError("La prioridad indicada no es válida.");
  }
};

export const orderService = {
  getOrders: async (query = {}) => {
    const pagination = parsePagination(query);
    const { status, priority, userId } = query;
    if (status !== undefined && !Object.values(ORDER_STATUS).includes(status)) {
      throw new InvalidStateError(status);
    }
    if (priority !== undefined && !Object.values(ORDER_PRIORITY).includes(priority)) {
      throw new ValidationError("El filtro priority no es válido.");
    }
    if (userId !== undefined && !validId(userId)) {
      throw new InvalidIdentifierError("usuario");
    }
    const result = await orderRepository.findAll({ ...pagination, status, priority, userId });
    return {
      items: result.items,
      pagination: createPaginationMetadata({ ...pagination, total: result.total }),
    };
  },
  getOrderById: async (id) => {
    validateId(id);
    const order = await orderRepository.findById(id);
    if (!order) throw new OrderNotFoundError();
    return order;
  },
  createOrder: async (data = {}) => {
    validateOrder(data);
    const user = await userRepository.findById(data.user);
    if (!user || user.role !== USER_ROLES.USER) throw new UserNotFoundError();

    const order = await orderRepository.create({
      user: data.user,
      items: data.items.map((item) => ({
        productName: item.productName.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      total: Number(data.total),
      shippingAddress: Object.fromEntries(
        ["street", "city", "province", "postalCode"].map((field) => [field, data.shippingAddress[field].trim()]),
      ),
      ...(data.status ? { status: data.status } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
    });
    logger.info("Pedido creado correctamente.", { orderId: order._id.toString(), userId: data.user });
    return order;
  },
  updateOrderStatus: async (id, status) => {
    validateId(id);
    if (typeof status !== "string" || !Object.values(ORDER_STATUS).includes(status)) {
      throw new InvalidStateError(status);
    }
    const order = await orderRepository.updateStatus(id, status);
    if (!order) throw new OrderNotFoundError();
    logger.info("Estado de pedido actualizado.", { orderId: id, status });
    return order;
  },
};
