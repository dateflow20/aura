
import { Todo } from "../types";

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const scheduleTaskReminders = (todos: Todo[]) => {
  if (Notification.permission !== "granted") return;

  // Clear existing check if any (we rely on the main app loop usually)
  const now = new Date().getTime();
  
  todos.forEach(todo => {
    if (todo.completed || !todo.dueDate) return;
    
    const dueTime = new Date(todo.dueDate).getTime();
    const diff = dueTime - now;

    // If due in the next 60 seconds and not already notified
    if (diff > 0 && diff < 60000) {
      setTimeout(() => {
        sendLocalNotification(todo);
      }, diff);
    }
  });
};

const sendLocalNotification = (todo: Todo) => {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      // Fix: Cast to 'any' because 'vibrate' and 'badge' may not be in the local environment's NotificationOptions type definition
      // Refactored: changed 'todo.task' to 'todo.goal' to match updated Todo type
      registration.showNotification(`AURA: Temporal Goal Due`, {
        body: todo.goal,
        icon: "https://img.icons8.com/ios-filled/512/ffffff/brain.png",
        badge: "https://img.icons8.com/ios-filled/512/ffffff/brain.png",
        vibrate: [200, 100, 200],
        tag: todo.id,
        data: { id: todo.id }
      } as any);
    });
  } else {
    // Refactored: changed 'todo.task' to 'todo.goal' to match updated Todo type
    new Notification(`AURA: Temporal Goal Due`, {
      body: todo.goal,
      icon: "https://img.icons8.com/ios-filled/512/ffffff/brain.png",
    });
  }
};
