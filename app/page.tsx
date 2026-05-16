"use client"
import Image from "next/image";
import Auth from "./auth/page";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <h1>Home page</h1> */}
      <button className="font-bold border p-3" onClick={()=>router.push("/auth")}> Auth </button>
      <button onClick={()=> router.push("/auth/dashboard")}>Dashboard</button>

  
    </div>
  );
}
