-- CreateTable
CREATE TABLE "TestEntity" (
    "id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "TestEntity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestEntity_id_key" ON "TestEntity"("id");
