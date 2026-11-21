import ProductModel from "../models/product.model.js";

const PRODUCT_FIELDS = "name description price stock status createdAt updatedAt";

export const productRepository = {
  findAll: async ({ skip, limit, status } = {}) => {
    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .select(PRODUCT_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById: async (id) => ProductModel.findById(id).select(PRODUCT_FIELDS).lean(),

  create: async (productData) => {
    const product = await ProductModel.create(productData);
    return ProductModel.findById(product._id).select(PRODUCT_FIELDS).lean();
  },

  update: async (id, productData) => ProductModel.findByIdAndUpdate(id, productData, {
    new: true,
    runValidators: true,
  }).select(PRODUCT_FIELDS).lean(),

  delete: async (id) => ProductModel.findByIdAndDelete(id).select(PRODUCT_FIELDS).lean(),
};
