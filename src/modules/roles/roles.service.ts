import { findSystemRoles } from "./roles.repository.js";

export async function getSystemRoles() {
  return findSystemRoles();
}