package com.espero.yaade.services

import org.graalvm.polyglot.Context

class ScriptRuntimeBuilder {

    private val bundleScript: String
    private val jasmineScript: String
    private val boot0Script: String
    private val boot1Script: String

    init {
        val bundleStream = javaClass.getResourceAsStream("/bundle.js")
            ?: throw RuntimeException("bundle.js file not found")
        bundleScript = bundleStream.bufferedReader().use { it.readText() }
        val jasmineStream = javaClass.getResourceAsStream("/jasmine.js")
            ?: throw RuntimeException("jasmine.js file not found")
        jasmineScript = jasmineStream.bufferedReader().use { it.readText() }
        val boot0Stream = javaClass.getResourceAsStream("/boot0.js")
            ?: throw RuntimeException("boot0.js file not found")
        boot0Script = boot0Stream.bufferedReader().use { it.readText() }
        val boot1Stream = javaClass.getResourceAsStream("/boot1.js")
            ?: throw RuntimeException("boot1.js file not found")
        boot1Script = boot1Stream.bufferedReader().use { it.readText() }
    }

    fun initRuntime(context: Context) {
        val globalBindings = context.getBindings("js")
        val jasmineGlobalPrototype = globalBindings.getMember("Object")
        val jasmineGlobal = jasmineGlobalPrototype.newInstance()
        context.getBindings("js").putMember("global", jasmineGlobal)
        context.eval("js", bundleScript)
        context.eval("js", jasmineScript)
        context.eval("js", boot0Script)
        context.eval("js", boot1Script)
    }

}
