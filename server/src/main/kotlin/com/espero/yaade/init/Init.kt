package com.espero.yaade.init

import com.espero.yaade.db.DaoManager

fun createDaoManager(jdbcUrl: String, jdbcUser: String, jdbcPwd: String): DaoManager {
    val daoManager = DaoManager()
    daoManager.init(jdbcUrl, jdbcUser, jdbcPwd)
    return daoManager
}
