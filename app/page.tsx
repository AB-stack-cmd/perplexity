"use client"
import Image from "next/image";
import Main from "./Main";
import LandingPage from "./Home";
export default function Home() {
 
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* <Main/> */}
      <LandingPage/>
    </div>
  );
}
