package com.espero.yaade.services

import org.graalvm.polyglot.Context
import org.graalvm.polyglot.Source
import org.graalvm.polyglot.Value
import java.io.InputStreamReader

class ScriptRuntimeBuilder(context: Context) {

    init {
        createGlobalVariables(context)
        loadDependencies(context)
    }

    private fun loadDependencies(context: Context) {
        loadDependency(context, "bundle.js")
        loadDependency(context, "jasmine.js")
        loadDependency(context, "boot0.js")
        loadDependency(context, "boot1.js")
    }

    private fun loadDependency(context: Context, scriptFile: String) {
        val inputStream = javaClass.getResourceAsStream("/$scriptFile")
            ?: throw RuntimeException("JavaScript file not found")
        InputStreamReader(inputStream).use { reader ->
            val source = Source.newBuilder(
                "js",
                reader,
                scriptFile
            ).cached(false).build()
            context.eval(source)
        }
    }

    private fun createGlobalVariables(context: Context) {
        val globalBindings = getGlobalBindings(context)
        val jasmineGlobalPrototype = globalBindings.getMember("Object")
        val jasmineGlobal = jasmineGlobalPrototype.newInstance()
        getGlobalBindings(context).putMember("global", jasmineGlobal)
    }

    private fun getGlobalBindings(context: Context): Value {
        return context.getBindings("js")
    }

    fun evalScript(context: Context, script: String): Value {
        return context.eval("js", script)
    }

}
