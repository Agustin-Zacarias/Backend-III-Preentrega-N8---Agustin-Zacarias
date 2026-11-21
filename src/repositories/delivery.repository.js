import DeliveryModel from "../models/delivery.model.js";

export const deliveryRepository = {
  findAll: async ({ skip, limit, status, driverId, orderId } = {}) => {
    const filter = {};
    if (status) filter.status = status;
    if (driverId) filter.driver = driverId;
    if (orderId) filter.order = orderId;

    const [items, total] = await Promise.all([
      DeliveryModel.find(filter)
        .select("order driver status assignedAt deliveredAt createdAt updatedAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryModel.countDocuments(filter),
    ]);
    return { items, total };
  },
};
