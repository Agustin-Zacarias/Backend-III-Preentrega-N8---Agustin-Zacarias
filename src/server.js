import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import { config } from "./config/index.js";
import logger from "./logger/logger.js";

const startServer = async () => {
  logger.debug("Iniciando ShipNow API", { environment: config.nodeEnv });

  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      logger.info(`Servidor ShipNow escuchando en el puerto ${config.port}.`);
    });

    server.on("error", (error) => {
      logger.fatal("El servidor HTTP sufrió un error crítico.", {
        error: error.message,
        stack: error.stack,
      });
      process.exitCode = 1;
    });

    let isShuttingDown = false;
    const shutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info("Se recibió una señal de apagado; cerrando ShipNow.", { signal });

      const forceExit = setTimeout(() => {
        logger.fatal("Se agotó el tiempo de apagado ordenado.");
        process.exit(1);
      }, 10_000);
      forceExit.unref();

      server.close(async (error) => {
        if (error) {
          logger.error("Error al cerrar el servidor HTTP.", { error: error.message });
          process.exitCode = 1;
        }
        try {
          await mongoose.disconnect();
          logger.info("Conexión a MongoDB cerrada.");
        } catch (disconnectError) {
          logger.error("Error al cerrar MongoDB.", { error: disconnectError.message });
          process.exitCode = 1;
        } finally {
          clearTimeout(forceExit);
        }
      });
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.fatal("No se pudo iniciar ShipNow.", {
      error: error.message,
      stack: error.stack,
    });
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  }
};

startServer();
