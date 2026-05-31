import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import workerRoutes from "./routes/worker.routes";
import categoriesRoutes, {
  subcategoriesRoutes,
} from "./routes/categories.routes";
import analyticsRoutes from "./routes/analytics.routes";
import shopRoutes from "./routes/shop.routes";
import storeRoutes from "./routes/store.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/worker", workerRoutes);
router.use("/categories", categoriesRoutes);
router.use("/subcategories", subcategoriesRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/shop", shopRoutes);
router.use("/business/stores", storeRoutes);

export default router;
