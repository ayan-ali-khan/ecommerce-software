/** Credential verification for admin login (bcrypt hash compare). */
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { Admin } from '@/models';

export interface AdminIdentity {
  id: string;
  email: string;
}

/**
 * Returns the admin identity on success, null on unknown email/bad password
 * (same null for both — no user enumeration).
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminIdentity | null> {
  await connectDB();
  const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).lean();
  if (!admin) {
    // Constant-ish work factor even for unknown users.
    await bcrypt.compare(password, '$2a$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidh');
    return null;
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;

  void Admin.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } }).exec();
  return { id: String(admin._id), email: admin.email };
}
