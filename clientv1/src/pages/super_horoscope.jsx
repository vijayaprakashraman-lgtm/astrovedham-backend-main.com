/* global $ */
import React, { useState, useEffect } from "react";
import { place_order } from "../services/api";
import {
  BirthTime,
  DateOfBirth,
  FirstName,
  Gender,
  Language,
  LastName,
  MiddleName,
  Place,
  PlaceOrder,
} from "../components/form/input";
const SuperHoroscope = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    // if (!user) {
    //   async function getUser() {
    //     try {
    //       const userData = await fetchUserData();
    //       if (userData.status === "S") {
    //         setUser(userData);
    //         localStorage.setItem("user", JSON.stringify(userData.data));
    //       }
    //     } catch (error) {
    //       console.error("Error fetching user data:", error);
    //     }
    //   }
    //   getUser();
    // }
  }, [user]);

  async function submit_order() {
    let firstname = $("#first-name").val().trim();
    if (firstname === "") return alert("First Name is required");

    let middlename = $("#middle-name").val().trim();
    if (middlename === "") return alert("Middle Name is required");

    let lastname = $("#last-name").val().trim();
    if (lastname === "") return alert("Last Name is required");

    let gender = $("#gender").val().trim();
    if (gender === "") return alert("Gender is required");

    let dob = $("#date-of-birth").val().trim();
    if (dob === "") return alert("Date Of Birth is required");

    let tob = $("#time-of-birth").val().trim();
    if (tob === "") return alert("Time Of Birth is required");

    let place = $("#place").val().trim();
    if (place === "") return alert("Place is required");

    let language = $("#report-language").val().trim();
    if (language === "") return alert("Report Language is required");

    let input_obj = {
      product_id: "super_horoscope",
      firstname,
      middlename,
      lastname,
      gender,
      dob,
      tob,
      place,
      language,
    };

    let save_order = await place_order(input_obj);
    if (save_order.status === "S") {
      alert("Order Placed Successfully");
      window.location.reload();
    } else {
      alert("Error in placing order");
    }
  }

  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {/* FORM ROW */}
              <div className="row mb-3">
                <label className="col-12 col-md-3 col-form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <div className="col-12 col-md-9">
                  <input className="form-control" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperHoroscope;
