var mongoose = require('mongoose');
var validators = require('mongoose-validators');

var UserSchema = new mongoose.Schema({
  displayName: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    validate: validators.isEmail(),
    unique: true,
    required: true
  },
  avatarImageUrl: {
    type: String,
    validate: validators.isURL()
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  linkedProviders: {
    google: String
  }
});

module.exports = mongoose.model('User', UserSchema);
