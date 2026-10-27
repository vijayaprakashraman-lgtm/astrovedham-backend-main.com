import React, { useState } from "react";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { place_order } from "../services/api";

const GenerateHoroscope = () => {
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
    fdob: "",
    ftob: "",
    fplace: "",
    fname: "", // 👈 ADD THIS
    cname: "", // 👈 ADD THIS
    language: "",
    horoscope_type: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setForm((prev) => ({ ...prev, mobile: value }));
      setErrors((prev) => ({ ...prev, mobile: "" }));
    }
  };
  const validate = () => {
    let e = {};
    if (!form.name) e.name = "Name is required";
    if (!form.mobile) e.mobile = "Mobile number is required";
    else if (form.mobile.length !== 10)
      e.mobile = "Enter valid 10 digit mobile number";
    if (
      form.horoscope_type === "Marriage" ||
      form.horoscope_type === "ProMarriage"
    ) {
      if (!form.dob) e.dob = "Male date of birth is required";
      if (!form.tob) e.tob = "Male time of birth is required";
      if (!form.place) e.place = "Male place is required";
      if (!form.fdob) e.fdob = "Female date of birth is required";
      if (!form.ftob) e.ftob = "Female time of birth is required";
      if (!form.fplace) e.fplace = "Female place is required";
      if (!form.fname) e.fname = "Female Name is required";
      if (!form.name) e.name = "Male Name is required";
      if (!form.cname) e.cname = "Customer Name is required";
    } else {
      if (!form.gender) e.gender = "Gender is required";
      if (!form.dob) e.dob = "Date of birth is required";
      if (!form.tob) e.tob = "Time of birth is required";
      if (!form.place) e.place = "Place is required";
    }
    if (!form.language) e.language = "Language is required";
    if (!form.horoscope_type) e.horoscope_type = "Please select horoscope type";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT ================= */

  const submit_order = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // 🔔 BEFORE SAVE CONFIRMATION
    const confirm = await Swal.fire({
      title: "Confirm Order",
      text: "Do you want to create this horoscope order?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Create",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await place_order({
        product_id: "life_horoscope",
        ...form,
      });

      // ✅ AFTER SAVE SUCCESS
      if (res.status === "S") {
        await Swal.fire({
          icon: "success",
          title: "Order Placed",
          text: "Horoscope order created successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        window.location.reload();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Error in placing order",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  const sectionStyle = {
    background: "#fbfbfc",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
    border: "1px solid #edf2f7",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  };

  const sectionTitleStyle = {
    fontWeight: "700",
    fontSize: "1.05rem",
    color: "#2d3748",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    borderBottom: "1px solid #edf2f7",
    paddingBottom: "8px",
  };

  const inputStyle = {
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    backgroundColor: "#fff",
    fontSize: "0.95rem",
  };

  const labelStyle = {
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: "4px",
    fontSize: "0.9rem",
  };

  return (
    <Row className="justify-content-center p-0 m-0">
      <Col xs={12} className="p-0 p-md-2">
        <Card
          style={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            backgroundColor: "#fff",
          }}
        >
          <Card.Body className="p-3 p-md-4">
            {/* HEADER */}
            <div className="mb-3 text-center">
              <h4
                style={{
                  fontWeight: 800,
                  color: "#1a202c",
                  marginBottom: "4px",
                }}
              >
                Create Horoscope Order
              </h4>
              <p
                style={{
                  color: "#718096",
                  fontSize: "0.9rem",
                  marginBottom: 0,
                }}
              >
                Enter the birth and personal details carefully.
              </p>
            </div>

            {/* HOROSCOPE TYPE */}
            <div
              style={{
                ...sectionStyle,
                background: "linear-gradient(to right, #f8fafc, #edf2f7)",
                border: "none",
              }}
            >
              <Row className="align-items-center">
                <Col xs={12} md={6} className="mx-auto">
                  <Form.Group>
                    <Form.Label style={{ ...labelStyle, fontSize: "1rem" }}>
                      Select Horoscope Type{" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      style={{
                        ...inputStyle,
                        padding: "8px 12px",
                        fontSize: "1rem",
                        fontWeight: "500",
                        borderColor: "#cbd5e0",
                      }}
                      value={form.horoscope_type}
                      isInvalid={!!errors.horoscope_type}
                      onChange={(e) =>
                        handleChange("horoscope_type", e.target.value)
                      }
                    >
                      <option value="">-- Choose Type --</option>
                      <option value="Single">Single Horoscope</option>
                      <option value="Life">Life Horoscope</option>
                      <option value="Yearly">Yearly Horoscope</option>
                      <option value="Super">Super Horoscope</option>
                      <option value="Numerology">Numerology</option>
                      <option value="Gemstone">Gemstone Horoscope</option>
                      <option value="Wealth">Wealth Horoscope</option>
                      <option value="MarriageH">Marriage Horoscope</option>
                      <option value="Marriage">Simple Marriage Matching</option>
                      <option value="ProMarriage">Pro Marriage Matching</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.horoscope_type}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <Form onSubmit={submit_order} noValidate>
              {/* PERSONAL DETAILS */}

              {/* BIRTH DETAILS */}
              <div style={sectionStyle}>
                {form.horoscope_type === "Marriage" ||
                form.horoscope_type === "ProMarriage" ? (
                  <>
                    <Col xs={12} md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label style={labelStyle}>
                          Customer Name
                        </Form.Label>
                        <Form.Control
                          style={inputStyle}
                          placeholder="Customer Name"
                          value={form.cname}
                          isInvalid={!!errors.cname}
                          onChange={(e) =>
                            handleChange("cname", e.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.cname}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <div style={sectionTitleStyle}>
                      <span style={{ fontSize: "1.1rem" }}>📅</span> Birth
                      Details
                    </div>
                    <div
                      style={{
                        background: "#ebf8ff",
                        padding: "10px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        border: "1px solid #bee3f8",
                      }}
                    >
                      <h6
                        className="fw-bold mb-2 text-primary"
                        style={{ fontSize: "0.95rem" }}
                      >
                        👨 Male Birth Details
                      </h6>
                      <Row>
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>Name</Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="Name"
                              value={form.name}
                              isInvalid={!!errors.name}
                              onChange={(e) =>
                                handleChange("name", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.name}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col xs={6} md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              DOB <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              type="date"
                              value={form.dob}
                              isInvalid={!!errors.dob}
                              onChange={(e) =>
                                handleChange("dob", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.dob}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={6} md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              TOB <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              type="time"
                              value={form.tob}
                              isInvalid={!!errors.tob}
                              onChange={(e) =>
                                handleChange("tob", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.tob}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={6} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              Place <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="City/Town"
                              value={form.place}
                              isInvalid={!!errors.place}
                              onChange={(e) =>
                                handleChange("place", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.place}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div
                      style={{
                        background: "#fff5f5",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #fed7d7",
                      }}
                    >
                      <h6
                        className="fw-bold mb-2 text-danger"
                        style={{ fontSize: "0.95rem" }}
                      >
                        👩 Female Birth Details
                      </h6>
                      <Row>
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>Name</Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="Name"
                              value={form.fname}
                              isInvalid={!!errors.fname}
                              onChange={(e) =>
                                handleChange("fname", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.fname}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={4} md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              DOB <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              type="date"
                              value={form.fdob}
                              isInvalid={!!errors.fdob}
                              onChange={(e) =>
                                handleChange("fdob", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.fdob}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={4} md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              TOB <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              type="time"
                              value={form.ftob}
                              isInvalid={!!errors.ftob}
                              onChange={(e) =>
                                handleChange("ftob", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.ftob}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={4} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              Place <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="City/Town"
                              value={form.fplace}
                              isInvalid={!!errors.fplace}
                              onChange={(e) =>
                                handleChange("fplace", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.fplace}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>
                        <span style={{ fontSize: "1.1rem" }}>👤</span> Personal
                        Details
                      </div>
                      <Row>
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="Full Name"
                              value={form.name}
                              isInvalid={!!errors.name}
                              onChange={(e) =>
                                handleChange("name", e.target.value)
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.name}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col xs={12} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              Father Name
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="Father's Name"
                              value={form.fathername}
                              onChange={(e) =>
                                handleChange("fathername", e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={12} md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              Mother Name
                            </Form.Label>
                            <Form.Control
                              style={inputStyle}
                              placeholder="Mother's Name"
                              value={form.mothername}
                              onChange={(e) =>
                                handleChange("mothername", e.target.value)
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                    <Row>
                      <Col xs={4} md={2}>
                        <Form.Group className="mb-2">
                          <Form.Label style={labelStyle}>
                            Gender <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            style={inputStyle}
                            value={form.gender}
                            isInvalid={!!errors.gender}
                            onChange={(e) =>
                              handleChange("gender", e.target.value)
                            }
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

                      <Col xs={4} md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label style={labelStyle}>
                            DOB <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            style={inputStyle}
                            type="date"
                            value={form.dob}
                            isInvalid={!!errors.dob}
                            onChange={(e) =>
                              handleChange("dob", e.target.value)
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.dob}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col xs={4} md={2}>
                        <Form.Group className="mb-2">
                          <Form.Label style={labelStyle}>
                            TOB <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            style={inputStyle}
                            type="time"
                            value={form.tob}
                            isInvalid={!!errors.tob}
                            onChange={(e) =>
                              handleChange("tob", e.target.value)
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.tob}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col xs={8} md={3}>
                        <Form.Group className="mb-2">
                          <Form.Label style={labelStyle}>
                            Place <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            style={inputStyle}
                            placeholder="City/Town"
                            value={form.place}
                            isInvalid={!!errors.place}
                            onChange={(e) =>
                              handleChange("place", e.target.value)
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.place}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
              </div>

              {/* CONTACT DETAILS */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                  <span style={{ fontSize: "1.1rem" }}>📞</span> Contact Details
                </div>
                <Row>
                  <Col md={4} xs={12}>
                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>
                        Mobile <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        style={inputStyle}
                        placeholder="10 digit number"
                        value={form.mobile}
                        isInvalid={!!errors.mobile}
                        onChange={handleMobileChange}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.mobile}
                      </Form.Control.Feedback>
                      <Form.Check
                        className="mt-1 text-muted"
                        style={{ fontSize: "0.85rem" }}
                        type="switch"
                        id="whatsapp-switch"
                        label="Is this WhatsApp number?"
                        checked={form.is_whatsapp}
                        onChange={(e) =>
                          handleChange("is_whatsapp", e.target.checked)
                        }
                      />
                    </Form.Group>
                  </Col>

                  <Col md={5} xs={12}>
                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>
                        Email Address (Optional)
                      </Form.Label>
                      <Form.Control
                        style={inputStyle}
                        type="email"
                        placeholder="e.g. johndoe@gmail.com"
                        value={form.emailid}
                        onChange={(e) =>
                          handleChange("emailid", e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>
                        Lang <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        style={inputStyle}
                        value={form.language}
                        isInvalid={!!errors.language}
                        onChange={(e) =>
                          handleChange("language", e.target.value)
                        }
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

                <Form.Group className="mt-2">
                  <Form.Label style={labelStyle}>
                    Other Details / Remarks
                  </Form.Label>
                  <Form.Control
                    style={{ ...inputStyle, minHeight: "50px" }}
                    as="textarea"
                    rows={2}
                    placeholder="Any specific requests..."
                    value={form.other_details}
                    onChange={(e) =>
                      handleChange("other_details", e.target.value)
                    }
                  />
                </Form.Group>
              </div>

              {/* SUBMIT */}
              <div className="text-center mt-3 mb-1">
                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 30px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderRadius: "50px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    boxShadow: "0 4px 10px rgba(118, 75, 162, 0.3)",
                    transition: "all 0.3s ease",
                    letterSpacing: "0.5px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 15px rgba(118, 75, 162, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 10px rgba(118, 75, 162, 0.3)";
                  }}
                >
                  {loading ? (
                    <span className="d-flex align-items-center">
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Processing...
                    </span>
                  ) : (
                    "✨ Create Horoscope Order"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default GenerateHoroscope;
