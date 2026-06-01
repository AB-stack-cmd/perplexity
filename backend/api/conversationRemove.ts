import { Router } from "express";
import type { Request, Response } from "express";

import prisma from "../db.js";
import Validation from "../middleware.js";

const router = Router();

/**
 * DELETE /conversation/:conversationId
 */
router.delete("/:conversationId", Validation, async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: req.dbUserId,
        },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      await prisma.conversation.delete({
        where: {
          id: conversationId,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

export default router;