import mongoose from "mongoose";
import { ORDER_PRIORITY, ORDER_STATUS } from "../constants/index.js";

const orderItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "La cantidad debe ser un número entero.",
      },
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0 && items.length <= 50,
        message: "El pedido debe contener entre 1 y 50 ítems.",
      },
    },
    total: {
      type: Number,
      required: true,
      min: 0.01,
    },
    shippingAddress: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      province: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      required: true,
      default: ORDER_STATUS.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(ORDER_PRIORITY),
      required: true,
      default: ORDER_PRIORITY.NORMAL,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ createdAt: -1, _id: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ priority: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

const OrderModel = mongoose.model("Order", orderSchema);

export default OrderModel;
