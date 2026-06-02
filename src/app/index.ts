import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import categoriesRoutes, {
  subcategoriesRoutes,
} from "./routes/categories.routes";
import businessCategoriesRoutes from "./routes/business_categories.routes";
import workersRoutes from "./routes/workers.routes";
import chatRoutes from "./routes/chat.routes";
import businessesRoutes from "./routes/businesses.routes";
import addressesRoutes from "./routes/addresses.routes";
import cartRoutes from "./routes/cart.routes";
import ordersRoutes from "./routes/orders.routes";
import housesRoutes from "./routes/houses.routes";
import vehiclesRoutes from "./routes/vehicles.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/subcategories", subcategoriesRoutes);
router.use("/business-categories", businessCategoriesRoutes);
router.use("/workers", workersRoutes);
router.use("/chat", chatRoutes);
router.use("/businesses", businessesRoutes);
router.use("/addresses", addressesRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", ordersRoutes);
router.use("/houses", housesRoutes);
router.use("/vehicles", vehiclesRoutes);

export default router;
