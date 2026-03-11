const express = require("express");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

console.log("🔥 Emergency watcher started");

// Check every 5 seconds for ACTIVE emergencies
setInterval(async () => {
  try {
    const snapshot = await db.collection("emergencies")
      .where("status", "==", "ACTIVE")
      .get();

    snapshot.forEach(async (doc) => {
      const data = doc.data();

      // Avoid sending again
      if (data.notificationSent) return;

      console.log("🚨 Emergency detected");

      const caregiverId = data.caregiverId;

      const caregiverDoc = await db.collection("users")
        .doc(caregiverId)
        .get();

      const token = caregiverDoc.data()?.fcmToken;

      if (!token) {
        console.log("❌ No FCM token");
        return;
      }

      await admin.messaging().send({
        token: token,
        notification: {
          title: "🚨 Emergency Alert",
          body: `${data.elderName} needs help immediately!`
        }
      });

      console.log("✅ Notification sent");

      // Mark as sent
      await doc.ref.update({ notificationSent: true });
    });

  } catch (err) {
    console.error(err);
  }
}, 5000); // every 5 seconds

app.get("/", (req, res) => {
  res.send("SafeGuardian Backend Running");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));