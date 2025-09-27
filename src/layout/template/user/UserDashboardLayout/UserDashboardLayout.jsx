import { Outlet } from "react-router-dom";
import UserLeftSide from "./UserLeftSide";
const UserDashboardLayout = () => {
  return (
    <section className="flex min-h-screen bg-[#212121] text-white">
      {/* Fixed Sidebar */}
      <div className="fixed z-10 h-screen md:w-[260px] bg-[#212121]">
        {/* Added 'fixed' and 'z-10' */}
        <UserLeftSide />
      </div>

      {/* Content Area - Takes remaining space and scrolls */}
      <div className="w-full overflow-y-auto bg-white bg-gradient-to-b md:pl-62">
        <Outlet />
      </div>
    </section>
  );
};

export default UserDashboardLayout;
