class Validator {

    documentExists(documentId, collectionsInDatabase) {
        /* collection.name is document's id
        (dbDocs.createCollection(documentId))*/
        for (let collection of collectionsInDatabase)
            if (documentId == collection.name)
                return true;
        return false;
    }
}

module.exports = Validator;