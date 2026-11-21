import { Router } from "express";
import { uploadDeliveryReceipt } from "../config/multer.js";
import { uploadDeliveryReceipt as uploadDeliveryReceiptController } from "../controllers/upload.controller.js";
import { getDeliveries } from "../controllers/delivery.controller.js";

const router = Router();

// El listado se pagina; la entidad permite asociar comprobantes, pero no tiene CRUD completo.
router.get("/", getDeliveries);
router.post("/:deliveryId/receipt", uploadDeliveryReceipt, uploadDeliveryReceiptController);

export default router;
