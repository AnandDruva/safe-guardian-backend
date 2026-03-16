const express = require("express");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

console.log("🔥 Emergency watcher started");

// Check every 5 seconds
setInterval(async () => {

  try {

    const snapshot = await db
      .collection("emergencies")
      .where("status", "==", "ACTIVE")
      .get();

    if (snapshot.empty) {
      console.log("No active emergencies");
      return;
    }

    for (const doc of snapshot.docs) {

      const data = doc.data();

      // Avoid sending duplicate notifications
      if (data.notificationSent === true) {
        continue;
      }

      console.log("🚨 Emergency detected");

      const caregiverId = data.caregiverId;

      const caregiverDoc = await db
        .collection("users")
        .doc(caregiverId)
        .get();

      if (!caregiverDoc.exists) {
        console.log("❌ Caregiver not found");
        continue;
      }

      const token = caregiverDoc.data().fcmToken;

      if (!token) {
        console.log("❌ No FCM token");
        continue;
      }

      await admin.messaging().send({
        token: token,
        notification: {
          title: "🚨 Emergency Alert",
          body: `${data.elderName} needs help immediately!`
        }
      });

      console.log("✅ Notification sent");

      await doc.ref.update({
        notificationSent: true
      });

    }

  } catch (error) {
    console.error("Error sending notification:", error);
  }

}, 5000);


app.get("/", (req, res) => {
  res.send("SafeGuardian Backend Running");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});