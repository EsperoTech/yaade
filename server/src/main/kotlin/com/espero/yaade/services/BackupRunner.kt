package com.espero.yaade.services

import com.cronutils.model.CronType
import com.cronutils.model.definition.CronDefinitionBuilder
import com.cronutils.model.time.ExecutionTime
import com.cronutils.parser.CronParser
import com.espero.yaade.db.DaoManager
import io.vertx.core.impl.logging.LoggerFactory
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait
import java.nio.file.Files
import java.nio.file.Paths
import java.time.Instant
import java.time.ZoneId

val YAADE_EXPERIMENTAL_BACKUP_CRON: String? =
    System.getenv("YAADE_EXPERIMENTAL_BACKUP_CRON")

class BackupRunner(private val daoManager: DaoManager) : CoroutineVerticle() {

    private val log = LoggerFactory.getLogger(BackupRunner::class.java)

    private var stopped = false
    private val cronParser =
        CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX))
    private lateinit var executionTime: ExecutionTime
    private var lastRun = System.currentTimeMillis()

    public override suspend fun start() {
        if (YAADE_EXPERIMENTAL_BACKUP_CRON == null) {
            return
        }
        try {
            executionTime = ExecutionTime.forCron(cronParser.parse(YAADE_EXPERIMENTAL_BACKUP_CRON))
            Files.createDirectories(Paths.get("./app/data/backup"))
        } catch (e: Throwable) {
            log.error("Failed to start backup runner", e)
            return
        }

        log.info("Backup runner started")
        while (!stopped) {
            try {
                val zdtutc = Instant.ofEpochMilli(lastRun).atZone(ZoneId.systemDefault())
                val nextExecutionOpt = executionTime.nextExecution(zdtutc)
                if (nextExecutionOpt.isEmpty) {
                    log.warn("Failed to calculate next execution")
                    continue
                }
                val nextExecution = nextExecutionOpt.get()
                val nowZoned =
                    Instant.ofEpochMilli(System.currentTimeMillis()).atZone(ZoneId.systemDefault())
                if (nowZoned.isBefore(nextExecution)) {
                    continue
                }
                log.info("Running backup")
                daoManager.dataSource.connection.use { conn ->
                    conn.prepareStatement("BACKUP TO './app/data/backup/yaade-db.mv.db'")
                        .executeUpdate()
                }
                lastRun = System.currentTimeMillis()
            } catch (e: Throwable) {
                log.error("Failed to run backup", e)
            } finally {
                vertx.timer(10_000).coAwait()
            }
        }
    }

    public override suspend fun stop() {
        stopped = true
    }
}
