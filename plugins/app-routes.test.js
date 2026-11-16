const fs = require("fs");
const path = require("path");

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesIn(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

it("dado que Expo Router toma como pantalla todo archivo de src/app, entonces no hay tests ahí (el build de la app los metería y fallaría)", () => {
  const tests = filesIn(path.join(__dirname, "..", "src", "app")).filter((f) => /\.test\.[jt]sx?$/.test(f));
  expect(tests.map((f) => path.relative(path.join(__dirname, ".."), f))).toEqual([]);
});
