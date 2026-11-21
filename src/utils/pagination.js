import { ValidationError } from "../errors/app-error.js";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
const MAX_PAGE = 10_000;

const parseIntegerQuery = (value, { name, defaultValue, min, max }) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (Array.isArray(value) || typeof value === "object" || !/^\d+$/.test(String(value))) {
    throw new ValidationError(`El parámetro ${name} debe ser un número entero.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new ValidationError(`El parámetro ${name} debe estar entre ${min} y ${max}.`);
  }
  return parsed;
};

export const parsePagination = (query = {}) => {
  const page = parseIntegerQuery(query.page, {
    name: "page", defaultValue: DEFAULT_PAGE, min: 1, max: MAX_PAGE,
  });
  const limit = parseIntegerQuery(query.limit, {
    name: "limit", defaultValue: DEFAULT_LIMIT, min: 1, max: MAX_LIMIT,
  });

  return Object.freeze({ page, limit, skip: (page - 1) * limit });
};

export const createPaginationMetadata = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
};
