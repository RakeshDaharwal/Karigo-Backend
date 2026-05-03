import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import workerRoutes from "./routes/worker.routes";
import categoriesRoutes, {
  subcategoriesRoutes,
} from "./routes/categories.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/worker", workerRoutes);
router.use("/categories", categoriesRoutes);
router.use("/subcategories", subcategoriesRoutes);

export default router;
