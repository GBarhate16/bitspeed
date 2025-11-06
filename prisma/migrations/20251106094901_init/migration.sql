-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "phoneNumber" VARCHAR(50),
    "email" VARCHAR(255),
    "linkedId" INTEGER,
    "linkPrecedence" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_contact_email" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "idx_contact_phone" ON "Contact"("phoneNumber");

-- CreateIndex
CREATE INDEX "idx_contact_linkedId" ON "Contact"("linkedId");

-- CreateIndex
CREATE INDEX "idx_contact_createdAt" ON "Contact"("createdAt");
