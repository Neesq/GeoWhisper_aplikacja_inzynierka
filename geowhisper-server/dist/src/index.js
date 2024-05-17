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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const uuid_1 = require("uuid");
const { Vonage } = require("@vonage/server-sdk");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const js_base64_1 = require("js-base64");
const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
});
// Initialize Twilio client
dotenv_1.default.config();
exports.app = (0, express_1.default)();
exports.app.use(body_parser_1.default.json());
exports.app.use(body_parser_1.default.urlencoded({ extended: true }));
exports.app.use((0, cors_1.default)());
const port = process.env.PORT || 3000;
const prisma = new client_1.PrismaClient();
const server = (0, http_1.createServer)(exports.app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
exports.app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
const verifyPassword = (password, hashedPassword) => {
    const hashedPasswordGivenPassword = js_base64_1.Base64.encode(password);
    return hashedPasswordGivenPassword === hashedPassword;
};
exports.app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body;
        const isUserLoggedIn = yield prisma.user.findFirst({
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
        if (isUserLoggedIn === null || isUserLoggedIn === void 0 ? void 0 : isUserLoggedIn.isOnline) {
            return res
                .status(200)
                .json({ message: "Ten użytkownik jest już zalogowany." });
        }
        if (!user.id) {
            const usersData = yield prisma.user.findFirstOrThrow({
                where: {
                    directionalNumber: Number(user.directionalNumber),
                    phoneNumber: Number(user.phoneNumber),
                },
                select: {
                    id: true,
                    password: true,
                },
            });
            const passwordEqual = user.password === usersData.password;
            if (passwordEqual) {
                yield prisma.user.update({
                    where: {
                        id: usersData.id,
                    },
                    data: {
                        isOnline: true,
                    },
                });
                res.status(200).json({ userId: usersData.id });
            }
            else {
                res.status(200).json({ message: "Niepoprawne dane logowania." });
            }
            return;
        }
        else {
            const userData = yield prisma.user.findUnique({
                where: {
                    id: user.id,
                    phoneNumber: Number(user.phoneNumber),
                    directionalNumber: Number(user.directionalNumber),
                },
            });
            if (userData) {
                const passwordEqual = user.password === userData.password;
                if (passwordEqual) {
                    yield prisma.user.update({
                        where: {
                            id: userData.id,
                        },
                        data: {
                            isOnline: true,
                        },
                    });
                    return res.status(200).json({ userId: userData.id });
                }
                else {
                    return res
                        .status(200)
                        .json({ message: "Niepoprawne dane logowania." });
                }
            }
            else {
                return res
                    .status(200)
                    .json({ message: "Nie znaleziono użytkownika." });
            }
        }
    }
    catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}));
