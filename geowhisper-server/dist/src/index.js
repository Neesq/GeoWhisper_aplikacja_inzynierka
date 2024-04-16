"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const react_native_bcrypt_1 = __importDefault(require("react-native-bcrypt"));
const uuid_1 = require("uuid");
const { Vonage } = require("@vonage/server-sdk");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
});
// Initialize Twilio client
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
const port = process.env.PORT || 3000;
const prisma = new client_1.PrismaClient();
app.get("/", (req, res) => {
    console.log("WITAM");
    res.send("Express + TypeScript Server");
});
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body;
        if (!user.id) {
            const usersData = yield prisma.user.findMany({
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
                    const passwordEqual = react_native_bcrypt_1.default.compareSync(user.password, userData.password);
                    if (passwordEqual) {
                        res.status(200).json({ userId: userData.id });
                    }
                    else {
                        res.status(200).json({ message: "Niepoprawne dane logowania." });
                    }
                }
            }
            else {
                res.status(200).json({ message: "Nie znaleziono użytkownika." });
            }
            return;
        }
        else {
            const userData = yield prisma.user.findUnique({
                where: {
                    id: user.id,
                },
            });
            if (userData) {
                const passwordEqual = react_native_bcrypt_1.default.compareSync(user.password, userData.password);
                if (passwordEqual) {
                    res.status(200).json({ userId: userData.id });
                }
                else {
                    res.status(200).json({ message: "Niepoprawne dane logowania." });
                }
            }
            else {
                res.status(200).json({ message: "Nie znaleziono użytkownika." });
            }
            return;
        }
    }
    catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}));
