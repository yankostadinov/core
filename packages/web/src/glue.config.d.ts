/* eslint-disable @typescript-eslint/no-explicit-any */
import { Glue42Web } from "../web";

export interface Glue42CoreConfig {
  glue?: Glue42Web.Config;
  gateway?: any;
  channels?: Glue42Web.ChannelContext[];
}
