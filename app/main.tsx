"use client"
import { useRouter } from "next/navigation";

export default function Main(){
    const router = useRouter();

    return( <div>
        <h1 className="border p-2"> Home</h1>
        <button className="font-bold border p-3" onClick={()=>router.push("/auth")}> Auth </button>
        <button onClick={()=> router.push("/auth/dashboard")}>Dashboard</button>
    </div>)
}