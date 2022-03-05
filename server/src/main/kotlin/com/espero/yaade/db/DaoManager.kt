package com.espero.yaade.db

import com.j256.ormlite.support.ConnectionSource

class DaoManager(connectionSource: ConnectionSource) {
    val requestDao = RequestDao(connectionSource)
    val collectionDao = CollectionDao(connectionSource)
}