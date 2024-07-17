
async function exec(a) {
    return new Promise((resolve, reject) => {
        resolve();
    });
}

(async function() {
try{
    console.log(jsonpath.value({"a": "b"}, "$.a"));
    console.log(javaFunction.test())
    const now = DateTime.now();
    console.log(now.toString());
} catch(e) {
    console.log(e);
}
const x = await exec("http://google.de");
describe("Integration Test Describe", function () {
    it("Integration Test Spec", function () {
        expect(true).toBe(true);
    });

    it("testinger", function () {
        expect(true).toBe(true);
    });
});

describe("Integration Test ASDSADSD", function () {
    it("Integration Test Spec", function () {
        expect(true).toBe(true);
    });

    it("testinger", function () {
        expect(true).toBe(true);
    });
});
})();
