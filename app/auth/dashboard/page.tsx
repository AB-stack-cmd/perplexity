"use client"

import { createClient } from "../../lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
const supabase = createClient()

export default function Dashboard() {

  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function getUser() {

      try {

        const { data :{session}, error } = await supabase.auth.getSession()
        const jwt = session?.access_token
        if (error) throw error

        setUser(session?.user ?? null)
        if(user){
          const res =await  axios.get(`${process.env.BACKEND_URL}/conversation`,{
            headers:{
              Authorization:`Bearer ${jwt}`
            }
          })
          if(!res){
            console.log("No response")
          }
        }
        
      } catch (error) {

        console.error("Error fetching user:", error)
        setUser(null)

      } finally {

        setLoading(false)

      }
    }

    getUser()

  }, [])

  const handleLogout = async () => {

    try {

      await supabase.auth.signOut()

      setUser(null)

    } catch (error) {

      console.error("Error signing out:", error)

    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>

        <p className="mb-4">
          Please sign in to access your dashboard
        </p>

        <button
          onClick={() => router.push("/auth")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">

      <h1 className="text-2xl font-bold mb-4">
        Dashboard
      </h1>

      <div className="mb-4">

        <p>
          Welcome, {user.email}
        </p>

        <p>
          ID: {user.id}
        </p>

      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
        
      >
        Sign Out
      </button>

    </div>
  )
}