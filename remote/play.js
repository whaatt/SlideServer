/*
 * File: play.js
 * Type: RPC Handlers
 * Exports play handler.
 */

// For sanity.
'use strict';

// For one-shot input object validation.
const validate = require('jsonschema').validate;
const Reply = require('./replies.js');

// Response handler function.
module.exports = (client) => {
  return (data, response) => {
    // Validation schema.
    const schema = {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          required: true
        },
        URI: {
          type: 'string',
          required: true,
          minLength: 36,
          maxLength: 36
        },
        playData: {
          type: 'object',
          required: true
        },
        stream: {
          type: 'string',
          required: true
        },
        state: {
          type: 'string',
          required: true,
          pattern: /playing|paused/
        },
        seek: {
          type: 'integer',
          required: true,
          minimum: 0, // [00:00:00]
          maximum: 7200 // [02:00:00]
        }
      }
    };

    // Perform input validation.
    const result = validate(data, schema);
    if (!result.valid) // See result.errors.
      response.error(Reply.errors.validation);

    else {
      // This is the stream the user will be registering with.
      const stream = client.record.getRecord('stream/' + data.stream);

      // Wait for record.
      stream.whenReady((record) => {
        let streamData = record.get();
        streamData.seek = data.seek;
        streamData.playing = data.URI;
        streamData.playData = data.playData;
        streamData.state = data.state;

        // Set updated stream data.
        stream.set(streamData, (error) => {
          if (error) response.error(Reply.errors.server);
          else response.send(null);
        });
      });
    }
  };
};