const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');

router.get('/', async(req, res, next) => {
    const db = req.app.locals.db;
    let documentId = randomstring.generate({ length: 7, charset: 'alphanumeric', capitalization: 'lowercase' });
    await db.listCollections().toArray((err, collections) => {
        while (isDuplicate(documentId, collections)) {
            documentId = randomstring.generate({ length: 7, charset: 'alphanumeric', capitalization: 'lowercase' });
        };
    });

    res.render('index', {
        title: 'Collaborative text editor',
        newDocumentId: `/${documentId}`
    });
});

function isDuplicate(documentId, collections) {
    /* collection.name is document's id
    (db.createCollection(documentId))*/
    for (let collection of collections) {
        if (documentId == collection.name)
            return true;
    }
    return false;
}

module.exports = router;
