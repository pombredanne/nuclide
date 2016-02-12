'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {
  denodeify,
  findNearestFile,
} from '../../commons';
const logger = require('../../logging').getLogger();
const which = denodeify(require('which'));

const HACK_CONFIG_FILE_NAME = '.hhconfig';
const PATH_TO_HH_CLIENT = 'hh_client';

// Kick this off early, so we don't need to repeat this on every call.
// We don't have a way of changing the path on the dev server after a
// connection is made so this shouldn't change over time.
// Worst case scenario is requiring restarting Nuclide after changing the hh_client path.
const DEFAULT_HACK_COMMAND: Promise<string> = findHackCommand();
let hackCommand = DEFAULT_HACK_COMMAND;

let useConnection = false;

/**
* If this returns null, then it is not safe to run hack.
*/
export function findHackConfigDir(localFile: string): Promise<?string> {
  return findNearestFile(HACK_CONFIG_FILE_NAME, localFile);
}

// Returns the empty string on failure
async function findHackCommand(): Promise<string> {
  let foundHackCommand;
  try {
    foundHackCommand = await which(PATH_TO_HH_CLIENT);
  } catch (error) {
    foundHackCommand = '';
  }
  return foundHackCommand;
}

export function setHackCommand(newHackCommand: string): void {
  if (newHackCommand === '') {
    logger.debug('Resetting to default hh_client');
    hackCommand = DEFAULT_HACK_COMMAND;
  } else {
    logger.debug(`Using custom hh_client: ${newHackCommand}`);
    hackCommand = Promise.resolve(newHackCommand);
  }
}

export function getHackCommand(): Promise<string> {
  return hackCommand;
}

export async function getHackExecOptions(
  localFile: string
): Promise<?{hackRoot: string, hackCommand: string}> {
  const [currentHackCommand, hackRoot] = await Promise.all([
    hackCommand,
    findHackConfigDir(localFile),
  ]);
  if (hackRoot && currentHackCommand) {
    return {hackRoot, hackCommand: currentHackCommand};
  } else {
    return null;
  }
}

export function setUseIde(useIdeConnection: boolean): void {
  useConnection = useIdeConnection;
}

export function getUseIde(): boolean {
  return useConnection;
}
