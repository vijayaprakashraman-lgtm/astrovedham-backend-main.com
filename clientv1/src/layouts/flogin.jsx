import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../services/firebase";
import { flogin, saveFcmToken } from "../services/api";
import { getFcmToken } from "../firebase";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate(); // ✅ TOP LEVEL
const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();

      const response = await flogin({ idToken });
      if (response.status === 200) {
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
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
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

        .login-wrapper {
          background: #f5f6fa;
        }

        .login-card {
          border-radius: 18px;
        }

        .google-btn {
          background: #fff;
          color: #444;
          border: 1px solid #ddd;
          padding: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .google-btn:hover {
          background: #f8f9fa;
          border-color: #ccc;
          transform: translateY(-1px);
        }

        /* RIGHT PANEL */
        .right-panel {
          background: linear-gradient(
              rgba(114, 9, 9, 0.65),
              rgba(0, 0, 0, 0.65)
            ),
            url("/assets/images/astro-bg.jpg") center / cover no-repeat;
        }

        .right-content {
          color: #fff;
          padding: 80px;
          max-width: 680px;
        }

        /* TITLES */
        .brand-title {
          font-size: 3.8rem;
          font-weight: 700;
          margin-bottom: 5px;
          color: #ffffff;
        }

        .brand-subtitle {
          font-size: 1.6rem;
          margin-bottom: 25px;
          color: #f1f1f1;
        }

        .brand-subtitle span {
          color: #dc3545;
        }

        /* INTRO */
        .intro-text {
          font-size: 1.15rem;
          line-height: 1.7;
          opacity: 0.95;
          margin-bottom: 35px;
        }

        /* SECTION BASE */
        .section {
          margin-bottom: 30px;
          padding-left: 20px;
          border-left: 4px solid transparent;
        }

        /* HIGHLIGHT SECTION */
        .section.highlight {
          border-left-color: #dc3545;
        }

        .section.highlight h3 {
          color: #dc3545;
          font-size: 1.45rem;
          margin-bottom: 15px;
          font-weight: 600;
        }

        /* FEATURE LIST */
        .feature-list {
          list-style: none;
          padding: 0;
        }

        .feature-list li {
          margin-bottom: 18px;
        }

        .feature-list strong {
          display: block;
          font-size: 1.05rem;
          color: #ffffff;
        }

        .feature-list span {
          display: block;
          font-size: 0.95rem;
          opacity: 0.85;
          margin-top: 3px;
        }

        /* CALLOUT SECTION */
        .section.callout {
          border-left-color: #dc3545;
          background: #900c3f;
          padding: 22px;
          border-radius: 12px;
        }

        .section.callout p {
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 10px;
        }

        .section.callout .cta {
          font-size: 1.15rem;
          color: #dc3545;
          font-weight: 600;
        }
          .why-para {
  font-size: 1.05rem;
  line-height: 1.7;
  opacity: 0.95;
  margin-top: 15px;
}

.why-para span {
  color: #dc3545;
  font-weight: 600;
}/* TEXT LOGO */
.text-logo {
 font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: #900c3f;
   position: relative;
  display: inline-block;
  padding-bottom: 6px;
}

/* LOGO UNDERLINE */
.text-logo::after {
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

/* SUBTITLE */
.login-subtitle {
  font-size: 0.95rem;
  color: #666;
}
  .login-left {
  background: linear-gradient(
    180deg,
    rgba(114, 9, 9, 0.65),
              rgba(0, 0, 0, 0.65)
  );
}

      `}
      </style>

      {/* ================= PAGE ================= */}
      <Container fluid className="p-0 min-vh-100 login-wrapper">
        <Row className="g-0 min-vh-100">
          {/* LEFT LOGIN */}

          {/* RIGHT BRAND CONTENT */}
          <Col
            lg={7}
            className="d-none d-lg-flex align-items-center right-panel"
          >
            <div className="right-content">
              <h1 className="brand-title">Astrovedham</h1>
              <h2 className="brand-subtitle">
                Your Trusted Source for <span>Vedic Astrology</span>
              </h2>

              <p className="intro-text">
                Astrovedham is a premier online platform dedicated to providing
                authentic and insightful Vedic astrology services. We empower
                individuals to make confident life decisions through ancient
                wisdom and modern technology.
              </p>

              <p className="why-para">
                <span>Astrovedham</span> delivers authentic Vedic astrology
                based on classical principles, offering personalized guidance
                through detailed birth-chart analysis. Our platform provides
                complete astrology solutions including life, marriage, wealth,
                career, and yearly horoscopes. Trusted by users for honest
                insights and accuracy, Astrovedham combines ancient wisdom with
                modern technology in a simple, user-friendly experience.
              </p>
            </div>
          </Col>
          <Col
            lg={5}
            className="d-flex align-items-center justify-content-center login-left"
          >
            <Card className="border-0 shadow-lg w-100 mx-4 login-card">
              <Card.Body className="p-4 p-md-5">
                {/* TITLE */}
                <div className="text-center mb-4">
                  {/* TEXT LOGO */}
                  <div className="text-logo">Astrovedham</div>

                  <h4 className="mt-3 fw-bold">Franchise Login</h4>
                  <p className="login-subtitle">
                    Sign in to access your dashboard
                  </p>
                </div>

                {/* GOOGLE LOGIN */}
                <Button
                  onClick={handleGoogleLogin}
                  className="w-100 google-btn d-flex align-items-center justify-content-center gap-3"
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    height="20"
                    alt="Google"
                  />
                  <span>Continue with Google</span>
                </Button>

                {/* FOOTER */}
                <div className="mt-5 text-center small login-footer">
                  © {new Date().getFullYear()} Astrovedham <br />
                  Crafted with <span>♥</span> by VILLZONE
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
