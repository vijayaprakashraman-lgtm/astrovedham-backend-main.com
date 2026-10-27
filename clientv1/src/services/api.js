import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut
} from "firebase/auth";

const HOSTNAME = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_BASE_URL;
console.log("hostname", HOSTNAME);

/* -------------------- AUTH HELPERS -------------------- */

// Admin ctype constant - must match what the server issues
const ADMIN_CTYPE = "oner12a31d240bf67e45b0ab17fc12226fa0";
let isHandlingTokenExpiry = false;

/**
 * Clears local storage and redirects based on user type:
 *  - Admin  -> /portal/admin
 *  - Franchise / others -> /portal/login
 */
export const handleTokenExpiry = async () => {
  if (isHandlingTokenExpiry) return;
  isHandlingTokenExpiry = true;

  const ctype = localStorage.getItem("AVctype");

  try {
    await signOut(auth);
  } catch (e) {
    console.error("Firebase logout error", e);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("AvdToken");
  localStorage.removeItem("AvdUser");
  localStorage.removeItem("AvdPicture");
  localStorage.removeItem("AVctype");

  if (ctype === ADMIN_CTYPE) {
    window.location.href = `${BASE_URL}/admin`;
  } else {
    window.location.href = `${BASE_URL}/login`;
  }
};

const hasTokenExpiredMarker = (obj) => {
  if (!obj || typeof obj !== "object") return false;
  const status = String(obj.status || "").toUpperCase();
  const message = String(obj.msg || obj.message || "").toLowerCase();
  return status === "UA" && message.includes("token expired");
};

const isTokenExpiredPayload = (payload) => {
  if (!payload || typeof payload !== "object") return false;
  if (hasTokenExpiredMarker(payload)) return true;

  if (payload.data && typeof payload.data === "object" && hasTokenExpiredMarker(payload.data)) {
    return true;
  }

  return false;
};

const parseApiResponse = async (response) => {
  let data = null;
  const rawText = await response.text();

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = rawText;
    }
  }

  const isAuthExpired = response.status === 401 || isTokenExpiredPayload(data);

  if (isAuthExpired) {
    await handleTokenExpiry();
    return {
      status: 401,
      ok: false,
      data,
      expired: true,
    };
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    expired: false,
  };
};

// Manual Logout function (USED IN HEADER)
export const Logout = async () => {
  await handleTokenExpiry();
};

// Fetch logged-in user data (USED IN MAINLAYOUT)
export const fetchUserData = async () => {
  const token = localStorage.getItem("token") || localStorage.getItem("AvdToken");
  if (!token) return null;

  const response = await fetch(`${HOSTNAME}/api/user_profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return null;

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return result.data;
};

/* -------------------- EXISTING FUNCTIONS -------------------- */

export async function login({ idToken }) {
  const response = await fetch(`${HOSTNAME}/api/google_login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
    },
    body: JSON.stringify({ idToken }),
    credentials: "include",
  });
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

export async function flogin({ idToken }) {
  const response = await fetch(`${HOSTNAME}/api/franchise_google_login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
    },
    body: JSON.stringify({ idToken }),
    credentials: "include",
  });
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

export async function place_order(data) {
  const token = localStorage.getItem("AvdToken");

  const response = await fetch(`${HOSTNAME}/api/place_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return result;

  return result.data;
}

export async function getOrders(data) {
  const token = localStorage.getItem("AvdToken");

  const response = await fetch(`${HOSTNAME}/api/order_list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function getfranchiseuser(data) {
  const token = localStorage.getItem("AvdToken");

  const response = await fetch(`${HOSTNAME}/api/franchise_user_list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function uploadOrderPDF(orderId, pdfFile) {
  const token = localStorage.getItem("AvdToken");
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("pdfFile", pdfFile);

  const response = await fetch(`${HOSTNAME}/api/upload_horscope`, {
    method: "POST",
    headers: {
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return result;

  return result.data;
}

export async function changeFranchiseStatus(id, status) {
  const token = localStorage.getItem("AvdToken");

  const response = await fetch(`${HOSTNAME}/api/franchise/toggle-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, status }),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function addFranchise(data) {
  const token = localStorage.getItem("AvdToken");

  const response = await fetch(`${HOSTNAME}/api/franchise_reg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function activateFranchisePlan(data) {
  const token = localStorage.getItem("AvdToken");

  const response = await fetch(`${HOSTNAME}/api/franchise/activate-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function saveFcmToken(fcmToken) {
  const token = localStorage.getItem("AvdToken");
  if (!token || !fcmToken) {
    return { status: 400, ok: false, data: { message: "Missing token or fcmToken" } };
  }

  const response = await fetch(`${HOSTNAME}/api/save_fcm_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fcmToken }),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function createUserPlan(data) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/user_plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return result;
  return result.data;
}

export async function getUserPlans(data = {}) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/user_plans/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return result;
  return result.data;
}

export async function updateUserPlan(data) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/user_plans/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return result;
  return result.data;
}

export async function deleteUserPlan(id) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/user_plans/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
    credentials: "include",
  });

  const result = await parseApiResponse(response);
  if (result.expired) return result;
  return result.data;
}

/* -------------------- CUSTOMER MANAGEMENT (ADMIN) -------------------- */

export async function getCustomerList(data = {}) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/customer_list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function toggleCustomerStatus(id, status) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/customer_list/toggle-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, status }),
    credentials: "include",
  });

  return parseApiResponse(response);
}

export async function getCustomerOrdersAdmin(data = {}) {
  const token = localStorage.getItem("AvdToken");
  const response = await fetch(`${HOSTNAME}/api/customer_list/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "helloworld",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  return parseApiResponse(response);
}
