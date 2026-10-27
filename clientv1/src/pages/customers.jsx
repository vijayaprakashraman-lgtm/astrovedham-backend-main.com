import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Modal,
  Badge,
  Nav,
  Tab,
  Spinner,
} from "react-bootstrap";
import Swal from "sweetalert2";
import {
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaSearch,
  FaSync,
  FaBox,
  FaHistory,
  FaFilePdf,
  FaCreditCard,
  FaShoppingBag,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import { getCustomerList, toggleCustomerStatus, getCustomerOrdersAdmin } from "../services/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    total_customers: 0,
    active_customers: 0,
    total_revenue: 0,
    total_transactions: 0,
    total_plans_purchased: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");

  /* ================= HELPERS ================= */

  const safe = (v) =>
    v !== null && v !== undefined && v !== "" && v !== "null" ? v : "-";

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS") {
      return (
        <Badge bg="success" className="px-2 py-1">
          <FaCheckCircle className="me-1" /> SUCCESS
        </Badge>
      );
    }
    if (s === "PENDING") {
      return (
        <Badge bg="warning" text="dark" className="px-2 py-1">
          <FaClock className="me-1" /> PENDING
        </Badge>
      );
    }
    return (
      <Badge bg="danger" className="px-2 py-1">
        <FaTimesCircle className="me-1" /> {s || "FAILED"}
      </Badge>
    );
  };

  const getPlanStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "ACTIVE") {
      return (
        <Badge bg="success" className="px-2 py-1">
          Active
        </Badge>
      );
    }
    if (s === "EXHAUSTED") {
      return (
        <Badge bg="secondary" className="px-2 py-1">
          Used / Exhausted
        </Badge>
      );
    }
    return (
      <Badge bg="warning" text="dark" className="px-2 py-1">
        {s || "Expired"}
      </Badge>
    );
  };

  /* ================= FETCH DATA ================= */

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomerList({
        search,
        status: statusFilter,
      });

      if (res?.ok && res.data) {
        setCustomers(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("fetchCustomers error:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  /* ================= TOGGLE STATUS ================= */

  const handleToggleStatus = async (customer) => {
    const newStatus = !customer.is_active;
    const confirm = await Swal.fire({
      title: `${newStatus ? "Activate" : "Deactivate"} Customer?`,
      text: `Customer ${customer.name || customer.mobile} will be ${
        newStatus ? "activated" : "deactivated"
      }.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus ? "#28a745" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Yes, ${newStatus ? "Activate" : "Deactivate"}`,
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await toggleCustomerStatus(customer._id, newStatus);
      if (res?.ok) {
        Swal.fire({
          icon: "success",
          title: "Status Updated",
          text: `Customer has been ${newStatus ? "activated" : "deactivated"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchCustomers();
      } else {
        Swal.fire("Error", res?.data?.message || "Failed to update status", "error");
      }
    } catch {
      Swal.fire("Error", "Server communication error", "error");
    }
  };

  /* ================= MODAL HANDLERS ================= */

  const openTxnModal = async (customer, defaultTab = "transactions") => {
    setSelectedCustomer(customer);
    setActiveTab(defaultTab);
    setShowModal(true);

    // Fetch customer's orders
    try {
      setOrdersLoading(true);
      const res = await getCustomerOrdersAdmin({
        customer_id: customer._id,
        mobile: customer.mobile,
      });
      if (res?.ok && res.data?.data) {
        setCustomerOrders(res.data.data);
      } else {
        setCustomerOrders([]);
      }
    } catch {
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="py-2 px-1 px-md-2">
      {/* HEADER & COUNTER CARDS */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 pb-2 border-bottom">
        <div>
          <h3 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
            <FaUsers className="text-primary" /> Customer Management
          </h3>
          <p className="text-muted small mb-0">
            View registered mobile app customers, transaction history, and purchased plan credits.
          </p>
        </div>
        <div className="mt-2 mt-md-0 d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill px-3 d-flex align-items-center gap-2"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <FaSync className={loading ? "spin-icon" : ""} /> Refresh
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <Row className="g-2 mb-3">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                style={{ width: "48px", height: "48px", fontSize: "1.25rem" }}
              >
                <FaUsers />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Total Customers</div>
                <h4 className="mb-0 fw-bold text-dark">{stats.total_customers}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success"
                style={{ width: "48px", height: "48px", fontSize: "1.25rem" }}
              >
                <FaCheckCircle />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Active Customers</div>
                <h4 className="mb-0 fw-bold text-success">{stats.active_customers}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-warning-subtle text-warning"
                style={{ width: "48px", height: "48px", fontSize: "1.25rem" }}
              >
                <FaRupeeSign />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Total Revenue</div>
                <h4 className="mb-0 fw-bold text-dark">₹{stats.total_revenue}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
            <Card.Body className="p-3 d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-info-subtle text-info"
                style={{ width: "48px", height: "48px", fontSize: "1.25rem" }}
              >
                <FaBox />
              </div>
              <div>
                <div className="text-muted small fw-semibold">Plans Purchased</div>
                <h4 className="mb-0 fw-bold text-info">{stats.total_plans_purchased}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SEARCH & FILTERS */}
      <Card className="border-0 shadow-sm rounded-3 mb-3 bg-white">
        <Card.Body className="p-2 p-md-3">
          <Form onSubmit={handleSearchSubmit}>
            <Row className="g-2 align-items-center">
              <Col xs={12} md={7}>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <Form.Control
                    type="text"
                    className="border-start-0 ps-0 shadow-none"
                    placeholder="Search by Mobile Number, Customer Name, or Email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="primary" type="submit" className="px-3">
                    Search
                  </Button>
                </div>
              </Col>

              <Col xs={6} md={3}>
                <Form.Select
                  className="shadow-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Accounts</option>
                  <option value="inactive">Inactive Accounts</option>
                </Form.Select>
              </Col>

              <Col xs={6} md={2} className="text-end">
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    fetchCustomers();
                  }}
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* CUSTOMERS TABLE */}
      <Card className="border-0 shadow-sm rounded-3 overflow-hidden bg-white">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2 text-muted fw-semibold">Loading Customers...</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted fs-5 fw-semibold mb-1">No customers found</div>
              <p className="text-secondary small mb-0">
                Customers who register via the mobile app will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0" style={{ borderCollapse: "collapse" }}>
                <thead className="table-light text-secondary small text-uppercase fw-semibold">
                  <tr>
                    <th style={{ width: "50px" }} className="text-center">#</th>
                    <th>Customer Details</th>
                    <th>Joined At</th>
                    <th>Status</th>
                    <th>Purchased Plans</th>
                    <th>Total Spent</th>
                    <th>Orders</th>
                    <th className="text-center" style={{ width: "160px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, idx) => {
                    const initials = (c.name || "C").charAt(0).toUpperCase();
                    const plansCount = c.purchased_plans?.length || 0;
                    const activeCredits = c.stats?.active_credits || 0;
                    const txnsCount = c.transactions?.length || 0;
                    const totalSpent = c.stats?.total_spent || 0;
                    const ordersCount = c.stats?.total_orders || 0;

                    return (
                      <tr key={c._id}>
                        <td className="text-center text-muted fw-semibold">{idx + 1}</td>

                        {/* Customer Info */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold bg-primary-subtle text-primary"
                              style={{ width: "38px", height: "38px", flexShrink: 0 }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="fw-bold text-dark mb-0">
                                {c.name || "Customer"}
                              </div>
                              <div className="small text-muted d-flex align-items-center gap-2">
                                <span>
                                  <FaPhone className="me-1 text-secondary" style={{ fontSize: "0.75rem" }} />
                                  {c.mobile}
                                </span>
                                {c.email && c.email !== "-" && (
                                  <span>
                                    <FaEnvelope className="me-1 text-secondary" style={{ fontSize: "0.75rem" }} />
                                    {c.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="small text-muted">
                          {formatDate(c.created_at)}
                        </td>

                        {/* Status */}
                        <td>
                          <Badge
                            bg={c.is_active ? "success-subtle" : "danger-subtle"}
                            text={c.is_active ? "success" : "danger"}
                            className="px-2 py-1 rounded-pill cursor-pointer border"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleToggleStatus(c)}
                            title="Click to toggle status"
                          >
                            {c.is_active ? "● Active" : "● Inactive"}
                          </Badge>
                        </td>

                        {/* Purchased Plans */}
                        <td>
                          <div
                            className="cursor-pointer"
                            onClick={() => openTxnModal(c, "plans")}
                            style={{ cursor: "pointer" }}
                          >
                            <Badge bg="info" className="me-1 px-2 py-1">
                              {plansCount} {plansCount === 1 ? "Plan" : "Plans"}
                            </Badge>
                            {activeCredits > 0 ? (
                              <span className="small text-success fw-semibold">
                                ({activeCredits} credit{activeCredits > 1 ? "s" : ""})
                              </span>
                            ) : (
                              <span className="small text-muted">(0 left)</span>
                            )}
                          </div>
                        </td>

                        {/* Total Spent / Transactions */}
                        <td>
                          <div
                            className="cursor-pointer"
                            onClick={() => openTxnModal(c, "transactions")}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="fw-bold text-dark">₹{totalSpent}</div>
                            <div className="small text-muted">
                              {txnsCount} txn{txnsCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </td>

                        {/* Orders Count */}
                        <td>
                          <div
                            className="cursor-pointer"
                            onClick={() => openTxnModal(c, "orders")}
                            style={{ cursor: "pointer" }}
                          >
                            <span className="badge bg-secondary-subtle text-dark border">
                              {ordersCount} {ordersCount === 1 ? "Order" : "Orders"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="text-center">
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-pill px-3 shadow-sm d-inline-flex align-items-center gap-1"
                            onClick={() => openTxnModal(c, "transactions")}
                          >
                            <FaEye className="me-1" /> View TXN
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ================= MODAL: VIEW TXN & PLANS ================= */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
            <span>Customer Details & History</span>
            {selectedCustomer && (
              <Badge bg="primary-subtle" text="primary" className="border">
                {selectedCustomer.name || "Customer"} ({selectedCustomer.mobile})
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          {selectedCustomer && (
            <div>
              {/* CUSTOMER SUMMARY STRIP */}
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <Row className="gy-2">
                  <Col xs={12} sm={6} md={3}>
                    <div className="small text-muted">Customer Name</div>
                    <div className="fw-bold text-dark">{safe(selectedCustomer.name)}</div>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
                    <div className="small text-muted">Mobile Number</div>
                    <div className="fw-bold text-dark">{safe(selectedCustomer.mobile)}</div>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
                    <div className="small text-muted">Email Address</div>
                    <div className="fw-bold text-dark">{safe(selectedCustomer.email)}</div>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
                    <div className="small text-muted">Joined Date</div>
                    <div className="fw-bold text-dark">{formatDate(selectedCustomer.created_at)}</div>
                  </Col>
                </Row>
              </div>

              {/* TABS FOR TXN, PURCHASED PLANS & ORDERS */}
              <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav variant="pills" className="nav-fill mb-3 bg-light p-1 rounded-3">
                  <Nav.Item>
                    <Nav.Link eventKey="transactions" className="fw-semibold d-flex align-items-center justify-content-center gap-2">
                      <FaCreditCard />
                      <span>Transactions ({selectedCustomer.transactions?.length || 0})</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="plans" className="fw-semibold d-flex align-items-center justify-content-center gap-2">
                      <FaBox />
                      <span>Purchased Plans ({selectedCustomer.purchased_plans?.length || 0})</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="orders" className="fw-semibold d-flex align-items-center justify-content-center gap-2">
                      <FaShoppingBag />
                      <span>Generated Orders ({customerOrders.length})</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  {/* TAB 1: TRANSACTIONS */}
                  <Tab.Pane eventKey="transactions">
                    {selectedCustomer.transactions?.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <FaCreditCard className="fs-1 text-secondary mb-2" />
                        <div>No transactions recorded for this customer yet.</div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover bordered className="align-middle mb-0">
                          <thead className="table-light small text-uppercase">
                            <tr>
                              <th>#</th>
                              <th>Order ID / CF Ref</th>
                              <th>Plan Type & Name</th>
                              <th>Amount</th>
                              <th>Payment Status</th>
                              <th>Method</th>
                              <th>Date & Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCustomer.transactions.map((tx, idx) => (
                              <tr key={idx}>
                                <td className="text-muted fw-semibold">{idx + 1}</td>
                                <td>
                                  <div className="fw-bold text-dark font-monospace small">
                                    {safe(tx.order_id || tx.cf_order_id)}
                                  </div>
                                  {tx.payment_id && (
                                    <div className="text-muted small">
                                      Pay ID: {tx.payment_id}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span className="badge bg-primary-subtle text-primary border me-1">
                                    {safe(tx.plan_type)}
                                  </span>
                                  <span className="fw-medium">{safe(tx.plan_name)}</span>
                                </td>
                                <td className="fw-bold text-dark">
                                  ₹{tx.amount || 0}
                                </td>
                                <td>{getStatusBadge(tx.status || tx.payment_status)}</td>
                                <td className="small text-uppercase">
                                  {safe(tx.payment_method || tx.method || "Cashfree PG")}
                                </td>
                                <td className="small text-muted">
                                  {formatDate(tx.created_at || tx.completed_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Tab.Pane>

                  {/* TAB 2: PURCHASED PLANS */}
                  <Tab.Pane eventKey="plans">
                    {selectedCustomer.purchased_plans?.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <FaBox className="fs-1 text-secondary mb-2" />
                        <div>No purchased plans active for this customer.</div>
                      </div>
                    ) : (
                      <Row className="g-3">
                        {selectedCustomer.purchased_plans.map((p, idx) => {
                          const remaining = p.remaining_count !== undefined ? p.remaining_count : (p.count || 1);
                          return (
                            <Col xs={12} md={6} key={idx}>
                              <Card className="border rounded-3 shadow-sm h-100">
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <span className="badge bg-primary me-2">
                                        {safe(p.plan_type)}
                                      </span>
                                      <h6 className="fw-bold mb-0 text-dark d-inline">
                                        {safe(p.plan_name)}
                                      </h6>
                                    </div>
                                    <div>{getPlanStatusBadge(p.status)}</div>
                                  </div>

                                  <div className="p-2 bg-light rounded-2 my-2 small">
                                    <Row className="gy-1">
                                      <Col xs={6}>
                                        <span className="text-muted">Total Count:</span>{" "}
                                        <span className="fw-bold text-dark">{p.count || 1}</span>
                                      </Col>
                                      <Col xs={6}>
                                        <span className="text-muted">Remaining:</span>{" "}
                                        <span className="fw-bold text-success">{remaining} left</span>
                                      </Col>
                                      <Col xs={6}>
                                        <span className="text-muted">Paid Price:</span>{" "}
                                        <span className="fw-bold text-dark">₹{p.amount || 0}</span>
                                      </Col>
                                      <Col xs={6}>
                                        <span className="text-muted">Order ID:</span>{" "}
                                        <span className="font-monospace text-truncate d-inline-block" style={{ maxWidth: "120px" }}>
                                          {safe(p.order_id)}
                                        </span>
                                      </Col>
                                    </Row>
                                  </div>

                                  <div className="d-flex justify-content-between align-items-center small text-muted mt-2 pt-2 border-top">
                                    <span>
                                      Purchased: {formatDate(p.purchased_at || p.created_at)}
                                    </span>
                                    {p.expires_at && (
                                      <span>
                                        Expires: {formatDate(p.expires_at)}
                                      </span>
                                    )}
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </Tab.Pane>

                  {/* TAB 3: GENERATED HOROSCOPE ORDERS */}
                  <Tab.Pane eventKey="orders">
                    {ordersLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" size="sm" variant="primary" />
                        <div className="small text-muted mt-2">Loading customer orders...</div>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <FaShoppingBag className="fs-1 text-secondary mb-2" />
                        <div>This customer has not placed any horoscope orders yet.</div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover bordered className="align-middle mb-0">
                          <thead className="table-light small text-uppercase">
                            <tr>
                              <th>#</th>
                              <th>Horoscope Type</th>
                              <th>Person Name</th>
                              <th>Birth Details (DOB / TOB / Place)</th>
                              <th>Status</th>
                              <th>Created At</th>
                              <th>PDF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerOrders.map((ord, idx) => (
                              <tr key={ord._id || idx}>
                                <td className="text-muted fw-semibold">{idx + 1}</td>
                                <td>
                                  <Badge bg="primary">{safe(ord.horoscope_type)}</Badge>
                                </td>
                                <td className="fw-bold text-dark">{safe(ord.name)}</td>
                                <td className="small">
                                  <div>
                                    📅 {ord.dob ? new Date(ord.dob).toLocaleDateString("en-GB") : "-"}
                                  </div>
                                  <div>
                                    ⏰ {safe(ord.tob)} | 📍 {safe(ord.place)}
                                  </div>
                                </td>
                                <td>
                                  <Badge
                                    bg={ord.status === "Completed" ? "success" : "warning"}
                                    text={ord.status === "Completed" ? "white" : "dark"}
                                    className="px-2 py-1"
                                  >
                                    {safe(ord.status)}
                                  </Badge>
                                </td>
                                <td className="small text-muted">
                                  {formatDate(ord.created_at)}
                                </td>
                                <td>
                                  {ord.fileurl ? (
                                    <Button
                                      size="sm"
                                      variant="outline-success"
                                      className="rounded-pill px-2 py-0 d-inline-flex align-items-center gap-1"
                                      onClick={() => window.open(ord.fileurl, "_blank")}
                                    >
                                      <FaFilePdf /> View
                                    </Button>
                                  ) : (
                                    <span className="text-muted small">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customers;

