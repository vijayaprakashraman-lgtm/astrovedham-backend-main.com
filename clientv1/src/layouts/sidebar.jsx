import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { FRANCHISE_CTYPE, getAVctype } from "../utils/variable";
import {
  FaStar,
  FaShoppingBag,
  FaCheckCircle,
  FaUserTie,
  FaLayerGroup,
  FaUsers,
} from "react-icons/fa";
const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const actype = getAVctype();

  const menus = [
    {
      to: "/generate-horoscope",
      label: "Generate Horoscope",
      icon: <FaStar />,
    },
    {
      to: "/user-plans",
      label: "User Plans",
      icon: <FaLayerGroup />,
    },
    {
      to: "/customers",
      label: "Customers",
      icon: <FaUsers />,
    },
    {
      to: "/franchise-reg",
      label: "Franchise Registration",
      icon: <FaUserTie />,
    },
    {
      to: "/list/Pending",
      label: "Pending Orders",
      icon: <FaShoppingBag />,
    },
    {
      to: "/list/Completed",
      label: "Completed Orders",
      icon: <FaCheckCircle />, // ✅ completed
    },
  ];

  return (
    <aside className={`astro-sidebar ${isOpen ? "open" : ""}`}>
      <div className="p-3">
        <div className="sidebar-title">Menus</div>

        <Nav className="flex-column gap-1">
          {menus
            .filter((m) => {
              if (
                actype === FRANCHISE_CTYPE &&
                (m.to === "/franchise-reg" || m.to === "/user-plans" || m.to === "/customers")
              ) {
                return false;
              }
              return true;
            })
            .map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onClick={onClose} // ✅ safe now
                className={({ isActive }) =>
                  "astro-nav-link" + (isActive ? " active" : "")
                }
              >
                <span className="me-3 sidebar-icon">{m.icon}</span>
                {m.label}
              </NavLink>
            ))}
        </Nav>
      </div>
    </aside>
  );
};

export default Sidebar;
