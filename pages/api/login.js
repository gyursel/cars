export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Методът не е позволен' });
  }

  try {
    const { password } = req.body;
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ success: false, error: 'Грешна парола!' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Сървърна грешка.' });
  }
}
