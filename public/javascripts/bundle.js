/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

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

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const Client = __webpack_require__(0);

const documentId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);

let socket = io.connect(); // <-- From CDN
const client = new Client(socket, documentId);
const dpm = new diff_match_patch(); // <-- From CDN

let socketConnected = false;

setInterval(() => {
    if (socketConnected) {
        client.sendDiffToServer();
    };
}, 300);

socket.on('connect', () => { socketConnected = true });
socket.io.engine.on('heartbeat', () => { socketConnected = true });
socket.on('disconnect', () => { socketConnected = false });


socket.on('apply updates to document', differences => {
    const oldContent = localStorage.getItem(`newest-content-${documentId}`);
    const newestContent = dpm.patch_apply(differences, oldContent)[0];
    const bookmark = tinymce.activeEditor.selection.getBookmark(2, true);
    tinymce.activeEditor.setContent(newestContent);
    tinymce.activeEditor.selection.moveToBookmark(bookmark);
    localStorage.setItem(`old-content-${documentId}`, newestContent);
    localStorage.setItem(`newest-content-${documentId}`, newestContent);
});

socket.on('show editing users', users => {
    let activeUsers = '';
    users.map(user => { activeUsers += `${user}<br/>` });
    swal(`Users working on "${document.title}"`, activeUsers, 'info').catch(swal.noop);
});

tinymce.init({
    selector: 'textarea',
    plugins: ['fullscreen, lists'],
    toolbar: 'undo redo | fontselect fontsizeselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | emoticons | editingusers username documenttitle',
    statusbar: false,
    setup: editor => {

        editor.on('init', e => {
            this.editor = tinymce.get('editor');                   
            const content = document.getElementById('editor').value;
            localStorage.setItem(`old-content-${documentId}`, content);
            localStorage.setItem(`newest-content-${documentId}`, content);
            editor.execCommand('mceFullScreen');

            editor.on('change', async() => {
                await localStorage.setItem(`newest-content-${documentId}`, tinymce.activeEditor.getContent());
            });

            editor.on('keyup', async() => {
                await localStorage.setItem(`newest-content-${documentId}`, tinymce.activeEditor.getContent());
            });
        });

        editor.addButton('editingusers', {
            image: '/images/editing-users.png',
            tooltip: 'List of editing users',
            onclick: () => {
                socket.emit('ask for editing users list');
            }
        });

        editor.addButton('username', {
            text: 'Your name',
            tooltip: 'Change your name',
            onclick: async() => {
                const clientsNewName = await swal({
                    title: 'Enter your new name',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonText: 'Change',
                    showLoaderOnConfirm: true,
                    preConfirm: async(newName) => {
                        await socket.emit('change client\'s name', newName);
                    },
                    allowOutsideClick: true
                }).catch(swal.noop);

                socket.on('client\'s name changed', () => {
                    swal({
                        type: 'success',
                        title: 'Client\'s name has been changed!',
                        html: `New name: ${clientsNewName}`
                    });
                });

                socket.on('error changing client\'s name', () => {
                    swal({
                        type: 'error',
                        title: 'Name already in use',
                        html: `Client with the name "${clientsNewName}" is editing the document!`
                    });
                });
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
                }).catch(swal.noop);

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
    }
});


/***/ })
/******/ ]);