'use client'

import React, { useState } from 'react'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@oxmon.com')
  const [password, setPassword] = useState('password')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    onLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-3xl -z-10"></div>

      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl p-10 flex flex-col gap-8 border border-white/50 backdrop-blur-sm animate-fade-in-up">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20 text-white mb-2">
            <span className="material-symbols-outlined text-4xl filled">monitoring</span>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-text-main text-2xl font-bold tracking-tight">Oxmon Admin</h1>
            <p className="text-secondary text-sm font-medium">Infrastructure Monitoring & Certificates</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-text-main text-sm font-medium ml-1" htmlFor="username">Username</label>
            <div className="relative group">
              <input
                id="username"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-background border border-border text-text-main text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ease-out"
                placeholder="admin@oxmon.com"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-text-main text-sm font-medium" htmlFor="password">Password</label>
              <a href="#" className="text-primary hover:text-blue-600 text-xs font-medium transition-colors">Forgot password?</a>
            </div>
            <div className="relative group">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-background border border-border text-text-main text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ease-out"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`mt-2 w-full h-12 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg text-[15px] tracking-wide transition-all duration-200 shadow-md shadow-primary/20 flex items-center justify-center gap-2 group active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
                <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
          <p className="text-xs text-secondary text-center">
            Protected by enterprise-grade encryption.<br />
            <span className="opacity-75">v2.4.0 (Stable)</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
