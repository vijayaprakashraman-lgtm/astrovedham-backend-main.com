importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDEaytemNcDby98RFLQUJtQjB5MHavKRM8",
  projectId: "astrovedham-66a0d",
  messagingSenderId: "902846948837",
  appId: "1:902846948837:web:fd4ba431df76ea99b0bb0c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png"
  });
});