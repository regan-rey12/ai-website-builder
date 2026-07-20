function extractContactInfoFromDescription(description = '') {
  const info = {
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
  };

  const lines = description.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const mPhone = trimmed.match(/^phone\s*:\s*(.+)$/i);
    const mWhats = trimmed.match(/^whatsapp\s*:\s*(.+)$/i);
    const mEmail = trimmed.match(/^email\s*:\s*(.+)$/i);
    const mAddr = trimmed.match(/^address\s*:\s*(.+)$/i);

    if (mPhone) info.phone = mPhone[1].trim();
    if (mWhats) info.whatsapp = mWhats[1].trim();
    if (mEmail) info.email = mEmail[1].trim();
    if (mAddr) info.address = mAddr[1].trim();
  }

  return info;
}

module.exports = { extractContactInfoFromDescription };
