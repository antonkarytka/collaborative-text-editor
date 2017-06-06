const DiffMatchPatch = require('diff-match-patch');
const dpm = new DiffMatchPatch();

const Document = require('../classes/document');

class Socket {

    constructor(io, socket, roomId) {
        this.io = io;
        this.socket = socket;
        this.roomId = roomId;
    };

    async joinRoom() {
        this.socket.join(this.roomId);
    };

    async setAnonymousNickname(anonymousNicknames) {
        const usersIds = Object.keys(this.io.sockets.adapter.rooms[this.roomId].sockets); 
        let usersNicknames = []; 
        usersIds.map(userId => usersNicknames.push(this.io.sockets.connected[userId].nickname));
        let anonymousNickname = anonymousNicknames[Math.floor(Math.random() * anonymousNicknames.length)];            
        while (usersNicknames.includes(anonymousNickname)) {
            anonymousNickname = anonymousNicknames[Math.floor(Math.random() * anonymousNicknames.length)];
        };

        this.socket.nickname = `Unknown ${anonymousNickname}`;
    };

    async setEventHandlers(dbDocs) {
        this.socket.on('change client\'s name', async(newClientName) => {
            const document = new Document(this.io, this.roomId);
            const usersNicknames = await document.getEditingUsersNicknames();
            if (usersNicknames.includes(newClientName)) {
                this.socket.emit('error changing client\'s name');                
            } else {
                this.socket.nickname = newClientName;
                this.socket.emit('client\'s name changed');                
            }
        });

        this.socket.on('change document\'s name', async(newDocumentName) => {
            await dbDocs.collection(this.roomId).update({}, { $set: {'name': newDocumentName} });
            this.socket.emit('document\'s name changed');                
        });

        this.socket.on('ask for editing users list', async() => {
            const document = new Document(this.io, this.roomId);
            const usersNicknames = await document.getEditingUsersNicknames();
            this.socket.emit('show editing users', usersNicknames);
        });

        this.socket.on('send updated content to server', async(clientPatch) => {
            this.socket.broadcast.to(this.roomId).emit('apply updates to document', clientPatch);
            const document = await dbDocs.collection(this.roomId).findOne();
            let documentContent = document.content.toString();
            documentContent = dpm.patch_apply(clientPatch, documentContent)[0];
            await dbDocs.collection(this.roomId).update({}, { $set: {'content': documentContent} });
        });
    }
 
}

module.exports = Socket;