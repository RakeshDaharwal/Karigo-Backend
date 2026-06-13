import { type MessageStatus } from "../../generated/prisma/enums";

// ---- Socket event names (single source of truth, shared client/server) ----
export const SOCKET_EVENTS = {
  // client -> server
  CHAT_JOIN: "chat:join",
  CHAT_LEAVE: "chat:leave",
  MESSAGE_SEND: "message:send",
  MESSAGE_SEEN: "message:seen",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // server -> client
  MESSAGE_NEW: "message:new",
  MESSAGE_STATUS: "message:status",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_HIDDEN: "message:hidden",
  MESSAGE_EDITED: "message:edited",
  CHAT_CLEARED: "chat:cleared",
  CHAT_BLOCK_UPDATE: "chat:block:update",
  // Authoritative "you have read this room" pushed to the reader's own devices
  // so their conversation list clears the unread badge even when the HTTP
  // rooms fetch raced ahead of the seen write (or the room wasn't cached).
  CHAT_ROOM_READ: "chat:room:read",
  TYPING: "typing",
  PRESENCE_UPDATE: "presence:update",
} as const;

// ---- Payload contracts ----
export type ChatJoinPayload = { workerId: string };
export type ChatJoinResult =
  | {
      ok: true;
      roomId: string;
      peerUserId: string;
      peerOnline: boolean;
      blockedBy: string | null;
    }
  | { ok: false; error: string };

export type ChatLeavePayload = { roomId: string };

export type MessageSendPayload = {
  tempId: string;
  roomId: string;
  receiverId: string;
  content: string;
};
export type MessageSendAck =
  | { ok: true; tempId: string; id: string; createdAt: string; status: MessageStatus }
  | { ok: false; tempId: string; error: string };

export type MessageNewEvent = {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
};

export type MessageSeenPayload = { roomId: string };

export type MessageStatusEvent = {
  roomId: string;
  status: MessageStatus;
  messageId?: string;
  // Bulk SEEN: peer opened the chat and read your outgoing messages.
  upToCreatedAt?: string;
  readByUserId?: string;
};

export type TypingPayload = { roomId: string };
export type TypingEvent = { roomId: string; userId: string; typing: boolean };

export type PresenceUpdateEvent = { roomId: string; userId: string; online: boolean };

export type MessageDeletedEvent = {
  roomId: string;
  messageId: string;
  receiverId: string;
  wasUnread: boolean;
  lastMsg: string;
  time: string | null;
  receiverUnread: number;
};
export type MessageHiddenEvent = { roomId: string; messageId: string; userId: string };
export type MessageEditedEvent = {
  roomId: string;
  messageId: string;
  content: string;
};
export type ChatClearedEvent = { roomId: string };
export type ChatBlockUpdateEvent = { roomId: string; blockedBy: string | null };
export type ChatRoomReadEvent = { roomId: string; readerUserId: string };
