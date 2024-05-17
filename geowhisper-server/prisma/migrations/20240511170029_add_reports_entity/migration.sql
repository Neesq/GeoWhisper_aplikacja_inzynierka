-- CreateTable
CREATE TABLE "Reports" (
    "id" SERIAL NOT NULL,
    "reportingUserId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reportMessage" TEXT NOT NULL,
    "reportTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("id")
);
