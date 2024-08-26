package com.espero.yaade.services

import com.jr.jasmine.JasmineBuilder
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Value
import java.io.InputStream

class ScriptRunner(private val requestSender: RequestSender) {

    private val indexFile: String

    init {
        val inputStream: InputStream = javaClass.getResourceAsStream("/index.js")
            ?: throw IllegalArgumentException("File not found in resources")
        indexFile = inputStream.bufferedReader().use { it.readText() }
    }

    fun run(script: String) {
        val actualScript = indexFile.format(script)
        val builder = JasmineBuilder()
        val context: Context = Context.newBuilder().allowAllAccess(true).build()
        val globalBindings: Value = context.getBindings("js")
        globalBindings.putMember("requestSender", requestSender)
        val jasmineEnv = builder.initializeJasmine(context)
        builder.evalScript(context, actualScript)
        jasmineEnv.getMember("execute").execute()
        displayReport(globalBindings)
    }

    private fun displayReport(globalBindings: Value) {
        val report = globalBindings.getMember("jsApiReporter")
        val started = report.getMember("started")
        val finished = report.getMember("finished")
        val runDetails = report.getMember("runDetails")
        val status = report.getMember("status").execute()
        val jasmineStarted = report.getMember("jasmineStarted").execute()
        val jasmineDone = report.getMember("jasmineDone").execute()
        val suites = report.getMember("suites").execute()
        val specDone = report.getMember("specDone").execute()
        val specResults = report.getMember("specResults").execute()
        val specs = report.getMember("specs").execute()
        val executionTime = report.getMember("executionTime").execute()
        println("########################")
        println("#    Jasmine Report    #")
        println("########################")
        println()
        println("Started: $started")
        println("Finished :$finished")
        println("Run Details: $runDetails")
        println("Status: $status")
        println("Jasmine Started:$jasmineStarted")
        println("Jasmine Done:$jasmineDone")
        println("Suites: $suites")
        println("Specs Done:$specDone")
        println("Spec Results:$specResults")
        println("Specs: $specs")
        println("Execution Time:$executionTime")
        println()
        println("########################")
        println("########################")
    }
}
