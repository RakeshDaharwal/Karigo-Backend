import express from "express";
import cors from "cors";
import { morganRequestLogger } from "./middlewares/morgan";
import authRoutes from "./routes/web/auth.route";
import { errorHandler } from "./middlewares/error.middleware";


const app = express();

app.use(morganRequestLogger);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);



app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Route not found",
  });
});

//  Global Error Handler (LAST middleware)
app.use(errorHandler);

export default app;
