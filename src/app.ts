import express from "express";
import cors from "cors";
import { morganRequestLogger } from "./middlewares/morgan.middleware";
import appApi from "./app/index";
import webApi from "./web/index";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(morganRequestLogger);
app.use(cors());
app.use(express.json());

app.use("/api/v1/app", appApi);
app.use("/api/v1/web", webApi);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
