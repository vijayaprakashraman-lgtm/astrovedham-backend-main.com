import React, { useEffect } from "react";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { handleTokenExpiry } from "./services/api";
// layouts
import Mainlayout from "./layouts/mainlayout";
import LoginLayout from "./layouts/login"; // admin  Login or owner login
import FranciseLoginLayout from "./layouts/flogin"; // franchise loign
// pages
import Home from "./pages/home";
import GenerateHoroscope from "./pages/generate_horoscope";
import LifeHoroscope from "./pages/life_horoscope";
import SuperHoroscope from "./pages/super_horoscope";
import WealthHoroscope from "./pages/wealth_horoscope";
import MarriageHoroscope from "./pages/marriage_horoscope";
import SinglePageHoroscope from "./pages/single_page_horoscope";
import GemstoneHoroscope from "./pages/gemstone_horoscope";
import NumerologyHoroscope from "./pages/numerology_horoscope";
import YearlyHoroscope from "./pages/yearly_horoscope";
import OrderHistory from "./pages/order_history";
import OrderList from "./pages/order_list";
import FranchiseReg from "./pages/franchise_reg";
import UserPlans from "./pages/user_plans";
import Customers from "./pages/customers";
import { FRANCHISE_CTYPE, getAVctype } from "./utils/variable";

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBtxi2e9cRhFZLQC1zc1LgW4_mPq9TXeDQ",
  authDomain: "astrovedham-66a0d.firebaseapp.com",
  projectId: "astrovedham-66a0d",
  storageBucket: "astrovedham-66a0d.firebasestorage.app",
  messagingSenderId: "902846948837",
  appId: "1:902846948837:web:d59c7c875048dc3ab0bb0c",
};

// 🔑 Auth check
const isLoggedIn = () => {
  return !!localStorage.getItem("AvdToken");
};

// 🔒 Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminOnlyRoute = ({ children }) => {
  // Allow franchise registration only for non-franchise users (admin/owner)
  if (getAVctype() === FRANCHISE_CTYPE) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// 🔥 Init Firebase (Vite safe)
const app = initializeApp(firebaseConfig);
if (typeof window !== "undefined") {
  getAnalytics(app);
}

// 🛣️ Router
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* FRANCHISE LOGIN */}
      <Route
        path="/login"
        element={
          isLoggedIn() ? <Navigate to="/" replace /> : <FranciseLoginLayout />
        }
      />
      {/* OWNER LOGIN */}
      <Route
        path="/admin"
        element={isLoggedIn() ? <Navigate to="/" replace /> : <LoginLayout />}
      />
      {/* MAIN APP - ALL ROUTES PROTECTED */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Mainlayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="generate-horoscope" element={<GenerateHoroscope />} />
        <Route path="list/:status" element={<OrderList />} />
        <Route path="life-horoscope" element={<LifeHoroscope />} />
        <Route path="super-horoscope" element={<SuperHoroscope />} />
        <Route path="wealth-horoscope" element={<WealthHoroscope />} />
        <Route path="marriage-horoscope" element={<MarriageHoroscope />} />
        <Route path="single-page-horoscope" element={<SinglePageHoroscope />} />
        <Route path="gemstone-horoscope" element={<GemstoneHoroscope />} />
        <Route path="numerology-horoscope" element={<NumerologyHoroscope />} />
        <Route path="yearly-horoscope" element={<YearlyHoroscope />} />
        <Route path="order-history" element={<OrderList />} />
        <Route
          path="customers"
          element={
            <AdminOnlyRoute>
              <Customers />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="user-plans"
          element={
            <AdminOnlyRoute>
              <UserPlans />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="franchise-reg"
          element={
            <AdminOnlyRoute>
              <FranchiseReg />
            </AdminOnlyRoute>
          }
        />
      </Route>
    </>
  ),
  {
    basename: "/portal", // ✅ THIS IS THE FIX
  }
);

export default function App() {
  useEffect(() => {
    // 🔥 Watch for Firebase Google token expiry
    // When Firebase session ends but we still have a local token → auto logout + smart redirect
    const firebaseAuth = getAuth();
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      const hasLocalToken = !!localStorage.getItem("AvdToken");
      if (!user && hasLocalToken) {
        // Google session expired but user wasn't manually logged out
        handleTokenExpiry();
      }
    });
    return () => unsubscribe();
  }, []);

  return <RouterProvider router={router} />;
}
