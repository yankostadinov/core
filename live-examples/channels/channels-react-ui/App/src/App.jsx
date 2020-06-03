import React, { useContext, useState } from "react";
import { GlueContext, useGlue } from '@glue42/react-hooks';
import { NO_CHANNEL_VALUE } from './constants';
import ChannelSelectorWidget from './ChannelSelectorWidget';

function App() {
  const glue = useContext(GlueContext);
  const [channelNavigationMessages, setChannelNavigationMessages] = useState([]);

  // Get the channel names and colors using the Channels API.
  const getChannelNamesAndColors = async glue => {
    const channelContexts = await glue.channels.list();
    const channelNamesAndColors = channelContexts.map(channelContext => ({
      name: channelContext.name,
      color: channelContext.meta.color
    }));
    return channelNamesAndColors;
  };

  // Join the given channel (or leave the current channel if NO_CHANNEL_VALUE is selected).
  const joinChannel = glue => async ({ value: channelName }) => {
    const myChannel = glue.channels.my();
    let newMessage;

    if (channelName === NO_CHANNEL_VALUE) {
      if (myChannel) {
        try {
          await glue.channels.leave();
          newMessage = `Left channel: ${myChannel}.`;
        } catch (error) {
          newMessage = `Failed to leave current channel: ${myChannel}.`;
        }
      }
    } else {
      try {
        await glue.channels.join(channelName);
        newMessage = `Joined channel: ${channelName}.`;
      } catch (error) {
        newMessage = `Failed to join channel: ${channelName}.`;
      }
    }

    const date = new Date();
    const messageTimeStamp = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;

    setChannelNavigationMessages((channelNavigationMessages) => {
      return [
        {
          message: newMessage,
          timeStamp: messageTimeStamp
        },
        ...channelNavigationMessages
      ];
    });
  };

  // Get the channel names and colors and pass them as props to the ChannelSelectorWidget component.
  const channelNamesAndColors = useGlue(getChannelNamesAndColors);
  // The callback that will join the newly selected channel. Pass it as props to the ChannelSelectorWidget component to be called whenever a channel is selected.
  const onChannelSelected = useGlue(joinChannel);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-2">
          {!glue && (
            <span id="glueSpan" className="badge badge-warning">
              Glue is unavailable
            </span>
          )}
          {glue && (
            <span id="glueSpan" className="badge badge-success">
              Glue is available
            </span>
          )}
        </div>
        <div className="col-md-8">
          <h1 className="text-center">Glue42 Core Channels React UI</h1>
        </div>
        <div className="col-md-2 align-self-center">
          <ChannelSelectorWidget
            channelNamesAndColors={channelNamesAndColors}
            onChannelSelected={onChannelSelected}
          />
        </div>
      </div>
      {
        channelNavigationMessages.map(({ message, timeStamp }, index) => {
          return (
            <div key={index}>{message} <span>{timeStamp}</span></div>
          );
        })
      }
    </div>
  );
}

export default App;
