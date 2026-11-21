import logger from "../logger/logger.js";
import { RouteNotFoundError } from "../errors/app-error.js";

// Los endpoints de generación y prueba no se exponen en producción.
// Se responde como ruta inexistente para no revelar herramientas internas.
export const internalEndpointsGuard = (req, _res, next) => {
  if (process.env.NODE_ENV === "production") {
    logger.warning("Se bloqueó el acceso a un endpoint interno en producción.", {
      method: req.method,
      path: req.originalUrl,
    });
    return next(new RouteNotFoundError(req.method, req.originalUrl));
  }
  return next();
};
