const express = require('express');
const router = express.Router();

const Validator = require('../classes/validator');
const Socket = require('../classes/socket');

router.get('/:documentId', async(req, res, next) => {
    const io = req.app.locals.io;
    const dbDocs = req.app.locals.dbDocs;
    const dbNicknames = req.app.locals.dbNicknames;
    const documentId = req.params.documentId;

    const validator = new Validator();

    const collectionsIndbDocs = await dbDocs.listCollections().toArray();
    const dbNicknamesObject = await dbNicknames.collection('nicknames').findOne();
    const availableAnonymousNicknames = dbNicknamesObject.animals;
            
    if (validator.documentExists(documentId, collectionsIndbDocs)) {
        const document = await dbDocs.collection(documentId).findOne();
        const documentName = document.name;
        const documentContent = document.content;
        res.render('editor', { pageTitle: documentName, editorContent: documentContent });

        io.once('connection', async(sock) => {
            const socket = new Socket(io, sock, documentId);
            await socket.joinRoom()
            await socket.setAnonymousNickname(availableAnonymousNicknames);            
            await socket.setEventHandlers(dbDocs);
        });
    } else {
        res.render('404');
    };
});

router.post('/:documentId', async(req, res, next) => {
    const io = req.app.locals.io;
    const dbDocs = req.app.locals.dbDocs;
    const dbNicknames = req.app.locals.dbNicknames;
    const documentId = req.params.documentId;
    const documentName = req.body.documentName;
    await dbDocs.createCollection(documentId);
    await dbDocs.collection(documentId).insert({ 'name': documentName, 'content': ''});
    res.render('editor', { pageTitle: documentName, editorContent: '' });

    const dbNicknamesObject = await dbNicknames.collection('nicknames').findOne();
    const availableAnonymousNicknames = dbNicknamesObject.animals;

    io.once('connection', async(sock) => {
        const socket = new Socket(io, sock, documentId);
        await socket.joinRoom()
        await socket.setAnonymousNickname(availableAnonymousNicknames);            
        await socket.setEventHandlers(dbDocs);
    });
});

module.exports = router;