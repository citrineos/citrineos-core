import {container} from "@citrineos/base";
import {CitrineOSServer} from "@citrineos/server";

const server = container.resolve(CitrineOSServer);
server.run().catch((error: any) => {
  console.error(error)
  process.exit(1)
});

setInterval(() => {
  logMemory();
}, 10 * 1000);

const logMemory = () => {
  console.log('[main] - log memory');
  const used: any = process.memoryUsage();
  Object.keys(used).forEach((key: any) => {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  });
}