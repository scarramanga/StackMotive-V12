import React from "react";
import { NavLink } from 'react-router-dom';

export const MobileNavigation: React.FC = () => {
  const navItems = [
    { label: "Home", icon: "ri-home-4-line", path: "/" },
    { label: "Trading", icon: "ri-line-chart-line", path: "/trading" },
    { label: "Strategies", icon: "ri-robot-line", path: "/strategies" },
    { label: "Account", icon: "ri-user-line", path: "/account" },
  ];
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 z-30">
      <div className="flex justify-around h-16">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}>
            <a className={`flex flex-col items-center justify-center`}>
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;
