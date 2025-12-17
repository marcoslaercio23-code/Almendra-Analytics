import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    try {
      if (isLogin) {
        await login(email, password);
        navigate("/dashboard");
      } else {
        navigate("/register", { state: { email, password, fullName } });
      }
    } catch (err) {
      setLocalError(err.message || "Erro ao processar");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError("");
      await loginWithGoogle();
    } catch (err) {
      setLocalError(err.message || "Erro ao fazer login com Google");
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1512] text-[#F5F5F0] flex items-center justify-center px-4 font-sans selection:bg-[#D4AF37] selection:text-black relative overflow-hidden">
      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 mix-blend-overlay" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")` 
           }}>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#D4AF37] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <span className="text-2xl font-serif font-bold text-[#D4AF37]">AA</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 font-serif text-[#D4AF37] tracking-tight">Almendra Analytics</h1>
          <p className="text-[#8B7355] font-light italic">Visão orgânica do mercado de cacau</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#2A2018]/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-[#8B7355]/20">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-3 font-serif font-medium transition-all flex-1 text-center ${
                isLogin
                  ? "border-b-2 border-[#D4AF37] text-[#D4AF37]"
                  : "text-[#8B7355] hover:text-[#F5F5F0]"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-3 font-serif font-medium transition-all flex-1 text-center ${
                !isLogin
                  ? "border-b-2 border-[#D4AF37] text-[#D4AF37]"
                  : "text-[#8B7355] hover:text-[#F5F5F0]"
              }`}
            >
              Registrar
            </button>
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-6 p-4 bg-[#C04000]/10 border border-[#C04000]/30 rounded-lg text-[#C04000] text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error || localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2 text-[#D4AF37]">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-lg bg-[#1A1512] text-[#F5F5F0] border border-[#8B7355]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-[#8B7355]/50"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-[#D4AF37]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-lg bg-[#1A1512] text-[#F5F5F0] border border-[#8B7355]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-[#8B7355]/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#D4AF37]">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-[#1A1512] text-[#F5F5F0] border border-[#8B7355]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-[#8B7355]/50"
                required
              />
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#8B7355]/30 bg-[#1A1512] text-[#D4AF37] focus:ring-[#D4AF37]" />
                  <span className="text-[#8B7355] group-hover:text-[#D4AF37] transition-colors">Lembrar-me</span>
                </label>
                <button type="button" className="text-[#D4AF37] hover:text-[#F5F5F0] transition-colors underline decoration-[#D4AF37]/30 hover:decoration-[#D4AF37]">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#1A1512] font-bold py-3 px-4 rounded-lg shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#1A1512]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                isLogin ? "Entrar na Plataforma" : "Criar Conta"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#8B7355]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#2A2018] text-[#8B7355]">ou continue com</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#1A1512] hover:bg-[#3E352F] text-[#F5F5F0] font-medium py-3 px-4 rounded-lg border border-[#8B7355]/30 hover:border-[#D4AF37]/50 transition-all disabled:opacity-50 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          {/* Footer Text */}
          <p className="text-center text-sm text-[#8B7355] mt-8">
            {isLogin ? "Não tem conta? " : "Já tem conta? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#D4AF37] hover:text-[#F5F5F0] font-semibold transition-colors"
            >
              {isLogin ? "Registrar agora" : "Fazer login"}
            </button>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-[#8B7355]/60 mt-8">
          Ao continuar, você concorda com nossos{" "}
          <button type="button" className="text-[#8B7355] hover:text-[#D4AF37] transition-colors underline">
            Termos de Serviço
          </button>{" "}
          e{" "}
          <button type="button" className="text-[#8B7355] hover:text-[#D4AF37] transition-colors underline">
            Política de Privacidade
          </button>
        </p>
      </div>
    </div>
  );
}
