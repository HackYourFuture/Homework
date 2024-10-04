import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fg from 'fast-glob';

import { computeHash } from './compliance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EXERCISE_MAP_PATH = path
  .join(__dirname, '../../exercises.json')
  .replaceAll(/\\/g, '/');

export type ExerciseHashes = {
  [module: string]: { [week: string]: { [exercise: string]: string } };
};

export function sealExercises() {
  const exerciseMap: ExerciseHashes = {};

  // Look for file and folder names that match the expected structure.
  // Windows paths are converted to POSIX paths to ensure compatibility.
  const posixFileSpec = path
    .join(__dirname, `../../**/assignment/ex([0-9])-*`)
    .replace(/\\/g, '/');

  const filePaths = fg.sync([posixFileSpec, '!**/node_modules'], {
    onlyFiles: false,
  });

  filePaths.forEach((filePath) => {
    const regexp = RegExp(
      String.raw`^.*/(.+)/(Week\d)/assignment/(.+?)(?:\.js)?$`,
      'i'
    );
    const matches = filePath.match(regexp);
    if (matches) {
      const [, module, week, exercise] = matches;
      if (!exerciseMap[module]) {
        exerciseMap[module] = {};
      }
      if (!exerciseMap[module][week]) {
        exerciseMap[module][week] = {};
      }
      const exercisePath = `${module}/${week}/assignment/${exercise}`;
      exerciseMap[module][week][exercise] = computeHash(exercisePath);
    }
  });

  const hashesJson = JSON.stringify(exerciseMap, null, 2);
  fs.writeFileSync(EXERCISE_MAP_PATH, hashesJson);
}

export function getExerciseMap(): ExerciseHashes {
  const data = fs.readFileSync(EXERCISE_MAP_PATH, 'utf8');
  return JSON.parse(data);
}
