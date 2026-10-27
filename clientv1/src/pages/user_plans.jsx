import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
  Table,
  Badge,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import Swal from "sweetalert2";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaRupeeSign,
  FaLayerGroup,
  FaSearch,
  FaClipboardList,
  FaCheckCircle,
} from "react-icons/fa";
import {
  createUserPlan,
  updateUserPlan,
  getUserPlans,
  deleteUserPlan,
} from "../services/api";

const HOROSCOPE_TYPES = [
  { value: "Single", label: "Single Horoscope" },
  { value: "Life", label: "Life Horoscope" },
  { value: "Yearly", label: "Yearly Horoscope" },
  { value: "Super", label: "Super Horoscope" },
  { value: "Numerology", label: "Numerology" },
  { value: "Gemstone", label: "Gemstone Horoscope" },
  { value: "Wealth", label: "Wealth Horoscope" },
  { value: "MarriageH", label: "Marriage Horoscope" },
  { value: "Marriage", label: "Simple Marriage Matching" },
  { value: "ProMarriage", label: "Pro Marriage Matching" },
];

const UserPlans = () => {
  // Page filter state
  const [selectedType, setSelectedType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Plans list state
  const [plans, setPlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]); // Stores all active plans across all types
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal form data (count defaults to 1 and is readonly)
  const [formData, setFormData] = useState({
    plan_type: "",
    plan_name: "",
    plan_details: "",
    count: 1,
    total_amount: "",
    discount_percent: "",
    discount_amount: "",
    final_amount: 0,
  });

  const [formErrors, setFormErrors] = useState({});

  /* ================= FETCH PLANS ================= */
  const fetchPlans = async (type = selectedType, search = searchTerm) => {
    setLoading(true);
    try {
      // 1. Always fetch all plans to know which types are already configured globally
      const allRes = await getUserPlans({});
      const fullList = (allRes && allRes.status === "S" ? allRes.data : (Array.isArray(allRes) ? allRes : [])) || [];
      setAllPlans(fullList);

      // 2. Fetch filtered plans for table display
      if (!type && !search) {
        setPlans(fullList);
      } else {
        const res = await getUserPlans({
          plan_type: type,
          search,
        });

        if (res && res.status === "S") {
          setPlans(res.data || []);
        } else if (Array.isArray(res)) {
          setPlans(res);
        } else {
          setPlans([]);
        }
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(selectedType, searchTerm);
  }, [selectedType]);

  // Types that already have an active plan (derived from allPlans, independent of table filter)
  const existingTypes = allPlans.map((p) => String(p.plan_type || '').trim().toLowerCase());
  const allTypesConfigured =
    HOROSCOPE_TYPES.length > 0 &&
    HOROSCOPE_TYPES.every((ht) =>
      existingTypes.includes(ht.value.toLowerCase())
    );

  /* ================= MODAL HANDLERS ================= */
  // Open Create Modal
  const handleOpenModal = () => {
    if (allTypesConfigured) {
      Swal.fire({
        icon: "info",
        title: "All Types Configured",
        text: "Every horoscope type already has a plan configured. You can edit any existing plan below.",
      });
      return;
    }

    // Default to the first available type without a plan
    const availableType = HOROSCOPE_TYPES.find(
      (ht) => !existingTypes.includes(ht.value.toLowerCase())
    );

    setIsEditMode(false);
    setEditingPlanId(null);
    setFormData({
      plan_type:
        selectedType && !existingTypes.includes(selectedType.toLowerCase())
          ? selectedType
          : (availableType ? availableType.value : ""),
      plan_name: "",
      plan_details: "",
      count: 1, // Fixed default 1
      total_amount: "",
      discount_percent: "",
      discount_amount: "",
      final_amount: 0,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEditPlan = (plan) => {
    setIsEditMode(true);
    setEditingPlanId(plan._id);
    setFormData({
      plan_type: plan.plan_type,
      plan_name: plan.plan_name,
      plan_details: plan.plan_details || "",
      count: 1, // Fixed default 1
      total_amount: plan.total_amount,
      discount_percent: plan.discount_percent || "",
      discount_amount: plan.discount_amount || "",
      final_amount: plan.final_amount,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingPlanId(null);
    setFormErrors({});
  };

  /* ================= DYNAMIC CALCULATION ================= */
  // 1. Total Amount Change
  const handleTotalAmountChange = (val) => {
    setFormData((prev) => {
      const t = val === "" ? "" : parseFloat(val);
      const numT = isNaN(t) || t === "" ? 0 : t;
      const currentPct =
        prev.discount_percent === "" || isNaN(parseFloat(prev.discount_percent))
          ? 0
          : parseFloat(prev.discount_percent);
      const currentAmt =
        prev.discount_amount === "" || isNaN(parseFloat(prev.discount_amount))
          ? 0
          : parseFloat(prev.discount_amount);

      let newDiscAmt = prev.discount_amount;
      let newFinal = numT;

      if (currentPct > 0) {
        const calcAmt = (numT * currentPct) / 100;
        newDiscAmt = calcAmt > 0 ? Number(calcAmt.toFixed(2)) : 0;
        newFinal = Math.max(0, numT - newDiscAmt);
      } else if (currentAmt > 0) {
        newDiscAmt = Math.min(numT, currentAmt);
        const calcPct = numT > 0 ? (newDiscAmt / numT) * 100 : 0;
        newFinal = Math.max(0, numT - newDiscAmt);
        return {
          ...prev,
          total_amount: val,
          discount_amount: newDiscAmt,
          discount_percent: Number(calcPct.toFixed(2)),
          final_amount: Number(newFinal.toFixed(2)),
        };
      }

      return {
        ...prev,
        total_amount: val,
        discount_amount: newDiscAmt,
        final_amount: Number(newFinal.toFixed(2)),
      };
    });
    setFormErrors((prev) => ({ ...prev, total_amount: "" }));
  };

  // 2. Discount % Change
  const handleDiscountPercentChange = (val) => {
    setFormData((prev) => {
      const numT =
        prev.total_amount === "" || isNaN(parseFloat(prev.total_amount))
          ? 0
          : parseFloat(prev.total_amount);

      if (val === "" || isNaN(parseFloat(val))) {
        return {
          ...prev,
          discount_percent: val,
          discount_amount: 0,
          final_amount: numT,
        };
      }

      let pct = parseFloat(val);
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;

      const calcAmt = (numT * pct) / 100;
      const newFinal = Math.max(0, numT - calcAmt);

      return {
        ...prev,
        discount_percent: val,
        discount_amount: Number(calcAmt.toFixed(2)),
        final_amount: Number(newFinal.toFixed(2)),
      };
    });
    setFormErrors((prev) => ({
      ...prev,
      discount_percent: "",
      discount_amount: "",
    }));
  };

  // 3. Discount Amount Change
  const handleDiscountAmountChange = (val) => {
    setFormData((prev) => {
      const numT =
        prev.total_amount === "" || isNaN(parseFloat(prev.total_amount))
          ? 0
          : parseFloat(prev.total_amount);

      if (val === "" || isNaN(parseFloat(val))) {
        return {
          ...prev,
          discount_amount: val,
          discount_percent: 0,
          final_amount: numT,
        };
      }

      let amt = parseFloat(val);
      if (amt < 0) amt = 0;
      if (numT > 0 && amt > numT) amt = numT;

      const calcPct = numT > 0 ? (amt / numT) * 100 : 0;
      const newFinal = Math.max(0, numT - amt);

      return {
        ...prev,
        discount_amount: val,
        discount_percent: Number(calcPct.toFixed(2)),
        final_amount: Number(newFinal.toFixed(2)),
      };
    });
    setFormErrors((prev) => ({
      ...prev,
      discount_amount: "",
      discount_percent: "",
    }));
  };

  /* ================= VALIDATION & SUBMIT ================= */
  const validate = () => {
    let errs = {};
    if (!formData.plan_type) {
      errs.plan_type = "Please select horoscope type";
    } else if (!isEditMode) {
      // Check if plan already exists for this type across all plans
      const alreadyHasPlan = existingTypes.includes(
        String(formData.plan_type || "").trim().toLowerCase()
      );
      if (alreadyHasPlan) {
        errs.plan_type = `A plan already exists for ${getTypeLabel(
          formData.plan_type
        )}. Only one plan per Horoscope Type is allowed. Please edit the existing plan.`;
      }
    }

    if (!formData.plan_name || !formData.plan_name.trim()) {
      errs.plan_name = "Plan name is required";
    }

    const totalNum = parseFloat(formData.total_amount);
    if (
      formData.total_amount === "" ||
      isNaN(totalNum) ||
      totalNum <= 0
    ) {
      errs.total_amount = "Enter a valid total amount greater than 0";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitPlan = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const actionText = isEditMode ? "Update" : "Create";

    const confirm = await Swal.fire({
      title: `Confirm ${actionText} Plan`,
      text: `Do you want to ${actionText.toLowerCase()} "${formData.plan_name}" for ${getTypeLabel(formData.plan_type)}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        plan_type: formData.plan_type,
        plan_name: formData.plan_name,
        plan_details: formData.plan_details,
        count: 1, // Fixed default 1
        total_amount: parseFloat(formData.total_amount),
        discount_percent: parseFloat(formData.discount_percent || 0),
        discount_amount: parseFloat(formData.discount_amount || 0),
        final_amount: parseFloat(formData.final_amount),
      };

      let res;
      if (isEditMode) {
        res = await updateUserPlan({
          id: editingPlanId,
          ...payload,
        });
      } else {
        res = await createUserPlan(payload);
      }

      if (res && res.status === "S") {
        await Swal.fire({
          icon: "success",
          title: isEditMode ? "Plan Updated" : "Plan Created",
          text: isEditMode
            ? "User plan has been updated successfully"
            : "User plan has been saved successfully in user_plans",
          timer: 2000,
          showConfirmButton: false,
        });

        handleCloseModal();
        fetchPlans(selectedType, searchTerm);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: (res && res.message) || `Failed to ${actionText.toLowerCase()} user plan`,
        });
      }
    } catch (err) {
      console.error("Save plan error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving the plan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= DELETE PLAN ================= */
  const handleDeletePlan = async (plan) => {
    const confirm = await Swal.fire({
      title: "Delete Plan?",
      text: `Are you sure you want to delete "${plan.plan_name}" for ${getTypeLabel(plan.plan_type)}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await deleteUserPlan(plan._id);
      if (res && res.status === "S") {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Plan has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchPlans(selectedType, searchTerm);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: (res && res.message) || "Failed to delete plan",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not delete plan",
      });
    }
  };

  /* ================= STYLES ================= */
  const sectionStyle = {
    background: "#fbfbfc",
    padding: "16px 20px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #edf2f7",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  };

  const inputStyle = {
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    padding: "8px 12px",
    backgroundColor: "#fff",
    fontSize: "0.95rem",
  };

  const labelStyle = {
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: "6px",
    fontSize: "0.9rem",
  };

  const getTypeLabel = (val) => {
    const item = HOROSCOPE_TYPES.find((t) => t.value === val);
    return item ? item.label : val;
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
            <div className="mb-4 text-center">
              <h4
                style={{
                  fontWeight: 800,
                  color: "#1a202c",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <FaLayerGroup className="text-primary" /> User Plans Management
              </h4>
              <p
                style={{
                  color: "#718096",
                  fontSize: "0.92rem",
                  marginBottom: 0,
                }}
              >
                Each horoscope type has one single pricing plan (Count is set to 1). Edit or create plans below.
              </p>
            </div>

            {/* CHOOSE TYPE & CREATE PLAN BAR */}
            <div
              style={{
                ...sectionStyle,
                background: "linear-gradient(to right, #f8fafc, #edf2f7)",
                border: "1px solid #e2e8f0",
              }}
            >
              <Row className="align-items-end g-3">
                <Col xs={12} md={5}>
                  <Form.Group>
                    <Form.Label style={{ ...labelStyle, fontSize: "0.95rem" }}>
                      Filter by Horoscope Type
                    </Form.Label>
                    <Form.Select
                      style={{
                        ...inputStyle,
                        borderColor: "#cbd5e0",
                        fontWeight: "500",
                      }}
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <option value="">-- All Types ({plans.length}/{HOROSCOPE_TYPES.length}) --</option>
                      {HOROSCOPE_TYPES.map((ht) => {
                        const hasPlan = existingTypes.includes(ht.value.toLowerCase());
                        return (
                          <option key={ht.value} value={ht.value}>
                            {ht.label} {hasPlan ? "✓ (Plan Set)" : "(No Plan)"}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label style={{ ...labelStyle, fontSize: "0.95rem" }}>
                      Search Plans
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        style={inputStyle}
                        placeholder="Search by name or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") fetchPlans(selectedType, searchTerm);
                        }}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => fetchPlans(selectedType, searchTerm)}
                      >
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col xs={12} md={3} className="text-md-end">
                  <Button
                    variant={allTypesConfigured ? "outline-secondary" : "primary"}
                    disabled={allTypesConfigured}
                    className="w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                    style={{
                      fontWeight: "600",
                      borderRadius: "6px",
                      cursor: allTypesConfigured ? "not-allowed" : "pointer",
                      boxShadow: allTypesConfigured
                        ? "none"
                        : "0 2px 6px rgba(13, 110, 253, 0.25)",
                    }}
                    onClick={handleOpenModal}
                    title={
                      allTypesConfigured
                        ? "All 10 horoscope types already have plans. You can edit them below."
                        : "Add a plan for remaining horoscope types"
                    }
                  >
                    {allTypesConfigured ? (
                      <>
                        <FaCheckCircle className="text-success" /> All 10 Plans Created
                      </>
                    ) : (
                      <>
                        <FaPlus /> Create Plan ({allPlans.length}/10)
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </div>

            {/* PLANS LIST TABLE / CONTENT */}
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6
                  style={{
                    fontWeight: "700",
                    color: "#2d3748",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaClipboardList className="text-muted" />
                  Configured Plans{" "}
                  {selectedType ? (
                    <Badge bg="info" className="ms-1">
                      {getTypeLabel(selectedType)}
                    </Badge>
                  ) : (
                    <Badge bg="secondary" className="ms-1">
                      All
                    </Badge>
                  )}
                  <span className="text-muted fw-normal fs-7">
                    ({allPlans.length} of {HOROSCOPE_TYPES.length} types configured)
                  </span>
                </h6>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading plans...</p>
                </div>
              ) : plans.length === 0 ? (
                <div
                  className="text-center py-5 px-3"
                  style={{
                    background: "#fcfcfd",
                    border: "2px dashed #e2e8f0",
                    borderRadius: "10px",
                  }}
                >
                  <FaLayerGroup size={48} className="text-muted mb-3 opacity-50" />
                  <h6 className="fw-bold text-dark">No User Plans Found</h6>
                  <p className="text-muted fs-7 mb-3">
                    {selectedType
                      ? `There is no plan registered for ${getTypeLabel(selectedType)}.`
                      : "No user plans have been added yet."}
                  </p>
                  <Button variant="outline-primary" size="sm" onClick={handleOpenModal}>
                    <FaPlus className="me-1" /> Create Plan
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover align="middle" className="border">
                    <thead style={{ backgroundColor: "#f8fafc" }}>
                      <tr>
                        <th style={{ width: "50px" }}>#</th>
                        <th>Horoscope Type</th>
                        <th>Plan Name</th>
                        <th>Count</th>
                        <th>Total Amount</th>
                        <th>Discount</th>
                        <th>Final Payable</th>
                        <th style={{ width: "120px" }} className="text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((p, index) => (
                        <tr key={p._id || index}>
                          <td>{index + 1}</td>
                          <td>
                            <Badge bg="primary" style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                              {getTypeLabel(p.plan_type)}
                            </Badge>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{p.plan_name}</div>
                            {p.plan_details && (
                              <small
                                className="text-muted d-block"
                                style={{
                                  maxWidth: "300px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {p.plan_details}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {p.count || 1}
                            </span>
                          </td>
                          <td className="fw-semibold">
                            ₹{Number(p.total_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td>
                            {p.discount_amount > 0 ? (
                              <div>
                                <span className="text-danger fw-semibold">
                                  -₹{Number(p.discount_amount || 0).toLocaleString("en-IN")}
                                </span>
                                <small className="text-muted ms-1">
                                  ({p.discount_percent}%)
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">None (0%)</span>
                            )}
                          </td>
                          <td>
                            <span
                              className="fw-bold text-success fs-6 px-2 py-1"
                              style={{
                                background: "#e8f5e9",
                                borderRadius: "4px",
                                display: "inline-block",
                              }}
                            >
                              ₹{Number(p.final_amount || 0).toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center align-items-center gap-2">
                              {/* EDIT BUTTON */}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                title="Edit Plan"
                                onClick={() => handleEditPlan(p)}
                              >
                                <FaEdit /> Edit
                              </Button>
                              {/* DELETE BUTTON */}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Delete Plan"
                                onClick={() => handleDeletePlan(p)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* ================= CREATE / EDIT PLAN MODAL ================= */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ borderBottom: "1px solid #edf2f7" }}>
          <Modal.Title style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1a202c" }}>
            {isEditMode ? (
              <>
                <FaEdit className="text-primary me-2" /> Edit Plan - {getTypeLabel(formData.plan_type)}
              </>
            ) : (
              <>
                <FaPlus className="text-primary me-2" /> Create Plan
              </>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Form onSubmit={handleSubmitPlan} noValidate>
            <Row className="g-3">
              {/* CHOOSE TYPE */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Choose Type <span className="text-danger">*</span>
                    {isEditMode && <small className="text-muted ms-2">(Locked in edit mode)</small>}
                  </Form.Label>
                  <Form.Select
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.plan_type ? "#e53e3e" : "#cbd5e0",
                      backgroundColor: isEditMode ? "#f8fafc" : "#fff",
                      cursor: isEditMode ? "not-allowed" : "pointer",
                    }}
                    disabled={isEditMode}
                    value={formData.plan_type}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, plan_type: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, plan_type: "" }));
                    }}
                    isInvalid={!!formErrors.plan_type}
                  >
                    <option value="">-- Choose Type --</option>
                    {HOROSCOPE_TYPES.map((ht) => {
                      const alreadyHasPlan = existingTypes.includes(ht.value.toLowerCase());
                      const isDisabled = !isEditMode && alreadyHasPlan;
                      return (
                        <option
                          key={ht.value}
                          value={ht.value}
                          disabled={isDisabled}
                        >
                          {ht.label} {isDisabled ? " (Plan Already Configured)" : ""}
                        </option>
                      );
                    })}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.plan_type}
                  </Form.Control.Feedback>
                  {!isEditMode && (
                    <Form.Text className="text-muted fs-8">
                      Only 1 single plan is allowed per Horoscope Type.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              {/* PLAN NAME */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Plan Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.plan_name ? "#e53e3e" : "#cbd5e0",
                    }}
                    placeholder="Enter plan name (e.g. Standard Life Horoscope Plan)"
                    value={formData.plan_name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, plan_name: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, plan_name: "" }));
                    }}
                    isInvalid={!!formErrors.plan_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.plan_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* PLAN DETAILS (TEXT AREA) */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Plan Details (Text Area)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    style={{ ...inputStyle, borderColor: "#cbd5e0" }}
                    placeholder="Enter detailed description of the plan, benefits, terms..."
                    value={formData.plan_details}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        plan_details: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              {/* COUNT (DEFAULT 1 READONLY) */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Count (Default: 1) <span className="badge bg-secondary ms-1">Readonly</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={1}
                    readOnly
                    style={{
                      ...inputStyle,
                      backgroundColor: "#f1f5f9",
                      cursor: "not-allowed",
                      fontWeight: "700",
                      color: "#334155",
                      borderColor: "#cbd5e0",
                    }}
                  />
                  <Form.Text className="text-muted fs-8">
                    Count is set to default 1 and cannot be modified.
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* TOTAL AMOUNT (CHANGEABLE) */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Total amount (₹) : (changeable) <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ backgroundColor: "#f8fafc" }}>
                      <FaRupeeSign />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0"
                      step="any"
                      style={{
                        ...inputStyle,
                        borderColor: formErrors.total_amount ? "#e53e3e" : "#cbd5e0",
                      }}
                      placeholder="e.g. 1000"
                      value={formData.total_amount}
                      onChange={(e) => handleTotalAmountChange(e.target.value)}
                      isInvalid={!!formErrors.total_amount}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.total_amount}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>

              {/* DISCOUNT % (CHANGEABLE) */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Discount % : (changeable)
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      style={{ ...inputStyle, borderColor: "#cbd5e0" }}
                      placeholder="e.g. 10"
                      value={formData.discount_percent}
                      onChange={(e) => handleDiscountPercentChange(e.target.value)}
                    />
                    <InputGroup.Text style={{ backgroundColor: "#f8fafc" }}>
                      %
                    </InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted fs-8">
                    Entering % automatically calculates Discount Amt.
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* DISCOUNT AMT (CHANGEABLE) */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>
                    Discount amt (₹) : (changeable)
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ backgroundColor: "#f8fafc" }}>
                      <FaRupeeSign />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      min="0"
                      step="any"
                      style={{ ...inputStyle, borderColor: "#cbd5e0" }}
                      placeholder="e.g. 100"
                      value={formData.discount_amount}
                      onChange={(e) => handleDiscountAmountChange(e.target.value)}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted fs-8">
                    Entering Amt automatically updates Discount %.
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* FINAL PAYABLE AMOUNT (READONLY) */}
              <Col xs={12}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <Form.Group>
                    <Form.Label
                      style={{
                        ...labelStyle,
                        color: "#166534",
                        fontSize: "0.95rem",
                      }}
                    >
                      Final Payable Amount : (Readonly)
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text
                        style={{
                          backgroundColor: "#22c55e",
                          color: "#fff",
                          border: "none",
                          fontWeight: "bold",
                        }}
                      >
                        ₹
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        readOnly
                        value={Number(formData.final_amount || 0).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                        style={{
                          backgroundColor: "#fff",
                          color: "#15803d",
                          fontSize: "1.25rem",
                          fontWeight: "800",
                          border: "1px solid #86efac",
                          cursor: "not-allowed",
                        }}
                      />
                    </InputGroup>
                    <div className="mt-2 text-success fs-8">
                      {formData.discount_amount > 0 ? (
                        <span>
                          Includes ₹{formData.discount_amount} discount ({formData.discount_percent}%)
                        </span>
                      ) : (
                        <span>No discount applied</span>
                      )}
                    </div>
                  </Form.Group>
                </div>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: "1px solid #edf2f7" }}>
          <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitPlan}
            disabled={submitting}
            style={{ minWidth: "120px", fontWeight: "600" }}
          >
            {submitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                {isEditMode ? "Updating..." : "Saving..."}
              </>
            ) : isEditMode ? (
              "Update Plan"
            ) : (
              "Save Plan"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default UserPlans;
