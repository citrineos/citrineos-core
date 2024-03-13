import {EventGroup} from "@citrineos/base";
import {Server} from "@citrineos/server";
import {systemConfig} from "@citrineos/server/dist/config";

new Server(
  process.env.APP_NAME as EventGroup,
  systemConfig
).run().catch((error: any) => {
  console.error(error)
  process.exit(1)
});