package com.jr.jasmine;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This is a sample class of how to execute a test.
 */
public class JasmineRunner {

    private static final String JS = "js";

    private final Logger logger = LoggerFactory.getLogger(getClass());

    private final JasmineBuilder builder = new JasmineBuilder();

    private final Context context;
    private final Value globalBindings;
    private final Value jasmineEnv;

    public JasmineRunner() {
        context = Context.newBuilder().allowAllAccess(true).build();
        globalBindings = context.getBindings(JS);
        globalBindings.putMember("javaFunction", new JavaInteropTest());
        jasmineEnv = builder.initializeJasmine(context);
    }

    public void run(final String testFile) {

        logger.info("Executing Test");

        builder.loadTestFile(context, testFile);

        jasmineEnv.getMember("execute").execute();

        logger.info("Done Executing Test");
    }

    public void displayReport() {

        final Value report = globalBindings.getMember("jsApiReporter");

        final Value started = report.getMember("started");
        final Value finished = report.getMember("finished");
        final Value runDetails = report.getMember("runDetails");
        final Value status = report.getMember("status").execute();
        final Value jasmineStarted = report.getMember("jasmineStarted").execute();
        final Value jasmineDone = report.getMember("jasmineDone").execute();
        final Value suites = report.getMember("suites").execute();
        final Value specDone = report.getMember("specDone").execute();
        final Value specResults = report.getMember("specResults").execute();
        final Value specs = report.getMember("specs").execute();
        final Value executionTime = report.getMember("executionTime").execute();

        System.out.println("########################");
        System.out.println("#    Jasmine Report    #");
        System.out.println("########################");
        System.out.println();
        System.out.println("Started: " + started);
        System.out.println("Finished :" + finished);
        System.out.println("Run Details: " + runDetails);
        System.out.println("Status: " + status);
        System.out.println("Jasmine Started:" + jasmineStarted);
        System.out.println("Jasmine Done:" + jasmineDone);
        System.out.println("Suites: " + suites);
        System.out.println("Specs Done:" + specDone);
        System.out.println("Spec Results:" + specResults);
        System.out.println("Specs: " + specs);
        System.out.println("Execution Time:" + executionTime);
        System.out.println();
        System.out.println("########################");
        System.out.println("########################");
    }

}
