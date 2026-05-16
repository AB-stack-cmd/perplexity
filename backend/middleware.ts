import type {Request , Response, NextFunction  } from "express";
import { createSupabseClient } from "./lib/supabase/Client";

const supebase = createSupabseClient()
export default async function Validation(req : Request ,  res: Response , next : NextFunction){
    try{
          const token =  req.headers.authorization ; 

    const data = await supebase.auth.getUser(token);
    const userId = data.data?.user?.id

    if(userId){
        req.userId = userId
        next()
    }
    }catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message
    })
  
}