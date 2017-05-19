const cursor = require('./cursor.js');

const documentId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
const socket = io.connect(`/${documentId}`);

tinymce.init({
    selector: 'textarea',
    plugins: ['fullscreen, lists'],
    toolbar: 'undo redo | fontselect fontsizeselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | emoticons | editingusers documenttitle',
    statusbar: false,
    setup: (editor) => {
        let countChanges = 0;
        
        editor.on('init', (e) => {
            const content = document.getElementById('editor').value;
            localStorage.setItem('content', content);

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
                        html: 'New name: ' + documentsNewName
                    });
                });
            }
        });

        editor.on('keyup', (e) => {
            localStorage.setItem('content', tinymce.activeEditor.getContent());
            countChanges += 1;
            if (countChanges == 3) {
                socket.emit('send updated content to server', localStorage.getItem('content'));
                countChanges = 0;
            };
        });
    }
});

socket.on('show editing users', users => {
    let activeUsers = '';
    users.map(user => { activeUsers += `${user}<br/>` });
    swal(`Users working on "${document.title}"`, activeUsers, 'info');
});

socket.on('apply updates to document', differences => {
    let newestContent = localStorage.getItem('content');
    JsDiff.applyPatch(newestContent, differences);
    const index = cursor.getPosition(tinymce.activeEditor);
    tinymce.activeEditor.setContent(newestContent);
    cursor.setPosition(tinymce.activeEditor, index);
    localStorage.setItem('content', newestContent);
});