import React, { useEffect, useState } from "react";
import { Navbar, Nav, Dropdown, Image, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Logout } from "../services/api";
import { FaBars } from "react-icons/fa";

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Admin");
  const [userAvatar, setUserAvatar] = useState(
    "/assets/images/users/avatar-2.jpg"
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("AvdUser");
    const storedAvatar = localStorage.getItem("AvdPicture");

    if (storedUser) setUserName(storedUser);
    if (storedAvatar) setUserAvatar(storedAvatar);
  }, []);

  const handleLogout = async () => {
    try {
      await Logout();
    } finally {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <style>
        {`
        .app-header {
          background: linear-gradient(
            180deg,
            rgba(111, 3, 3, 0.65),
            rgba(106, 8, 8, 0.65)
          );
          border-bottom: 1px solid #5a0627;
        }

        .menu-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-btn svg {
          font-size: 18px;
        }

        .header-user-toggle {
          background: transparent !important;
          border: none !important;
          color: #fff !important;
        }
        `}
      </style>

      <Navbar
        className="app-header px-3 position-fixed w-100 top-0"
        style={{ height: "70px", zIndex: 1030 }}
      >
        {/* LEFT */}
        <div className="d-flex align-items-center">
          <Button
            variant="outline-light"
            className="me-2 d-lg-none menu-btn"
            onClick={onToggleSidebar}
          >
            <FaBars />
          </Button>

          <Navbar.Brand className="fw-bold text-white mb-0">
            𖤐⭒ ASTROVEDHAM
          </Navbar.Brand>
        </div>

        {/* RIGHT (ALWAYS VISIBLE) */}
        <Nav className="ms-auto align-items-center">
          <Dropdown align="end">
            <Dropdown.Toggle className="header-user-toggle d-flex align-items-center">
              <Image
                src={userAvatar}
                roundedCircle
                height={36}
                width={36}
                className="me-2"
              />
              <span className="d-none d-md-inline">{userName}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.ItemText className="fw-semibold">
                {userName}
              </Dropdown.ItemText>

              <Dropdown.Divider />

              <Dropdown.Item className="text-danger" onClick={handleLogout}>
                Log Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Navbar>
    </>
  );
};

export default Header;
