const UserRepository = require('../repositories/user.repository');
const { AppError } = require('../middleware/errorHandler');

function registerFace(userId, descriptorJson, photoFilename) {
  UserRepository.saveFaceDescriptor(userId, descriptorJson, photoFilename);
}

function getStoredDescriptor(userId) {
  const user = UserRepository.findById(userId);
  if (!user?.face_descriptor) {
    throw new AppError('No face registered for this user', 404, { registered: false });
  }
  return { registered: true, storedDescriptor: user.face_descriptor };
}

module.exports = { registerFace, getStoredDescriptor };
