// Notification Service
// This service allows components to trigger notifications from anywhere in the app

class NotificationService {
  static addNotification(type, title, message, action = null) {
    // Use the global function exposed by App.jsx
    if (window.addNotification) {
      window.addNotification(type, title, message, action);
    }
  }

  // Convenience methods for different notification types
  static success(title, message, action = null) {
    this.addNotification('success', title, message, action);
  }

  static warning(title, message, action = null) {
    this.addNotification('warning', title, message, action);
  }

  static error(title, message, action = null) {
    this.addNotification('error', title, message, action);
  }

  static info(title, message, action = null) {
    this.addNotification('info', title, message, action);
  }

  // Predefined notifications for common actions
  static studentCreated(studentName) {
    this.success(
      'Student Created',
      `${studentName} has been successfully added to the system`,
      () => window.location.hash = '#students'
    );
  }

  static productCreated(productName) {
    this.success(
      'Product Added',
      `${productName} has been added to inventory`,
      () => window.location.hash = '#products'
    );
  }

  static orderCreated(orderNumber) {
    this.success(
      'Order Placed',
      `Order #${orderNumber} has been successfully created`,
      () => window.location.hash = '#orders'
    );
  }

  static invoiceCreated(invoiceNumber) {
    this.success(
      'Invoice Generated',
      `Invoice #${invoiceNumber} has been created`,
      () => window.location.hash = '#invoicing'
    );
  }

  static lowStock(productName, quantity) {
    this.warning(
      'Low Stock Alert',
      `${productName} has only ${quantity} units remaining`,
      () => window.location.hash = '#products'
    );
  }

  static orderDelayed(orderNumber) {
    this.warning(
      'Order Delayed',
      `Order #${orderNumber} delivery has been delayed`,
      () => window.location.hash = '#orders'
    );
  }

  static systemError(errorMessage) {
    this.error(
      'System Error',
      errorMessage,
      () => window.location.hash = '#settings'
    );
  }

  static bulkDeleteCompleted(type, count) {
    this.success(
      'Bulk Delete Completed',
      `Successfully deleted ${count} ${type}`,
      null
    );
  }

  static bulkDeleteFailed(type, count) {
    this.error(
      'Bulk Delete Failed',
      `Failed to delete ${count} ${type}. Please try again.`,
      null
    );
  }
}

export default NotificationService;
