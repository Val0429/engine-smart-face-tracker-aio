export default require(`./../../build/${typeof global.v8debug === "object" ? "Debug" : "Release"}/valxnet`);
