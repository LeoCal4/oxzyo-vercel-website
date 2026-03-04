export function requireAdmin(token: string): void {
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    throw new Error('Unauthorized')
  }
}
