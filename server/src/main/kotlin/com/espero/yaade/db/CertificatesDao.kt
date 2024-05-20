package com.espero.yaade.db

import com.espero.yaade.model.db.CertificateDb
import com.j256.ormlite.support.ConnectionSource

class CertificatesDao(connectionSource: ConnectionSource) :
    BaseDao<CertificateDb>(connectionSource, CertificateDb::class.java) {

    fun getAll(): List<CertificateDb> {
        return dao.queryForAll()
    }

}
