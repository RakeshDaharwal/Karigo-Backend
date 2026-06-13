import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware";
import { chatsRateLimit } from "../../middlewares/rateLimit/redis.limits";
import {
  getChatRooms,
  getRoomMessages,
  markRoomSeenHandler,
  clearChat,
  deleteMessage,
  hideChatRoom,
  editMessage,
  blockChat,
  unblockChat,
} from "../controllers/chat.controller";

const router = express.Router();

router.get("/rooms/:roomId/messages", chatsRateLimit, verifyToken, getRoomMessages);
router.post("/rooms/:roomId/seen", chatsRateLimit, verifyToken, markRoomSeenHandler);
router.get("/rooms", chatsRateLimit, verifyToken, getChatRooms);
router.delete("/rooms/:roomId", chatsRateLimit, verifyToken, hideChatRoom);

router.delete("/rooms/:roomId/messages/:messageId", chatsRateLimit, verifyToken, deleteMessage);
router.patch("/rooms/:roomId/messages/:messageId", chatsRateLimit, verifyToken, editMessage);
router.delete("/rooms/:roomId/messages", chatsRateLimit, verifyToken, clearChat);
router.post("/rooms/:roomId/block", chatsRateLimit, verifyToken, blockChat);
router.post("/rooms/:roomId/unblock", chatsRateLimit, verifyToken, unblockChat);

export default router;
