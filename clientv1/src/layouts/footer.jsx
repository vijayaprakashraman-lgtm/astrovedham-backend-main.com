import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="border-top py-3 mt-auto">
      <Container fluid>
        <Row className="align-items-center">
          <Col sm={6} className="text-center text-sm-start">
            © {new Date().getFullYear()} Astrovedham
          </Col>

          <Col sm={6} className="text-center text-sm-end">
            Crafted with{" "}
            <span className="text-danger">♥</span> by VILLZONE!
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
    