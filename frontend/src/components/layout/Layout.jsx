import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./layout.css";

function Layout({ children, type }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  };

  return (
    <div className="layout">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar
        type={type}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onDesktopToggle={() => setCollapsed(c => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="main">
        <Header
          title={type === "admin" ? "Admin" : "User"}
          onMenuToggle={handleMenuToggle}
          sidebarOpen={mobileOpen || !collapsed}
        />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
