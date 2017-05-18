const express = require('express');
const router = express.Router();
const diff = require('diff');

router.get('/:documentId', async(req, res, next) => {
    const db = req.app.locals.db;
    const io = req.app.locals.io;
    let documentId = req.params.documentId;
    let documentNamespace = io.of(`/${documentId}`);
    let documentsInDb = await db.listCollections().toArray();
    if (documentExists(documentId, documentsInDb)) {
        let document = await db.collection(documentId).find().toArray();
        let name = document[0].name;
        let content = document[0].content;
        res.render('editor', { title: name, value: content });

        documentNamespace.on('connection', socket => {
            socket.on('ask for editing users list', async() => {
                let users = await Object.keys(documentNamespace.sockets);
                socket.emit('show editing users', users);
            });

            socket.on('send updated content to server', async(newContent) => {
                await db.collection(documentId).update({ 'name': name }, { $set: {'content': newContent} });
                let differences = await diff.createPatch('', content, newContent, '', '');
                documentNamespace.emit('apply updates to document', differences);
            });
        });
    } else {
        res.render('404');
    };
});

router.post('/:documentId', async(req, res, next) => {
    const db = req.app.locals.db;
    let documentId = req.params.documentId;
    let documentName = req.body.documentName;
    await db.createCollection(documentId);
    await db.collection(documentId).insert({ 'name': documentName, 'content': ''});
    res.render('editor', { title: documentName });
});


function documentExists(documentId, documentsInDatabase) {
    for (let document of documentsInDatabase)
        if (documentId == document.name)
            return true;
    return false;
}

module.exports = router;
