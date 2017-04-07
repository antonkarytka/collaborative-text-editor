const express = require('express');
const router = express.Router();

router.post('/:id', (req, res, next) => {
    res.render('hello', { title: 'Document' });
});

router.get('/:id', (req, res, next) => {
    // CHECK IF DOCUMENT WITH THIS ID IS ALREADY CREATED
    // IF YES THEN
    // GET DOCUMENT OUT OF THE DATABASE AND RENDER THE PAGE
    // IF NOT THEN ERROR
    res.render('hello', { title: 'Document' });
});

module.exports = router;
