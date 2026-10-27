import React, { useEffect, useState } from "react";
import { Row, Col, Card, Form, Button, Modal } from "react-bootstrap";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { getOrders, uploadOrderPDF } from "../services/api";
import { getAVctype, FRANCHISE_CTYPE } from "../utils/variable";

const OrderList = () => {
  const { status } = useParams();
  const actype = getAVctype();

  const [filters, setFilters] = useState({
    horoscope_type: "",
    search: "",
    status,
    source: "all",
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ================= HELPERS ================= */

  const safe = (v) =>
    v !== null && v !== undefined && v !== "" && v !== "null" ? v : "-";
  const kv = (label, value) => (
    <div className="small mb-1">
      <span className="fw-semibold text-secondary">{label}:</span>{" "}
      <span className="text-dark fw-medium">{safe(value)}</span>
    </div>
  );

  const getGenderLabel = (g) => {
    if (g === "M") return "Male";
    if (g === "F") return "Female";
    if (!g || g === "-" || g === "null") return "";
    return safe(g);
  };

  const getHoroscopeBadge = (type) => {
    const map = {
      Single: ["Single Horoscope", "primary"],
      Life: ["Life Horoscope", "success"],
      Yearly: ["Yearly Horoscope", "info"],
      Super: ["Super Horoscope", "warning"],
      Numerology: ["Numerology", "secondary"],
      Gemstone: ["Gemstone Horoscope", "danger"],
      Marriage: ["Simple Marriage", "dark"],
      ProMarriage: ["Pro Marriage", "dark"],
      Wealth: ["Wealth Horoscope", "success"],
      MarriageH: ["Marriage Horoscope", "success"],
    };

    return {
      label: map[type]?.[0] || safe(type),
      color: map[type]?.[1] || "secondary",
    };
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    setFilters((prev) => ({ ...prev, status }));
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [filters.horoscope_type, filters.search, filters.status, filters.source]);

  /* ================= API ================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrders(filters);
      if (res?.status === 200 && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= HANDLERS ================= */

  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openUploadModal = async (order) => {
    if (order.status === "Completed") {
      const result = await Swal.fire({
        title: "Reupload Horoscope?",
        text: "This will replace the existing horoscope PDF",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Reupload",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;
    }

    setSelectedOrder(order);
    setPdfFile(null);
    setShowModal(true);
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select a PDF file",
      });
      return;
    }

    try {
      setUploading(true);
      const res = await uploadOrderPDF(selectedOrder._id, pdfFile);

      if (res.status) {
        Swal.fire({
          icon: "success",
          title: "Upload Successful",
          timer: 2000,
          showConfirmButton: false,
        });
        setShowModal(false);
        fetchOrders();
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: res.message || "Unable to upload PDF",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong during upload",
      });
    } finally {
      setUploading(false);
    }
  };

  const sendWhatsAppPDF = (mobile, pdfUrl, name) => {
    if (!mobile || !pdfUrl) {
      Swal.fire({
        icon: "warning",
        title: "Missing Data",
        text: "Mobile number or PDF not available",
      });
      return;
    }

    const phone = mobile.startsWith("91") ? mobile : `91${mobile}`;
    const message = `Hello ${name || ""},

Your horoscope is ready.
${pdfUrl}`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const downloadPDF = (pdfUrl, name = "horoscope") => {
    if (!pdfUrl) {
      Swal.fire({
        icon: "warning",
        title: "File not available",
        text: "PDF file is missing",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${name}_horoscope.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ================= UI ================= */

  return (
    <div className="py-2 px-1 px-md-2">
      <Card
        className="border-0 shadow-sm"
        style={{ borderRadius: "16px", backgroundColor: "#fff" }}
      >
        <Card.Body className="p-2 p-md-3">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <h3 className="mb-0 fw-bold" style={{ color: "#2d3748" }}>
              Order Management
              {filters.status && (
                <span className="badge bg-soft-info text-info ms-3 fs-6">
                  {safe(filters.status)}
                </span>
              )}
            </h3>
          </div>

          {/* FILTERS */}
          <div
            className="p-2 bg-light rounded mb-3 border"
            style={{ borderColor: "#edf2f7" }}
          >
            <Row className="align-items-end gy-2">
              <Col xs={12} md={actype !== FRANCHISE_CTYPE ? 3 : 4}>
                <Form.Label className="fw-semibold text-muted small mb-1">
                  Horoscope Type
                </Form.Label>
                <Form.Select
                  size="sm"
                  className="shadow-none"
                  value={filters.horoscope_type}
                  onChange={(e) =>
                    handleChange("horoscope_type", e.target.value)
                  }
                >
                  <option value="">All Types</option>
                  <option value="Single">Single Horoscope</option>
                  <option value="Life">Life Horoscope</option>
                  <option value="Yearly">Yearly Horoscope</option>
                  <option value="Super">Super Horoscope</option>
                  <option value="Numerology">Numerology</option>
                  <option value="MarriageH">Marriage Horoscope</option>
                  <option value="Gemstone">Gemstone Horoscope</option>
                  <option value="Marriage">Simple Marriage Horoscope</option>
                  <option value="ProMarriage">Pro Marriage Horoscope</option>
                  <option value="Wealth">Wealth Horoscope</option>
                </Form.Select>
              </Col>

              {actype !== FRANCHISE_CTYPE && (
                <Col xs={12} md={3}>
                  <Form.Label className="fw-semibold text-muted small mb-1">
                    Order Source
                  </Form.Label>
                  <Form.Select
                    size="sm"
                    className="shadow-none"
                    value={filters.source}
                    onChange={(e) => handleChange("source", e.target.value)}
                  >
                    <option value="all">All Orders (Customer & Franchise)</option>
                    <option value="customer">📱 Customer App Orders</option>
                    <option value="franchise">🏪 Franchise Orders</option>
                  </Form.Select>
                </Col>
              )}

              <Col xs={12} md={actype !== FRANCHISE_CTYPE ? 6 : 8}>
                <Form.Label className="fw-semibold text-muted small mb-1">
                  Search Database
                </Form.Label>
                <Form.Control
                  size="sm"
                  className="shadow-none"
                  type="text"
                  placeholder="Search by Name, Mobile, Email..."
                  value={filters.search}
                  onChange={(e) => handleChange("search", e.target.value)}
                />
              </Col>
            </Row>
          </div>

          {/* LIST */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-2 text-muted fw-semibold">
                Loading Orders...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted fs-5 fw-semibold mb-2">
                No records found.
              </div>
              <p className="small text-secondary mb-0">
                Try adjusting your search criteria or horoscope type filter.
              </p>
            </div>
          ) : (
            orders.map((row, index) => {
              const badge = getHoroscopeBadge(row.horoscope_type);
              const isMarriage =
                row.horoscope_type === "Marriage" ||
                row.horoscope_type === "ProMarriage";
              const genderLabel = getGenderLabel(row.gender);

              return (
                <Card
                  key={row._id}
                  className="border-0 shadow-sm mb-2"
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {/* Top Accent Line */}
                  <div
                    style={{
                      height: "4px",
                      background:
                        row.status === "Completed"
                          ? "linear-gradient(to right, #48bb78, #38a169)"
                          : "linear-gradient(to right, #ed8936, #dd6b20)",
                    }}
                  ></div>

                  <Card.Body className="p-2 p-md-3">
                    {/* HEADER */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-2 mb-2">
                      <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 gap-md-3">
                        <span className="badge bg-secondary-subtle text-dark border">
                          #{index + 1}
                        </span>
                        <h5
                          className="mb-0 fw-bold"
                          style={{ color: "#1a202c" }}
                        >
                          {safe(row.name)}
                        </h5>
                        <span className="small">
                          <span className="fw-semibold text-secondary">
                            Order ID:
                          </span>{" "}
                          <span className="text-dark">{safe(row._id)}</span>
                        </span>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          {!isMarriage && genderLabel && (
                            <span className="badge bg-light text-dark border shadow-sm">
                              Gender: {genderLabel}
                            </span>
                          )}
                          <span className={`badge bg-${badge.color} shadow-sm`}>
                            {badge.label}
                          </span>
                          {(row.order_source === "customer" || row.cus_id || String(row.created_by).toLowerCase().includes("customer")) ? (
                            <span className="badge bg-primary text-white shadow-sm">
                              📱 Customer App
                            </span>
                          ) : (
                            <span className="badge bg-secondary text-white shadow-sm">
                              🏪 Franchise
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 mt-md-0 d-flex gap-2 text-md-end justify-content-start justify-content-md-end">
                        <span
                          className={`badge ${row.status === "Completed" ? "bg-success" : "bg-warning text-dark"} px-3 py-2 rounded-pill shadow-sm`}
                          style={{ fontSize: "0.85rem" }}
                        >
                          {safe(row.status)}
                        </span>
                      </div>
                    </div>

                    {/* GENERAL DETAILS */}
                    <div
                      className="rounded p-2 mb-2 border bg-white"
                      style={{ borderColor: "#edf2f7" }}
                    >
                      <Row className="gy-2">
                        <Col xs={12} sm={6} md={3}>
                          <div className="d-flex align-items-center">
                            {kv("Mobile", row.mobile)}
                            {row.is_whatsapp && (
                              <span
                                className="ms-2 badge bg-success text-white"
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "3px 6px",
                                  height: "fit-content",
                                }}
                              >
                                WhatsApp
                              </span>
                            )}
                          </div>
                        </Col>
                        <Col xs={12} sm={6} md={3}>
                          {kv("Email ID", row.emailid)}
                        </Col>
                        <Col xs={12} sm={6} md={2}>
                          {kv("Language", row.language)}
                        </Col>
                        <Col
                          xs={6}
                          sm={6}
                          md={4}
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px 20px",
                            alignItems: "center",
                          }}
                        >
                          {/* Father - show if exists */}
                          {row.fathername && kv("Father", row.fathername)}

                          {/* Mother - show if exists */}
                          {row.mothername && kv("Mother", row.mothername)}

                          {/* App Customer Name or Franchise Customer Name */}
                          {(row.order_source === "customer" || row.cus_id || String(row.created_by).toLowerCase().includes("customer")) ? (
                            kv("Customer", row.customer_info?.name || row.cname || row.created_by?.replace("-Customer", "") || row.name)
                          ) : (
                            !row.fathername &&
                            !row.mothername &&
                            row.cname &&
                            kv("Customer Name", row.cname)
                          )}
                        </Col>
                      </Row>
                    </div>

                    {/* BIRTH DETAILS */}
                    {isMarriage ? (
                      <Row className="gy-2 mb-2">
                        <Col md={6} xs={12}>
                          <div
                            className="rounded p-2 h-100"
                            style={{
                              backgroundColor: "#ebf8ff",
                              border: "1px solid #bee3f8",
                            }}
                          >
                            <h6
                              className="fw-bold mb-3"
                              style={{ color: "#2b6cb0", fontSize: "0.95rem" }}
                            >
                              <span className="me-2">👨</span> Male Birth
                              Details {row.name}
                            </h6>
                            <Row className="gy-1">
                              <Col
                                xs={12}
                                sm={12}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "12px 20px", // row-gap: 12px, column-gap: 20px
                                  alignItems: "center",
                                }}
                              >
                                {kv("Name", row.name)}
                                {kv(
                                  "DOB",
                                  row.dob
                                    ? new Date(row.dob).toLocaleDateString(
                                        "en-GB",
                                      )
                                    : "-",
                                )}
                                {kv("TOB", row.tob)}
                                {kv("Place", row.place)}
                              </Col>
                            </Row>
                          </div>
                        </Col>
                        <Col md={6} xs={12}>
                          <div
                            className="rounded p-2 h-100"
                            style={{
                              backgroundColor: "#fff5f5",
                              border: "1px solid #fed7d7",
                            }}
                          >
                            <h6
                              className="fw-bold mb-3"
                              style={{ color: "#c53030", fontSize: "0.95rem" }}
                            >
                              <span className="me-2">👩</span> Female Birth
                              Details
                            </h6>
                            <Row className="gy-1">
                              <Col
                                xs={12}
                                sm={12}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "12px 20px", // row-gap: 12px, column-gap: 20px
                                  alignItems: "center",
                                }}
                              >
                                {kv("Name", row.fname)}
                                {kv(
                                  "DOB",
                                  row.fdob
                                    ? new Date(row.fdob).toLocaleDateString(
                                        "en-GB",
                                      )
                                    : "-",
                                )}
                                {kv("TOB", row.ftob)}
                                {kv("Place", row.fplace)}
                              </Col>
                            </Row>
                          </div>
                        </Col>
                      </Row>
                    ) : (
                      <div
                        className="rounded p-2 mb-2 border shadow-sm"
                        style={{ backgroundColor: "#fafafa" }}
                      >
                        <h6
                          className="fw-bold mb-3 text-secondary"
                          style={{ fontSize: "0.95rem" }}
                        >
                          <span className="me-2">📅</span> Birth Details
                        </h6>
                        <Row className="gy-1">
                          <Col xs={12} sm={4} md={3}>
                            {kv(
                              "DOB",
                              row.dob
                                ? new Date(row.dob).toLocaleDateString("en-GB")
                                : "-",
                            )}
                          </Col>
                          <Col xs={12} sm={4} md={3}>
                            {kv("TOB", row.tob)}
                          </Col>
                          <Col xs={12} sm={4} md={6}>
                            {kv("Place", row.place)}
                          </Col>
                        </Row>
                      </div>
                    )}

                    {safe(row.other_details) !== "-" && (
                      <div
                        className="mb-3 px-3 py-2 rounded bg-soft-warning border-start border-4 border-warning"
                        style={{ backgroundColor: "#fffaf0" }}
                      >
                        <span className="fw-bold text-dark small">
                          Remarks/Details:
                        </span>{" "}
                        <span
                          className="text-muted small"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {row.other_details}
                        </span>
                      </div>
                    )}

                    {/* ACTIONS & FOOTER */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pt-2 mt-2 border-top">
                      <div className="small text-muted d-flex flex-column flex-sm-row gap-2 gap-sm-4 mb-3 mb-md-0">
                        <div>
                          <span className="text-secondary fw-semibold">
                            Created:
                          </span>{" "}
                          <span className="text-dark">
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-secondary fw-semibold">
                            By:
                          </span>{" "}
                          <span className="text-dark">
                            {safe(row.created_by)}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 justify-content-start justify-content-md-end">
                        {actype === "oner12a31d240bf67e45b0ab17fc12226fa0" && (
                          <Button
                            size="sm"
                            variant={
                              row.status === "Pending"
                                ? "primary"
                                : "outline-primary"
                            }
                            className="rounded-pill px-3 fw-medium shadow-sm transition d-flex align-items-center gap-2"
                            onClick={() => openUploadModal(row)}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>
                              {row.status === "Pending" ? "📤" : "🔄"}
                            </span>
                            {row.status === "Pending"
                              ? "Complete Order"
                              : "Update PDF"}
                          </Button>
                        )}

                        {row.status === "Completed" && row.fileurl && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="rounded-pill px-3 fw-medium d-flex align-items-center gap-2"
                              onClick={() => window.open(row.fileurl, "_blank")}
                            >
                              <span>📄</span> View
                            </Button>

                            <Button
                              size="sm"
                              variant="success"
                              className="rounded-pill px-3 fw-medium d-flex align-items-center gap-2 shadow-sm"
                              onClick={() =>
                                sendWhatsAppPDF(
                                  row.mobile,
                                  row.fileurl,
                                  row.name,
                                )
                              }
                              style={{
                                backgroundColor: "#25D366",
                                borderColor: "#25D366",
                              }}
                            >
                              <span>💬</span> WhatsApp
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          )}
        </Card.Body>
      </Card>

      {/* UPLOAD MODAL */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold px-2 pt-2 text-dark">
            Upload Horoscope Result
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          <p className="text-muted mb-4 small">
            Select a PDF document containing the generated horoscope analysis
            for <b>{safe(selectedOrder?.name)}</b>. Upon upload, the order
            status will be updated to completed.
          </p>
          <div
            className="p-4 border rounded text-center"
            style={{
              backgroundColor: "#f8fafc",
              borderStyle: "dashed !important",
              borderWidth: "2px",
              borderColor: "#cbd5e0",
            }}
          >
            <Form.Control
              type="file"
              accept="application/pdf"
              className="form-control"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          <Button
            variant="light"
            className="px-4 rounded-pill border"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="px-4 rounded-pill fw-bold shadow-sm d-flex align-items-center"
            onClick={handlePdfUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Uploading...
              </>
            ) : (
              "Confirm & Upload"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderList;
