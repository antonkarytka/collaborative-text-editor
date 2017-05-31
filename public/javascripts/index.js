const Client = require('./client');

const socket = io.connect();
const client = new Client(socket);
const dpm = new diff_match_patch();

setInterval(() => {
    client.sendDiffToServer();
}, 300);

socket.on('apply updates to document', differences => {
    const oldContent = localStorage.getItem('newest-content');
    const newestContent = dpm.patch_apply(differences, oldContent)[0];
    const bookmark = tinymce.activeEditor.selection.getBookmark(2, true);
    tinymce.activeEditor.setContent(newestContent);
    tinymce.activeEditor.selection.moveToBookmark(bookmark);
    localStorage.setItem('old-content', newestContent);
    localStorage.setItem('newest-content', newestContent);
});

socket.on('show editing users', users => {
    let activeUsers = '';
    users.map(user => { activeUsers += `${user}<br/>` });
    swal(`Users working on "${document.title}"`, activeUsers, 'info');
});

tinymce.init({
    selector: 'textarea',
    plugins: ['fullscreen, lists'],
    toolbar: 'undo redo | fontselect fontsizeselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | emoticons | editingusers documenttitle',
    statusbar: false,
    setup: editor => {
        let editorInitialized = false;

        editor.on('init', e => {
            editorInitialized = true;
            this.editor = tinymce.get('editor');                   
            const content = document.getElementById('editor').value;
            localStorage.setItem('old-content', content);
            localStorage.setItem('newest-content', content);
            editor.execCommand('mceFullScreen');
        });

        editor.addButton('editingusers', {
            image: '/images/editing-users.png',
            tooltip: 'List of editing users',
            onclick: () => {
                socket.emit('ask for editing users list');
            }
        });

        editor.addButton('documenttitle', {
            text: 'Document\'s name',
            tooltip: 'Edit document\'s name',
            onclick: async() => {
                const documentsNewName = await swal({
                    title: 'Enter document\'s new name',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonText: 'Change',
                    showLoaderOnConfirm: true,
                    preConfirm: async(newName) => {
                        await socket.emit('change document\'s name', newName);
                    },
                    allowOutsideClick: true
                });

                socket.on('document\'s name changed', () => {
                    document.title = documentsNewName;
                    swal({
                        type: 'success',
                        title: 'Document\'s name has been changed!',
                        html: `New name: ${documentsNewName}`
                    });
                });
            }
        });

        editor.on('change', () => {
            if (editorInitialized)
                localStorage.setItem('newest-content', tinymce.activeEditor.getContent());
        });

        editor.on('keyup', () => {
            if (editorInitialized)
                localStorage.setItem('newest-content', tinymce.activeEditor.getContent());
        });
    }
});
