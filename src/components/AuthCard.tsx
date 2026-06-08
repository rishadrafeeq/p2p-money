import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#f5e6ff] via-[#f0e8ff] to-[#e8f0ff] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-8 py-10">
        <h1 className="text-[26px] font-bold text-center text-[#2d3748] mb-8 tracking-tight">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
