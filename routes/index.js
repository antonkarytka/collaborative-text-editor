const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');

router.get('/', (req, res, next) => {
  res.render('index', {
      title: 'Collaborative text editor',
      documentID: `/${randomstring.generate({ length: 5, charset: 'alphanumeric' })}`
  });
});

module.exports = router;
