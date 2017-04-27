const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');

router.get('/', async(req, res, next) => {
    const db = req.app.locals.db;
    let documentLink = randomstring.generate({ length: 7, charset: 'alphanumeric' });
    await db.listCollections().toArray((err, collections) => {
        while (isDuplicate(documentLink, collections))
            documentLink = randomstring.generate({ length: 7, charset: 'alphanumeric' });
    });

    res.render('index', {
        title: 'Collaborative text editor',
        documentID: `/${documentLink}`
    });
});


function isDuplicate(documentLink, collections) {
    for (let collection of collections)
        if (documentLink == collection.name)
            return true;
    return false;
}

module.exports = router;
