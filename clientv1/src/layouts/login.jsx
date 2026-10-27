import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../services/firebase";
import { login, saveFcmToken } from "../services/api";
import { getFcmToken } from "../firebase";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();

      const response = await login({ idToken });
      if (response.status == 200) {
        localStorage.setItem("AvdToken", response.data.token);
        localStorage.setItem("AvdUser", response.data.name);
        localStorage.setItem("AvdPicture", response.data.picture);
        localStorage.setItem("AVctype", String(response.data.ctype || "").trim());
        const fcmToken = await getFcmToken();
        if (fcmToken) {
          await saveFcmToken(fcmToken);
        }
        navigate("/"); // ✅ goes to /portal/ because of basename
      } else {
        alert("Login failed. Please try again.");
      }
    } catch (error) {
      alert("Login failed. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <>
      {/* ================= INLINE STYLES ================= */}
      <style>
        {`
        body {
          font-family: "Segoe UI", sans-serif;
        }

        .owner-wrapper {
          background: linear-gradient(
    180deg,
    rgba(114, 9, 9, 0.65),
              rgba(0, 0, 0, 0.65)
  );
        }

        .owner-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        .owner-logo {
          font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: #900c3f;
   position: relative;
  display: inline-block;
  padding-bottom: 6px;
        }
.owner-logo::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 60%;
  height: 3px;
  background: #900c3f;
  transform: translateX(-50%);
  border-radius: 2px;
}

        .owner-subtitle {
          font-size: 0.95rem;
          color: #666;
        }

        .owner-badge {
          display: inline-block;
          background: #900c3f;
          color: #ffffff;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 1px;
          margin-top: 10px;
        }

        .owner-google-btn {
          background: #ffffff;
          border: 2px solid #900c3f;
          padding: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .owner-google-btn:hover {
          background: #900c3f;
          color: #ffffff;
        }

        .owner-footer {
          font-size: 0.85rem;
          color: #777;
        }
          .signincolor{
          color:balck;
          }
      `}
      </style>

      {/* ================= PAGE ================= */}
      <Container fluid className="p-0 min-vh-100 owner-wrapper">
        <Row className="g-0 min-vh-100 justify-content-center align-items-center">
          <Col lg={4} md={6} sm={10}>
            <Card className="border-0 owner-card p-4">
              <Card.Body>
                {/* HEADER */}
                <div className="text-center mb-4">
                  <div className="owner-logo">Astrovedham</div><br/>
                  <div className="owner-badge">Admin ACCESS</div>
                  <h5 className="mt-4 fw-bold">Administrator Login</h5>
                  <p className="owner-subtitle">
                    Restricted access for platform Admin only
                  </p>
                </div>

                {/* GOOGLE LOGIN */}
                <Button
                  onClick={handleGoogleLogin}
                  className="w-100 owner-google-btn d-flex align-items-center justify-content-center gap-3"
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    height="20"
                    alt="Google"
                  />
                  <span className="text-black">Sign in with Google</span>
                </Button>

                {/* FOOTER */}
                <div className="mt-5 text-center owner-footer">
                  © {new Date().getFullYear()} Astrovedham <br />
                  Crafted with <span style={{ color: "#900c3f" }}>♥</span> by
                  VILLZONE
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Login;
