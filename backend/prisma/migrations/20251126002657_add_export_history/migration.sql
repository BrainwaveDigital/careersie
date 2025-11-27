-- CreateTable
CREATE TABLE "public"."DownloadHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadHistory_pkey" PRIMARY KEY ("id")
);
