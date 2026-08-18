"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Folder } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Jika berhasil login, arahkan kembali ke halaman dashboard utama
      router.push("/");
    } catch (error: any) {
      setErrorMsg("Email atau password salah.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <Folder className="w-6 h-6 text-black" />
          </div>
          <h1 className="font-bold text-xl text-gray-900">Referensi Team</h1>
        </div>

        <p className="text-sm text-gray-500 mb-6">Silakan masuk untuk mengakses ruang kerja.</p>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}