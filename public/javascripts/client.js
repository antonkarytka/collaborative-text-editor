const cursor = require('./cursor.js');

const socket = io.connect();

socket.on('show editing users', users => {
    let activeUsers = '';
    users.map(user => { activeUsers += `${user}<br/>` });
    swal(`Users working on "${document.title}"`, activeUsers, 'info');
});

socket.on('apply updates to document', differences => {
    let oldContent = localStorage.getItem('content');
    let newestContent = JsDiff.applyPatch(oldContent, differences);
    if (typeof(newestContent) == 'string') {
        const index = cursor.getPosition(tinymce.activeEditor);
        tinymce.activeEditor.setContent(newestContent);
        cursor.setPosition(tinymce.activeEditor, index);
        localStorage.setItem('content', newestContent);
    };
});

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
                        html: `New name: ${documentsNewName}`
                    });
                });
            }
        });

        editor.on('keyup', async(e) => {
            countChanges += 1;
            if (countChanges > 3) {
                let oldContent = localStorage.getItem('content');
                let newestContent = tinymce.activeEditor.getContent();
                const patch = JsDiff.createPatch('', oldContent, newestContent, '', '');
                socket.emit('send updated content to server', patch);
                countChanges = 0;
            };
        });
    }
});
