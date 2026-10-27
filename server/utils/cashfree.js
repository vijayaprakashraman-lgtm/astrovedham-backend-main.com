/**
 * Cashfree Payment Gateway Helper
 * Supports Cashfree PG Orders API v2023-08-01
 */

const getCashfreeBaseUrl = () => {
  const env = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
  return env === 'PROD' || env === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
};

const getCashfreeHeaders = () => {
  const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';

  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'x-api-version': '2023-08-01',
  };
};

/**
 * Creates an order on Cashfree PG
 */
const createOrder = async ({
  orderId,
  orderAmount,
  customer,
  planName,
  returnUrl,
  notifyUrl,
}) => {
  const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const env = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
  const isProd = env === 'PROD' || env === 'PRODUCTION';

  // Fallback to demo/simulation mode if keys are not yet configured in .env (TEST mode only)
  if (!appId || !secretKey || appId === 'your_cashfree_app_id') {
    if (isProd) {
      throw new Error('Production security error: Cashfree App ID and Secret Key are required in production mode. Simulation mode is disabled.');
    }

    console.warn(
      '⚠️ CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not configured in .env. Running in simulation mode.'
    );

    const simulatedPaymentSessionId = `session_${Date.now()}_simulated`;
    const simulatedPaymentLink = `https://sandbox.cashfree.com/pg/orders?order_id=${orderId}&simulated=true`;

    return {
      order_id: orderId,
      cf_order_id: `CF_${Date.now()}`,
      order_status: 'ACTIVE',
      payment_session_id: simulatedPaymentSessionId,
      payment_link: simulatedPaymentLink,
      is_simulated: true,
    };
  }

  const baseUrl = getCashfreeBaseUrl();
  const headers = getCashfreeHeaders();

  const payload = {
    order_id: orderId,
    order_amount: parseFloat(orderAmount),
    order_currency: 'INR',
    customer_details: {
      customer_id: String(customer._id || customer.id || customer.mobile),
      customer_phone: String(customer.mobile || '9999999999').replace(/\D/g, ''),
      customer_name: (customer.name && customer.name.trim()) || 'Astro Customer',
      customer_email: customer.email || `${customer.mobile || 'customer'}@astrovedham.com`,
    },
    order_meta: {
      return_url:
        returnUrl ||
        process.env.CASHFREE_RETURN_URL ||
        `https://astrovedham.com/payment_status?order_id={order_id}`,
      notify_url:
        notifyUrl ||
        process.env.CASHFREE_NOTIFY_URL ||
        `https://astrovedham.com/api/customer/cashfree_webhook`,
    },
    order_note: `Purchase: ${planName || 'Horoscope Plan'}`,
  };

  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree order creation error response:', data);
      throw new Error(data.message || 'Failed to create Cashfree order');
    }

    // Cashfree returns payment_session_id and optionally payments.url
    const paymentSessionId = data.payment_session_id || '';
    const paymentLink =
      (data.payments && data.payments.url) ||
      `https://payments.cashfree.com/order/#${paymentSessionId}`;

    return {
      order_id: data.order_id,
      cf_order_id: data.cf_order_id,
      order_status: data.order_status,
      payment_session_id: paymentSessionId,
      payment_link: paymentLink,
      raw: data,
    };
  } catch (err) {
    console.error('Cashfree createOrder fetch error:', err);
    throw err;
  }
};

/**
 * Fetches order details & status from Cashfree
 */
const getOrderDetails = async (orderId) => {
  const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const env = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
  const isProd = env === 'PROD' || env === 'PRODUCTION';

  if (!appId || !secretKey || appId === 'your_cashfree_app_id') {
    if (isProd) {
      throw new Error('Production security error: Cashfree credentials required for order verification in production mode.');
    }
    // Simulated auto-success for testing if no keys provided in TEST mode
    return {
      order_id: orderId,
      order_status: 'PAID',
      order_amount: 100,
      is_simulated: true,
    };
  }

  const baseUrl = getCashfreeBaseUrl();
  const headers = getCashfreeHeaders();

  try {
    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch Cashfree order');
    }

    return data;
  } catch (err) {
    console.error('Cashfree getOrderDetails error:', err);
    throw err;
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
};

