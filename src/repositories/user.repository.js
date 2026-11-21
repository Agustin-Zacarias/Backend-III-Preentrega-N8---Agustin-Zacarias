import UserModel from "../models/user.model.js";

// La lista excluye documents para evitar respuestas grandes; los metadatos
// completos se obtienen al consultar un usuario individual.
const PUBLIC_USER_FIELDS = "firstName lastName email role documents createdAt updatedAt";
const USER_LIST_FIELDS = "firstName lastName email role createdAt updatedAt";

export const userRepository = {
  findAll: async ({ skip, limit, role } = {}) => {
    const filter = role ? { role } : {};
    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .select(USER_LIST_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById: async (id) => UserModel.findById(id).select(PUBLIC_USER_FIELDS).lean(),

  findByEmail: async (email) => UserModel.findOne({ email }).select("_id").lean(),

  create: async (userData) => {
    const user = await UserModel.create(userData);
    return UserModel.findById(user._id).select(PUBLIC_USER_FIELDS).lean();
  },

  update: async (id, userData) => UserModel.findByIdAndUpdate(id, userData, {
    new: true,
    runValidators: true,
  }).select(PUBLIC_USER_FIELDS).lean(),

  delete: async (id) => UserModel.findByIdAndDelete(id).select(PUBLIC_USER_FIELDS).lean(),
};
