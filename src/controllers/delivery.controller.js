import { asyncHandler } from "../middlewares/async-handler.js";
import { deliveryService } from "../services/delivery.service.js";

export const getDeliveries = asyncHandler(async (req, res) => {
  const result = await deliveryService.getDeliveries(req.query);
  return res.status(200).json({
    status: "success",
    payload: result.items,
    pagination: result.pagination,
  });
});
