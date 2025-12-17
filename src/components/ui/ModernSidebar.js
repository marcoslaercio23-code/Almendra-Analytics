"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Scale,
  ScrollText,
  Bell,
  Search,
  Newspaper,
  MapPin,
  TrendingUp,
  Globe
} from 'lucide-react';

// Updated navigation items for Cacau Market
const navigationItems = [
  { id: "dashboard", name: "Dashboard", icon: Leaf, href: "#dashboard" },
  { id: "chart", name: "Análise", icon: Scale, href: "#chart" },
  { id: "news", name: "Notícias", icon: ScrollText, href: "#news" },
  { id: "noticias-ia", name: "Notícias IA", icon: Newspaper, href: "/noticias", isRoute: true },
  { id: "analise-local", name: "Análise Local", icon: MapPin, href: "/analise-local", isRoute: true },
  { id: "analise-futura", name: "Análise Futura", icon: TrendingUp, href: "/analise-futura", isRoute: true },
  { id: "calculadora", name: "Calculadora", icon: Scale, href: "/calculadora", isRoute: true },
  { id: "import-analysis", name: "Importação Profunda", icon: Globe, href: "/import-analysis", isRoute: true },
  { id: "alerts", name: "Alertas", icon: Bell, href: "#alerts" },
];

export function Sidebar({ className = "", children, activeTab, setActiveTab, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  
  // Hook para navegação - sempre chamado incondicionalmente
  const navigate = useNavigate();

  // Sync activeItem with activeTab prop
  useEffect(() => {
    if (activeTab) {
      setActiveItem(activeTab);
    }
  }, [activeTab]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClick = (item) => {
    // Se é uma rota externa, navega para ela
    if (item.isRoute && navigate) {
      navigate(item.href);
      return;
    }
    
    setActiveItem(item.id);
    if (setActiveTab) {
      setActiveTab(item.id);
    }
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#1A1512] text-[#F5F5F0] font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-[#1A1512] shadow-md border border-[#D4AF37]/20 md:hidden hover:bg-[#2A2018] transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-[#D4AF37]" /> : 
          <Menu className="h-5 w-5 text-[#D4AF37]" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-[#1A1512] border-r border-[#3E352F] z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-28" : "w-72"}
          md:translate-x-0 md:static md:z-auto
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-5 border-b border-[#3E352F] bg-[#1A1512]/95">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#D4AF37] to-[#8B7355] rounded-lg flex items-center justify-center shadow-sm border border-[#D4AF37]/20">
                <span className="text-[#1A1512] font-bold text-base font-serif">AA</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#D4AF37] text-base font-serif tracking-tight">Almendra</span>
                <span className="text-xs text-[#8B7355] font-medium tracking-wider">ANALYTICS</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-[#D4AF37] to-[#8B7355] rounded-lg flex items-center justify-center mx-auto shadow-sm border border-[#D4AF37]/20">
              <span className="text-[#1A1512] font-bold text-base font-serif">AA</span>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-[#2A2018] transition-all duration-200 text-[#8B7355] hover:text-[#D4AF37]"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#8B7355]" />
              <input
                type="text"
                placeholder="Buscar ativo..."
                className="w-full pl-9 pr-4 py-2 bg-[#2A2018] border border-[#3E352F] rounded-md text-sm text-[#F5F5F0] placeholder-[#6B5B45] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]/50 transition-all duration-200 font-sans"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-300 group border
                      ${isActive
                        ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                        : "text-[#8B7355] border-transparent hover:bg-[#2A2018] hover:text-[#F5F5F0] hover:border-[#3E352F]"
                      }
                      ${isCollapsed ? "justify-center px-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[24px]">
                      <Icon
                        className={`
                          h-5 w-5 flex-shrink-0 transition-colors duration-300
                          ${isActive 
                            ? "text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" 
                            : "text-[#6B5B45] group-hover:text-[#D4AF37]"
                          }
                        `}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-sm tracking-wide ${isActive ? "font-bold font-serif" : "font-medium font-sans"}`}>{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-1.5 py-0.5 text-[10px] font-bold rounded-full border
                            ${isActive
                              ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30"
                              : "bg-[#2A2018] text-[#8B7355] border-[#3E352F]"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && item.badge && (
                      <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[#D4AF37] border border-[#1A1512]">
                        <span className="text-[10px] font-bold text-[#1A1512]">
                          {parseInt(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#2A2018] text-[#F5F5F0] text-xs font-medium rounded border border-[#D4AF37]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-[#2A2018] border-l border-b border-[#D4AF37]/20 rotate-45" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-[#8B7355]/20">
          {/* Profile Section */}
          <div className={`border-b border-[#8B7355]/20 bg-[#1A1512]/30 ${isCollapsed ? 'py-3 px-2' : 'p-3'}`}>
            {!isCollapsed ? (
              <div className="flex items-center px-3 py-2 rounded-md bg-[#2A2018] hover:bg-[#3E3025] transition-colors duration-200 border border-[#8B7355]/10">
                <div className="w-8 h-8 bg-[#3E3025] rounded-full flex items-center justify-center border border-[#D4AF37]/20">
                  <span className="text-[#D4AF37] font-serif font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 ml-2.5">
                  <p className="text-sm font-medium text-[#F5F5F0] truncate font-serif">{user?.name || user?.email || 'Usuário'}</p>
                  <p className="text-xs text-[#8B7355] truncate font-mono">{user?.email || 'user@example.com'}</p>
                </div>
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full ml-2 shadow-[0_0_8px_rgba(76,175,80,0.5)]" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-9 h-9 bg-[#3E3025] rounded-full flex items-center justify-center border border-[#D4AF37]/20">
                    <span className="text-[#D4AF37] font-serif font-medium text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#4CAF50] rounded-full border-2 border-[#1A1512]" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={() => onLogout && onLogout()}
              className={`
                w-full flex items-center rounded-md text-left transition-all duration-200 group
                text-[#C04000] hover:bg-[#C04000]/10 hover:text-[#E05000]
                ${isCollapsed ? "justify-center p-2.5" : "space-x-2.5 px-3 py-2.5"}
              `}
              title={isCollapsed ? "Sair" : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-4.5 w-4.5 flex-shrink-0 text-[#C04000] group-hover:text-[#E05000]" />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm font-medium">Sair</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#2A2018] text-[#F5F5F0] text-xs font-medium rounded border border-[#D4AF37]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                  Sair
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-[#2A2018] border-l border-b border-[#D4AF37]/20 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        className={`
          flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out
          bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1A1512] via-[#0f0a08] to-[#1A1512]
          ${isCollapsed ? "md:ml-28" : "md:ml-72"}
          pt-16 md:pt-0
        `}
      >
        <div className="relative min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
