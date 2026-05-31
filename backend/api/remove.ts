import express from "express";
import type { Request , Response } from "express";
import Validation from "../middleware";
import { request } from "node:http";
import { error } from "node:console";
import prisma from "../db";

const router = express()

router.delete("/delete" ,  Validation , async(res:Response,req:Request)=>{
    try{
        const conversation = await prisma.conversation.findFirst()

    }catch(e){
        res.json({
            Message : "unable to delete conversation",
            error : e
        })
    }
})