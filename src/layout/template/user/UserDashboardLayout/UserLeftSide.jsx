import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSettings, FiLink, FiFileText, FiMenu, FiX } from "react-icons/fi";

const navLinksData = [
  { name: "User", icon: <FiFileText />, path: "/user-dashboard/user" },
  { name: "History", icon: <FiFileText />, path: "/user-dashboard/history" },
  {
    name: "Documents",
    icon: <FiSettings />,
    path: "/user-dashboard/documents",
  },
  { name: "Links", icon: <FiLink />, path: "/user-dashboard/links" },
];

const UserLeftSide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed z-50 flex w-full items-center justify-between bg-gray-900 px-4 py-3 text-white md:hidden">
        <button onClick={() => setIsOpen(true)}>
          <FiMenu className="h-7 w-7" />
        </button>
        <a href="/">
          <img src="/image/Logo.png" alt="Logo" className="h-10" />
        </a>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 transform bg-gray-800 text-white transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-4 md:justify-center">
          <a href="/">
            <img
              src="/image/Logo.png"
              alt="Logo"
              className="h-[48px] w-[144px] rounded-2xl border-2 border-yellow-400 bg-cover object-cover p-2"
            />
          </a>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white md:hidden"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col pt-6">
          {navLinksData.map((link) => (
            <a
              key={link.name}
              onClick={() => {
                navigate(link.path);
                setIsOpen(false); // close after click on mobile
              }}
              className={`relative flex cursor-pointer items-center gap-4 rounded-lg px-4 py-3 text-base font-normal capitalize transition-colors duration-200 ${
                isActive(link.path)
                  ? "text-blue-500"
                  : "text-neutral-400 hover:text-blue-500"
              }`}
            >
              {isActive(link.path) && (
                <div className="absolute top-2 left-0 h-10 w-1 rounded-tr-sm rounded-br-sm bg-blue-500" />
              )}
              <span
                className={`rounded-lg p-2 transition-colors duration-200 ${
                  isActive(link.path)
                    ? "bg-blue-500 text-white"
                    : "bg-neutral-700 text-white"
                }`}
              >
                {link.icon}
              </span>
              <span className="whitespace-nowrap">{link.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default UserLeftSide;
