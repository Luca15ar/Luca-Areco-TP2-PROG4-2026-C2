/**
 * Configuración de tiempos de sesión y advertencia de inactividad.
 *
 * NOTA DE ENTREGA SPRINT 3:
 * A solicitud de la cátedra para facilitar la corrección y evaluación en vivo,
 * los tiempos se han configurado con valores reducidos:
 * - Advertencia de inactividad: 60 segundos (1 minuto)
 * - Expiración total de sesión / token: 120 segundos (2 minutos)
 *
 * Una vez finalizada la corrección del Sprint 3, estos valores deben restablecerse a:
 * - WARNING_TIME_MS = 10 * 60 * 1000 (10 minutos)
 * - EXPIRATION_TIME_MS = 15 * 60 * 1000 (15 minutos)
 */
export const SESSION_CONFIG = {
  WARNING_TIME_MS: 60 * 1000, // 1 minuto
  EXPIRATION_TIME_MS: 120 * 1000, // 2 minutos
  COUNTDOWN_SECONDS: 60, // 60 segundos de cuenta regresiva en el modal
};
