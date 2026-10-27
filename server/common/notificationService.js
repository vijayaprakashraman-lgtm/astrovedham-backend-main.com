const admin = require("./firebase");

// 🔔 send notification
const sendNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens.length) return;

    const message = {
      notification: { title, body },
      data: {
        ...data,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // remove invalid tokens
    const failedTokens = [];
    response.responses.forEach((res, index) => {
      if (!res.success) {
        failedTokens.push(tokens[index]);
      }
    });

    return failedTokens;

  } catch (err) {
    console.error(err);
  }
};

module.exports = { sendNotification };