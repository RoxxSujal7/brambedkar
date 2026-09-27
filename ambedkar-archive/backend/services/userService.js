const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const cryptoUtil = require('../utils/cryptoUtil');
const User = require('../models/User');

const inMemoryUsers = new Map();

// Seed initial in-memory accounts for offline / development resilience (with SHA-256 pre-hashing)
(async () => {
  try {
    const hashVisitor = await cryptoUtil.hashPassword('Visitor@1234', 10);
    const hashResearcher = await cryptoUtil.hashPassword('Research@1234', 10);
    const hashEditor = await cryptoUtil.hashPassword('Editor@1234', 10);
    const hashArchivist = await cryptoUtil.hashPassword('Archivist@1234', 10);
    const hashAdmin = await cryptoUtil.hashPassword('Admin@1234', 10);
    const hashSuperAdmin = await cryptoUtil.hashPassword('SuperAdmin@1234', 10);

    inMemoryUsers.set('visitor@ambedkar-archive.in', {
      _id: 'mock-user-visitor-000',
      name: 'Public Visitor',
      email: 'visitor@ambedkar-archive.in',
      password: hashVisitor,
      role: 'visitor',
      language: 'en',
      institution: 'General Public',
      avatar: '',
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });

    inMemoryUsers.set('researcher@ambedkar-archive.in', {
      _id: 'mock-user-researcher-001',
      name: 'Archival Researcher',
      email: 'researcher@ambedkar-archive.in',
      password: hashResearcher,
      role: 'researcher',
      language: 'en',
      institution: 'Ambedkar Heritage Foundation',
      avatar: '',
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });

    inMemoryUsers.set('editor@ambedkar-archive.in', {
      _id: 'mock-user-editor-003',
      name: 'Content Editor',
      email: 'editor@ambedkar-archive.in',
      password: hashEditor,
      role: 'content_editor',
      language: 'en',
      institution: 'DAIC Editorial Board',
      avatar: '',
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });

    inMemoryUsers.set('archivist@ambedkar-archive.in', {
      _id: 'mock-user-archivist-004',
      name: 'Senior Archivist',
      email: 'archivist@ambedkar-archive.in',
      password: hashArchivist,
      role: 'archivist',
      language: 'en',
      institution: 'Dr. Ambedkar International Centre',
      avatar: '',
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });

    inMemoryUsers.set('admin@ambedkar-archive.in', {
      _id: 'mock-user-admin-002',
      name: 'Archive Administrator',
      email: 'admin@ambedkar-archive.in',
      password: hashAdmin,
      role: 'admin',
      language: 'en',
      institution: 'National Archives',
      avatar: '',
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });

    inMemoryUsers.set('superadmin@ambedkar-archive.in', {
      _id: 'mock-user-superadmin-005',
      name: 'Super Administrator',
      email: 'superadmin@ambedkar-archive.in',
      password: hashSuperAdmin,
      role: 'super_admin',
      language: 'en',
      institution: 'DAIC Technology Governance Council',
      avatar: '',
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    });
  } catch (e) {
    console.error('Error initializing demo in-memory users:', e);
  }
})();

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

async function findByEmail(email, includePassword = false) {
  const normalized = (email || '').toLowerCase().trim();
  if (isDbConnected()) {
    try {
      const q = User.findOne({ email: normalized });
      if (includePassword) q.select('+password');
      const doc = await q.exec();
      if (doc) return doc;
    } catch (e) {
      // fallback to memory
    }
  }

  const memUser = inMemoryUsers.get(normalized);
  if (!memUser) return null;

  return {
    ...memUser,
    comparePassword: async function (candidate) {
      return await cryptoUtil.comparePassword(candidate, memUser.password);
    },
    updateActivity: async function () {
      memUser.lastActiveAt = new Date();
      return true;
    },
  };
}

async function findById(id) {
  if (isDbConnected()) {
    try {
      const doc = await User.findById(id).select('-password');
      if (doc) return doc;
    } catch (e) {
      // fallback to memory
    }
  }

  for (const u of inMemoryUsers.values()) {
    if (u._id === id || String(u._id) === String(id)) {
      return u;
    }
  }
  return null;
}

async function createUser({ name, email, password, phone = '', role = 'visitor', language = 'en', institution = '', avatar = '', authProvider = 'local', googleId = '', email_verified = false, phone_verified = false }) {
  const normalized = (email || '').toLowerCase().trim();
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');

  if (isDbConnected()) {
    try {
      return await User.create({
        name,
        email: normalized,
        password,
        phone: cleanPhone,
        role,
        language,
        institution,
        avatar,
        authProvider,
        googleId,
        email_verified,
        phone_verified,
      });
    } catch (e) {
      // fallback to memory
    }
  }

  const hashedPassword = await cryptoUtil.hashPassword(password, 12);
  const id = 'user-' + crypto.randomBytes(8).toString('hex');
  const user = {
    _id: id,
    name,
    email: normalized,
    phone: cleanPhone,
    password: hashedPassword,
    role,
    language,
    institution,
    avatar,
    authProvider,
    googleId,
    email_verified,
    phone_verified,
    isActive: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    comparePassword: async function (candidate) {
      return await cryptoUtil.comparePassword(candidate, hashedPassword);
    },
    updateActivity: async function () {
      user.lastActiveAt = new Date();
      return true;
    },
  };

  inMemoryUsers.set(normalized || cleanPhone, user);
  return user;
}

async function findByPhone(phone, includePassword = false) {
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  if (!cleanPhone) return null;

  // Prepare search candidates (e.g., "+919876543210", "9876543210")
  const candidates = [cleanPhone];
  if (cleanPhone.startsWith('+91') && cleanPhone.length === 13) {
    candidates.push(cleanPhone.slice(3));
  } else if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
    candidates.push('+91' + cleanPhone);
  }

  if (isDbConnected()) {
    try {
      const q = User.findOne({ phone: { $in: candidates } });
      if (includePassword) q.select('+password');
      const doc = await q.exec();
      if (doc) return doc;
    } catch (e) {
      // fallback
    }
  }

  for (const u of inMemoryUsers.values()) {
    if (u.phone && candidates.includes(u.phone)) {
      return {
        ...u,
        comparePassword: async function (candidate) {
          return await cryptoUtil.comparePassword(candidate, u.password);
        },
        updateActivity: async function () {
          u.lastActiveAt = new Date();
          return true;
        },
      };
    }
  }
  return null;
}

async function updateUser(id, updates) {
  if (isDbConnected()) {
    try {
      return await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    } catch (e) {
      // fallback
    }
  }

  for (const u of inMemoryUsers.values()) {
    if (u._id === id || String(u._id) === String(id)) {
      Object.assign(u, updates);
      return u;
    }
  }
  return null;
}

async function updatePassword(email, newPassword) {
  const normalized = (email || '').toLowerCase().trim();
  if (isDbConnected()) {
    try {
      const user = await User.findOne({ email: normalized });
      if (user) {
        user.password = newPassword;
        user.passwordChangedAt = new Date();
        await user.save();
        return true;
      }
    } catch (e) {
      // fallback to memory
    }
  }

  const memUser = inMemoryUsers.get(normalized);
  if (memUser) {
    const hashed = await cryptoUtil.hashPassword(newPassword, 12);
    memUser.password = hashed;
    memUser.passwordChangedAt = new Date();
    return true;
  }
  return false;
}

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  createUser,
  updateUser,
  updatePassword,
  isDbConnected,
};
