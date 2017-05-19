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

module.exports = {
    getPosition: (editor) => {
        let bookmark = editor.selection.getBookmark(0);
        let selector = "[data-mce-type=bookmark]";
        let bookmarkElements = editor.dom.select(selector);
        editor.selection.select(bookmarkElements[0]);
        editor.selection.collapse();
        let elementID = "cursor";
        let positionString = '<span id="' + elementID + '"></span>';
        editor.selection.setContent(positionString);
        let content = editor.getContent({format: "html"});
        let index = content.indexOf(positionString);
        editor.dom.remove(elementID, false);
        editor.selection.moveToBookmark(bookmark);

        return index;
    },

    setPosition: (editor, index) => {
        let content = editor.getContent({format: "html"});
        let part1 = content.substr(0, index);
        let part2 = content.substr(index);
        let bookmark = editor.selection.getBookmark(0);
        let positionString = '<span id="' + bookmark.id + '_start" data-mce-type="bookmark" data-mce-style="overflow:hidden;line-height:0px"></span>';
        let contentWithString = part1 + positionString + part2;
        editor.setContent(contentWithString, ({ format: 'raw' }));
        editor.selection.moveToBookmark(bookmark);

        return bookmark;
    }
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const cursor = __webpack_require__(0);

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

/***/ })
/******/ ]);