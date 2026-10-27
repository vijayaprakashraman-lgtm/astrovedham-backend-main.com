import React, { useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import Footer from "./footer";
import { Outlet } from "react-router-dom";

const Mainlayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* HEADER */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay d-lg-none"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* PAGE CONTENT */}
      <main
        className="content-wrapper flex-grow-1 p-4 bg-light"
        style={{
          marginLeft: "250px",
          marginTop: "70px",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <Outlet />
        <Footer />
      </main>
    </>
  );
};

export default Mainlayout;
