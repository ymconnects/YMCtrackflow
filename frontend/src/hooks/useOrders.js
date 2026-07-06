// useOrders.js
// Thin re-export so existing pages (Dashboard, Orders) keep importing
// useOrders from here unchanged, while actually sharing one cached copy
// of the orders list via OrdersContext instead of each fetching their own.

export { useOrdersContext as default } from '../context/OrdersContext'
