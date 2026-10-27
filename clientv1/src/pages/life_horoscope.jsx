import React, { useState } from "react";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import { place_order } from "../services/api";

const LifeHoroscope = () => {
  const [form, setForm] = useState({
    name: "",
    fathername: "",
    mothername: "",
    mobile: "",
    is_whatsapp: false,
    emailid: "",
    other_details: "",
    gender: "",
    dob: "",
    tob: "",
    place: "",
    language: "",
    horoscope_type: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Mobile: numbers only
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setForm((prev) => ({ ...prev, mobile: value }));
      setErrors((prev) => ({ ...prev, mobile: "" }));
    }
  };

  // Validation (ONLY required fields)
  const validate = () => {
    let e = {};

    if (!form.name) e.name = "Name is required";

    if (!form.mobile) {
      e.mobile = "Mobile number is required";
    } else if (form.mobile.length !== 10) {
      e.mobile = "Enter valid 10 digit mobile number";
    }

    if (!form.gender) e.gender = "Gender is required";
    if (!form.dob) e.dob = "Date of birth is required";
    if (!form.tob) e.tob = "Time of birth is required";
    if (!form.place) e.place = "Place is required";
    if (!form.language) e.language = "Language is required";
    if (!form.horoscope_type) {
      e.horoscope_type = "Please select horoscope type";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit_order = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      product_id: "life_horoscope",
      ...form,
    };

    try {
      const res = await place_order(payload);
      if (res.status === "S") {
        alert("Order Placed Successfully");
        window.location.reload();
      } else {
        alert("Error in placing order");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row>
      <Col md={12}>
        <Card>
          <Card.Body>
            <h4 className="card-title">Horoscope Order</h4>
            <Row>
              <Col md={4}></Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Horoscope Type *</Form.Label>
                  <Form.Select
                    value={form.horoscope_type}
                    isInvalid={!!errors.horoscope_type}
                    onChange={(e) =>
                      handleChange("horoscope_type", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Single">Single Horoscope</option>
                    <option value="Life">Life Horoscope</option>
                    <option value="Yearly">Yearly Horoscope</option>
                    <option value="Super">Super Horoscope</option>
                    <option value="Numerology">Numerology</option>
                    <option value="Gemstone">Gemstone Horoscope</option>
                    <option value="Marriage">Marriage Horoscope</option>
                    <option value="Wealth">Wealth Horoscope</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.horoscope_type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}></Col>
              <hr/>
            </Row>

            <Form onSubmit={submit_order} noValidate>
              {/* Row 1 */}
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      value={form.name}
                      isInvalid={!!errors.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Father Name (Optional)</Form.Label>
                    <Form.Control
                      value={form.fathername}
                      onChange={(e) =>
                        handleChange("fathername", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Mother Name (Optional)</Form.Label>
                    <Form.Control
                      value={form.mothername}
                      onChange={(e) =>
                        handleChange("mothername", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 2 */}

              {/* Row 3 */}
              <Row>
                <Col md={2}>
                  <Form.Group className="mb-2">
                    <Form.Label>Gender *</Form.Label>
                    <Form.Select
                      value={form.gender}
                      isInvalid={!!errors.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.gender}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group className="mb-2">
                    <Form.Label>DOB *</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.dob}
                      isInvalid={!!errors.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.dob}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group className="mb-2">
                    <Form.Label>TOB *</Form.Label>
                    <Form.Control
                      type="time"
                      value={form.tob}
                      isInvalid={!!errors.tob}
                      onChange={(e) => handleChange("tob", e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.tob}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Place *</Form.Label>
                    <Form.Control
                      value={form.place}
                      isInvalid={!!errors.place}
                      onChange={(e) => handleChange("place", e.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.place}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group className="mb-2">
                    <Form.Label>Language *</Form.Label>
                    <Form.Select
                      value={form.language}
                      isInvalid={!!errors.language}
                      onChange={(e) => handleChange("language", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="ta">Tamil</option>
                      <option value="en">English</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.language}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Mobile *</Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="numeric"
                      value={form.mobile}
                      isInvalid={!!errors.mobile}
                      onChange={handleMobileChange}
                    />
                    <Form.Check
                      label="Is this WhatsApp number?"
                      checked={form.is_whatsapp}
                      onChange={(e) =>
                        handleChange("is_whatsapp", e.target.checked)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.mobile}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group className="mb-2">
                    <Form.Label>Email (Optional)</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.emailid}
                      onChange={(e) => handleChange("emailid", e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 4 */}
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-2">
                    <Form.Label>Other Details (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={form.other_details}
                      onChange={(e) =>
                        handleChange("other_details", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button
                className="float-end mt-2"
                type="submit"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Create Order"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default LifeHoroscope;
