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