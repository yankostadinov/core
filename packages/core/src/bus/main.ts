import { Glue42Core } from "../../glue";
import ProtocolFactory from "./protocol";

const successMessages = ["subscribed", "success"];

export default (configuration: Glue42Core.Bus.Settings): Promise<Glue42Core.Bus.API> => {
  const { connection, logger } = configuration;
  const session: Glue42Core.Connection.GW3DomainSession = (connection as Glue42Core.Connection.GW3Connection).domain("bus", logger, successMessages);
  return new Promise((resolve, reject) => {
    session.join()
      .then(() => {
        const protocol = ProtocolFactory(connection, logger, session);
        resolve(protocol);
      })
      .catch(reject);
  });
};
