import { deliveryRepository } from "../repositories/delivery.repository.js";
import { DELIVERY_STATUS } from "../constants/index.js";
import { InvalidIdentifierError, InvalidStateError } from "../errors/app-error.js";
import { parsePagination, createPaginationMetadata } from "../utils/pagination.js";

const validId = (id) => typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);

export const deliveryService = {
  getDeliveries: async (query = {}) => {
    const pagination = parsePagination(query);
    const { status, driverId, orderId } = query;

    if (status !== undefined && !Object.values(DELIVERY_STATUS).includes(status)) {
      throw new InvalidStateError(status);
    }
    if (driverId !== undefined && !validId(driverId)) {
      throw new InvalidIdentifierError("repartidor");
    }
    if (orderId !== undefined && !validId(orderId)) {
      throw new InvalidIdentifierError("pedido");
    }

    const result = await deliveryRepository.findAll({ ...pagination, status, driverId, orderId });
    return {
      items: result.items,
      pagination: createPaginationMetadata({ ...pagination, total: result.total }),
    };
  },
};
