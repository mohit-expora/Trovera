export type UserRole = "super_admin" | "librarian" | "member";

export const PERMISSION_CODES = {
  // Page level
  PAGE_BOOKS: "page:books:view",
  PAGE_TRANSACTIONS: "page:transactions:view",
  PAGE_MEMBERS: "page:members:view",
  PAGE_FINES: "page:fines:view",
  PAGE_ROLES: "page:roles:view",
  PAGE_SETTINGS: "page:settings:view",
  // Books API
  BOOKS_CREATE: "books:create",
  BOOKS_READ: "books:read",
  BOOKS_UPDATE: "books:update",
  BOOKS_DELETE: "books:delete",
  // Books UI
  BOOKS_CREATE_CTA: "books:create:cta",
  BOOKS_EDIT_CTA: "books:edit:cta",
  BOOKS_DELETE_CTA: "books:delete:cta",
  BOOKS_SHELF_FIELD: "books:shelf_location:field",
  // Transactions API
  TRANSACTIONS_ISSUE: "transactions:issue",
  TRANSACTIONS_RETURN: "transactions:return",
  TRANSACTIONS_LIST: "transactions:list",
  TRANSACTIONS_READ: "transactions:read",
  // Transactions UI
  TRANSACTIONS_ISSUE_CTA: "transactions:issue:cta",
  TRANSACTIONS_RETURN_CTA: "transactions:return:cta",
  // Fines API
  FINES_PAY: "fines:pay",
  FINES_WAIVE: "fines:waive",
  // Fines UI
  FINES_PAY_CTA: "fines:pay:cta",
  FINES_WAIVE_CTA: "fines:waive:cta",
  // Users
  USERS_ROLE_FIELD: "users:role:field",
  USERS_PHONE_FIELD: "users:phone:field",
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];