exports.app.post("/send-code", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, directionalNumber, action } = req.body;
        const checkIfPhoneNumberIsRegistered = yield prisma.user.findFirst({
            where: {
                phoneNumber: Number(phoneNumber),
                directionalNumber: Number(directionalNumber),
            },
        });
        if (checkIfPhoneNumberIsRegistered && action === "register") {
            return res.status(200).json({
                message: "Taki numer telefonu jest już zarejestrowany",
            });
        }
        else if (!checkIfPhoneNumberIsRegistered &&
            action === "forgotPassword") {
            return res.status(200).json({
                message: "Taki numer telefonu nie jest zarejestrowany",
            });
        }
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
exports.app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body;
        const userId = (0, uuid_1.v4)();
        if (!user.phoneNumber) {
            throw new Error("Brak numeru telefonu");
        }
        if (!user.directionalNumber) {
            throw new Error("Brak numeru kierunkowego");
        }
        if (!user.password) {
            throw new Error("Brak hasła");
        }
        const userExists = yield prisma.user.findFirst({
            where: {
                phoneNumber: Number(user.phoneNumber),
                directionalNumber: Number(user.directionalNumber),
            },
        });
        if (userExists)
            return res
                .status(200)
                .json({ message: "Taki numer telefonu jest już zarejestrowany." });
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
exports.app.post("/change-user-name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const changedUser = yield prisma.user.update({
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
exports.app.get("/get-user-name/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.app.get("/logout/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId)
            return res.status(200).json({ message: "Brak id użytkownika." });
        yield prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                isOnline: false,
                isAvailable: false,
            },
        });
        res.status(200).send();
    }
    catch (error) {
        console.error("Error changing user name:", error);
        throw error;
    }
}));
exports.app.post("/update-location", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.app.post("/get-user-id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.app.post("/get-users-to-chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
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
                        languagePrefference: true,
                    },
                },
            },
        });
        const usersToAvoid = [userId];
        const blockedByUsers = yield prisma.blockedUsers.findMany({
            where: {
                blockedUserId: userId,
            },
            select: {
                userId: true,
            },
        });
        const blockedUsers = yield prisma.blockedUsers.findMany({
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
                        id: { in: usersToAvoid },
                    },
                    isAvailable: true,
                    isOnline: true,
                    settings: {
                        searchRadius: (_b = userLocation.settings) === null || _b === void 0 ? void 0 : _b.searchRadius,
                        languagePrefference: (_c = userLocation.settings) === null || _c === void 0 ? void 0 : _c.languagePrefference,
                    },
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
            if (usersInRange.length <= ((_d = userLocation.settings) === null || _d === void 0 ? void 0 : _d.numberOfChats)) {
                for (const user of usersInRange) {
                    users.push({
                        userId: user.id,
                        userName: user.name,
                    });
                }
            }
            else {
                while (i < ((_e = userLocation.settings) === null || _e === void 0 ? void 0 : _e.numberOfChats)) {
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
exports.app.post("/user-availabilty-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.app.post("/user-settings-save", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _f = req.body, { userId } = _f, restData = __rest(_f, ["userId"]);
        if (!userId)
            throw Error("Brak id użytkownika");
        yield prisma.settings.update({
            where: {
                userId,
            },
            data: restData,
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error("Error updating user availablity:", error);
        throw error;
    }
}));
exports.app.post("/user-settings-fetch", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId)
            throw Error("Brak id użytkownika");
        const userSettings = yield prisma.settings.findUnique({
            where: { userId },
            select: {
                appMainColor: true,
                appTheme: true,
                languagePrefference: true,
                numberOfChats: true,
                searchRadius: true,
            },
        });
        if (!userSettings)
            throw new Error("Nie znaleziono ustawień");
        res.status(200).json(userSettings);
    }
    catch (error) {
        console.error("Error updating user availablity:", error);
        throw error;
    }
}));
exports.app.post("/report-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, blockUser, reportMessage, reportedUserId } = req.body;
        if (!userId)
            throw Error("Brak id użytkownika");
        if (!reportedUserId)
            throw Error("Brak id reportowanego użytkownika");
        const reportResponse = yield prisma.reports.create({
            data: {
                reportingUserId: userId,
                reportedUserId,
                reportMessage,
                reportTime: new Date(),
                resolved: false,
            },
        });
        if (!reportResponse)
            throw Error("Błąd podczas zgłaszania użytkownika");
        if (blockUser) {
            const blockUserResponse = yield prisma.blockedUsers.create({
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
    }
    catch (error) {
        console.error("Error reporting/blocking user:", error);
        throw error;
    }
}));
exports.app.post("/fetch-blocked-users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId)
            throw Error("Brak id użytkownika");
        const blockedUserIds = yield prisma.blockedUsers.findMany({
            where: {
                userId,
            },
            select: {
                blockedUserId: true,
            },
        });
        const mappedBlockedUserIds = blockedUserIds.map((blockedUser) => blockedUser.blockedUserId);
        const blockedUsers = yield prisma.user.findMany({
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
        res.status(200).json(blockedUsers !== null && blockedUsers !== void 0 ? blockedUsers : null);
    }
    catch (error) {
        console.error("Error reporting/blocking user:", error);
        throw error;
    }
}));
exports.app.post("/unblock-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, blockedUser } = req.body;
        if (!userId)
            throw Error("Brak id użytkownika");
        const blockedUserRowId = yield prisma.blockedUsers.findFirst({
            where: {
                userId,
                blockedUserId: blockedUser,
            },
            select: {
                id: true,
            },
        });
        yield prisma.blockedUsers.delete({
            where: {
                id: blockedUserRowId === null || blockedUserRowId === void 0 ? void 0 : blockedUserRowId.id,
            },
        });
        return res.status(200).send();
    }
    catch (error) {
        console.error("Error unblocking user:", error);
        throw error;
    }
}));
exports.app.post("/forgot-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, directionalNumber, password, phoneNumber } = req.body;
        if (userId) {
            yield prisma.user.update({
                where: {
                    id: userId,
                    phoneNumber: Number(phoneNumber),
                    directionalNumber: Number(directionalNumber),
                },
                data: {
                    password: password,
                },
            });
        }
        else {
            const userToUpdate = yield prisma.user.findFirst({
                where: {
                    phoneNumber: Number(phoneNumber),
                    directionalNumber: Number(directionalNumber),
                },
            });
            if (!userToUpdate)
                throw Error("Nie znaleziono użytkownika.");
            yield prisma.user.update({
                where: {
                    id: userToUpdate.id,
                },
                data: {
                    password: password,
                },
            });
        }
        res.status(200).send();
    }
    catch (error) {
        console.error("Error unblocking user:", error);
        throw error;
    }
}));
const userIdToSocketId = {};
const setUserOnlineState = (userId, state, availabilty) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            isOnline: state,
            isAvailable: availabilty,
        },
    });
});
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("A user connected");
    socket.on("mapUserId", (userId) => __awaiter(void 0, void 0, void 0, function* () {
        if (!userIdToSocketId[userId]) {
            console.log(`Mapping user ${userId} to socket ${socket.id}`);
            yield setUserOnlineState(userId, true, true);
            userIdToSocketId[userId] = socket.id;
        }
    }));
    socket.on("sendInvite", (invitationData) => __awaiter(void 0, void 0, void 0, function* () {
        const { from, to } = invitationData;
        const userIdToCheck = to;
        if (!userIdToCheck)
            return socket.emit("userUnavailable", {
                message: "Nie znaleziono takiego użytkownika.",
            });
        const checkInvitedUser = yield prisma.user.findUnique({
            where: {
                id: to,
            },
            select: {
                isAvailable: true,
                isOnline: true,
            },
        });
        if (!(checkInvitedUser === null || checkInvitedUser === void 0 ? void 0 : checkInvitedUser.isAvailable)) {
            socket.emit("userUnavailable", {
                message: "Zaproszony użytkownik jest zajęty.",
            });
        }
        else {
            yield prisma.user.updateMany({
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
    }));
    socket.on("acceptDenyInvitation", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { accepted, to, from } = data;
        if (!accepted) {
            yield prisma.user.updateMany({
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
    }));
    socket.on("message", (messageData) => __awaiter(void 0, void 0, void 0, function* () {
        const { from, to, message } = messageData;
        const senderSocketId = userIdToSocketId[from];
        const recipientSocketId = userIdToSocketId[to];
        yield prisma.message.create({
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
    }));
    socket.on("rangeCheck", (rangeCheckData) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        const { userId, userIdToCheck } = rangeCheckData;
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
            if (!userLocation)
                throw new Error("Błąd pobierania lokalizacji użytkownika");
            const rangeInDegrees = ((_g = userLocation.settings) === null || _g === void 0 ? void 0 : _g.searchRadius) / 111000;
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
            io.to(socket.id).emit("userInRange", !!stillInRange);
        }
        catch (error) {
            io.to(socket.id).emit("error", "Nieoczekiwany błąd serwera podczas sprawdzania odległości.");
        }
    }));
    socket.on("cancelInvite", (invitedUser) => {
        const socketOfInvitedUser = userIdToSocketId[invitedUser];
        socket.to(socketOfInvitedUser).emit("invitationCancelled");
    });
    socket.on("endChat", (to) => {
        io.to(userIdToSocketId[to]).emit("chatEnded", true);
    });
    yield new Promise((resolve) => setTimeout(resolve, 3000));
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        const userId = Object.keys(userIdToSocketId).find((key) => userIdToSocketId[key] === socket.id);
        console.log("User disconnected: ", userId);
        if (userId) {
            yield setUserOnlineState(userId, false, false);
            console.log(`Deleting mapping for user ${userId}`);
            delete userIdToSocketId[userId];
        }
    }));
}));
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
