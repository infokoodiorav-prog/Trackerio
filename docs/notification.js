let notificationsReady = false;
let timerNotificationId = 1001;

async function initNotifications() {
  const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;

  if (!LocalNotifications) {
    console.error("LocalNotifications plugin puudub.");
    return false;
  }

  try {
    const permission = await LocalNotifications.checkPermissions();

    if (permission.display !== "granted") {
      const result = await LocalNotifications.requestPermissions();

      if (result.display !== "granted") {
        console.log("Notification permission denied.");
        return false;
      }
    }

    await LocalNotifications.createChannel({
      id: "timer",
      name: "Timer",
      description: "TrackerIO timer notifications",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
    });

    notificationsReady = true;

    console.log("Notifications valmis.");

    return true;
  } catch (error) {
    console.error("Notificationide seadistamine ebaõnnestus:", error);
    return false;
  }
}

async function scheduleTimerNotification(
  seconds,
  title = "PUHKUS LÄBI",
  body = "Jätka järgmise seeriaga 💪",
) {
  const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;

  if (!LocalNotifications || !notificationsReady) {
    return;
  }

  if (!seconds || seconds <= 0) {
    return;
  }

  try {
    await cancelTimerNotification();

    const at = new Date(Date.now() + seconds * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: timerNotificationId,
          title,
          body,
          channelId: "timer",
          schedule: {
            at,
            allowWhileIdle: true,
          },
        },
      ],
    });

    console.log("Timer notification planeeritud:", at.toLocaleTimeString());
  } catch (error) {
    console.error("Timer notificationi planeerimine ebaõnnestus:", error);
  }
}

async function cancelTimerNotification() {
  const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;

  if (!LocalNotifications) {
    return;
  }

  try {
    await LocalNotifications.cancel({
      notifications: [
        {
          id: timerNotificationId,
        },
      ],
    });
  } catch (error) {
    console.error("Timer notificationi tühistamine ebaõnnestus:", error);
  }
}
