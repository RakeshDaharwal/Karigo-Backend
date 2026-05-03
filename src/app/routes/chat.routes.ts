import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { chatsRateLimit } from "../../middlewares/rateLimit/redis.limits";
import { getChatRooms, getRoomMessages } from "../controllers/chat.controller";

const router = express.Router();

router.get("/rooms/:roomId/messages", chatsRateLimit, verifyToken, getRoomMessages);
router.get("/rooms", chatsRateLimit, verifyToken, getChatRooms);

export default router;
