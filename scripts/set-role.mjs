/**
 * Asigna custom claims de rol en Firebase Auth.
 *
 * Requisitos:
 * 1) npm install (incluye firebase-admin)
 * 2) Variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON de servicio
 * 3) UID del usuario (Consola de Firebase > Authentication)
 *
 * Uso:
 *   node scripts/set-role.mjs <UID> admin
 *   node scripts/set-role.mjs <UID> operativo
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import admin from "firebase-admin";

const [, , uid, roleArg] = process.argv;

if (!uid || !roleArg) {
  console.error("Uso: node scripts/set-role.mjs <firebaseUserUid> <admin|operativo>");
  process.exit(1);
}

const role = roleArg === "admin" || roleArg === "operativo" ? roleArg : null;
if (!role) {
  console.error("El rol debe ser admin u operativo.");
  process.exit(1);
}

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("Definí GOOGLE_APPLICATION_CREDENTIALS con la ruta al JSON de servicio.");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(credPath), "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

await admin.auth().setCustomUserClaims(uid, { role });
const user = await admin.auth().getUser(uid);
console.log(`Listo. claims actuales:`, user.customClaims);
