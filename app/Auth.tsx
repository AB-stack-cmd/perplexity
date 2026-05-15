"use client"
import { createClient } from "./lib/supabase/client";
const supabase = createClient()


export default function Auth(){
    
    async function login(provider:"github" | "google"){
        const {data , error}= await supabase.auth.signInWithOAuth({
            provider:provider
        })

        console.log(`Data : ${data}`)

        if(error){
            alert("Error while Signing in")
        }else{
            alert("Signed in")
        }
    }


    return <div>
        <button onClick={()=> login("github")}>GitHub</button>
        <br />
        <button onClick={()=> login("google")}>Google</button>
    </div>
}