app.post("/send-code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, directionalNumber } = req.body;
        const code = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        const response = yield vonage.sms.send({
            to: `${directionalNumber.trim()}${phoneNumber.trim()}`,
            from: "GeoWhisper",
            text: `Kod weryfikacyjny GeoWhisper: ${code}`,
        });
        res.status(200).json({ code });
    }
    catch (error) {
        console.error("Error verifying code:", error);
        throw error;
    }
}));
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body;
        const userId = (0, uuid_1.v4)();
        if (!user.phoneNumber) {
            throw Error("Brak numeru telefonu");
        }
        if (!user.directionalNumber) {
            throw Error("Brak numeru kierunkowego");
        }
        if (!user.password) {
            throw Error("Brak hasła");
        }
        const createdUser = yield prisma.user.create({
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
        yield prisma.settings.create({
            data: { userId: userId },
        });
        if (createdUser) {
            res.status(200).json({ userId });
        }
        else {
            res
                .status(200)
                .json({ message: "Nie udało się stworzyć użytkownika." });
        }
    }
    catch (error) {
        console.error("Register error: ", error);
        throw error;
    }
}));
app.post("/change-user-name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userName, userId } = req.body;
        if (!userId)
            res.status(200).json({ message: "Brak id użytkownika." });
        const checkUser = yield prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Error changing user name:", error);
        throw error;
    }
}));
app.get("/get-user-name/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId)
            return res.status(200).json({ message: "Brak id użytkownika." });
        const getUserName = yield prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                name: true,
            },
        });
        if (!getUserName || !getUserName.name)
            return res.status(200).json({ message: "Nie znaleziono użytkownika." });
        res.status(200).json({ userName: getUserName === null || getUserName === void 0 ? void 0 : getUserName.name });
    }
    catch (error) {
        console.error("Error changing user name:", error);
        throw error;
    }
}));
app.post("/update-location", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { latitude, longitude, userId } = req.body;
        if (!userId)
            return res.status(200).send();
        yield prisma.user.update({
            where: { id: userId },
            data: {
                longitude: Number(longitude),
                latitude: Number(latitude),
            },
        });
        res.status(200).send();
    }
    catch (error) {
        console.error("Error updating location:", error);
        throw error;
    }
}));
app.post("/get-user-id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { directionalNumber, phoneNumber } = req.body;
        if (!directionalNumber || !phoneNumber)
            return res.status(200).json({ userId: null });
        const user = yield prisma.user.findFirst({
            where: {
                directionalNumber: Number(directionalNumber),
                phoneNumber: Number(phoneNumber),
            },
        });
        if (user) {
            return res.status(200).json({ userId: user.id });
        }
        else {
            return res.status(200).json({ userId: null });
        }
    }
    catch (error) {
        console.error("Error get-user-id:", error);
        throw error;
    }
}));
app.post("/get-users-to-chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { userId, oneChat } = req.body;
        if (!userId) {
            throw Error("Brak id użytkownkika.");
        }
        const userLocation = yield prisma.user.findUnique({
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
        const rangeInDegrees = ((_a = userLocation.settings) === null || _a === void 0 ? void 0 : _a.searchRadius) / 111000;
        const usersInRange = yield prisma.user.findMany({
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
        const users = [];
        if (usersInRange.length === 0)
            return res.status(200).json(null);
        if (oneChat === true) {
            const randomIndex = Math.floor(Math.random() * usersInRange.length);
            users.push({
                userId: usersInRange[randomIndex].id,
                userName: usersInRange[randomIndex].name,
            });
        }
        else {
            let i = 0;
            const usedIndexes = [];
            if (usersInRange.length <= ((_b = userLocation.settings) === null || _b === void 0 ? void 0 : _b.numberOfChats)) {
                for (const user of usersInRange) {
                    users.push({
                        userId: user.id,
                        userName: user.name,
                    });
                }
            }
            else {
                while (i < ((_c = userLocation.settings) === null || _c === void 0 ? void 0 : _c.numberOfChats)) {
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
        }
        else {
            res.status(200).json(null);
        }
    }
    catch (error) {
        console.error("Error get-users-to-chat:", error);
        throw error;
    }
}));
app.post("/user-availabilty-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, available } = req.body;
        if (!userId)
            throw Error("Brak id użytkownika");
        yield prisma.user.update({
            where: { id: userId },
            data: { isAvailable: available },
        });
        res.status(200).json();
    }
    catch (error) {
        console.error("Error updating user availablity:", error);
        throw error;
    }
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server);
io.listen(3001, {
    cors: {
        origin: "*",
    },
});
const userIdToSocketId = {};
const setUserOnlineState = (userId, state) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            isOnline: true,
        },
    });
});
io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("mapUserId", (userId) => {
        console.log(`Mapping user ${userId} to socket ${socket.id}`);
        setUserOnlineState(userId, true);
        userIdToSocketId[userId] = socket.id;
    });
    socket.on("sendInvite", (invitationData) => {
        const { from, to } = invitationData;
        io.to(userIdToSocketId[to]).emit("invitationRecieved", from);
    });
    socket.on("acceptDenyInvitation", (data) => {
        const { accepted, to } = data;
        io.to(userIdToSocketId[to]).emit("inviteDecision", accepted);
    });
    socket.on("message", (messageData) => {
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
    });
    let intervalId = null;
    socket.on("stopRangeCheck", () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });
    socket.on("startRangeCheck", (rangeCheckData) => {
        const { userId, userIdToCheck } = rangeCheckData;
        intervalId = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const userLocation = yield prisma.user.findUnique({
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
                if (!userLocation)
                    throw new Error("Error fetching user location.");
                const rangeInDegrees = ((_a = userLocation.settings) === null || _a === void 0 ? void 0 : _a.searchRadius) / 111000;
                const stillInRange = yield prisma.user.findUnique({
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
                }
                else {
                    io.to(socket.id).emit("userOutOfRange", false);
                }
            }
            catch (error) {
                console.error("Error checking user range:", error);
                io.to(socket.id).emit("error", "An error occurred while checking user range.");
            }
        }), 5000);
    });
    socket.on("endChat", (to) => {
        io.to(userIdToSocketId[to]).emit("chatEnded", true);
    });
    socket.on("disconnect", () => {
        console.log("User disconnected");
        const userId = Object.keys(userIdToSocketId).find((key) => userIdToSocketId[key] === socket.id);
        if (userId) {
            setUserOnlineState(userId, false);
            console.log(`Deleting mapping for user ${userId}`);
            delete userIdToSocketId[userId];
        }
    });
});
