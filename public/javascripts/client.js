const dpm = new diff_match_patch();

class Client {
    constructor(socket, documentId) {
        this.socket = socket;
        this.documentId = documentId;
    }

    sendDiffToServer() {
        const oldContent = localStorage.getItem(`old-content-${this.documentId}`);
        const newestContent = localStorage.getItem(`newest-content-${this.documentId}`); 

        if (oldContent != newestContent) {
            const patch = dpm.patch_make(oldContent, newestContent);
            this.socket.emit('send updated content to server', patch); 
            localStorage.setItem(`old-content-${this.documentId}`, newestContent);        
        };
    }
}

module.exports = Client;