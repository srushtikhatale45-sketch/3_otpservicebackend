const express = require('express');
const router = express.Router();

// ✅ Check Auth
router.get('/check', (req, res) => {
  res.json({
    authenticated: false,
    message: 'Auth route working'
  });
});

// ✅ Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out'
  });
});

module.exports = router;