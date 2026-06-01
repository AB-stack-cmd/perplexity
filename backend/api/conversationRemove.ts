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
    console.log(`conversation on delete route ${conversationId}`)

    try {

      if (!conversationId) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      };

      await prisma.$transaction([
        prisma.message.deleteMany({
          where: {
            conversationId,
          },
        }),

        prisma.conversation.delete({
          where: {
            id: conversationId,
          },
        }),
      ]);
      console.log("deleted")

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