import OrderModel from "../models/order.model.js";

export const orderRepository = {
  findAll: async ({ skip, limit, status, priority, userId } = {}) => {
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (userId) filter.user = userId;

    const [items, total] = await Promise.all([
      OrderModel.find(filter)
        .select("user items total shippingAddress status priority createdAt updatedAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(filter),
    ]);
    return { items, total };
  },
  findById: (id) => OrderModel.findById(id).lean(),
  create: async (data) => {
    const order = await OrderModel.create(data);
    return OrderModel.findById(order._id).lean();
  },
  updateStatus: (id, status) =>
    OrderModel.findByIdAndUpdate(id, { status }, { new: true, runValidators: true }).lean(),
};
