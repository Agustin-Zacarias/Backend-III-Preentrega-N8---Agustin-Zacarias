import { userService } from "../services/user.service.js";
import { asyncHandler } from "../middlewares/async-handler.js";

export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query);
  return res.status(200).json({ status: "success", payload: result.items, pagination: result.pagination });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.uid);
  return res.status(200).json({ status: "success", payload: user });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return res.status(201).json({ status: "success", payload: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.uid, req.body);
  return res.status(200).json({ status: "success", payload: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.deleteUser(req.params.uid);
  return res.status(200).json({ status: "success", payload: user });
});
