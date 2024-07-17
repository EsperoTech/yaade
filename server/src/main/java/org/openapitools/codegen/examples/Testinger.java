package org.openapitools.codegen.examples;

import io.vertx.core.impl.logging.Logger;
import io.vertx.core.impl.logging.LoggerFactory;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Source;
import org.graalvm.polyglot.Value;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class Testinger {
    private final Logger logger = LoggerFactory.getLogger(ExampleGenerator.class);

    public void test() throws IOException {
        String jsFilePath = "/Users/joro/work/espero/yaade/yaade/server/my-js-project/index.js";
        String indexCode = new String(Files.readAllBytes(Paths.get(jsFilePath)));
        Source source1 = Source.newBuilder("js", indexCode, "index.js").build();

        try (Context context = Context.newBuilder().allowAllAccess(true)
                .allowAllAccess(true)
                .out(System.out)
                .build()) {

            initializeJasmine(context);

            // Evaluate the main JavaScript code
            var value = context.eval(source1).execute();

            System.out.println("Result: " + value);
        }
    }

    private static final String JASMINE = "/Users/joro/work/espero/yaade/yaade/server/my-js-project/jasmine.mjs";
    private static final String JASMINE_BOOT_0 = "/Users/joro/work/espero/yaade/yaade/server/my-js-project/boot0.js";
    private static final String JASMINE_BOOT_1 = "/Users/joro/work/espero/yaade/yaade/server/my-js-project/boot1.js";
    private static final String JS = "js";


    private boolean jasmineInitialized = false;

    /**
     * Initialize the Jasmine environment into the supplied Context.
     * <ul>
     *     <li>Create a Jasmine required variable named "global" at the Global scope</li>
     *
     *
     * </ul>
     * <p>
     * If there is any customization needed for the Jasmine environment, modify the boot1.js file.
     *
     * @param context <a href="https://www.graalvm.org/sdk/javadoc/org/graalvm/polyglot/Context.html">Context</a>
     * @return Polyglot Value representing the Jasmine environment
     */
    public Value initializeJasmine(final Context context) {

        logger.info("Setting up Jasmine Environment");

        // jasmine.js wants a global property set to "this"
        createGlobalVariables(context);

        // this sets up the jasmine environment which becomes globally available as "jasmineEnv"
        loadJasmine(context);
        loadJasmineBoot0(context);
        loadJasmineBoot1(context);

        final Value jasmine = getGlobalBindings(context).getMember("jasmine");

        if (jasmine == null || jasmine.isNull()) {
            throw new IllegalArgumentException("The 'jasmine' variable in the global scope is null");
        }

        final Value jasmineEnv = jasmine.getMember("getEnv").execute();

        if (jasmineEnv == null || jasmineEnv.isNull()) {
            throw new IllegalArgumentException("The 'jasmineEnv' variable in the global scope is null");
        }

        logger.info("Jasmine Environment Set Up Complete");

        jasmineInitialized = true;

        return jasmineEnv;
    }

    /**
     * Load a list of File Paths needed for the test. The paths can be relative, or absolute.
     *
     * @param context   <a href="https://www.graalvm.org/sdk/javadoc/org/graalvm/polyglot/Context.html">Context</a>
     * @param testFiles List of Test File paths.
     */
    public void loadTestFiles(final Context context, final List<String> testFiles) {

        isJasmineInitialized();

        logger.info("Loading Test");

        testFiles.forEach(testFile -> loadScriptString(context, testFile));

        logger.info("Loaded Test File");
    }

    /**
     * Load a file into the Context for testing. The path can be relative, or absolute.
     *
     * @param context  <a href="https://www.graalvm.org/sdk/javadoc/org/graalvm/polyglot/Context.html">Context</a>
     * @param testFile File path for file to be loaded.
     */
    public void loadTestFile(final Context context, final String testFile) {

        isJasmineInitialized();

        logger.info("Loading Test: {}");

        loadScriptString(context, testFile);

        logger.info("Loaded Test File");
    }

    /**
     * Load a script represented in the form of  String.
     *
     * @param context    <a href="https://www.graalvm.org/sdk/javadoc/org/graalvm/polyglot/Context.html">Context</a>
     * @param scriptName Name of the script
     * @param script     The script to be loaded.
     */
    public void loadScript(final Context context, final String scriptName, final String script) {

        isJasmineInitialized();

        loadScriptString(context, scriptName, script);
    }

    void loadJasmine(final Context context) {

        logger.info("Loading: " + JASMINE);

        loadScriptString(context, JASMINE);

        logger.info("Loaded File");
    }

    void loadJasmineBoot0(final Context context) {

        logger.info("Loading: " + JASMINE_BOOT_0);

        loadScriptString(context, JASMINE_BOOT_0);

        logger.info("Loaded File");
    }

    void loadJasmineBoot1(final Context context) {

        logger.info("Loading: " + JASMINE_BOOT_1);

        loadScriptString(context, JASMINE_BOOT_1);

        logger.info("Loaded File");
    }

    void loadScriptString(final Context context, final String scriptFile) {

        logger.debug("Loading File: {}");

        try {
            final File script = findFile(scriptFile);
            final String test = FileUtils.readFileToString(script, StandardCharsets.UTF_8);
            loadScriptString(context, scriptFile, test);
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }

        logger.debug("Loaded File");
    }

    void createGlobalVariables(final Context context) {

        logger.info("Creating Global Variables");

        final Value globalBindings = getGlobalBindings(context);

        final Value jasmineGlobalPrototype = globalBindings.getMember("Object");
        final Value jasmineGlobal = jasmineGlobalPrototype.newInstance();

        getGlobalBindings(context).putMember("global", jasmineGlobal);

        logger.info("Finished Creating Global Variables");
    }

    void isJasmineInitialized() {

        if (!jasmineInitialized) {
            throw new IllegalArgumentException("Jasmine has not been initialized");
        }

    }

    void loadScriptString(final Context context, final String scriptName, final String script) {

        logger.info("Loading Script: " + scriptName);
        logger.debug("Script: {}");

        try {
            final Source source = Source.newBuilder(JS, new StringReader(script), scriptName).cached(false).build();

            context.eval(source);
        } catch (final Exception e) {
            throw new RuntimeException(e);
        }

        logger.info("Loaded Script" + scriptName);
    }

    File findFile(final String filePath) {

        logger.debug("Finding File: {}");

        if (StringUtils.isBlank(filePath)) {
            logger.error("An empty File Path was supplied");
            return null;
        }

        URL fileUrl;

        if (StringUtils.startsWith(filePath, "/")) {
            fileUrl = getClass().getResource(filePath);
        } else {
            fileUrl = getClass().getClassLoader().getResource(filePath);
        }

        if (fileUrl == null) {
            String[] pathElements = StringUtils.split(filePath, File.separator);
            String firstElement = "/";

            if (!StringUtils.startsWith(filePath, File.separator)) {
                firstElement = System.getProperty("user.dir");
            }

            final Path path = Paths.get(firstElement, pathElements);

            return path.toFile();
        }

        return new File(fileUrl.getPath());
    }

    Value getGlobalBindings(final Context context) {

        return context.getBindings(JS);
    }
}
