import React from "react";

/* ---------- First Name ---------- */
export const FirstName = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-12 col-md-2 col-form-label">
      First Name <span className="text-danger">*</span>
    </label>
    <div className="col-12 col-md-10">
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder="Enter the first name"
      />
    </div>
  </div>
);

/* ---------- Middle Name ---------- */
export const MiddleName = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-md-2 col-form-label">Middle Name</label>
    <div className="col-md-10">
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder="Enter the middle name"
      />
    </div>
  </div>
);

/* ---------- Last Name ---------- */
export const LastName = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-md-2 col-form-label">
      Last Name <span className="text-danger">*</span>
    </label>
    <div className="col-md-10">
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder="Enter the last name"
      />
    </div>
  </div>
);

/* ---------- Gender ---------- */
export const Gender = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-md-2 col-form-label">
      Gender <span className="text-danger">*</span>
    </label>
    <div className="col-md-10">
      <select
        className="form-select"
        value={value}
        onChange={onChange}
      >
        <option value="">-- Choose Gender --</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>
  </div>
);

/* ---------- Date of Birth ---------- */
export const DateOfBirth = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-md-2 col-form-label">
      Date of Birth <span className="text-danger">*</span>
    </label>
    <div className="col-md-10">
      <input
        type="date"
        className="form-control"
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

/* ---------- Birth Time ---------- */
export const BirthTime = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-md-2 col-form-label">
      Time of Birth <span className="text-danger">*</span>
    </label>
    <div className="col-md-10">
      <input
        type="time"
        className="form-control"
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

/* ---------- Place ---------- */
export const Place = ({ value, onChange }) => (
  <div className="row mb-3">
    <label className="col-md-2 col-form-label">
      Place <span className="text-danger">*</span>
    </label>
    <div className="col-md-10">
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder="Enter place"
      />
    </div>
  </div>
);

/* ---------- Language ---------- */
export const Language = ({ value, onChange }) => (
  <div className="row mb-4">
    <label className="col-md-2 col-form-label">
      Report Language <span className="text-danger">*</span>
    </label>
    <div className="col-md-10">
      <select
        className="form-select"
        value={value}
        onChange={onChange}
      >
        <option value="">-- Choose Language --</option>
        <option value="tamil">Tamil</option>
        <option value="english">English</option>
      </select>
    </div>
  </div>
);

/* ---------- Place Order Button ---------- */
export const PlaceOrder = ({ onClick }) => (
  <div className="text-center mt-4">
    <button
      type="button"
      className="btn btn-danger btn-lg"
      onClick={onClick}
    >
      Place Order
    </button>
  </div>
);
