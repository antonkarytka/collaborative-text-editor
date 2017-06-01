const express = require('express');
const router = express.Router();
const DiffMatchPatch = require('diff-match-patch');
const Validator = require('../classes/validator');
const SocketHandler = require('../classes/socket-handler');
const dpm = new DiffMatchPatch();

router.get('/:documentId', async(req, res, next) => {
    const dbDocs = req.app.locals.dbDocs;
    const dbNicknames = req.app.locals.dbNicknames;
    const io = req.app.locals.io;
    const documentId = req.params.documentId;

    const validator = new Validator();
    const socketHandler = new SocketHandler(io, documentId);        

    const collectionsIndbDocs = await dbDocs.listCollections().toArray();
    const dbNicknamesObject = await dbNicknames.collection('nicknames').findOne();
    const anonymousNicknames = dbNicknamesObject.animals;
            
    if (validator.documentExists(documentId, collectionsIndbDocs)) {
        const document = await dbDocs.collection(documentId).findOne();
        const documentName = document.name;
        const documentContent = document.content;
        res.render('editor', { pageTitle: documentName, editorContent: documentContent });

        io.once('connection', async(socket) => {
            socket.join(documentId);

            const anonymousNickname = await socketHandler.generateAnonymousNickname(anonymousNicknames);
            socket.nickname = `Unknown ${anonymousNickname}`;

            socket.on('change client\'s name', async(newClientName) => {
                const usersNicknames = await socketHandler.getEditingUsersNicknames();
                if (usersNicknames.includes(newClientName)) {
                    socket.emit('error changing client\'s name');                
                } else {
                    socket.nickname = newClientName;
                    socket.emit('client\'s name changed');                
                }
            });

            socket.on('change document\'s name', async(newDocumentName) => {
                await dbDocs.collection(documentId).update({}, { $set: {'name': newDocumentName} });
                socket.emit('document\'s name changed');                
            });

            socket.on('ask for editing users list', async() => {
                const usersNicknames = await socketHandler.getEditingUsersNicknames();                
                socket.emit('show editing users', usersNicknames);
            });

            socket.on('send updated content to server', async(clientPatch) => {
                socket.broadcast.to(documentId).emit('apply updates to document', clientPatch);
                const document = await dbDocs.collection(documentId).findOne();
                let documentContent = document.content.toString();
                documentContent = dpm.patch_apply(clientPatch, documentContent)[0];
                await dbDocs.collection(documentId).update({}, { $set: {'content': documentContent} });
            });
        });
    } else {
        res.render('404');
    };
});

router.post('/:documentId', async(req, res, next) => {
    const dbDocs = req.app.locals.dbDocs;
    const documentId = req.params.documentId;
    const documentName = req.body.documentName;
    await dbDocs.createCollection(documentId);
    await dbDocs.collection(documentId).insert({ 'name': documentName, 'content': ''});
    res.render('editor', { title: documentName });
});

module.exports = router;