import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Query } from "express-serve-static-core";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
const { Vonage } = require("@vonage/server-sdk");
import { Server, Socket } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { Base64 } from "js-base64";
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});
// Initialize Twilio client

dotenv.config();

export const app: Express = express();
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

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const hashedPasswordGivenPassword = Base64.encode(password);
  return hashedPasswordGivenPassword === hashedPassword;
};

app.post(
  "/login",
  async (
    req: CustomRequest<LoginRequest, any>,
    res: Response<LoginResponse>
  ) => {
    try {
      const { user } = req.body;

      const isUserLoggedIn = await prisma.user.findFirst({
        where: !user.id
          ? {
              directionalNumber: Number(user.directionalNumber),
              phoneNumber: Number(user.phoneNumber),
            }
          : {
              id: user.id,
              directionalNumber: Number(user.directionalNumber),
              phoneNumber: Number(user.phoneNumber),
            },
        select: {
          isOnline: true,
        },
      });

      if (isUserLoggedIn?.isOnline) {
        return res
          .status(200)
          .json({ message: "Ten użytkownik jest już zalogowany." });
      }

      if (!user.id) {
        const usersData = await prisma.user.findFirst({
          where: {
            directionalNumber: Number(user.directionalNumber),
            phoneNumber: Number(user.phoneNumber),
          },
          select: {
            id: true,
            password: true,
          },
        });
        if (!usersData) {
          return res
            .status(200)
            .json({ message: "Nie znaleziono użytkownika." });
        }

        const passwordEqual = user.password === usersData.password;
        if (passwordEqual) {
          await prisma.user.update({
            where: {
              id: usersData.id,
            },
            data: {
              isOnline: true,
            },
          });

          res.status(200).json({ userId: usersData.id });
        } else {
          res.status(200).json({ message: "Niepoprawne dane logowania." });
        }
        return;
      } else {
        const userData = await prisma.user.findUnique({
          where: {
            id: user.id,
            phoneNumber: Number(user.phoneNumber),
            directionalNumber: Number(user.directionalNumber),
          },
        });
        if (userData) {
          const passwordEqual = user.password === userData.password;
          if (passwordEqual) {
            await prisma.user.update({
              where: {
                id: userData.id,
              },
              data: {
                isOnline: true,
              },
            });
            return res.status(200).json({ userId: userData.id });
          } else {
            return res
              .status(200)
              .json({ message: "Niepoprawne dane logowania." });
          }
        } else {
          return res
            .status(200)
            .json({ message: "Nie znaleziono użytkownika." });
        }
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
  action: "register" | "forgotPassword";
}

app.post(
  "/send-code",
  async (
    req: CustomRequest<SendCodeRequest, any>,
    res: Response<{ code: number } | { message: string }>
  ) => {
    try {
      const { phoneNumber, directionalNumber, action } = req.body;

      const checkIfPhoneNumberIsRegistered = await prisma.user.findFirst({
        where: {
          phoneNumber: Number(phoneNumber),
          directionalNumber: Number(directionalNumber),
        },
      });
      if (checkIfPhoneNumberIsRegistered && action === "register") {
        return res.status(200).json({
          message: "Taki numer telefonu jest już zarejestrowany",
        });
      } else if (
        !checkIfPhoneNumberIsRegistered &&
        action === "forgotPassword"
      ) {
        return res.status(200).json({
          message: "Taki numer telefonu nie jest zarejestrowany",
        });
      }
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
        throw new Error("Brak numeru telefonu");
      }
      if (!user.directionalNumber) {
        throw new Error("Brak numeru kierunkowego");
      }
      if (!user.password) {
        throw new Error("Brak hasła");
      }

      const userExists = await prisma.user.findFirst({
        where: {
          phoneNumber: Number(user.phoneNumber),
          directionalNumber: Number(user.directionalNumber),
        },
      });

      if (userExists)
        return res
          .status(200)
          .json({ message: "Taki numer telefonu jest już zarejestrowany." });

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
      const changedUser = await prisma.user.update({
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
    req: CustomRequest<any, { userId: string }>,
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
app.get(
  "/logout/:userId",
  async (
    req: CustomRequest<any, { userId: string }>,
    res: Response<{ message: string } | { userName: string }>
  ) => {
    try {
      const { userId } = req.params;

      if (!userId)
        return res.status(200).json({ message: "Brak id użytkownika." });
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isOnline: false,
          isAvailable: false,
        },
      });

      res.status(200).send();
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
      console.log(`Udating location for ${userId}`);
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
              languagePrefference: true,
            },
          },
        },
      });

      const usersToAvoid: string[] = [userId];

      const blockedByUsers = await prisma.blockedUsers.findMany({
        where: {
          blockedUserId: userId,
        },
        select: {
          userId: true,
        },
      });
      const blockedUsers = await prisma.blockedUsers.findMany({
        where: {
          userId,
        },
        select: {
          blockedUserId: true,
        },
      });

      if (blockedByUsers) {
        for (const blockedByUser of blockedByUsers) {
          usersToAvoid.push(blockedByUser.userId);
        }
      }
      if (blockedUsers) {
        for (const blockedUser of blockedUsers) {
          usersToAvoid.push(blockedUser.blockedUserId);
        }
      }

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
              id: { in: usersToAvoid },
            },
            isAvailable: true,
            isOnline: true,
            settings: {
              searchRadius: userLocation.settings?.searchRadius,
              languagePrefference: userLocation.settings?.languagePrefference,
            },
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

interface UserSettingsRequest {
  userId: string;
  searchRadius: number;
  numberOfChats: number;
  languagePrefference: string;
  appTheme: string;
  appMainColor: string;
}

app.post(
  "/user-settings-save",
  async (req: CustomRequest<UserSettingsRequest, any>, res: Response) => {
    try {
      const { userId, ...restData } = req.body;

      if (!userId) throw Error("Brak id użytkownika");

      await prisma.settings.update({
        where: {
          userId,
        },
        data: restData,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating user availablity:", error);
      throw error;
    }
  }
);
app.post(
  "/user-settings-fetch",
  async (
    req: CustomRequest<Pick<UserSettingsRequest, "userId">, any>,
    res: Response<Omit<UserSettingsRequest, "userId">>
  ) => {
    try {
      const { userId } = req.body;
      if (!userId) throw Error("Brak id użytkownika");

      const userSettings = await prisma.settings.findUnique({
        where: { userId },
        select: {
          appMainColor: true,
          appTheme: true,
          languagePrefference: true,
          numberOfChats: true,
          searchRadius: true,
        },
      });

      if (!userSettings) throw new Error("Nie znaleziono ustawień");

      res.status(200).json(userSettings);
    } catch (error) {
      console.error("Error updating user availablity:", error);
      throw error;
    }
  }
);

interface ReportUserRequest {
  userId: string;
  reportedUserId: string;
  reportMessage: string;
  blockUser: boolean;
}

app.post(
  "/report-user",
  async (
    req: CustomRequest<ReportUserRequest, any>,
    res: Response<{ message: string }>
  ) => {
    try {
      const { userId, blockUser, reportMessage, reportedUserId } = req.body;
      if (!userId) throw Error("Brak id użytkownika");
      if (!reportedUserId) throw Error("Brak id reportowanego użytkownika");

      const reportResponse = await prisma.reports.create({
        data: {
          reportingUserId: userId,
          reportedUserId,
          reportMessage,
          reportTime: new Date(),
          resolved: false,
        },
      });

      if (!reportResponse) throw Error("Błąd podczas zgłaszania użytkownika");

      if (blockUser) {
        const blockUserResponse = await prisma.blockedUsers.create({
          data: {
            blockedUserId: reportedUserId,
            userId: userId,
          },
        });
        if (!blockUserResponse)
          throw Error("Błąd bodczas blokowania użytkownika");
      }

      res.status(200).json({
        message: blockUser
          ? "Pomyślnie zgłoszono użytkownika i zablokowano użytkownika."
          : "Pomyślnie zgłoszono użytkownika.",
      });
    } catch (error) {
      console.error("Error reporting/blocking user:", error);
      throw error;
    }
  }
);

interface FetchBlockedUsersRequest {
  userId: string;
}

app.post(
  "/fetch-blocked-users",
  async (
    req: CustomRequest<FetchBlockedUsersRequest, any>,
    res: Response<{ id: string; name: string }[] | null>
  ) => {
    try {
      const { userId } = req.body;
      if (!userId) throw Error("Brak id użytkownika");

      const blockedUserIds = await prisma.blockedUsers.findMany({
        where: {
          userId,
        },
        select: {
          blockedUserId: true,
        },
      });

      const mappedBlockedUserIds = blockedUserIds.map(
        (blockedUser) => blockedUser.blockedUserId
      );

      const blockedUsers = await prisma.user.findMany({
        where: {
          id: {
            in: mappedBlockedUserIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      res.status(200).json(blockedUsers ?? null);
    } catch (error) {
      console.error("Error reporting/blocking user:", error);
      throw error;
    }
  }
);
app.post(
  "/unblock-user",
  async (
    req: CustomRequest<{ userId: string; blockedUser: string }, any>,
    res: Response
  ) => {
    try {
      const { userId, blockedUser } = req.body;
      if (!userId) throw Error("Brak id użytkownika");

      const blockedUserRowId = await prisma.blockedUsers.findFirst({
        where: {
          userId,
          blockedUserId: blockedUser,
        },
        select: {
          id: true,
        },
      });

      await prisma.blockedUsers.delete({
        where: {
          id: blockedUserRowId?.id,
        },
      });

      return res.status(200).send();
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  }
);

app.post(
  "/forgot-password",
  async (
    req: CustomRequest<
      {
        directionalNumber: number;
        phoneNumber: number;
        password: string;
      },
      any
    >,
    res: Response
  ) => {
    try {
      const { directionalNumber, password, phoneNumber } = req.body;

      const userToUpdate = await prisma.user.findFirst({
        where: {
          phoneNumber: Number(phoneNumber),
          directionalNumber: Number(directionalNumber),
        },
      });
      if (!userToUpdate) throw Error("Nie znaleziono użytkownika.");
      await prisma.user.update({
        where: {
          id: userToUpdate.id,
        },
        data: {
          password: password,
        },
      });
      res.status(200).send();
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  }
);

app.post(
  "/set-logged-in-when-keep-logged-in",
  async (
    req: CustomRequest<
      {
        userId: string;
      },
      any
    >,
    res: Response
  ) => {
    try {
      const { userId } = req.body;
      if (!userId) throw new Error("nie znaleziono użytkownika");
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isAvailable: true,
          isOnline: true,
        },
      });
      res.status(200).send();
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  }
);

const userIdToSocketId: Record<string, string> = {};

const setUserOnlineState = async (
  userId: string,
  state: boolean,
  availabilty: boolean
) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isOnline: state,
      isAvailable: availabilty,
    },
  });
};

io.on("connection", async (socket: Socket) => {
  console.log("A user connected");

  socket.on("mapUserId", async (userId: string) => {
    if (!userIdToSocketId[userId]) {
      console.log(`Mapping user ${userId} to socket ${socket.id}`);
      await setUserOnlineState(userId, true, true);
      userIdToSocketId[userId] = socket.id;
    }
  });

  socket.on(
    "sendInvite",
    async (invitationData: { from: string; to: string }) => {
      const { from, to } = invitationData;
      const userIdToCheck = to;
      if (!userIdToCheck)
        return socket.emit("userUnavailable", {
          message: "Nie znaleziono takiego użytkownika.",
        });
      const checkInvitedUser = await prisma.user.findUnique({
        where: {
          id: to,
        },
        select: {
          isAvailable: true,
          isOnline: true,
        },
      });
      if (!checkInvitedUser?.isAvailable) {
        socket.emit("userUnavailable", {
          message: "Zaproszony użytkownik jest zajęty.",
        });
      } else {
        await prisma.user.updateMany({
          where: {
            id: {
              in: [to, from],
            },
          },
          data: {
            isAvailable: false,
          },
        });
        io.to(userIdToSocketId[to]).emit("invitationRecieved", from);
      }
    }
  );

  socket.on(
    "acceptDenyInvitation",
    async (data: { to: string; from: string; accepted: boolean }) => {
      const { accepted, to, from } = data;
      if (!accepted) {
        await prisma.user.updateMany({
          where: {
            id: {
              in: [to, from],
            },
          },
          data: {
            isAvailable: true,
          },
        });
      }
      io.to(userIdToSocketId[to]).emit("inviteDecision", accepted);
    }
  );

  socket.on(
    "message",
    async (messageData: { from: string; to: string; message: string }) => {
      const { from, to, message } = messageData;
      const senderSocketId = userIdToSocketId[from];
      const recipientSocketId = userIdToSocketId[to];
      await prisma.message.create({
        data: {
          senderId: from,
          recipientId: to,
          content: message,
        },
      });
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

  socket.on(
    "rangeCheck",
    async (rangeCheckData: { userId: string; userIdToCheck: string }) => {
      const { userId, userIdToCheck } = rangeCheckData;
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
        if (!userLocation)
          throw new Error("Błąd pobierania lokalizacji użytkownika");
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
        io.to(socket.id).emit("userInRange", !!stillInRange);
      } catch (error) {
        io.to(socket.id).emit(
          "error",
          "Nieoczekiwany błąd serwera podczas sprawdzania odległości."
        );
      }
    }
  );

  socket.on("cancelInvite", (invitedUser: string) => {
    const socketOfInvitedUser = userIdToSocketId[invitedUser];
    socket.to(socketOfInvitedUser).emit("invitationCancelled");
  });

  socket.on("endChat", (to: string) => {
    io.to(userIdToSocketId[to]).emit("chatEnded", true);
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  socket.on("disconnect", async () => {
    const userId = Object.keys(userIdToSocketId).find(
      (key) => userIdToSocketId[key] === socket.id
    );
    console.log("User disconnected: ", userId);
    if (userId) {
      await setUserOnlineState(userId, false, false);
      console.log(`Deleting mapping for user ${userId}`);
      delete userIdToSocketId[userId];
    }
  });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
