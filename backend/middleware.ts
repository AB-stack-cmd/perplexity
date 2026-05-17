import type {Request , Response, NextFunction  } from "express";
import { createSupabseClient } from "./lib/supabase/Client.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const supebase = createSupabseClient()
export default async function Validation(req : Request ,  res: Response , next : NextFunction){
    try{
        const auth =  req.headers.authorization ; 
        console.log(auth)
        if (!auth || !auth.startsWith("Bearer ")) {

        return res.status(401).json({
            success: false,
            message: "No token provided"
          })
        }
          // Extract JWT only
    const token = auth.split(" ")[1];

    const data = await supebase.auth.getUser(token);
    console.log(data)
        
    const userId = data.data?.user?.id

        if(userId){
            console.log(userId)
            req.userId = userId
            
           next()
          }
    }catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message
        })
    }
}