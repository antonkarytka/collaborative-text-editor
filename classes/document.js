class Document {

    constructor(io, roomId) {
        this.io = io;
        this.roomId = roomId;
    };

    async getEditingUsersNicknames() {
        const usersIds = Object.keys(this.io.sockets.adapter.rooms[this.roomId].sockets); 
        let usersNicknames = []; 
        usersIds.map(userId => usersNicknames.push(this.io.sockets.connected[userId].nickname));

        return usersNicknames;
    };
}

module.exports = Document;