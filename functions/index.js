const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendEmergencyNotification = functions.firestore
  .document("emergencies/{emergencyId}")
  .onCreate(async (snap, context) => {

    const emergency = snap.data();
    const elderName = emergency.elderName || "Elder";

    console.log("🚨 Emergency detected for:", elderName);

    // Get all caregivers
    const caregiversSnapshot = await admin.firestore()
        .collection("users")
        .where("role", "==", "CARE_GIVER")
        .get();

    const tokens = [];

    caregiversSnapshot.forEach(doc => {
        const token = doc.data().fcmToken;
        if (token) tokens.push(token);
    });

    if (tokens.length === 0) {
        console.log("❌ No caregiver tokens found");
        return null;
    }

    const payload = {
        notification: {
            title: "🚨 EMERGENCY ALERT",
            body: `${elderName} needs immediate help!`,
            sound: "default"
        }
    };

    await admin.messaging().sendToDevice(tokens, payload);

    console.log("✅ Notification sent successfully");
    return null;
});