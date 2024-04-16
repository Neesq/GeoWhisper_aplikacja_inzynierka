import { PrismaClient, User } from "@prisma/client";

const users: User[] = [
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

const prisma = new PrismaClient();
async function main() {
  await prisma.user.createMany({
    data: users,
  });
  for (const user of users) {
    await prisma.settings.create({
      data: { userId: user.id },
    });
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
