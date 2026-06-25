'use client';

import { useState, useEffect } from "react";
import { ChevronUp, Plus, X, Moon, Sun } from "lucide-react";

export default function QuickMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // 모바일 체크용

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
      if (window.scrollY > 100) setIsOpen(false);
    };
    
    handleResize(); // 초기 체크
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const actions = [
    { 
      icon: isDark ? <Sun size={20} /> : <Moon size={20} />, 
      label: isDark ? "라이트 모드" : "다크 모드", 
      color: "bg-[#3E3232] dark:bg-[#8D7B68]",
      onClick: () => {
        document.documentElement.classList.toggle('dark');
        const darkStatus = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', darkStatus ? 'dark' : 'light');
        setIsDark(darkStatus);
      }
    },
  ];

  return (
    // 모바일에서는 하단/우측 여백을 4(1rem)로 줄임
    <div className="fixed bottom-6 right-4 md:bottom-10 md:right-8 z-[200] flex flex-col items-center gap-4">
      
      <div className="relative flex items-center justify-center">
        {actions.map((action, i) => {
          // 모바일일 때 반지름(Radius)을 더 작게 설정
          const radiusX = isMobile ? 80 : 100;
          const radiusY = isMobile ? 130 : 170;

          return (
            <div
              key={i}
              className={`absolute flex items-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"
              } ${showTop ? "-translate-y-16" : "translate-y-0"}`}
              style={{
                transform: isOpen 
                  ? `translate(${Math.cos((130 + i * 40) * Math.PI / 180) * radiusX}px, ${Math.sin((180 + i * 20) * Math.PI / 180) * radiusY}px)`
                  : 'translate(0, 0)'
              }}
            >
              <span className="absolute right-full mr-3 px-3 py-1.5 bg-[#3E3232] dark:bg-[#F9F5F0] text-white dark:text-[#3E3232] text-[10px] font-bold rounded-lg whitespace-nowrap shadow-xl">
                {action.label}
                <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#3E3232] dark:bg-[#F9F5F0] rotate-45" />
              </span>

              <button 
                onClick={action.onClick}
                className={`flex items-center justify-center w-12 h-12 rounded-full text-white shadow-2xl transition-transform cursor-pointer active:scale-95 ${action.color}`}
              >
                {action.icon}
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 cursor-pointer ${
            isOpen ? "bg-[#3E3232] rotate-45" : "bg-[#8D7B68]"
          } ${showTop ? "-translate-y-16" : "translate-y-0"}`}
        >
          {isOpen ? <X size={28} className="text-white" /> : <Plus size={28} className="text-white" />}
        </button>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`absolute w-14 h-14 bg-white dark:bg-[#3E3232] border border-[#eee] dark:border-[#8D7B68]/30 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-xl cursor-pointer active:scale-95 ${
            showTop ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"
          }`}
        >
          <ChevronUp size={24} className="text-[#3E3232] dark:text-white -mb-1" />
          <span className="text-[8px] font-black text-[#3E3232] dark:text-white uppercase">TOP</span>
        </button>
      </div>

      {/* 모바일에서는 번호를 숨기고 테블릿 이상부터 노출 */}
      <div className="absolute -bottom-6 right-0 whitespace-nowrap pointer-events-none hidden md:block">
         <span className="text-[10px] font-black tracking-widest text-[#3E3232]/30 dark:text-[#8D7B68]/30 uppercase">PARTNERSHIP : 1522-0290</span>
      </div>
    </div>
  );
}