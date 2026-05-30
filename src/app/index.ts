import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import categoriesRoutes, {
  subcategoriesRoutes,
} from "./routes/categories.routes";
import workersRoutes from "./routes/workers.routes";
import chatRoutes from "./routes/chat.routes";
import shopsRoutes from "./routes/shops.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/subcategories", subcategoriesRoutes);
router.use("/workers", workersRoutes);
router.use("/chat", chatRoutes);
router.use("/shops", shopsRoutes);

export default router;
