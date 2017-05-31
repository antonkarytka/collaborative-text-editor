const dpm = new diff_match_patch();

class Client {
    constructor(socket) {
        this.socket = socket;
    }

    sendDiffToServer() {
        const oldContent = localStorage.getItem('old-content');
        const newestContent = localStorage.getItem('newest-content'); 

        if (oldContent != newestContent) {
            const patch = dpm.patch_make(oldContent, newestContent);
            this.socket.emit('send updated content to server', patch); 
            localStorage.setItem('old-content', newestContent);        
        };
    }
}

module.exports = Client;