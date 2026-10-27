import React, { useEffect, useState } from "react";
import { Row, Col, Card, Form, Button, Modal } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { getfranchiseuser, changeFranchiseStatus, addFranchise, activateFranchisePlan } from "../services/api";
import Swal from "sweetalert2";

const FranchiseReg = () => {
  const { status } = useParams(); // true | false | undefined

  /* ================= STATE ================= */

  const [filters, setFilters] = useState({
    search: "",
    status: status ?? "",
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [formData, setFormData] = useState({
    _id: null,
    name: "",
    mobile: "",
    altMobile: "",
    email: "",
    business_name: "",
    city: "",
    office_address: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ================= HELPERS ================= */

  const safe = (v) => (v !== null && v !== undefined && v !== "" ? v : "-");

  const getStatusBadge = (isActive) => ({
    label: isActive ? "Active" : "Inactive",
    color: isActive ? "success" : "danger",
  });

  /* ================= EFFECTS ================= */

  // Sync route status → filter
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: status ?? "",
    }));
  }, [status]);

  // Fetch data on filter change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [filters.status, filters.search]);

  /* ================= API ================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getfranchiseuser(filters);

      if (res?.status === 200 && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Franchise API error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLERS ================= */

  const handleChange = (name, value) => {
    if (name === "status") {
      if (value === "") {
        value = ""; // All
      } else if (value === "true") {
        value = true; // ✅ boolean
      } else if (value === "false") {
        value = false; // ✅ boolean
      }
    }

    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const handleToggleStatus = async (row) => {
    const newStatus = !row.is_active;

    const result = await Swal.fire({
      title: "Are you sure?",
      html: newStatus
        ? "<b>Do you want to <span style='color:green'>ACTIVATE</span> this franchise?</b>"
        : "<b>Do you want to <span style='color:red'>DEACTIVATE</span> this franchise?</b> <br>Once DEACTIVATED,cant be Login Again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: newStatus ? "Yes, Activate" : "Yes, Deactivate",
      cancelButtonText: "Cancel",
      confirmButtonColor: newStatus ? "#28a745" : "#dc3545",
      cancelButtonColor: "#6c757d",
    });

    if (!result.isConfirmed) return;

    try {
      await changeFranchiseStatus(row._id, newStatus);

      // Optimistic UI update
      setOrders((prev) =>
        prev.map((item) =>
          item._id === row._id ? { ...item, is_active: newStatus } : item
        )
      );

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Franchise has been ${
          newStatus ? "activated" : "deactivated"
        } successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Status update failed", err);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to update franchise status.",
      });
    }
  };

  // Modal Handlers
  const handleOpenModal = () => {
    setIsEditMode(false);
    setFormData({
      _id: null,
      name: "",
      mobile: "",
      altMobile: "",
      email: "",
      business_name: "",
      city: "",
      office_address: "",
      is_active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditModal = (row) => {
    setIsEditMode(true);
    setFormData({
      _id: row._id,
      name: row.name,
      mobile: row.mobile,
      altMobile: row.altMobile || "",
      email: row.email,
      business_name: row.business_name,
      city: row.city,
      office_address: row.office_address,
      is_active: row.is_active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setFormData({
      _id: null,
      name: "",
      mobile: "",
      altMobile: "",
      email: "",
      business_name: "",
      city: "",
      office_address: "",
      is_active: true,
    });
    setFormErrors({});
  };

  // Plan Modal Handlers
  const handlePlanModal = (row) => {
    setSelectedFranchise(row);
    setShowPlanModal(true);
  };

  const handleClosePlanModal = () => {
    setShowPlanModal(false);
    setSelectedFranchise(null);
  };

  const handleActivatePlan = async (plan) => {
    if (!selectedFranchise) return;

    try {
      const result = await Swal.fire({
        title: "Confirm Plan Activation",
        html: `
          <div class="text-center">
            <h5>${plan.name}</h5>
            <p class="text-muted">₹${plan.price} for ${plan.years} year${plan.years > 1 ? 's' : ''}</p>
            <p><strong>Franchise:</strong> ${selectedFranchise.name}</p>
            <p><strong>Business:</strong> ${selectedFranchise.business_name}</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Activate Plan",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#28a745",
      });

      if (!result.isConfirmed) return;

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + plan.years);

      const planData = {
        franchiseId: selectedFranchise._id,
        planName: plan.name,
        amount: plan.price,
        years: plan.years,
        plan_start_date: startDate.toISOString(),
        plan_end_date: endDate.toISOString(),
        paymode: 'cash', // Default to cash, can be changed later
        txnid: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Call API to activate plan
      const res = await activateFranchisePlan(planData);

      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Plan Activated!",
          text: `${plan.name} has been activated for ${selectedFranchise.name}`,
          timer: 2000,
          showConfirmButton: false,
        });

        handleClosePlanModal();
        fetchOrders(); // Refresh the list
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data?.message || "Unable to activate plan.",
        });
      }
    } catch (err) {
      console.error("Plan activation error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while activating the plan.",
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.mobile.trim()) errors.mobile = "Mobile is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.business_name.trim())
      errors.business_name = "Business name is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.office_address.trim())
      errors.office_address = "Office address is required";

    return errors;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      const res = await addFranchise(formData);

      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: isEditMode
            ? "Franchise has been updated successfully."
            : "Franchise has been added successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        handleCloseModal();
        fetchOrders(); // Refresh the list
      } else if (res.status === 409) {
        // Duplicate field error
        const field = res.data?.field;
        
        Swal.fire({
          icon: "warning",
          title: "Duplicate Entry",
          text: res.data?.message || "This entry already exists.",
        });

        // Set field error
        if (field) {
          setFormErrors((prev) => ({
            ...prev,
            [field]: res.data?.message,
          }));
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res.data?.message || "Unable to save franchise.",
        });
      }
    } catch (err) {
      console.error("Franchise save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving franchise.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Row>
      <Col md={12}>
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="card-title mb-0">Franchise Registration</h4>
              <Button variant="success" onClick={handleOpenModal}>
                + Add Franchise
              </Button>
            </div>

            {/* FILTERS */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Col>

              <Col md={8}>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search Name, Mobile, Email"
                  value={filters.search}
                  onChange={(e) => handleChange("search", e.target.value)}
                />
              </Col>
            </Row>

            {/* RESULTS */}
            <Row>
              {loading ? (
                <Col md={12} className="text-center py-4">
                  Loading...
                </Col>
              ) : orders.length === 0 ? (
                <Col md={12} className="text-center py-4 text-muted">
                  No records found
                </Col>
              ) : (
                orders.map((row) => {
                  const badge = getStatusBadge(row.is_active);

                  return (
                    <Col md={12} key={row._id} className="mb-2">
                      <Card className="shadow-sm">
                        <Card.Body>
                          {/* HEADER */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <strong className="text-primary fs-5">
                                {safe(row.name)}
                              </strong>
                              <div
                                className="text-muted"
                                style={{ fontSize: "13px" }}
                              >
                                {safe(row.business_name)}
                              </div>
                            </div>

                            <span className={`badge bg-${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          {/* DETAILS */}
                          <Row className="gy-1">
                            <Col md={4}>
                              <strong>Mobile:</strong> {safe(row.mobile)}
                            </Col>

                            <Col md={4}>
                              <strong>Alt Mobile:</strong> {safe(row.altMobile)}
                            </Col>

                            <Col md={4}>
                              <strong>Email:</strong> {safe(row.email)}
                            </Col>
                            <Col md={4}>
                              <strong>Business Name:</strong> {safe(row.business_name)}
                            </Col>
                            <Col md={4}>
                              <strong>City:</strong> {safe(row.city)}
                            </Col>

                            <Col md={8}>
                              <strong>Office Address:</strong>{" "}
                              {safe(row.office_address)}
                            </Col>
                          </Row>

                          {/* FOOTER */}
                          <div className="text-end mt-2">
                            <small className="text-muted me-3">
                              Created At:{" "}
                              {row.created_at
                                ? new Date(row.created_at).toLocaleString()
                                : "-"}
                            </small>

                            {/* STATUS TOGGLE BUTTON */}
                            {row.is_active ? (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                className="me-2"
                                onClick={() => handleToggleStatus(row)}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline-success"
                                className="me-2"
                                onClick={() => handleToggleStatus(row)}
                              >
                                Activate
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline-warning"
                              className="me-2"
                              onClick={() => handleEditModal(row)}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="outline-info"
                              className="me-2"
                              onClick={() => handlePlanModal(row)}
                            >
                              Plan Activation
                            </Button>

                            <Button size="sm" variant="outline-primary">
                              View
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              )}
            </Row>
          </Card.Body>
        </Card>
      </Col>

      {/* ADD/EDIT FRANCHISE MODAL */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditMode ? "Edit Franchise" : "Add New Franchise"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitForm}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.name}
                    placeholder="Enter name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Mobile <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.mobile}
                    placeholder="Enter mobile number"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.mobile}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Alt Mobile</Form.Label>
                  <Form.Control
                    type="tel"
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.altMobile}
                    placeholder="Enter alternate mobile number (optional)"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.altMobile}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.email}
                    placeholder="Enter email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Business Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.business_name}
                    placeholder="Enter business name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.business_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    City <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.city}
                    placeholder="Enter city"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Office Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="office_address"
                    value={formData.office_address}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.office_address}
                    placeholder="Enter office address"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.office_address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSubmitForm}
            disabled={submitting}
          >
            {submitting
              ? isEditMode
                ? "Updating..."
                : "Adding..."
              : isEditMode
              ? "Update Franchise"
              : "Add Franchise"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PLAN ACTIVATION MODAL */}
      <Modal show={showPlanModal} onHide={handleClosePlanModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Plan Activation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFranchise && (
            <div className="mb-4">
              <h5 className="text-primary">{selectedFranchise.name}</h5>
              <p className="text-muted mb-4">{selectedFranchise.business_name}</p>
            </div>
          )}

          <Row>
            {/* 1 Year Plan */}
            <Col md={4} className="mb-3">
              <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                  <h4 className="text-primary">1 Year Plan</h4>
                  <h2 className="text-success mb-3">₹1,499</h2>
                  <p className="text-muted">Perfect for getting started</p>
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={() => handleActivatePlan({
                      name: "1 Year Plan",
                      price: 1499,
                      years: 1
                    })}
                  >
                    Activate Plan
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* 2 Year Plan */}
            <Col md={4} className="mb-3">
              <Card className="h-100 border-success">
                <Card.Body className="text-center">
                  <h4 className="text-success">2 Year Plan</h4>
                  <h2 className="text-success mb-3">₹2,499</h2>
                  <p className="text-muted">Best value for long term</p>
                  <Button
                    variant="success"
                    className="w-100"
                    onClick={() => handleActivatePlan({
                      name: "2 Year Plan",
                      price: 2499,
                      years: 2
                    })}
                  >
                    Activate Plan
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* 3 Year Plan */}
            <Col md={4} className="mb-3">
              <Card className="h-100 border-warning">
                <Card.Body className="text-center">
                  <h4 className="text-warning">3 Year Plan</h4>
                  <h2 className="text-success mb-3">₹2,999</h2>
                  <p className="text-muted">Maximum savings</p>
                  <Button
                    variant="warning"
                    className="w-100"
                    onClick={() => handleActivatePlan({
                      name: "3 Year Plan",
                      price: 2999,
                      years: 3
                    })}
                  >
                    Activate Plan
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePlanModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default FranchiseReg;
