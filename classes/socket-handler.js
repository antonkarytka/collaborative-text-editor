class SocketHandler {
    
    constructor(io, roomId) {
        this.io = io;
        this.roomId = roomId;
    }

    async getEditingUsersNicknames() {
        const usersIds = Object.keys(this.io.sockets.adapter.rooms[this.roomId].sockets); 
        let usersNicknames = []; 
        usersIds.map(userId => { usersNicknames.push(this.io.sockets.connected[userId].nickname) });

        return usersNicknames;
    }

    async generateAnonymousNickname(anonymousNicknames) {
        const usersIds = Object.keys(this.io.sockets.adapter.rooms[this.roomId].sockets); 
        let usersNicknames = []; 
        usersIds.map(userId => { usersNicknames.push(this.io.sockets.connected[userId].nickname) });
        let anonymousNickname = anonymousNicknames[Math.floor(Math.random() * anonymousNicknames.length)];            
        while (usersNicknames.includes(anonymousNickname)) {
            anonymousNickname = anonymousNicknames[Math.floor(Math.random() * anonymousNicknames.length)];
        };

        return anonymousNickname;
    }
}

module.exports = SocketHandler;