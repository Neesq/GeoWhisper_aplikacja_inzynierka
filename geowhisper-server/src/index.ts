import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Query } from "express-serve-static-core";
import bodyParser from "body-parser";
import bcrypt from "react-native-bcrypt";
import { v4 as uuidv4 } from "uuid";
const { Vonage } = require("@vonage/server-sdk");
import { Server, Socket } from "socket.io";
import cors from "cors";
import { createServer } from "http";
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});
// Initialize Twilio client

dotenv.config();

const app: Express = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
// io.listen(3001, {
//   cors: {
//     origin: "*",
//   },
// });

interface CustomRequest<T, U extends Query> extends Request {
  body: T;
  query: U;
}

app.get("/", (req: Request, res: Response) => {
  console.log("WITAM");
  res.send("Express + TypeScript Server");
});

interface LoginRequest {
  user: {
    id: string;
    phoneNumber: string;
    directionalNumber: string;
    password: string;
  };
}
type LoginResponse = { userId: string } | { message: string };

app.post(
  "/login",
  async (
    req: CustomRequest<LoginRequest, any>,
    res: Response<LoginResponse>
  ) => {
    try {
      const { user } = req.body;

      if (!user.id) {
        const usersData = await prisma.user.findMany({
          where: {
            directionalNumber: Number(user.directionalNumber),
            phoneNumber: Number(user.phoneNumber),
          },
          select: {
            id: true,
            password: true,
          },
        });
        if (usersData.length !== 0) {
          for (const userData of usersData) {
            const passwordEqual = bcrypt.compareSync(
              user.password,
              userData.password
            );
            if (passwordEqual) {
              res.status(200).json({ userId: userData.id });
            } else {
              res.status(200).json({ message: "Niepoprawne dane logowania." });
            }
          }
        } else {
          res.status(200).json({ message: "Nie znaleziono użytkownika." });
        }
        return;
      } else {
        const userData = await prisma.user.findUnique({
          where: {
            id: user.id,
          },
        });
        if (userData) {
          const passwordEqual = bcrypt.compareSync(
            user.password,
            userData.password
          );
          if (passwordEqual) {
            res.status(200).json({ userId: userData.id });
          } else {
            res.status(200).json({ message: "Niepoprawne dane logowania." });
          }
        } else {
          res.status(200).json({ message: "Nie znaleziono użytkownika." });
        }
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }
);

interface RegisterRequest {
  user: {
    name: string;
    phoneNumber: string;
    directionalNumber: string;
    password: string;
  };
}
type RegisterResponse = { userId: string } | { message: string };

interface SendCodeRequest {
  phoneNumber: string;
  directionalNumber: string;
}

app.post(
  "/send-code",
  async (
    req: CustomRequest<SendCodeRequest, any>,
    res: Response<{ code: number }>
  ) => {
    try {
      const { phoneNumber, directionalNumber } = req.body;
      const code = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
      const response = await vonage.sms.send({
        to: `${directionalNumber.trim()}${phoneNumber.trim()}`,
        from: "GeoWhisper",
        text: `Kod weryfikacyjny GeoWhisper: ${code}`,
      });

      res.status(200).json({ code });
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  }
);

app.post(
  "/register",
  async (
    req: CustomRequest<RegisterRequest, any>,
    res: Response<RegisterResponse>
  ) => {
    try {
      const { user } = req.body;

      const userId = uuidv4();
      if (!user.phoneNumber) {
        throw Error("Brak numeru telefonu");
      }
      if (!user.directionalNumber) {
        throw Error("Brak numeru kierunkowego");
      }
      if (!user.password) {
        throw Error("Brak hasła");
      }

      const createdUser = await prisma.user.create({
        data: {
          id: userId,
          name: user.name,
          directionalNumber: Number(user.directionalNumber),
          phoneNumber: Number(user.phoneNumber),
          password: user.password,
          isAvailable: false,
          isOnline: false,
        },
      });
      await prisma.settings.create({
        data: { userId: userId },
      });

      if (createdUser) {
        res.status(200).json({ userId });
      } else {
        res
          .status(200)
          .json({ message: "Nie udało się stworzyć użytkownika." });
      }
    } catch (error) {
      console.error("Register error: ", error);
      throw error;
    }
  }
);

interface ChangeUserNameRequest {
  userId: string;
  userName: string;
}

app.post(
  "/change-user-name",
  async (req: CustomRequest<ChangeUserNameRequest, any>, res: Response) => {
    try {
      const { userName, userId } = req.body;

      if (!userId) res.status(200).json({ message: "Brak id użytkownika." });
      const checkUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!checkUser)
        res.status(200).json({ message: "Nie znaleziono użytkownika." });

      const changedUser = prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: userName,
        },
      });

      res.status(200).send();
    } catch (error) {
      console.error("Error changing user name:", error);
      throw error;
    }
  }
);

