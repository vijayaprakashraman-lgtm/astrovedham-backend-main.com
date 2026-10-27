/* global $ */
import React, { useState, useEffect } from "react";
import { place_order } from "../services/api";    
import { BirthTime, DateOfBirth, FirstName, Gender, Language, LastName, MiddleName, Place, PlaceOrder } from "../components/form/input";
const GemstoneHoroscope = () => {
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

  async function submit_order()
  {
    let firstname = $('#first-name').val().trim(); 
    if (firstname === "") return alert("First Name is required"); 

    let middlename = $('#middle-name').val().trim(); 
    if (middlename === "") return alert("Middle Name is required"); 

    let lastname = $('#last-name').val().trim(); 
    if (lastname === "") return alert("Last Name is required"); 

    let gender = $('#gender').val().trim(); 
    if (gender === "") return alert("Gender is required"); 

    let dob = $('#date-of-birth').val().trim(); 
    if (dob === "") return alert("Date Of Birth is required"); 

    let tob = $('#time-of-birth').val().trim(); 
    if (tob === "") return alert("Time Of Birth is required");

    let place = $('#place').val().trim(); 
    if (place === "") return alert("Place is required");

    let language = $('#report-language').val().trim();
    if (language === "") return alert("Report Language is required");

    let input_obj = {
        product_id: "gemstone_horoscope",
        firstname,
        middlename,
        lastname,
        gender, 
        dob,
        tob,
        place,
        language
    }

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
     <div className="col-lg-3"></div>
    <div className="col-lg-6 col-md-12 col-sm-12">
        <div className="card">
            <div className="card-body">

                <h4 className="card-title">Gemstone Horoscope</h4>
                <p className="card-title-desc"><code className="highlighter-rouge">Please fill the following details: </code></p>
                <FirstName />
                <LastName />
                <MiddleName /> 
                <Gender/>
                <DateOfBirth/>
                <BirthTime/>
                <Place/>
                <Language/>
                <PlaceOrder onClick={(event) => {
                                                submit_order();
                                            }}/>    
            </div>
        </div>
    </div> 
</div>
    </>
  )
}

export default GemstoneHoroscope