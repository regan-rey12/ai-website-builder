const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  templateId: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  settings: {
    primaryColor: { type: String, default: '#2563eb' },
    fontFamily: { type: String, default: 'modern' },
  },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Website', websiteSchema);
