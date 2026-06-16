import { getIO } from "./io";

export const userRoom = (userId: string) => `user:${userId}`;
export const chatRoom = (roomId: string) => `room:${roomId}`;

// Whether a user currently has at least one socket actively joined to a chat
// room (i.e. the chat screen is open). Used to decide delivered vs seen at
// persist time, independent of queue job ordering.
export const isUserInRoom = async (roomId: string, userId: string) => {
  const sockets = await getIO().in(chatRoom(roomId)).fetchSockets();
  return sockets.some((s) => s.data.userId === userId);
};
