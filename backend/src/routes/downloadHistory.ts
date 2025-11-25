import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/track", async (req, res) => {
  const { userId, format } = req.body;
  try {
    const record = await prisma.downloadHistory.create({
      data: { userId, format }
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Failed to track download" });
  }
});

export default router;