app.get(
  "/get-user-name/:userId",
  async (
    req: CustomRequest<ChangeUserNameRequest, { userId: string }>,
    res: Response<{ message: string } | { userName: string }>
  ) => {
    try {
      const { userId } = req.params;
      if (!userId)
        return res.status(200).json({ message: "Brak id użytkownika." });
      const getUserName = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          name: true,
        },
      });
      if (!getUserName || !getUserName.name)
        return res.status(200).json({ message: "Nie znaleziono użytkownika." });

      res.status(200).json({ userName: getUserName?.name });
    } catch (error) {
      console.error("Error changing user name:", error);
      throw error;
    }
  }
);

interface UpdateLocationRequest {
  userId: string;
  latitude: string;
  longitude: string;
}

app.post(
  "/update-location",
  async (req: CustomRequest<UpdateLocationRequest, any>, res: Response) => {
    try {
      const { latitude, longitude, userId } = req.body;
      if (!userId) return res.status(200).send();
      await prisma.user.update({
        where: { id: userId },
        data: {
          longitude: Number(longitude),
          latitude: Number(latitude),
        },
      });

      res.status(200).send();
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  }
);

interface GetUserIdRequest {
  directionalNumber: string;
  phoneNumber: string;
}

app.post(
  "/get-user-id",
  async (
    req: CustomRequest<GetUserIdRequest, any>,
    res: Response<{ userId: string | null }>
  ) => {
    try {
      const { directionalNumber, phoneNumber } = req.body;
      if (!directionalNumber || !phoneNumber)
        return res.status(200).json({ userId: null });

      const user = await prisma.user.findFirst({
        where: {
          directionalNumber: Number(directionalNumber),
          phoneNumber: Number(phoneNumber),
        },
      });
      if (user) {
        return res.status(200).json({ userId: user.id });
      } else {
        return res.status(200).json({ userId: null });
      }
    } catch (error) {
      console.error("Error get-user-id:", error);
      throw error;
    }
  }
);

interface GetUsersToChatRequest {
  userId: string;
  oneChat: boolean;
}

app.post(
  "/get-users-to-chat",
  async (
    req: CustomRequest<GetUsersToChatRequest, any>,
    res: Response<{ userId: string; userName: string }[] | null>
  ) => {
    try {
      const { userId, oneChat } = req.body;

      if (!userId) {
        throw Error("Brak id użytkownkika.");
      }

      const userLocation = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          longitude: true,
          latitude: true,
          settings: {
            select: {
              searchRadius: true,
              numberOfChats: true,
            },
          },
        },
      });

      if (!userLocation)
        throw Error("Błąd pobierania lokalizacji użytkownika.");
      const rangeInDegrees = userLocation.settings?.searchRadius! / 111000;
      const usersInRange = await prisma.user.findMany({
        where: {
          latitude: {
            gte: Number(userLocation.latitude) - rangeInDegrees,
            lte: Number(userLocation.latitude) + rangeInDegrees,
          },
          longitude: {
            gte: Number(userLocation.longitude) - rangeInDegrees,
            lte: Number(userLocation.longitude) + rangeInDegrees,
          },
          AND: {
            NOT: {
              id: userId,
            },
            isAvailable: true,
            isOnline: true,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const users: { userId: string; userName: string }[] = [];

      if (usersInRange.length === 0) return res.status(200).json(null);
      if (oneChat === true) {
        const randomIndex = Math.floor(Math.random() * usersInRange.length);
        users.push({
          userId: usersInRange[randomIndex].id,
          userName: usersInRange[randomIndex].name,
        });
      } else {
        let i = 0;
        const usedIndexes: number[] = [];
        if (usersInRange.length <= userLocation.settings?.numberOfChats!) {
          for (const user of usersInRange) {
            users.push({
              userId: user.id,
              userName: user.name,
            });
          }
        } else {
          while (i < userLocation.settings?.numberOfChats!) {
            const randomIndex = Math.floor(Math.random() * usersInRange.length);
            if (!usedIndexes.includes(randomIndex)) {
              users.push({
                userId: usersInRange[randomIndex].id,
                userName: usersInRange[randomIndex].name,
              });
              usedIndexes.push(randomIndex);
              i++;
            }
          }
        }
      }

      if (users.length !== 0) {
        res.status(200).json(users);
      } else {
        res.status(200).json(null);
      }
    } catch (error) {
      console.error("Error get-users-to-chat:", error);
      throw error;
    }
  }
);

app.post(
  "/user-availabilty-status",
  async (
    req: CustomRequest<{ userId: string; available: boolean }, any>,
    res: Response
  ) => {
    try {
      const { userId, available } = req.body;

      if (!userId) throw Error("Brak id użytkownika");
      await prisma.user.update({
        where: { id: userId },
        data: { isAvailable: available },
      });

      res.status(200).json();
    } catch (error) {
      console.error("Error updating user availablity:", error);
      throw error;
    }
  }
);

// app.listen(port, () => {
//   console.log(`[server]: Server is running at http://localhost:${port}`);
// });

const userIdToSocketId: Record<string, string> = {};

const setUserOnlineState = async (userId: string, state: boolean) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isOnline: true,
    },
  });
};

