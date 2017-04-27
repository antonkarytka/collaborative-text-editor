const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');

router.get('/:id', async(req, res, next) => {
    const db = req.app.locals.db;
    let documentId = req.path.slice(1);
    let collections = await db.listCollections().toArray();
    if (collectionExists(documentId, collections)) {
        let collection = await db.collection(documentId).find().toArray();
        let name = collection[0].name;
        let content = collection[0].content;
        res.render('editor', { title: name, value: content });
    } else {
        res.render('404');
    };
});

router.post('/:id', async(req, res, next) => {
    const db = req.app.locals.db;
    let documentId = req.path.slice(1);
    let documentName = req.body.documentName;
    await db.createCollection(documentId);
    await db.collection(documentId).insert({ 'name' :  documentName, 'content' : ''});
    res.render('editor', { title: documentName });
});


function collectionExists(documentLink, collections) {
    for (let collection of collections)
        if (documentLink == collection.name)
            return true;
    return false;
}

module.exports = router;
