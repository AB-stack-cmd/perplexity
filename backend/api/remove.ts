import express from "express";
import type { Request , Response } from "express";
import Validation from "../middleware";
import { request } from "node:http";
import { error } from "node:console";
import prisma from "../db";

const router = express()

router.delete("/delete" ,  Validation , async(res:Response,req:Request)=>{
    try{
         const { conversationId } = req.params;

        const conversation = await prisma.conversation.findFirst({
            where :{id : req.dbUserId , userId:req.userId}
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
                });
        };

        await prisma.conversation.delete({
            where :{id:req.dbUserId}
        });

        return res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
        conversationId,
      });
        }catch(e){
            res.json({
                Message : "unable to delete conversation",
                error : e
            })
        }
})