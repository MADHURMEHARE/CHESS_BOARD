import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
export default function MainLayout() {

  return (
    <div
      className="
        min-h-screen
        bg-[#F8F7F2]
        text-[#1A1A1A]
        font-sans
      "
    >

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar/>

        {/* Route Pages */}
        <main
          className="
            flex-1
            bg-white
            relative
            overflow-y-auto

            ml-0
            lg:ml-72

            pt-16
            lg:pt-0
          "
        >

          <div
            className="
              w-full
              max-w-7xl
              mx-auto

              p-4
              sm:p-6
              md:p-8
              lg:p-12
            "
          >

            <Outlet />

          </div>

        </main>

      </div>

    </div>
  );
}