io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.on("mapUserId", (userId: string) => {
    console.log(`Mapping user ${userId} to socket ${socket.id}`);
    setUserOnlineState(userId, true);
    userIdToSocketId[userId] = socket.id;
  });

  socket.on("sendInvite", (invitationData: { from: string; to: string }) => {
    const { from, to } = invitationData;
    io.to(userIdToSocketId[to]).emit("invitationRecieved", from);
  });

  socket.on(
    "acceptDenyInvitation",
    (data: { to: string; accepted: boolean }) => {
      const { accepted, to } = data;
      io.to(userIdToSocketId[to]).emit("inviteDecision", accepted);
    }
  );

  socket.on(
    "message",
    (messageData: { from: string; to: string; message: string }) => {
      const { from, to, message } = messageData;
      const senderSocketId = userIdToSocketId[from];
      const recipientSocketId = userIdToSocketId[to];
      if (senderSocketId && recipientSocketId) {
        io.to(senderSocketId).emit("messageReceived", {
          from: from,
          to: to,
          message: message,
        });
        io.to(recipientSocketId).emit("messageReceived", {
          from: from,
          to: to,
          message: message,
        });
      }
    }
  );

  let intervalId: NodeJS.Timeout | null = null;
  socket.on("stopRangeCheck", () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
  socket.on(
    "startRangeCheck",
    (rangeCheckData: { userId: string; userIdToCheck: string }) => {
      const { userId, userIdToCheck } = rangeCheckData;
      intervalId = setInterval(async () => {
        try {
          const userLocation = await prisma.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              longitude: true,
              latitude: true,
              settings: {
                select: {
                  searchRadius: true,
                },
              },
            },
          });
          console.log(userLocation);
          if (!userLocation) throw new Error("Error fetching user location.");

          const rangeInDegrees = userLocation.settings?.searchRadius! / 111000;
          const stillInRange = await prisma.user.findUnique({
            where: {
              id: userIdToCheck,
              latitude: {
                gte: Number(userLocation.latitude) - rangeInDegrees,
                lte: Number(userLocation.latitude) + rangeInDegrees,
              },
              longitude: {
                gte: Number(userLocation.longitude) - rangeInDegrees,
                lte: Number(userLocation.longitude) + rangeInDegrees,
              },
            },
          });

          if (stillInRange) {
            console.log("witam");
            io.to(socket.id).emit("userInRange", true);
          } else {
            io.to(socket.id).emit("userOutOfRange", false);
          }
        } catch (error) {
          console.error("Error checking user range:", error);
          io.to(socket.id).emit(
            "error",
            "An error occurred while checking user range."
          );
        }
      }, 5000);
    }
  );

  socket.on("endChat", (to: string) => {
    io.to(userIdToSocketId[to]).emit("chatEnded", true);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    const userId = Object.keys(userIdToSocketId).find(
      (key) => userIdToSocketId[key] === socket.id
    );
    if (userId) {
      setUserOnlineState(userId, false);
      console.log(`Deleting mapping for user ${userId}`);
      delete userIdToSocketId[userId];
    }
  });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
