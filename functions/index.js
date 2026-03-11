const express = require("express");
const admin = require("firebase-admin");

admin.initializeApp();

const app = express();
app.use(express.json());

// Firestore listener using Admin SDK
admin.firestore().collection("emergencies")
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === "modified") {
        const data = change.doc.data();

        if (data.status === "ACTIVE") {
          console.log("🚨 Emergency detected");

          const caregiverId = data.caregiverId;

          const caregiverDoc = await admin.firestore()
            .collection("users")
            .doc(caregiverId)
            .get();

          const token = caregiverDoc.data().fcmToken;

          if (!token) return;

          await admin.messaging().send({
            token: token,
            notification: {
              title: "🚨 Emergency Alert",
              body: `${data.elderName} needs help immediately!`
            }
          });

          console.log("✅ Notification sent");
        }
      }
    });
  });

app.get("/", (req, res) => {
  res.send("SafeGuardian Backend Running");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));