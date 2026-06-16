import { type Server, type Socket } from "socket.io";

import { removeSocket } from "../presence/presence";
import { SOCKET_EVENTS } from "../events";

export const registerDisconnectHandler = (socket: Socket, _io: Server) => {
  const userId = socket.data.userId as string;

  const broadcastPresenceToJoinedRooms = (online: boolean) => {
    for (const room of socket.rooms) {
      if (room.startsWith("room:")) {
        socket.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
          roomId: room.slice("room:".length),
          userId,
          online,
        });
      }
    }
  };

  socket.on("disconnecting", () => {
    const { becameOffline } = removeSocket(userId, socket.id);
    console.log(
      `[socket] disconnect userId=${userId} socketId=${socket.id} becameOffline=${becameOffline}`
    );
    if (becameOffline) broadcastPresenceToJoinedRooms(false);
  });
};
