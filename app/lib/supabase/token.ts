import { createClient } from "./client";

const supabase = createClient()

export  async function jwt_token (){
    const {data: { session },error,} = await supabase.auth.getSession();
    
                if (error) throw error;
                 // Access token from session
                const jwt = session?.access_token;
                const user = session?.user
              
              // return `user ${user} \n ${jwt}`
              return jwt
           }

console.log(jwt_token())