const express = require('express');
const router = express.Router();
const DiffMatchPatch = require('diff-match-patch');
const dpm = new DiffMatchPatch();

router.get('/:documentId', async(req, res, next) => {
    const db = req.app.locals.db;
    const io = req.app.locals.io;

    const documentId = req.params.documentId;
    const collectionsInDb = await db.listCollections().toArray();
    if (documentExists(documentId, collectionsInDb)) {
        const document = await db.collection(documentId).findOne();
        const documentName = document.name;
        let documentContent = document.content;
        res.render('editor', { pageTitle: documentName, editorContent: documentContent });

        io.once('connection', socket => {
            socket.join(documentId);
            
            socket.on('change document\'s name', async(newDocumentName) => {
                await db.collection(documentId).update({}, { $set: {'name': newDocumentName} });
                socket.emit('document\'s name changed');                
            });

            socket.on('ask for editing users list', () => {
                let editingUsers = Object.keys(io.sockets.adapter.rooms[documentId].sockets);
                socket.emit('show editing users', editingUsers);
            });

            // ЕСЛИ ДОБАВИТЬ ТЕКСТ ДО КАРЕТКИ, ОНА СДВИГАЕТСЯ

            socket.on('send updated content to server', async(clientPatch) => {
                socket.broadcast.to(documentId).emit('apply updates to document', clientPatch);
                const document = await db.collection(documentId).findOne();
                let documentContent = document.content.toString();
                documentContent = dpm.patch_apply(clientPatch, documentContent)[0];
                await db.collection(documentId).update({}, { $set: {'content': documentContent} });
            });
        });
    } else {
        res.render('404');
    };
});

router.post('/:documentId', async(req, res, next) => {
    const db = req.app.locals.db;
    const documentId = req.params.documentId;
    const documentName = req.body.documentName;
    await db.createCollection(documentId);
    await db.collection(documentId).insert({ 'name': documentName, 'content': ''});
    res.render('editor', { title: documentName });
});


function documentExists(documentId, collectionsInDatabase) {
    /* collection.name is document's id
    (db.createCollection(documentId))*/
    for (let collection of collectionsInDatabase)
        if (documentId == collection.name)
            return true;
    return false;
}

module.exports = router;