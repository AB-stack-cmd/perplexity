"use client";
import { jwt_token } from "@/app/lib/supabase/token";
import { createClient } from "@/app/lib/supabase/client";
import { useEffect } from "react";
import axios, { Axios } from "axios";


export default  async function Page() {

  const supabase = createClient()
      
  async function handleConveration() {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/conversation`)
  }

  async function handleTest() {
  
    try {
      const {data: { session },error,} = await supabase.auth.getSession();
                if (error) throw error;
                 // Access token from session
              const jwt = session?.access_token;
                console.log(`Jwt : ${jwt}`)


      

      // Check token
      if (!jwt) {

        console.error(
          "No token found"
        );

        return;
      }

      useEffect (()=>{
        async function ask() {
          const response = await fetch(
        "http://localhost:4000/purplexity_ask",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${jwt}`,
          },

          body: JSON.stringify({
            query: "What is AI?",
          }),
        }
      );

      // Handle HTTP errors
      if (!response.ok) {

        throw new Error(
          `HTTP Error: ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(data);

        }

        ask()
      
      },[])
      
    } catch (error) {

      console.error(
        "Fetch Error:",
        error
      );

    }
  }

  return (
    <button onClick={handleTest}>
      Test API
    </button>
  );
}