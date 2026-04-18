import express from "express";
import { verifyToken } from "../../../middlewares/auth.middleware";
import { getChatRooms, getRoomMessages } from "../controllers/chat.controller";

const router = express.Router();

router.get("/rooms/:roomId/messages", verifyToken, getRoomMessages);
router.get("/rooms", verifyToken, getChatRooms);

export default router;
