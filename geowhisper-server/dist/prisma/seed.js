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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const users = [
    {
        id: "5556901f-19f4-4fdf-9faf-ee44df4882a7",
        name: "użytkownik#nfs9zm",
        directionalNumber: 48,
        password: "$2a$06$......................1xsvwSWnkBBgSDarnIzXLW9SJ3QWVZ6",
        phoneNumber: 784967559,
        isAvailable: false,
        isOnline: false,
        longitude: null,
        latitude: null,
    },
    {
        id: "ada7a6d1-13fa-4acd-a9d5-0e57773f875a",
        name: "test2",
        directionalNumber: 222,
        password: "$2a$06$6WN2wxnl8uBl2bW3mMqas.73PElEbfdBq1lcqAT13Kykw5B1lM6xG",
        phoneNumber: 222222222,
        isAvailable: false,
        isOnline: false,
        longitude: null,
        latitude: null,
    },
    {
        id: "fab3d9b7-fa0f-4339-89c7-c59a4419d61a",
        name: "test1",
        directionalNumber: 111,
        password: "$2a$06$6WN2wxnl8uBl2bW3mMqas.73PElEbfdBq1lcqAT13Kykw5B1lM6xG",
        phoneNumber: 111111111,
        isAvailable: false,
        isOnline: false,
        longitude: null,
        latitude: null,
    },
];
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.user.createMany({
            data: users,
        });
        for (const user of users) {
            yield prisma.settings.create({
                data: { userId: user.id },
            });
        }
    });
}
main()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}))
    .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(e);
    yield prisma.$disconnect();
    process.exit(1);
}));
