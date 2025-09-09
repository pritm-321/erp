import Image from "next/image";
import dynamic from "next/dynamic";
import ClientSection from "./ClientSection";

export default function Home() {
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ClientSection />
      </div>
    </>
  );
}
