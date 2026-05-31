import express from "express";
import { requireBusinessUser } from "../../middlewares/auth.middleware";
import {
  uploadProductImage,
  uploadProductsCsv,
} from "../../middlewares/upload.middleware";
import {
  createProduct,
  createStore,
  deleteProduct,
  getStore,
  listProducts,
  listStores,
  updateProduct,
} from "../controllers/store.controller";

const router = express.Router();

router.use(requireBusinessUser);

router.get("/", listStores);
router.post("/", uploadProductsCsv, createStore);
router.get("/:storeId", getStore);

router.get("/:storeId/products", listProducts);
router.post("/:storeId/products", uploadProductImage, createProduct);
router.put(
  "/:storeId/products/:productId",
  uploadProductImage,
  updateProduct
);
router.delete("/:storeId/products/:productId", deleteProduct);

export default router;
