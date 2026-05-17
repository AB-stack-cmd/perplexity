import type {Request , Response, NextFunction  } from "express";
import { createSupabseClient } from "./lib/supabase/Client.ts";
import prisma from "./db.ts"
import { email } from "zod";


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
        console.log(`auth: ${auth}`)
        if (!auth || !auth.startsWith("Bearer ")) {
        console.log(req.body)

        return res.status(401).json({
            success: false,
            message: "No token provided"
          })
        }
          // Extract JWT only
    const token = auth.split(" ")[1];

    // User data
    const data = await supebase.auth.getUser(token);
    console.log(data.data.user)
    console.log(`Metadata : ${data.data.user?.app_metadata.provider}`)
        
    const userId = data.data?.user?.id

        if(userId){
          console.log(`Req : ${req.body.user}`)
          
            console.log(`req.id : ${req.userId}`)
            console.log(userId)

            req.userId = userId
            try {

            const existingUser = await prisma.user.findUnique({
              where: {
                id:userId,
                supabaseId: userId,
              },
            });

            if (!existingUser) {

              await prisma.user.create({
                data: {
                  email: data.data.user?.email || "",

                  provider:
                    data.data.user?.app_metadata.provider === "google"
                      ? "Google"
                      : "Github",

                  name:
                    data.data.user?.user_metadata.full_name ||
                    data.data.user?.user_metadata.name ||
                    "Unknown",

                  supabaseId: userId,
                },
              });

              console.log("User created");
            } else {
              console.log("User already exists");
            }

          } catch (e) {
            console.log(e);
          }
            
           next()
          }
    }catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message
        })
    }
}